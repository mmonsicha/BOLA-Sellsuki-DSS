import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RefreshCw, AlertCircle, ClipboardList, Search } from "lucide-react";
import { auditLogApi, type AuditLog } from "@/api/auditLog";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";

const PAGE_SIZE = 20;

interface AuditActionOption {
  value: string;
  label: string;
  group: string;
}

const AUDIT_ACTION_GROUPS: { group: string; label: string; actions: AuditActionOption[] }[] = [
  {
    group: "admin",
    label: "Admin",
    actions: [
      { value: "admin.invite", label: "Invite Admin", group: "admin" },
      { value: "admin.update", label: "Update Admin", group: "admin" },
      { value: "admin.remove", label: "Remove Admin", group: "admin" },
      { value: "admin.activate", label: "Activate Admin", group: "admin" },
      { value: "admin.reset_password", label: "Reset Password", group: "admin" },
    ],
  },
  {
    group: "workspace",
    label: "Workspace",
    actions: [
      { value: "workspace.create", label: "Create Workspace", group: "workspace" },
      { value: "workspace.update", label: "Update Workspace", group: "workspace" },
      { value: "workspace.webhook_update", label: "Update Webhook", group: "workspace" },
    ],
  },
  {
    group: "line_oa",
    label: "LINE OA",
    actions: [
      { value: "line_oa.create", label: "Connect LINE OA", group: "line_oa" },
      { value: "line_oa.update", label: "Update LINE OA", group: "line_oa" },
      { value: "line_oa.delete", label: "Delete LINE OA", group: "line_oa" },
      { value: "line_oa.activate", label: "Activate LINE OA", group: "line_oa" },
      { value: "line_oa.deactivate", label: "Deactivate LINE OA", group: "line_oa" },
      { value: "line_oa.webhook_update", label: "Update OA Webhook", group: "line_oa" },
    ],
  },
  {
    group: "broadcast",
    label: "Broadcast",
    actions: [
      { value: "broadcast.create", label: "Create Broadcast", group: "broadcast" },
      { value: "broadcast.send", label: "Send Broadcast", group: "broadcast" },
      { value: "broadcast.cancel", label: "Cancel Broadcast", group: "broadcast" },
    ],
  },
  {
    group: "segment",
    label: "Segment",
    actions: [
      { value: "segment.create", label: "Create Segment", group: "segment" },
      { value: "segment.update", label: "Update Segment", group: "segment" },
      { value: "segment.delete", label: "Delete Segment", group: "segment" },
    ],
  },
  {
    group: "auto_reply",
    label: "Auto Reply",
    actions: [
      { value: "auto_reply.create", label: "Create Auto Reply", group: "auto_reply" },
      { value: "auto_reply.update", label: "Update Auto Reply", group: "auto_reply" },
      { value: "auto_reply.delete", label: "Delete Auto Reply", group: "auto_reply" },
    ],
  },
  {
    group: "rich_menu",
    label: "Rich Menu",
    actions: [
      { value: "rich_menu.create", label: "Create Rich Menu", group: "rich_menu" },
      { value: "rich_menu.update", label: "Update Rich Menu", group: "rich_menu" },
      { value: "rich_menu.delete", label: "Delete Rich Menu", group: "rich_menu" },
      { value: "rich_menu.publish", label: "Publish Rich Menu", group: "rich_menu" },
      { value: "rich_menu.set_default", label: "Set Default Rich Menu", group: "rich_menu" },
      { value: "rich_menu.unset_default", label: "Unset Default Rich Menu", group: "rich_menu" },
      { value: "rich_menu.duplicate", label: "Duplicate Rich Menu", group: "rich_menu" },
    ],
  },
  {
    group: "media",
    label: "Media",
    actions: [
      { value: "media.upload", label: "Upload Media", group: "media" },
      { value: "media.update", label: "Update Media", group: "media" },
      { value: "media.restore", label: "Restore Media", group: "media" },
      { value: "media.delete", label: "Delete Media", group: "media" },
    ],
  },
  {
    group: "lon",
    label: "LON",
    actions: [
      { value: "lon.send_notification", label: "Send Notification", group: "lon" },
      { value: "lon.subscribe_by_phone", label: "Subscribe by Phone", group: "lon" },
      { value: "lon.bulk_subscribe_by_phone", label: "Bulk Subscribe by Phone", group: "lon" },
      { value: "lon.send_consent_request", label: "Send Consent Request", group: "lon" },
    ],
  },
  {
    group: "lon_subscriber",
    label: "LON Subscriber",
    actions: [
      { value: "lon_subscriber.view_phone", label: "View Phone Number", group: "lon_subscriber" },
      { value: "lon_subscriber.revoke", label: "Revoke Subscriber", group: "lon_subscriber" },
    ],
  },
  {
    group: "lon_job",
    label: "LON Job",
    actions: [
      { value: "lon_job.create", label: "Create LON Job", group: "lon_job" },
      { value: "lon_job.update", label: "Update LON Job", group: "lon_job" },
      { value: "lon_job.delete", label: "Delete LON Job", group: "lon_job" },
      { value: "lon_job.pause", label: "Pause LON Job", group: "lon_job" },
      { value: "lon_job.resume", label: "Resume LON Job", group: "lon_job" },
      { value: "lon_job.trigger", label: "Trigger LON Job", group: "lon_job" },
    ],
  },
];

