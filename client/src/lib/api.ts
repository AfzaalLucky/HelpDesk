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
