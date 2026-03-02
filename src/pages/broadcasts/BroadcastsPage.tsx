import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import type { Broadcast, BroadcastStatus } from "@/types";

const statusConfig: Record<BroadcastStatus, { variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline"; icon: React.ElementType; label: string }> = {
  draft: { variant: "secondary", icon: Clock, label: "Draft" },
  scheduled: { variant: "default", icon: Clock, label: "Scheduled" },
  sending: { variant: "default", icon: Send, label: "Sending" },
  sent: { variant: "success", icon: CheckCircle, label: "Sent" },
  failed: { variant: "destructive", icon: XCircle, label: "Failed" },
  cancelled: { variant: "outline", icon: Ban, label: "Cancelled" },
};

// Placeholder
const mockBroadcasts: Broadcast[] = [];

export function BroadcastsPage() {
  const broadcasts = mockBroadcasts;

  return (
    <AppLayout title="Broadcasts">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Send messages to all followers or specific segments.
          </p>
          <Button className="gap-2">
            <Plus size={16} />
            New Broadcast
          </Button>
        </div>

        {broadcasts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">📢</div>
              <p className="font-medium">No broadcasts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first broadcast to send messages to your customers.
              </p>
              <Button className="mt-4 gap-2">
                <Plus size={16} />
                New Broadcast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {broadcasts.map((broadcast) => {
              const cfg = statusConfig[broadcast.status];
              const StatusIcon = cfg.icon;
              return (
                <Card key={broadcast.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{broadcast.name}</span>
                        <Badge variant={cfg.variant} className="gap-1">
                          <StatusIcon size={10} />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Target: {broadcast.target_type}
                        {broadcast.scheduled_at && ` · Scheduled: ${new Date(broadcast.scheduled_at).toLocaleString()}`}
                      </div>
                    </div>
                    {broadcast.status === "sent" && (
                      <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                        <div>{broadcast.success_count} delivered</div>
                        {broadcast.fail_count > 0 && (
                          <div className="text-destructive">{broadcast.fail_count} failed</div>
                        )}
                      </div>
                    )}
                    <Button variant="outline" size="sm">View</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
