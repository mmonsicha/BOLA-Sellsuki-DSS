import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Copy, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";
import { ConnectLineOADialog } from "./ConnectLineOADialog";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const statusVariant = {
  active: "success" as const,
  inactive: "secondary" as const,
  error: "destructive" as const,
};

export function LineOAPage() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setLineOAs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreated = (oa: LineOA) => {
    setLineOAs((prev) => [oa, ...prev]);
  };

  const copyWebhookURL = (oa: LineOA) => {
    if (!oa.webhook_url) return;
    navigator.clipboard.writeText(oa.webhook_url);
    setCopiedId(oa.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const goToDetail = (id: string) => {
    window.location.pathname = `/line-oa/${id}`;
  };

  return (
    <AppLayout title="LINE Official Accounts">
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Connect your LINE Official Accounts to manage customers and send messages.
          </p>
          <Button className="gap-2" onClick={() => setConnectOpen(true)}>
            <Plus size={16} />
            Connect LINE OA
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty state */}
        {!loading && lineOAs.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold text-base">No LINE OA connected yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Connect your first LINE Official Account to start managing customers and sending messages.
              </p>
              <Button className="mt-5 gap-2" onClick={() => setConnectOpen(true)}>
                <Plus size={16} />
                Connect LINE OA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && lineOAs.length > 0 && (
          <div className="grid gap-3">
            {lineOAs.map((oa) => (
              <Card key={oa.id} className="hover:border-border/80 transition-colors">
                <CardContent className="flex items-center gap-4 p-4">

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-line/10 border-2 border-line/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {oa.picture_url ? (
                      <img src={oa.picture_url} alt={oa.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-line font-bold text-lg">{oa.name[0]?.toUpperCase()}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{oa.name}</span>

                      {/* Bot basic ID Badge */}
                      {oa.basic_id && (
                        <a
                          href={`https://line.me/R/ti/p/${oa.basic_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 bg-line/10 text-line rounded text-xs font-mono font-semibold hover:bg-line/20 transition-colors"
                          title="Open in LINE"
                        >
                          {oa.basic_id}
                        </a>
                      )}

                      <Badge variant={statusVariant[oa.status]}>{oa.status}</Badge>
                      {oa.is_default && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>

                    {/* Description */}
                    {oa.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {oa.description}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-0.5">
                      Channel ID: <code className="font-mono">{oa.channel_id}</code>
                    </div>

                    {oa.webhook_url && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground truncate max-w-xs">
                          {oa.webhook_url}
                        </span>
                        <button
                          onClick={() => copyWebhookURL(oa)}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                          title="Copy webhook URL"
                        >
                          <Copy size={12} />
                        </button>
                        {copiedId === oa.id && (
                          <span className="text-xs text-green-500">Copied!</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                    {new Date(oa.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => goToDetail(oa.id)}
                    >
                      <Settings2 size={14} />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connect dialog */}
      <ConnectLineOADialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onCreated={handleCreated}
      />
    </AppLayout>
  );
}
