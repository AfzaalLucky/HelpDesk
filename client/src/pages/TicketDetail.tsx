import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Mail, User } from "lucide-react"
import { ticketsApi, usersApi, type UpdateTicketInput } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge, PriorityBadge } from "@/pages/Tickets"

function MessageBubble({
  body,
  direction,
  fromName,
  fromEmail,
  createdAt,
}: {
  body: string
  direction: "inbound" | "outbound"
  fromName: string | null
  fromEmail: string | null
  createdAt: string
}) {
  const isInbound = direction === "inbound"

  return (
    <div className={`flex flex-col gap-1 ${isInbound ? "" : "items-end"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isInbound ? (
          <>
            <Mail className="size-3" />
            <span>{fromName ?? fromEmail ?? "Unknown"}</span>
          </>
        ) : (
          <>
            <span>Support</span>
            <User className="size-3" />
          </>
        )}
        <span>·</span>
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isInbound
            ? "rounded-tl-sm bg-muted text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        }`}
      >
        {body}
      </div>
    </div>
  )
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketsApi.get(id!),
  })

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  })

  const updateTicket = useMutation({
    mutationFn: (input: UpdateTicketInput) => ticketsApi.update(id!, input),
    onSuccess: ({ ticket }) => {
      queryClient.setQueryData(["ticket", id], { ticket })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  if (isPending) {
    return (
      <div className="p-8">
        <div className="mb-6 h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="w-64 space-y-4">
            <div className="h-8 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">{error?.message ?? "Ticket not found"}</p>
      </div>
    )
  }

  const { ticket } = data
  const agents = usersData?.users ?? []

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/tickets")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="flex-1 truncate text-base font-semibold">{ticket.subject}</h1>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {ticket.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                body={msg.body}
                direction={msg.direction as "inbound" | "outbound"}
                fromName={msg.fromName}
                fromEmail={msg.fromEmail}
                createdAt={msg.createdAt}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto border-l border-border px-5 py-6">
          <div className="flex flex-col gap-5">
            <SidebarSection label="Status">
              <Select
                value={ticket.status}
                onValueChange={(v) =>
                  updateTicket.mutate({ status: v as UpdateTicketInput["status"] })
                }
                disabled={updateTicket.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </SidebarSection>

            <SidebarSection label="Priority">
              <Select
                value={ticket.priority}
                onValueChange={(v) =>
                  updateTicket.mutate({ priority: v as UpdateTicketInput["priority"] })
                }
                disabled={updateTicket.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </SidebarSection>

            <SidebarSection label="Assigned to">
              <Select
                value={ticket.assignedToId ?? "unassigned"}
                onValueChange={(v) =>
                  updateTicket.mutate({ assignedToId: v === "unassigned" ? null : v })
                }
                disabled={updateTicket.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarSection>

            <div className="border-t border-border pt-4">
              <SidebarSection label="From">
                <p className="text-sm font-medium">{ticket.fromName}</p>
                <p className="text-xs text-muted-foreground">{ticket.fromEmail}</p>
              </SidebarSection>
            </div>

            <SidebarSection label="Created">
              <p className="text-xs text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </SidebarSection>

            <SidebarSection label="Last updated">
              <p className="text-xs text-muted-foreground">
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
            </SidebarSection>

            {updateTicket.error && (
              <p className="text-xs text-destructive">{updateTicket.error.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
