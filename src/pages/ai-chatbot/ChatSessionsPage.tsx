import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageCircle } from "lucide-react";
import { chatSessionApi } from "@/api/aiChatbot";
import type { ChatSession, ChatMode } from "@/types";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const modeBadge: Record<ChatMode, { label: string; cls: string }> = {
  ai: { label: "AI", cls: "bg-green-100 text-green-700 border-0" },
  human: { label: "Human", cls: "bg-orange-100 text-orange-700 border-0" },
};

export function ChatSessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [modeFilter, setModeFilter] = useState<ChatMode | "all">("all");

  const load = () => {
    setLoading(true);
    chatSessionApi.list(WORKSPACE_ID)
      .then((res) => setSessions(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = modeFilter === "all"
    ? sessions
    : sessions.filter((s) => s.mode === modeFilter);

  return (
    <AppLayout title="Chat Sessions">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} />
            <p className="text-sm text-muted-foreground">
              {sessions.length} total sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode filter */}
            <div className="flex gap-1 border rounded-md overflow-hidden text-xs">
              {(["all", "ai", "human"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`px-3 py-1.5 capitalize ${modeFilter === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-md hover:bg-muted"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No chat sessions found
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((session) => {
                  const mb = modeBadge[session.mode] ?? modeBadge.ai;
                  return (
                    <a
                      key={session.id}
                      href={`/chat-sessions/${session.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate">
                            {session.follower_id || session.line_chat_id}
                          </span>
                          <Badge className={`text-xs ${mb.cls}`}>{mb.label}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {session.chat_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Chat ID: {session.line_chat_id}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(session.last_message_at)}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
