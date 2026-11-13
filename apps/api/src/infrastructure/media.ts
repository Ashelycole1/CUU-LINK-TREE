import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ValidationError } from "@event-tree/core";
import type { NeonStorageSettings } from "./neonEnv";

/** A stored image, ready to stream back to a browser. */
export interface StoredMedia {
  body: Readable;
  contentType: string;
  size?: number;
}

/**
 * Where uploaded images live. Keys are unique per upload (a random UUID),
 * so a stored object never changes and can be cached forever.
 */
export interface MediaStore {
  readonly kind: string;
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredMedia | null>;
  delete(key: string): Promise<void>;
}

/** Neon Object Storage (S3-compatible). Neon requires path-style addressing. */
export class NeonMediaStore implements MediaStore {
  readonly kind = "Neon Object Storage";
  private readonly s3: S3Client;

  constructor(
    settings: NeonStorageSettings,
    private readonly bucket: string,
  ) {
    this.s3 = new S3Client({
      forcePathStyle: true,
      endpoint: settings.endpoint,
      region: settings.region,
      credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
    });
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async get(key: string): Promise<StoredMedia | null> {
    try {
      const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!res.Body) return null;
      return { body: res.Body as Readable, contentType: res.ContentType ?? "application/octet-stream", size: res.ContentLength };
    } catch (error) {
      if (error instanceof NoSuchKey || (error as { name?: string }).name === "NoSuchKey") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/** Files on disk, for local development without Neon storage. */
export class LocalMediaStore implements MediaStore {
  readonly kind = "local files";

  constructor(private readonly dir: string) {}

  private file(key: string) {
    return path.join(this.dir, ...key.split("/"));
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const file = this.file(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
    await fs.writeFile(`${file}.type`, contentType);
  }

  async get(key: string): Promise<StoredMedia | null> {
    const file = this.file(key);
    try {
      const [bytes, contentType] = await Promise.all([fs.readFile(file), fs.readFile(`${file}.type`, "utf8")]);
      return { body: Readable.from(bytes), contentType, size: bytes.length };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const file = this.file(key);
    await Promise.all([fs.rm(file, { force: true }), fs.rm(`${file}.type`, { force: true })]);
  }
}

/** In memory, for tests. */
export class MemoryMediaStore implements MediaStore {
  readonly kind = "memory";
  readonly objects = new Map<string, { bytes: Uint8Array; contentType: string }>();

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    this.objects.set(key, { bytes, contentType });
  }

  async get(key: string): Promise<StoredMedia | null> {
    const o = this.objects.get(key);
    return o ? { body: Readable.from(Buffer.from(o.bytes)), contentType: o.contentType, size: o.bytes.length } : null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", ext: "png", test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v) },
  { type: "image/gif", ext: "gif", test: (b) => String.fromCharCode(...b.subarray(0, 4)) === "GIF8" },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) => String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP",
  },
];

/**
 * Checks an upload is a real JPEG, PNG, GIF or WebP image by its first bytes
 * (the declared Content-Type is not trusted) and within the size limit.
 * SVG is refused: it can carry scripts.
 */
export function sniffImage(bytes: Uint8Array): { type: string; ext: string } {
  if (bytes.length === 0) throw new ValidationError("Choose an image to upload.", "image");
  if (bytes.length > MAX_IMAGE_BYTES) throw new ValidationError("Images can be up to 5 MB.", "image");
  const match = SIGNATURES.find((s) => s.test(bytes));
  if (!match) throw new ValidationError("Upload a JPEG, PNG, GIF or WebP image.", "image");
  return { type: match.type, ext: match.ext };
}

/** A fresh, unguessable key under a prefix such as "u/<ownerId>" or "e/<eventId>". */
export function mediaKey(prefix: string, ext: string): string {
  const safe = prefix.replace(/[^a-zA-Z0-9/_-]/g, "");
  return `${safe}/${randomUUID()}.${ext}`;
}

/** Keys come from mediaKey(); anything else (.., odd characters) is rejected when serving. */
export const MEDIA_KEY = /^[a-z]\/[a-zA-Z0-9_-]{1,128}\/[0-9a-f-]{36}\.(jpg|png|gif|webp)$/;
