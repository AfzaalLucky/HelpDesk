# Security Auditor — Agent Memory Index

- [Project Auth Architecture](project-auth-architecture.md) — better-auth v1 with Prisma adapter, email/password only, httpOnly cookie sessions, role field on User model
- [Auth Security Findings — Initial Audit](findings-auth-initial.md) — Critical/High/Medium findings from first auth audit (2026-05-28): missing BETTER_AUTH_SECRET guard, no rate limiting, missing session cookie hardening, no .env.example
- [Codebase Patterns](codebase-patterns.md) — Recurring security patterns: no routes exist yet (only app.ts), seed file has weak default passwords, client-side role guard not backed by server route yet
