# HelpDesk — Claude Code Context

## Project Overview
AI-powered ticket management system. Support emails arrive via webhook, become tickets, and agents review AI-drafted replies before sending. Built with a separate React frontend and Node/Express backend.

See `project-scope.md` for full feature list and `implementation-plan.md` for phased task breakdown.

## Structure
```
HelpDesk/
├── client/          # React + TypeScript (Vite) — runs on :5173
└── server/          # Node.js + TypeScript (Express) — runs on :5000
```

## Tech Stack
| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript, Vite 8 |
| UI | Tailwind CSS v4, shadcn/ui |
| Routing | React Router v7 |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) + pgvector |
| Auth | Database sessions (httpOnly cookie) |
| AI | Anthropic Claude API — model `claude-sonnet-4-6` |
| Inbound email | Postmark webhook |
| Outbound email | Resend |
| Hosting | Vercel (client), Railway/Render (server) |

## Dev Commands

### Server (`/server`)
```bash
npm run dev        # start with nodemon + ts-node
npm run build      # compile TypeScript to dist/
npm run lint       # ESLint
npm run format     # Prettier
npm run db:push    # push schema to DB (no migration file)
npm run db:migrate # create and apply migration
npm run db:studio  # open Prisma Studio
```

### Client (`/client`)
```bash
npm run dev        # Vite dev server
npm run build      # production build
npm run lint       # ESLint
npm run format     # Prettier
```

## Key Conventions

### Backend
- All source code lives in `server/src/`
- Route handlers go in `server/src/routes/`
- Business logic goes in `server/src/services/`
- Prisma client is a singleton imported from `server/src/lib/prisma.ts`
- Auth middleware validates the session cookie and attaches `req.user`
- Environment variables are accessed via `process.env` — always add new ones to `.env.example`

### Frontend
- `@/` maps to `client/src/`
- Pages go in `client/src/pages/`
- Shared UI components (non-shadcn) go in `client/src/components/`
- shadcn/ui components live in `client/src/components/ui/` — do not edit them manually
- Add new shadcn components via: `npx shadcn@4.7.0 add <component>` from `client/`
- API calls go in `client/src/lib/api.ts`
- Use `import.meta.env.VITE_API_URL` for the backend URL

### Auth
- Sessions are stored in the `Session` table in PostgreSQL
- The session ID is sent as an httpOnly cookie named `sid`
- Use the `requireAuth` middleware on all protected routes
- Use the `requireRole('admin')` middleware for admin-only routes

### AI (Claude API)
- Model: `claude-sonnet-4-6`
- All Claude calls go through `server/src/services/ai.ts`
- Use structured outputs (JSON mode) for classification tasks
- Knowledge base retrieval uses pgvector similarity search before calling Claude

## Fetching Documentation
Use the **context7 MCP** to get up-to-date library docs before implementing any feature that involves a specific library or API. This is especially important for:
- Prisma (schema syntax, migrations, pgvector)
- Anthropic Claude API (tool use, structured output, embeddings)
- shadcn/ui (adding new components)
- React Router v7 (routing patterns)
- Resend / Postmark (webhook parsing, email sending)
- Express 5 (middleware, error handling)

To use context7, call `mcp__context7__resolve-library-id` first with the library name, then `mcp__context7__query-docs` with the resolved ID and your specific question.

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
DATABASE_URL=           # Neon pooled connection (for queries)
DIRECT_URL=             # Neon direct connection (for migrations)
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000
```
