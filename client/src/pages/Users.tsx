import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Trash2, UserPlus } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { usersApi, type User, type UpdateUserInput } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

type UserFormValues = {
  name: string
  email: string
  password: string
  role: "admin" | "agent"
}

type DialogState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; user: User }

function UserForm({
  mode,
  user,
  onSuccess,
  onClose,
}: {
  mode: "add" | "edit"
  user?: User
  onSuccess: (user: User) => void
  onClose: () => void
}) {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email address"),
    password:
      mode === "add"
        ? z.string().min(8, "Password must be at least 8 characters")
        : z.string().refine((v) => v === "" || v.length >= 8, {
            message: "Password must be at least 8 characters",
          }),
    role: z.enum(["admin", "agent"]),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: (user?.role as "admin" | "agent") ?? "agent",
      password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) => {
      if (mode === "add") {
        return usersApi.create({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        })
      }
      const payload: UpdateUserInput = {
        name: values.name,
        email: values.email,
        role: values.role,
      }
      if (values.password) payload.password = values.password
      return usersApi.update(user!.id, payload)
    },
    onSuccess: ({ user: saved }) => onSuccess(saved),
  })

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-name" className="text-sm font-medium">Name</label>
        <Input
          id="u-name"
          placeholder="Jane Smith"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-email" className="text-sm font-medium">Email</label>
        <Input
          id="u-email"
          type="email"
          placeholder="jane@example.com"
          autoComplete="off"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-password" className="text-sm font-medium">
          {mode === "edit" ? (
            <>
              New password
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (leave blank to keep current)
              </span>
            </>
          ) : (
            "Password"
          )}
        </label>
        <Input
          id="u-password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="u-role" className="text-sm font-medium">Role</label>
        <Select
          value={watch("role")}
          onValueChange={(v) => setValue("role", v as "admin" | "agent", { shouldValidate: true })}
        >
          <SelectTrigger id="u-role" aria-invalid={!!errors.role}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
      </div>

      {mutation.error && (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "add"
              ? "Creating…"
              : "Saving…"
            : mode === "add"
              ? "Create user"
              : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function UserDialog({
  state,
  onClose,
  onSuccess,
}: {
  state: DialogState
  onClose: () => void
  onSuccess: (user: User) => void
}) {
  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state.open && state.mode === "edit" ? "Edit user" : "Add user"}
          </DialogTitle>
        </DialogHeader>
        {state.open && (
          <UserForm
            key={state.mode === "edit" ? state.user.id : "new"}
            mode={state.mode}
            user={state.mode === "edit" ? state.user : undefined}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function Users() {
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user.id
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogState>({ open: false })

  const { data, isPending, error } = useQuery({
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

  const closeDialog = () => setDialog({ open: false })

  const handleUserSuccess = (user: User) => {
    queryClient.setQueryData<{ users: User[] }>(["users"], (old) => {
      if (!old) return { users: [user] }
      const exists = old.users.some((u) => u.id === user.id)
      return {
        users: exists
          ? old.users.map((u) => (u.id === user.id ? user : u))
          : [user, ...old.users],
      }
    })
    closeDialog()
  }

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{userList.length} total</p>
        </div>
        <Button size="sm" onClick={() => setDialog({ open: true, mode: "add" })}>
          <UserPlus className="size-4" />
          Add user
        </Button>
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
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setDialog({ open: true, mode: "edit", user })}
                    >
                      <Pencil className="size-4" />
                    </Button>
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userList.length === 0 && (
          <p className="px-4 py-10 text-center text-muted-foreground">No users found.</p>
        )}
      </div>

      <UserDialog state={dialog} onClose={closeDialog} onSuccess={handleUserSuccess} />
    </div>
  )
}
