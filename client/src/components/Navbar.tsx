import { Link, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

type Props = {
  userName: string
  role?: string
}

export default function Navbar({ userName, role }: Props) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-foreground">HelpDesk</span>
        <Link to="/tickets" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Tickets
        </Link>
        {role === "admin" && (
          <Link to="/users" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{userName}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  )
}
