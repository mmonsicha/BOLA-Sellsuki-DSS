import { useState, useEffect, useRef, useCallback } from "react";
import { chatSessionApi } from "@/api/aiChatbot";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import type { ChatSession, ChatMessage, Follower, Media, LineOA } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChevronLeft, ImageIcon, X } from "lucide-react";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";

import { toDisplayUrl } from "@/lib/mediaUtils";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

type TabFilter = "all" | "ai" | "human";

const ESCALATION_LABELS: Record<string, string> = {
  low_confidence: "Low Confidence",
  manual: "Manual Takeover",
  keyword: "Keyword Match",
};

const CHAT_TYPE_LABELS: Record<string, string> = {
  one_on_one: "1-on-1",
  group: "Group",
  room: "Room",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function msgPreview(msg: ChatMessage): string {
  if (msg.message_type === "image") return "📷 Image";
  const trimmed = msg.content?.trim() ?? "";
  if (!trimmed) return "(no text)";
  return trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed;
}

function msgSenderPrefix(role: string): string {
  if (role === "user") return "";
  if (role === "human_agent") return "You: ";
  if (role === "assistant") return "Bot: ";
  return "";
}

export function ChatInboxPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sending, setSending] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [saveAsKB, setSaveAsKB] = useState(false);
  const [kbTitle, setKbTitle] = useState("");

  // LINE OA filter
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOAId, setSelectedOAId] = useState<string>("");

  // Follower profiles
  const [followerMap, setFollowerMap] = useState<Record<string, Follower>>({});

  // Last message preview per session
  const [lastMsgMap, setLastMsgMap] = useState<Record<string, ChatMessage>>({});

  // Unread tracking — persisted to localStorage
  const [lastViewedMap, setLastViewedMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("chatInbox_lastViewed") ?? "{}"); }
    catch { return {}; }
  });

  // Media attachment
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Mobile responsive: show chat panel instead of list on small screens
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load LINE OAs ─────────────────────────────────────────────────────────
  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        // No auto-select — start with "All"
      })
      .catch(console.error);
  }, []);

  // ── Sessions polling ──────────────────────────────────────────────────────
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

  // ── Batch-fetch follower profiles for sessions ────────────────────────────
  // follower_id in chat_sessions is the LINE user ID (e.g. U5432...), not a BOLA UUID.
  // Use ?line_oa_id= to look up by LINE user ID via GetFollowerByLineUserID.
  useEffect(() => {
    const unknownIds = sessions
      .map((s) => s.follower_id)
      .filter((id): id is string => !!id && !followerMap[id]);
    const unique = [...new Set(unknownIds)];
    unique.forEach((lineUserId) => {
      const session = sessions.find((s) => s.follower_id === lineUserId);
      const lineOAID = session?.line_oa_id;
      followerApi.get(lineUserId, lineOAID ? { line_oa_id: lineOAID } : undefined)
        // Key by lineUserId so followerMap[session.follower_id] always resolves
        .then((f) => setFollowerMap((prev) => ({ ...prev, [lineUserId]: f })))
        .catch(() => {});
    });
  }, [sessions]);

  // ── Messages polling ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = () => {
      chatSessionApi.listMessages(selectedSession.id, 1, 100).then((res) => {
        const data = res.data || [];
        setMessages(data);
        // Store last message for preview in session list
        const last = data.at(-1);
        if (last) {
          setLastMsgMap((prev) => ({ ...prev, [selectedSession.id]: last }));
        }
      }).catch(() => {});
    };

    fetchMessages();
    const t = setInterval(fetchMessages, 2000);
    return () => clearInterval(t);
  }, [selectedSession?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Sync selected session state ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedSession) return;
    const updated = sessions.find((s) => s.id === selectedSession.id);
    if (updated) setSelectedSession(updated);
  }, [sessions]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const filteredSessions = sessions.filter((s) => {
    if (selectedOAId && s.line_oa_id !== selectedOAId) return false;
    if (activeTab === "ai") return s.mode === "ai";
    if (activeTab === "human") return s.mode === "human";
    return true;
  });

  const isUnread = (s: ChatSession): boolean => {
    if (s.id === selectedSession?.id) return false;
    // last_message_at is preferred; fall back to updated_at so sessions with
    // no explicit last_message_at value still show the unread dot.
    const activityAt = s.last_message_at || s.updated_at;
    if (!activityAt) return false;
    return !lastViewedMap[s.id] || new Date(activityAt) > new Date(lastViewedMap[s.id]);
  };

  const markRead = (session: ChatSession) => {
    const now = new Date().toISOString();
    const updated = { ...lastViewedMap, [session.id]: now };
    setLastViewedMap(updated);
    try { localStorage.setItem("chatInbox_lastViewed", JSON.stringify(updated)); } catch {}
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!inputText.trim() && !selectedMedia) || !selectedSession || sending) return;
    setSending(true);
    try {
      if (selectedMedia) {
        await chatSessionApi.sendMessage(selectedSession.id, {
          content: inputText.trim() || "",
          image_url: selectedMedia.url,
          image_preview_url: selectedMedia.thumbnail_url || selectedMedia.url,
          workspace_id: WORKSPACE_ID,
        });
      } else {
        await chatSessionApi.sendMessage(selectedSession.id, {
          content: inputText.trim(),
          workspace_id: WORKSPACE_ID,
          ...(saveAsKB ? { save_as_knowledge: true, kb_title: kbTitle || inputText.trim().slice(0, 80) } : {}),
        });
      }
      setInputText("");
      setSelectedMedia(null);
      setSaveAsKB(false);
      setKbTitle("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    setSelectedMedia(null);
    setSaveAsKB(false);
    setKbTitle("");
    markRead(session);
    setMobileShowChat(true); // on mobile: switch to conversation view
  };

  const selectedFollower = selectedSession?.follower_id ? followerMap[selectedSession.follower_id] : undefined;
  const selectedName = selectedFollower?.display_name || selectedSession?.line_chat_id || "";

  return (
    <AppLayout title="Chat Inbox" fullHeight>
    <div className="flex h-full overflow-hidden bg-gray-100">

      {/* ── Left Panel: Session List ─────────────────────────────────────── */}
      {/* On mobile: hidden when chat is open. On md+: always visible */}
      <div className={`${mobileShowChat ? "hidden md:flex" : "flex"} w-full md:w-80 flex-shrink-0 border-r flex-col bg-white shadow-sm`}>
        {/* Header */}
        <div className="px-4 py-4 border-b">
          <h1 className="font-bold text-lg text-gray-900">Chat Inbox</h1>
          <p className="text-xs text-gray-500 mt-0.5">Human-in-the-loop conversations</p>
        </div>

        {/* LINE OA Filter */}
        {lineOAs.length > 0 && (
          <div className="px-4 py-2.5 border-b bg-gray-50">
            <LineOAFilter
              lineOAs={lineOAs}
              selectedId={selectedOAId}
              onChange={setSelectedOAId}
              showAll={true}
              className="text-xs"
            />
          </div>
        )}

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
                {activeTab !== "all"
                  ? `No ${activeTab === "ai" ? "AI active" : "human active"} sessions`
                  : "No conversations yet"}
              </div>
            </div>
          ) : (
            filteredSessions.map((s) => (
              <SessionListItem
                key={s.id}
                session={s}
                follower={followerMap[s.follower_id ?? ""] ?? undefined}
                lastMessage={lastMsgMap[s.id]}
                isSelected={selectedSession?.id === s.id}
                unread={isUnread(s)}
                onClick={() => handleSelectSession(s)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Conversation ────────────────────────────────────── */}
      {selectedSession ? (
        <div className={`${mobileShowChat ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {/* Conversation Header */}
          <div className="px-5 py-3.5 border-b flex items-center justify-between bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button — mobile only */}
              <button
                onClick={() => setMobileShowChat(false)}
                className="md:hidden flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 -ml-1"
                aria-label="Back to session list"
              >
                <ChevronLeft size={20} />
              </button>
              <Avatar follower={selectedFollower} name={selectedName} size={9} />
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{selectedName}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  {selectedFollower
                    ? selectedSession.line_chat_id
                    : (selectedSession.follower_id ? `Follower: ${selectedSession.follower_id.slice(0, 8)}…` : "Anonymous")}
                  <span className="text-gray-300">·</span>
                  <span>{messages.length} messages</span>
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

          {/* Escalation banner */}
          {selectedSession.mode === "human" && selectedSession.escalation_reason && (
            <div className="px-5 py-2 bg-orange-50 border-b border-orange-100 text-xs text-orange-700 flex items-center gap-2 flex-shrink-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="font-medium">Escalated:</span>
              <span>{ESCALATION_LABELS[selectedSession.escalation_reason] ?? selectedSession.escalation_reason}</span>
              {selectedSession.escalated_at && (
                <span className="text-orange-500">· {relativeTime(selectedSession.escalated_at)}</span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">No messages yet</div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} follower={selectedFollower} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {selectedSession.mode === "human" ? (
            <div className="px-5 py-4 border-t bg-white flex-shrink-0 space-y-2">
              {/* Media preview */}
              {selectedMedia && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                    {selectedMedia.type === "image" ? (
                      <img
                        src={toDisplayUrl(selectedMedia.thumbnail_url || selectedMedia.url)}
                        alt={selectedMedia.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{selectedMedia.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedMedia.type}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="p-1 hover:bg-gray-200 rounded text-muted-foreground flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Textarea + buttons */}
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedMedia ? "Add a caption (optional)..." : "Type a message to send via LINE..."}
                  disabled={sending}
                  rows={3}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
                <div className="flex flex-col gap-1.5 self-end">
                  <button
                    onClick={() => setPickerOpen(true)}
                    title="Attach from media library"
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || (!inputText.trim() && !selectedMedia)}
                    className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
              </div>

              {/* KB save */}
              {!selectedMedia && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="save_as_kb"
                      checked={saveAsKB}
                      onChange={(e) => setSaveAsKB(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <label htmlFor="save_as_kb" className="text-xs text-gray-500 cursor-pointer select-none">
                      Save reply as Knowledge Base entry
                    </label>
                  </div>
                  {saveAsKB && (
                    <input
                      type="text"
                      value={kbTitle}
                      onChange={(e) => setKbTitle(e.target.value)}
                      placeholder="KB entry title"
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Sent via LINE Push API</span>
                <span>Enter to send · Shift+Enter for new line</span>
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
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-500">Select a conversation</div>
          <div className="text-xs mt-1 text-gray-400">Choose a session from the left to view messages and reply</div>
        </div>
      )}
    </div>

    {/* Media Picker */}
    {pickerOpen && (
      <MediaPickerDialog
        onSelect={(media) => {
          setSelectedMedia(media);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    )}
    </AppLayout>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ follower, name, size = 8 }: { follower?: Follower; name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase() || "?";
  const sizeClass = `w-${size} h-${size}`;

  if (follower?.picture_url) {
    return (
      <img
        src={follower.picture_url}
        alt={follower.display_name || name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-gray-200`}
        onError={(e) => {
          // Fallback to initials on broken image
          (e.currentTarget as HTMLImageElement).style.display = "none";
          e.currentTarget.parentElement?.querySelector(".avatar-fallback")?.classList.remove("hidden");
        }}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
      {initial}
    </div>
  );
}

// ── SessionListItem ──────────────────────────────────────────────────────────

function SessionListItem({
  session,
  follower,
  lastMessage,
  isSelected,
  unread,
  onClick,
}: {
  session: ChatSession;
  follower?: Follower;
  lastMessage?: ChatMessage;
  isSelected: boolean;
  unread: boolean;
  onClick: () => void;
}) {
  const name = follower?.display_name || session.line_chat_id;
  const lastTime = session.last_message_at ? relativeTime(session.last_message_at) : null;
  const chatTypeLabel = CHAT_TYPE_LABELS[session.chat_type] ?? session.chat_type;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 border-b cursor-pointer transition-colors ${
        isSelected
          ? "bg-green-50 border-l-2 border-l-green-500"
          : "hover:bg-gray-50 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0 mt-0.5">
          <Avatar follower={follower} name={name} size={9} />
          {unread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + mode badge */}
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm truncate ${unread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
              {name}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
              session.mode === "human"
                ? "bg-orange-100 text-orange-700"
                : "bg-green-100 text-green-700"
            }`}>
              {session.mode === "human" ? "Human" : "AI"}
            </span>
          </div>

          {/* Row 2: chat type + time */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {chatTypeLabel}
            </span>
            {lastTime && <span className="text-[10px] text-gray-400">{lastTime}</span>}
          </div>

          {/* Row 3: last message preview */}
          {lastMessage && (
            <p className={`text-xs mt-1 truncate ${unread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
              {msgSenderPrefix(lastMessage.role)}{msgPreview(lastMessage)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, follower }: { message: ChatMessage; follower?: Follower }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAgent = message.role === "human_agent";
  const isImage = message.message_type === "image";

  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-400 py-1 px-4">
        <span className="bg-gray-200 rounded-full px-3 py-1">{message.content}</span>
      </div>
    );
  }

  const timeStr = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-start" : "justify-end"}`}>
      {/* User avatar (left side) */}
      {isUser && (
        <div className="flex-shrink-0 mb-1">
          <Avatar follower={follower} name={follower?.display_name || "User"} size={7} />
        </div>
      )}

      {isImage ? (
        /* Image bubble */
        <div className={`max-w-xs lg:max-w-sm rounded-2xl overflow-hidden shadow-sm ${isUser ? "rounded-tl-sm" : "rounded-tr-sm"}`}>
          <img
            src={toDisplayUrl(message.content)}
            alt="Image"
            className="w-full object-cover block"
            style={{ maxHeight: "240px" }}
          />
          <div className={`text-xs px-3 py-1.5 flex justify-end ${isUser ? "bg-white text-gray-400 border-t" : isAgent ? "bg-orange-500 text-orange-100" : "bg-green-500 text-green-100"}`}>
            {timeStr}
          </div>
        </div>
      ) : (
        /* Text bubble */
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isUser
            ? "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
            : isAgent
            ? "bg-orange-500 text-white rounded-tr-sm"
            : "bg-green-500 text-white rounded-tr-sm"
        }`}>
          {!isUser && (
            <div className="text-xs opacity-75 mb-1 font-medium">
              {isAgent ? "You" : "Bot"}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <div className={`text-xs mt-1.5 ${isUser ? "text-gray-400" : "opacity-60"}`}>
            {timeStr}
          </div>
        </div>
      )}
    </div>
  );
}
