import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Identity, IdentityVerifier } from "@event-tree/core";
import type { NeonAuthSettings } from "./neonEnv";

/**
 * Verifies Neon Auth (Managed Better Auth) JWTs, as the Neon JWT guide
 * describes: EdDSA signatures checked against the branch's JWKS, with the
 * issuer and audience both set to the origin of the Auth URL. Tokens last
 * 15 minutes; the JWKS is fetched once and cached by jose.
 */
export class NeonJwtVerifier implements IdentityVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly origin: string;

  constructor(settings: NeonAuthSettings) {
    this.jwks = createRemoteJWKSet(new URL(settings.jwksUrl));
    this.origin = new URL(settings.baseUrl).origin;
  }

  async verify(token: string): Promise<Identity | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        algorithms: ["EdDSA"],
        issuer: this.origin,
        audience: this.origin,
      });
      if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
      if (payload.banned === true) return null;
      return { id: payload.sub, email: payload.email, name: typeof payload.name === "string" ? payload.name : undefined };
    } catch {
      return null;
    }
  }
}
