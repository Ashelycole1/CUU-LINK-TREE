import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Neon Auth: sign-up and sign-in for hosts (see apps/api/src/http/authProxy.ts).
  auth: true,
  // Neon Object Storage: uploaded avatars, posters and event photos.
  buckets: {
    // "private" is the default; use "public_read" for anonymous reads
    assets: { access: "private" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
