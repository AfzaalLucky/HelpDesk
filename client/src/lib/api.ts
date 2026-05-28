import axios from "axios"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.error ?? err.message))
)

export type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role: "admin" | "agent"
}

export type UpdateUserInput = {
  name?: string
  email?: string
  role?: "admin" | "agent"
  password?: string
}

export type Ticket = {
  id: string
  subject: string
  fromEmail: string
  fromName: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  assignedToId: string | null
  assignedTo: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

export type Message = {
  id: string
  ticketId: string
  body: string
  direction: "inbound" | "outbound"
  fromEmail: string | null
  fromName: string | null
  createdAt: string
}

export type TicketDetail = Omit<Ticket, "assignedTo" | "_count"> & {
  assignedTo: { id: string; name: string; email: string } | null
  messages: Message[]
}

export type UpdateTicketInput = {
  status?: Ticket["status"]
  priority?: Ticket["priority"]
  assignedToId?: string | null
}

export type CreateTicketInput = {
  subject: string
  fromEmail: string
  fromName: string
  body: string
  priority?: Ticket["priority"]
}

export type TicketListResponse = {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
}

export const ticketsApi = {
  list: (params?: { status?: string; priority?: string; assignedToId?: string; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<TicketListResponse>("/api/tickets", { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<{ ticket: TicketDetail }>(`/api/tickets/${id}`).then((r) => r.data),
  update: (id: string, data: UpdateTicketInput) =>
    apiClient.patch<{ ticket: TicketDetail }>(`/api/tickets/${id}`, data).then((r) => r.data),
  create: (data: CreateTicketInput) =>
    apiClient.post<{ ticket: Ticket }>("/api/tickets", data).then((r) => r.data),
}

export const usersApi = {
  list: () => apiClient.get<{ users: User[] }>("/api/users").then((r) => r.data),
  create: (data: CreateUserInput) =>
    apiClient.post<{ user: User }>("/api/users", data).then((r) => r.data),
  update: (id: string, data: UpdateUserInput) =>
    apiClient.patch<{ user: User }>(`/api/users/${id}`, data).then((r) => r.data),
  updateRole: (id: string, role: string) =>
    apiClient.patch<{ user: User }>(`/api/users/${id}`, { role }).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/users/${id}`),
}
