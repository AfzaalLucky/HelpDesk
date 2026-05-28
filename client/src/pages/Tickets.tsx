import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { ticketsApi, type Ticket, type CreateTicketInput } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400",
  },
  closed: {
    label: "Closed",
    className: "",
  },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  medium: {
    label: "Medium",
    className:
      "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
  },
  high: {
    label: "High",
    className:
      "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400",
  },
  urgent: {
    label: "Urgent",
    className:
      "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-500",
  },
}

export function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS_CONFIG[status] ?? { label: status, className: "" }
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { label, className } = PRIORITY_CONFIG[priority] ?? { label: priority, className: "" }
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  fromName: z.string().min(1, "Name is required"),
  fromEmail: z.string().email("Enter a valid email"),
  body: z.string().min(1, "Message body is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
})

type CreateFormValues = z.infer<typeof createTicketSchema>

function NewTicketDialog({ onSuccess }: { onSuccess: (ticket: Ticket) => void }) {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: "medium" },
  })

  const create = useMutation({
    mutationFn: (data: CreateTicketInput) => ticketsApi.create(data),
    onSuccess: ({ ticket }) => {
      onSuccess(ticket)
      setOpen(false)
      reset()
    },
  })

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New ticket
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((v) => create.mutate(v))}
            className="flex flex-col gap-4 py-2"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="t-subject" className="text-sm font-medium">Subject</label>
              <Input
                id="t-subject"
                placeholder="Problem with enrollment"
                aria-invalid={!!errors.subject}
                {...register("subject")}
              />
              {errors.subject && (
                <p className="text-xs text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="t-name" className="text-sm font-medium">From name</label>
                <Input
                  id="t-name"
                  placeholder="Jane Smith"
                  aria-invalid={!!errors.fromName}
                  {...register("fromName")}
                />
                {errors.fromName && (
                  <p className="text-xs text-destructive">{errors.fromName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="t-email" className="text-sm font-medium">From email</label>
                <Input
                  id="t-email"
                  type="email"
                  placeholder="jane@example.com"
                  aria-invalid={!!errors.fromEmail}
                  {...register("fromEmail")}
                />
                {errors.fromEmail && (
                  <p className="text-xs text-destructive">{errors.fromEmail.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="t-priority" className="text-sm font-medium">Priority</label>
              <Select
                value={watch("priority")}
                onValueChange={(v) =>
                  setValue("priority", v as CreateFormValues["priority"], { shouldValidate: true })
                }
              >
                <SelectTrigger id="t-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="t-body" className="text-sm font-medium">Message</label>
              <textarea
                id="t-body"
                rows={4}
                placeholder="Describe the issue…"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring aria-invalid:border-destructive resize-none"
                aria-invalid={!!errors.body}
                {...register("body")}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
            </div>

            {create.error && (
              <p className="text-sm text-destructive">{create.error.message}</p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setOpen(false); reset() }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export default function Tickets() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string })?.role

  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [search, setSearch] = useState("")

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", { status: statusFilter, priority: priorityFilter, search }],
    queryFn: () =>
      ticketsApi.list({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: search || undefined,
      }),
  })

  const handleTicketCreated = (ticket: Ticket) => {
    queryClient.invalidateQueries({ queryKey: ["tickets"] })
    navigate(`/tickets/${ticket.id}`)
  }

  const tickets = data?.tickets ?? []

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          {!isPending && (
            <p className="mt-1 text-sm text-muted-foreground">{tickets.length} tickets</p>
          )}
        </div>
        {role === "admin" && <NewTicketDialog onSuccess={handleTicketCreated} />}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search subject or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || priorityFilter !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); setSearch("") }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">{error.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {isPending ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="ml-auto h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted-foreground">No tickets found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{ticket.subject}</span>
                    {ticket._count && ticket._count.messages > 1 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ticket._count.messages} msgs
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{ticket.fromName}</div>
                    <div className="text-xs">{ticket.fromEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.assignedTo?.name ?? (
                      <span className="text-xs italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
