// Builds the whole app for Vercel with the Build Output API (v3):
//   .vercel/output/static              the built web app (apps/web/dist)
//   .vercel/output/functions/api.func  the Express API bundled into one file
// Routes: files first, then /api, /media, /assets and /health go to the
// function, and every other path gets the web app's index.html.
import { execSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const out = ".vercel/output";
const fn = `${out}/functions/api.func`;

await rm(out, { recursive: true, force: true });

execSync("npm run build:web", { stdio: "inherit" });
await cp("apps/web/dist", `${out}/static`, { recursive: true });

await mkdir(fn, { recursive: true });
await build({
  entryPoints: ["apps/api/src/vercel.ts"],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["pg-native"],
  // Some bundled CommonJS packages expect require and __dirname.
  banner: {
    js: [
      'import { createRequire as __createRequire } from "node:module";',
      'import { fileURLToPath as __fileURLToPath } from "node:url";',
      'import { dirname as __pathDirname } from "node:path";',
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join("\n"),
  },
  logLevel: "info",
});
await cp("apps/static/assets", `${fn}/static-assets`, { recursive: true });
await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      // Keep request bodies untouched: Express and the Neon Auth proxy read the raw stream.
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 30,
    },
    null,
    2,
  ),
);

await writeFile(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "^/(api/.*|media/.*|assets/.*|health)$", dest: "/api" },
        { src: "^/.*$", dest: "/index.html", headers: { "cache-control": "no-cache" } },
      ],
    },
    null,
    2,
  ),
);

console.log(`Vercel output written to ${out}`);
