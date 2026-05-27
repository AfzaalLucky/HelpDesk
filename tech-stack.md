# Tech Stack

## Frontend
- **Framework**: React + TypeScript (Vite)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Hosting**: Railway or Render

## Database
- **DB**: PostgreSQL (Neon — serverless)
- **ORM**: Prisma
- **Vector search**: pgvector extension (for knowledge base embeddings)

## Authentication
- **Strategy**: Database sessions
  - On login, create a session record in PostgreSQL
  - Return a session ID via httpOnly cookie
  - Each request validates the session ID against the database
  - Sessions can be revoked server-side (logout, admin suspension)

## AI
- **Provider**: Anthropic Claude API
- **Model**: claude-sonnet-4-6
- **Use cases**: ticket classification, AI summaries, suggested reply drafts (RAG via pgvector)

## Email
- **Inbound**: Postmark webhook — parses incoming emails and POSTs to the backend
- **Outbound**: Resend — sends agent-approved replies back to students
