---
name: codebase-patterns
description: Recurring security patterns and codebase structure facts relevant to future audits
metadata:
  type: project
---

**No application routes exist yet** (as of 2026-05-28). server/src/ contains only: app.ts, index.ts, lib/auth.ts, lib/prisma.ts, middleware/auth.ts, types/express.d.ts. No routes/ directory. All future route files will need requireAuth/requireRole applied — watch for this when routes are added.

**client/src/lib/api.ts** — apiFetch helper correctly sets credentials: "include" and Content-Type: application/json. Base URL from VITE_API_URL env var with localhost fallback.

**Role elevation path**: role field has input: false in better-auth config, so it cannot be set at sign-up. It can only be set via direct Prisma writes (seed.ts does this). When a role-management UI is built, that endpoint will need requireRole('admin') protection.

**Seed passwords in source control**: prisma/seed.ts lines 6-7 contain Admin@123!! and Agent@123!!. These are development-only seeds but are committed to the repo. Must be rotated if any production DB is ever seeded with this script.

**No middleware for security headers**: app.ts has no helmet, no x-content-type-options, no referrer-policy, etc.

**No rate limiting package in dependencies**: server/package.json has no express-rate-limit or similar. This is a gap to fill before any auth routes are exposed to the internet.

**Why:** These patterns recur and will be relevant when new routes are added.
**How to apply:** When reviewing new route files, immediately check for requireAuth/requireRole. When reviewing package.json changes, look for rate-limit and helmet additions.