// Flat lookup: action value → friendly label
const ACTION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  AUDIT_ACTION_GROUPS.flatMap((g) => g.actions.map((a) => [a.value, a.label]))
);

function actionBadgeClass(action: string): string {
  if (action.includes("delete") || action.includes("remove") || action.includes("deactivate")) {
    return "bg-red-100 text-red-800 border-red-200";
  }
  if (action.includes("create") || action.includes("invite") || action.includes("activate")) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (action.includes("update") || action.includes("edit") || action.includes("reset")) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (action.includes("login") || action.includes("logout")) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (action.includes("view")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function formatMetadata(metadata: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  try {
    return JSON.stringify(metadata, null, 0)
      .replace(/[{}]/g, "")
      .replace(/"([^"]+)":/g, "$1:")
      .replace(/,/g, ", ")
      .slice(0, 80);
  } catch {
    return "—";
  }
}

export function AuditLogsPage() {
  const { isAdminOrAbove, loading: adminLoading } = useCurrentAdmin();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const loadLogs = (p: number = 1) => {
    setLoading(true);
    setError(null);
    auditLogApi.list({
      page: p,
      page_size: PAGE_SIZE,
      admin_id: filterAdminId.trim() || undefined,
      action: filterAction.trim() || undefined,
      from: filterFrom || undefined,
      to: filterTo || undefined,
    })
      .then((res) => {
        setLogs(res.data ?? []);
        setTotal(res.total ?? 0);
        setPage(p);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
        setLogs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (adminLoading) return;
    if (isAdminOrAbove) {
      loadLogs(1);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLoading, isAdminOrAbove]);

  const handleSearch = () => {
    loadLogs(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!adminLoading && !isAdminOrAbove) {
    return (
      <AppLayout title="Audit Logs" icon={<ClipboardList size={20} />}>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">Access restricted</p>
            <p className="text-sm mt-1">Audit logs are visible to admins and super admins only.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Audit Logs" icon={<ClipboardList size={20} />}>
      <div className="space-y-4">

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Action Type</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All actions">
                      {filterAction ? (ACTION_LABEL_MAP[filterAction] ?? filterAction) : "All actions"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    {AUDIT_ACTION_GROUPS.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t first:border-t-0 mt-1 first:mt-0">
                          {group.label}
                        </div>
                        {group.actions.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-admin" className="text-xs">Admin email / ID</Label>
                <Input
                  id="filter-admin"
                  placeholder="Filter by admin"
                  value={filterAdminId}
                  onChange={(e) => setFilterAdminId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-from" className="text-xs">From</Label>
                <Input
                  id="filter-from"
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-to" className="text-xs">To</Label>
                <Input
                  id="filter-to"
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={handleSearch} className="gap-1.5" disabled={loading}>
                <Search size={14} />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results summary */}
        {!loading && !error && (
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>{total.toLocaleString()} log{total !== 1 ? "s" : ""} found</span>
            {totalPages > 1 && (
              <span>Page {page} of {totalPages}</span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle size={24} className="mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => loadLogs(page)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {!loading && !error && logs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No audit logs found for the selected filters.
            </CardContent>
          </Card>
        )}

        {!loading && !error && logs.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Time</th>
                      <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Admin</th>
                      <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Action</th>
                      <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Resource</th>
                      <th className="px-4 py-3 text-left font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-xs">{log.admin_name || "—"}</div>
                          <div className="text-muted-foreground text-xs">{log.admin_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${actionBadgeClass(log.action)}`}>
                            {ACTION_LABEL_MAP[log.action] ?? log.action}
                          </span>
                          <div className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{log.action}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.resource_type && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {log.resource_type}
                            </Badge>
                          )}
                          {log.resource_id && (
                            <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[120px]">
                              {log.resource_id}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                          <span className="truncate block">{formatMetadata(log.metadata)}</span>
                          {log.ip_address && (
                            <span className="text-xs text-muted-foreground/70">{log.ip_address}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page <= 1 || loading}
                    onClick={() => loadLogs(page - 1)}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page >= totalPages || loading}
                    onClick={() => loadLogs(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
