import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { chatSessionApi } from "@/api/aiChatbot";
import type { ChatSession, ChatMessage, MessageRole } from "@/types";
import { ArrowLeft, Bot, User, UserCheck } from "lucide-react";

const roleBubble: Record<MessageRole, { side: "left" | "right" | "center"; cls: string; label?: string }> = {
  assistant: { side: "left", cls: "bg-gray-100 text-gray-900", label: "Bot" },
  user: { side: "right", cls: "bg-primary text-primary-foreground" },
  system: { side: "center", cls: "bg-muted text-muted-foreground text-xs" },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatSessionDetailPage() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const sessionId = segments[1];

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sess, msgs] = await Promise.all([
        chatSessionApi.get(sessionId),
        chatSessionApi.listMessages(sessionId),
      ]);
      setSession(sess);
      setMessages(msgs.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleHandoff = async () => {
    if (!session) return;
    try {
      await chatSessionApi.handoff(session.id, "");
      setSession((s) => s ? { ...s, mode: "human" } : s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to hand off");
    }
  };

  const handleHandback = async () => {
    if (!session) return;
    try {
      await chatSessionApi.handback(session.id);
      setSession((s) => s ? { ...s, mode: "ai" } : s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to hand back");
    }
  };

  return (
    <AppLayout title="Chat Session">
      <div className="space-y-4">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <a href="/chat-sessions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} />
            Back to sessions
          </a>
          {session && (
            <div className="flex items-center gap-2">
              <Badge className={session.mode === "ai" ? "bg-green-100 text-green-700 border-0" : "bg-orange-100 text-orange-700 border-0"}>
                {session.mode === "ai" ? <Bot size={12} className="mr-1 inline" /> : <UserCheck size={12} className="mr-1 inline" />}
                {session.mode === "ai" ? "AI Mode" : "Human Mode"}
              </Badge>
              {session.mode === "ai" ? (
                <Button size="sm" variant="outline" onClick={handleHandoff}>
                  Take Over (Human)
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleHandback}>
                  Hand Back to AI
                </Button>
              )}
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        {/* Session info */}
        {session && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex gap-6 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Chat ID:</span> {session.line_chat_id}</div>
                <div><span className="font-medium text-foreground">Type:</span> {session.chat_type.replace("_", " ")}</div>
                <div><span className="font-medium text-foreground">Follower:</span> {session.follower_id || "—"}</div>
                {session.assigned_admin_id && (
                  <div><span className="font-medium text-foreground">Assigned:</span> {session.assigned_admin_id}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No messages yet</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {messages.map((msg) => {
                  const bubble = roleBubble[msg.role] ?? roleBubble.user;

                  if (bubble.side === "center") {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className={`text-xs px-3 py-1 rounded-full ${bubble.cls}`}>{msg.content}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${bubble.side === "right" ? "justify-end" : "justify-start"}`}
                    >
                      {bubble.side === "left" && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <Bot size={12} />
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md`}>
                        {bubble.label && (
                          <div className="text-xs text-muted-foreground mb-0.5">{bubble.label}</div>
                        )}
                        <div className={`rounded-2xl px-3 py-2 text-sm ${bubble.cls}`}>
                          {msg.content}
                        </div>
                        <div className={`text-xs text-muted-foreground mt-0.5 ${bubble.side === "right" ? "text-right" : "text-left"}`}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                      {bubble.side === "right" && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <User size={12} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
