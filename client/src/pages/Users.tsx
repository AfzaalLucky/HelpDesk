import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { usersApi, type User } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Users() {
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user.id
  const queryClient = useQueryClient()

  const {
    data,
    isPending,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: ({ user }) => {
      queryClient.setQueryData<{ users: User[] }>(["users"], (old) =>
        old ? { users: old.users.map((u) => (u.id === user.id ? user : u)) } : old
      )
    },
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ users: User[] }>(["users"], (old) =>
        old ? { users: old.users.filter((u) => u.id !== id) } : old
      )
    },
  })

  const mutationError = updateRole.error?.message ?? deleteUser.error?.message

  if (isPending) {
    return (
      <div className="p-8">
        <div className="mb-6 h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="overflow-hidden rounded-xl border border-border">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border px-4 py-3 last:border-0">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    )
  }

  const userList = data?.users ?? []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{userList.length} total</p>
      </div>

      {mutationError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  {user.id === currentUserId ? (
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(role) => updateRole.mutate({ id: user.id, role })}
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="agent">agent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.id !== currentUserId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={deleteUser.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes their account and all active sessions. This
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser.mutate(user.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userList.length === 0 && (
          <p className="px-4 py-10 text-center text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  )
}
