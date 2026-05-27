 # Implementation Plan

## Phase 1 — Project Setup

**Goal**: Working skeleton with both apps running, connected to the database, and deployable.

### Backend
- [x] Initialize Node.js + TypeScript project (`/server`)
- [x] Set up Express with basic health-check route
- [x] Add Prisma, connect to Neon PostgreSQL
- [x] Create `.env` structure (`DATABASE_URL`, `PORT`, etc.)
- [x] Add ESLint + Prettier

### Frontend
- [x] Initialize React + TypeScript project with Vite (`/client`)
- [x] Install and configure Tailwind CSS
- [x] Install shadcn/ui, add base components (Button, Input, Card)
- [x] Set up React Router for page navigation
- [x] Add ESLint + Prettier

### Infrastructure
- [ ] Create Neon database, enable pgvector extension
- [ ] Deploy backend to Railway/Render (CI from main branch)
- [ ] Deploy frontend to Vercel (CI from main branch)
- [ ] Confirm frontend can reach backend via API

---

## Phase 2 — Authentication

**Goal**: Agents and admins can log in. All subsequent routes are protected.

### Backend
- [ ] Prisma schema: `User` (id, name, email, passwordHash, role), `Session` (id, userId, expiresAt)
- [ ] `POST /auth/login` — validate credentials, create session, set httpOnly cookie
- [ ] `POST /auth/logout` — destroy session record
- [ ] `GET /auth/me` — return current user from session
- [ ] Auth middleware — validate session cookie on every protected route
- [ ] Role middleware — guard routes by role (admin, agent, supervisor)
- [ ] Seed script: create one admin user

### Frontend
- [ ] Login page (email + password form)
- [ ] Auth context — store current user, expose login/logout helpers
- [ ] Protected route wrapper — redirect to login if unauthenticated
- [ ] Logout button in nav

---

## Phase 3 — Ticket Core

**Goal**: Emails arrive, become tickets, agents can view and manage them — no AI yet.

### Backend
- [ ] Prisma schema: `Ticket` (id, subject, studentEmail, studentName, status, priority, assignedTo, createdAt), `Message` (id, ticketId, body, direction, createdAt)
- [ ] `POST /webhooks/postmark` — parse inbound email, create ticket + first message
- [ ] Reply threading — match reply-to/references headers to existing ticket; append message instead of creating new ticket
- [ ] `GET /tickets` — list tickets with filters (status, priority, assignee) and sorting
- [ ] `GET /tickets/:id` — ticket detail with full message thread
- [ ] `PATCH /tickets/:id` — update status, priority, assignee
- [ ] Postmark webhook signature verification

### Frontend
- [ ] App shell: sidebar nav, header with user info
- [ ] Ticket list page — table with status badge, priority badge, assignee, created date
- [ ] Filtering bar (by status, priority, assignee)
- [ ] Ticket detail page — conversation thread, ticket metadata panel
- [ ] Status update control on detail page

---

## Phase 4 — User Management

**Goal**: Admins can manage agents and supervisors.

### Backend
- [ ] `GET /users` — list all users (admin only)
- [ ] `POST /users` — create user with role
- [ ] `PATCH /users/:id` — update name, role
- [ ] `DELETE /users/:id` — deactivate user, invalidate their sessions

### Frontend
- [ ] User management page (admin only)
- [ ] User table with role badges
- [ ] Create user modal (name, email, password, role)
- [ ] Edit / deactivate user actions

---

## Phase 5 — AI Classification & Routing

**Goal**: Every new ticket is automatically classified and assigned to an agent.

### Backend
- [ ] Claude API client setup (API key, model config)
- [ ] Classification service — call Claude with ticket subject + body, return Priority, Topic, Sentiment, Intent
- [ ] Auto-classification on ticket creation (runs after webhook creates ticket)
- [ ] Prisma schema update: add `topic`, `sentiment`, `intent` fields to `Ticket`
- [ ] Auto-routing logic — assign ticket to agent based on topic/workload (simple round-robin or rule-based for v1)
- [ ] `PATCH /tickets/:id/classify` — manual reclassify endpoint

### Frontend
- [ ] Classification badges on ticket list (Priority, Topic, Sentiment, Intent)
- [ ] Classification panel on ticket detail page
- [ ] Manual reclassify control (agents/supervisors)

---

## Phase 6 — Knowledge Base

**Goal**: Admins can manage articles. AI can retrieve relevant content when drafting replies.

### Backend
- [ ] Prisma schema: `KnowledgeArticle` (id, title, body, embedding, createdAt, updatedAt)
- [ ] Embedding service — generate vector embeddings via Claude API for each article
- [ ] `POST /knowledge` — create article, generate and store embedding
- [ ] `PUT /knowledge/:id` — update article, regenerate embedding
- [ ] `DELETE /knowledge/:id` — remove article
- [ ] `GET /knowledge` — list all articles
- [ ] Vector search helper — given a query string, return top-N relevant articles via pgvector similarity search

### Frontend
- [ ] Knowledge base page (admin only)
- [ ] Article list with search
- [ ] Create / edit article form (rich-text editor)
- [ ] Delete confirmation

---

## Phase 7 — AI Replies & Summaries

**Goal**: Agents get an AI-drafted reply and summary for every ticket. Approved replies are sent to the student.

### Backend
- [ ] Summary service — call Claude with full ticket thread, return concise summary
- [ ] Auto-generate summary when ticket is created (async, store on ticket)
- [ ] Reply draft service — retrieve relevant KB articles via vector search, call Claude with ticket + KB context, return draft
- [ ] `GET /tickets/:id/reply-draft` — generate (or return cached) suggested reply
- [ ] `POST /tickets/:id/send-reply` — agent submits approved reply text; send via Resend; append outbound message to thread
- [ ] Resend client setup (API key, from-address config)

### Frontend
- [ ] AI summary panel on ticket detail page
- [ ] Suggested reply panel — show draft, allow agent to edit
- [ ] Send / discard reply actions
- [ ] Outbound messages shown in thread (visually distinct from inbound)

---

## Phase 8 — Dashboard & Notifications

**Goal**: Supervisors and admins have visibility across all tickets. Agents are notified of new assignments.

### Backend
- [ ] `GET /dashboard/stats` — open tickets, avg response time, tickets by topic, tickets by agent
- [ ] `GET /notifications` — unread notifications for current user
- [ ] `POST /notifications/read` — mark notifications as read
- [ ] Create notification record when a ticket is assigned to an agent

### Frontend
- [ ] Dashboard page — stat cards, tickets-by-status chart, recent activity
- [ ] Notification bell in header — unread count badge, dropdown list
- [ ] Mark notifications as read on open

---

## Deferred (Post-MVP)

- Email/push notifications for agents (in-app only for v1)
- Supervisor permission refinement (reassign, override classification)
- Knowledge base file upload (PDF/Word)
- Bulk ticket actions
- SLA timers and escalation rules
- Audit log
