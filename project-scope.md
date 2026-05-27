# AI-Powered Ticket Management System

## Problem
We receive hundreds of support emails daily. Our agents manually read, classify, and respond to each ticket — which is slow and leads to impersonal, canned responses.

## Solution
Build a ticket management system that uses AI to automatically classify, respond to, and route support tickets — delivering faster, more personalized responses to students while freeing up agents for complex issues.

---

## Features

### Email Ingestion
- Receive inbound support emails via webhook (SendGrid, Mailgun, or Postmark)
- Automatically create a ticket for each new email
- When a student replies to a ticket response, append the reply to the existing ticket thread (do not create a new ticket)

### Ticket Management
- Ticket list with filtering and sorting
- Ticket detail view showing the full conversation thread
- Dashboard to view and manage all tickets

### AI Features
- **Classification** — automatically tag each ticket with:
  - Priority: Low / Medium / High / Urgent
  - Topic/Type: e.g. Billing, Tech Support, Enrollment
  - Sentiment: Frustrated / Neutral / Satisfied
  - Intent: Question / Complaint / Request / Bug
- **Auto-routing** — assign tickets to an agent automatically based on classification
- **AI summaries** — generate a concise summary of the ticket for agents
- **AI-suggested replies** — draft a response using the knowledge base; agent reviews and approves before it is sent to the student

### Knowledge Base
- Admins can create, edit, and manage documents and FAQs
- AI uses the knowledge base as context when generating suggested replies

### User Management
- **Admin** — manage users, settings, and the knowledge base
- **Agent** — view assigned tickets, review/edit/approve AI replies
- **Supervisor** — view all tickets and reports *(exact permissions TBD — see Open Questions)*

---

## Open Questions

| # | Question | Why it matters |
|---|---|---|
| 1 | **Authentication** — email/password, Google SSO, or other? | Determines whether to build auth or delegate to a provider |
| 2 | **Outbound email** — does approving a reply actually send an email to the student, or is it logged internally only? | Changes data model; requires outbound email setup and reply-to threading |
| 3 | **Agent notifications** — in-app only, or also email/push when a ticket is assigned? | Affects notification infrastructure |
| 4 | **Supervisor permissions** — read-only, or can supervisors reassign tickets and override classifications? | Prevents role-scope creep during development |
| 5 | **Knowledge base format** — rich-text editor in-app, file uploads (PDF/Word), or external source (Notion, Confluence)? | Drives knowledge base UI and ingestion pipeline |
