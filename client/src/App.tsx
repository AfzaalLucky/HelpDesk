import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { authClient } from "@/lib/auth-client"
import Navbar from "@/components/Navbar"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import Users from "@/pages/Users"
import Tickets from "@/pages/Tickets"
import TicketDetail from "@/pages/TicketDetail"

function ProtectedLayout() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null
  if (!session) return <Navigate to="/login" replace />

  const role = (session.user as { role?: string }).role

  return (
    <>
      <Navbar userName={session.user.name} role={role} />
      <main>
        <Outlet />
      </main>
    </>
  )
}

function AdminLayout() {
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string })?.role
  if (role !== "admin") return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route element={<AdminLayout />}>
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
