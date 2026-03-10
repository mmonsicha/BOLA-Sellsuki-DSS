import { useState, useEffect, useRef, useCallback } from "react";
import { chatSessionApi } from "@/api/aiChatbot";
import type { ChatSession, ChatMessage } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

type TabFilter = "all" | "ai" | "human";

export function ChatInboxPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sending, setSending] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll sessions every 5s
  const fetchSessions = useCallback(() => {
    chatSessionApi.list(WORKSPACE_ID, 1, 50).then((res) => {
      setSessions(res.data || []);
      setSessionLoading(false);
    }).catch(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    fetchSessions();
    const t = setInterval(fetchSessions, 5000);
    return () => clearInterval(t);
  }, [fetchSessions]);

  // Poll messages every 2s when session selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = () => {
      chatSessionApi.listMessages(selectedSession.id, 1, 100).then((res) => {
        setMessages(res.data || []);
      }).catch(() => {});
    };

    fetchMessages();
    const t = setInterval(fetchMessages, 2000);
    return () => clearInterval(t);
  }, [selectedSession?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync selected session state when sessions list refreshes
  useEffect(() => {
    if (!selectedSession) return;
    const updated = sessions.find((s) => s.id === selectedSession.id);
    if (updated) {
      setSelectedSession(updated);
    }
  }, [sessions]);

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "ai") return s.mode === "ai";
    if (activeTab === "human") return s.mode === "human";
    return true;
  });

  const handleSend = async () => {
    if (!inputText.trim() || !selectedSession || sending) return;
    setSending(true);
    try {
      await chatSessionApi.sendMessage(selectedSession.id, {
        content: inputText.trim(),
        workspace_id: WORKSPACE_ID,
      });
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTakeover = async () => {
    if (!selectedSession) return;
    try {
      await chatSessionApi.handoff(selectedSession.id, "");
      fetchSessions();
    } catch (err) {
      console.error("Failed to take over:", err);
    }
  };

  const handleHandback = async () => {
    if (!selectedSession) return;
    try {
      await chatSessionApi.handback(selectedSession.id);
      fetchSessions();
    } catch (err) {
      console.error("Failed to hand back:", err);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setMessages([]);
  };

  return (
    <AppLayout title="Chat Inbox" fullHeight>
    <div className="flex h-full overflow-hidden bg-gray-100">
      {/* Left Panel: Session List */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col bg-white shadow-sm">
        {/* Header */}
        <div className="px-4 py-4 border-b">
          <h1 className="font-bold text-lg text-gray-900">Chat Inbox</h1>
          <p className="text-xs text-gray-500 mt-0.5">Human-in-the-loop conversations</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b bg-gray-50">
          {(["all", "ai", "human"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-green-500 text-green-700 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "ai" ? "AI Active" : tab === "human" ? "Human Active" : "All"}
            </button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessionLoading ? (
            <div className="p-4 text-gray-400 text-sm text-center">Loading sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-sm">No sessions found</div>
              <div className="text-gray-300 text-xs mt-1">
                {activeTab !== "all" ? `No ${activeTab === "ai" ? "AI active" : "human active"} sessions` : "No conversations yet"}
              </div>
            </div>
          ) : (
            filteredSessions.map((s) => (
              <SessionListItem
                key={s.id}
                session={s}
                isSelected={selectedSession?.id === s.id}
                onClick={() => handleSelectSession(s)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Conversation View */}
      {selectedSession ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conversation Header */}
          <div className="px-5 py-3.5 border-b flex items-center justify-between bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedSession.line_chat_id.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {selectedSession.line_chat_id}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedSession.follower_id ? `Follower: ${selectedSession.follower_id.slice(0, 8)}...` : "Anonymous"}
                </div>
              </div>
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                selectedSession.mode === "human"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {selectedSession.mode === "human" ? "Human Mode" : "AI Mode"}
              </span>
            </div>

            <div className="flex gap-2 flex-shrink-0 ml-4">
              {selectedSession.mode === "ai" ? (
                <button
                  onClick={handleTakeover}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 font-medium transition-colors"
                >
                  Take Over
                </button>
              ) : (
                <button
                  onClick={handleHandback}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 font-medium transition-colors"
                >
                  Hand Back to AI
                </button>
              )}
            </div>
          </div>

          {/* Escalation info banner */}
          {selectedSession.mode === "human" && selectedSession.escalation_reason && (
            <div className="px-5 py-2 bg-orange-50 border-b border-orange-100 text-xs text-orange-700 flex items-center gap-2 flex-shrink-0">
              <span className="font-medium">Escalated:</span>
              <span>{selectedSession.escalation_reason}</span>
              {selectedSession.escalated_at && (
                <span className="text-orange-500">
                  at {new Date(selectedSession.escalated_at).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">No messages yet</div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {selectedSession.mode === "human" ? (
            <div className="px-5 py-4 border-t bg-white flex-shrink-0">
              <div className="flex gap-2">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message to send via LINE..."
                  disabled={sending}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !inputText.trim()}
                  className="px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Message will be sent directly to the user via LINE Push API
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 border-t bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-500 text-center">
                AI is handling this conversation.{" "}
                <button onClick={handleTakeover} className="text-orange-600 hover:underline font-medium">
                  Click "Take Over"
                </button>{" "}
                to reply manually.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="text-sm font-medium">Select a conversation</div>
          <div className="text-xs mt-1">Choose a session from the left to view messages</div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

// ---- SessionListItem ----

function SessionListItem({
  session,
  isSelected,
  onClick,
}: {
  session: ChatSession;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastTime = session.last_message_at
    ? new Date(session.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 border-b cursor-pointer transition-colors ${
        isSelected
          ? "bg-green-50 border-l-2 border-l-green-500"
          : "hover:bg-gray-50 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {session.line_chat_id.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {session.line_chat_id}
            </div>
            {lastTime && (
              <div className="text-xs text-gray-400">{lastTime}</div>
            )}
          </div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${
          session.mode === "human"
            ? "bg-orange-100 text-orange-700"
            : "bg-green-100 text-green-700"
        }`}>
          {session.mode === "human" ? "Human" : "AI"}
        </span>
      </div>
    </div>
  );
}

// ---- MessageBubble ----

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAgent = message.role === "human_agent";

  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-400 py-1 px-4">
        <span className="bg-gray-200 rounded-full px-3 py-1">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
        isUser
          ? "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
          : isAgent
          ? "bg-orange-500 text-white rounded-tr-sm"
          : "bg-green-500 text-white rounded-tr-sm"
      }`}>
        {!isUser && (
          <div className="text-xs opacity-75 mb-1 font-medium">
            {isAgent ? "Agent" : "Bot"}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className={`text-xs mt-1.5 ${isUser ? "text-gray-400" : "opacity-60"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
