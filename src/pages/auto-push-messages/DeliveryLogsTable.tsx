import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface DeliveryLog {
  id: string;
  auto_push_message_id: string;
  status: "pending" | "success" | "partial_failure" | "failed";
  target_follower_count: number;
  success_count: number;
  failure_count: number;
  error_message?: string;
  triggered_at: string;
  completed_at?: string;
}

interface DeliveryLogsTableProps {
  logs: DeliveryLog[];
  loading: boolean;
  hasNextPage: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const statusConfig = {
  pending: { badge: "secondary", label: "Pending" },
  success: { badge: "success" as const, label: "Success" },
  partial_failure: { badge: "warning" as const, label: "Partial Failure" },
  failed: { badge: "destructive" as const, label: "Failed" },
};

export function DeliveryLogsTable({
  logs,
  loading,
  hasNextPage,
  page,
  pageSize,
  onPageChange,
  onRefresh,
}: DeliveryLogsTableProps) {
  const hasPrevPage = page > 1;

  if (logs.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Delivery Logs</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No delivery logs yet. Messages will appear here when this auto-push message is triggered.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Delivery Logs</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading delivery logs...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 font-medium">Triggered</th>
                    <th className="text-left py-3 px-3 font-medium">Status</th>
                    <th className="text-right py-3 px-3 font-medium">Success</th>
                    <th className="text-right py-3 px-3 font-medium">Failed</th>
                    <th className="text-left py-3 px-3 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-3">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.triggered_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            statusConfig[log.status].badge as
                              | "default"
                              | "secondary"
                              | "success"
                              | "warning"
                              | "destructive"
                          }
                        >
                          {statusConfig[log.status].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-semibold text-green-600">{log.success_count}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          / {log.target_follower_count}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {log.failure_count > 0 ? (
                          <span className="font-semibold text-red-600">{log.failure_count}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {log.error_message ? (
                          <span
                            className="text-xs text-destructive truncate max-w-xs"
                            title={log.error_message}
                          >
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(hasPrevPage || hasNextPage) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Page {page}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrevPage || loading}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNextPage || loading}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
