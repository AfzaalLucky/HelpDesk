---
name: project-auth-architecture
description: Auth stack details — better-auth v1, Prisma adapter, email/password, httpOnly cookie sessions, role on User model
metadata:
  type: project
---

Auth library: better-auth ^1.6.11 (same package on both client and server).

Server config in `server/src/lib/auth.ts`:
- Prisma adapter against PostgreSQL (Neon)
- emailAndPassword enabled
- `role` additional field: type string, default "agent", input: false (cannot be set at sign-up — good)
- baseURL from BETTER_AUTH_URL env var, falls back to localhost:5000
- secret from BETTER_AUTH_SECRET env var (no guard if undefined)
- trustedOrigins: production → CLIENT_URL only; dev → CLIENT_URL + any localhost port

Middleware in `server/src/middleware/auth.ts`:
- requireAuth: calls auth.api.getSession, attaches req.user and req.session, returns 401 if missing
- requireRole(role): composes [requireAuth, role-check] — correct pattern

Session storage: PostgreSQL Session table (better-auth manages cookies — httpOnly by default for better-auth, but explicit secure/sameSite flags not visible in config).

Client auth: better-auth/react createAuthClient, baseURL from VITE_API_URL.

Schema: User, Session, Account, Verification tables — standard better-auth schema. Session has onDelete: Cascade from User.

**Why:** Need this to scope future audits and understand what's configured vs. what relies on better-auth defaults.
**How to apply:** When auditing new routes, check requireAuth/requireRole usage against this middleware. When auditing cookie security, note that better-auth handles the cookie — check its default behavior for the installed version.
