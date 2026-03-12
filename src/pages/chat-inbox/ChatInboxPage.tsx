import { useState, useEffect, useRef, useCallback } from "react";
import { chatSessionApi } from "@/api/aiChatbot";
import { lineOAApi } from "@/api/lineOA";
import type { ChatSession, ChatMessage, Media, LineOA } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChevronLeft, ImageIcon, X } from "lucide-react";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { toDisplayUrl } from "@/lib/mediaUtils";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

type TabFilter = "all" | "ai" | "human" | "group";

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
  if (msg.message_type === "flex") return "🃏 Flex Card";
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
      .then((res) => setLineOAs(res.data ?? []))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const filteredSessions = sessions.filter((s) => {
    if (selectedOAId && s.line_oa_id !== selectedOAId) return false;
    if (activeTab === "ai") return s.mode === "ai";
    if (activeTab === "human") return s.mode === "human";
    if (activeTab === "group") return s.chat_type === "group" || s.chat_type === "room";
    return true;
  });

  const isUnread = (s: ChatSession): boolean => {
    if (s.id === selectedSession?.id) return false;
    const activityAt = s.last_message_at || s.updated_at;
    if (!activityAt) return false;
    return !lastViewedMap[s.id] || new Date(activityAt) > new Date(lastViewedMap[s.id]);
  };

  const markRead = (session: ChatSession) => {
    const now = new Date().toISOString();
    const updated = { ...lastViewedMap, [session.id]: now };
    setLastViewedMap(updated);
    // eslint-disable-next-line no-empty
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
      void handleSend();
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
    setMobileShowChat(true);
  };

  // Derive display name and picture URL directly from denormalized session fields
  const selectedName = selectedSession?.follower_display_name || selectedSession?.line_chat_id || "";
  const selectedPicUrl = selectedSession?.follower_picture_url || "";

  return (
    <AppLayout title="Chat Inbox" fullHeight>
    <div className="flex h-full overflow-hidden bg-gray-100">

      {/* ── Left Panel: Session List ─────────────────────────────────────── */}
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
          {(["all", "ai", "human", "group"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-green-500 text-green-700 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "ai" ? "AI" : tab === "human" ? "Human" : tab === "group" ? "Groups" : "All"}
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
                {activeTab === "ai" ? "No AI active sessions" : activeTab === "human" ? "No human active sessions" : activeTab === "group" ? "No group sessions" : "No conversations yet"}
              </div>
            </div>
          ) : (
            filteredSessions.map((s) => (
              <SessionListItem
                key={s.id}
                session={s}
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
              <Avatar pictureUrl={selectedPicUrl} name={selectedName} size={9} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="font-semibold text-sm text-gray-900 truncate">{selectedName}</div>
                  {(selectedSession.chat_type === "group" || selectedSession.chat_type === "room") && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">Group</span>
                  )}
                </div>
                <div className="hidden md:flex text-xs text-gray-400 items-center gap-1.5">
                  <span>{selectedSession.line_chat_id}</span>
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
                  onClick={() => void handleTakeover()}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 font-medium transition-colors"
                >
                  Take Over
                </button>
              ) : (
                <button
                  onClick={() => void handleHandback()}
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
              <MessageBubble
                key={msg.id}
                message={msg}
                followerName={selectedSession.follower_display_name}
                followerPicUrl={selectedSession.follower_picture_url}
                isGroupChat={selectedSession.chat_type === "group" || selectedSession.chat_type === "room"}
              />
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
                    onClick={() => void handleSend()}
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
                <button onClick={() => void handleTakeover()} className="text-orange-600 hover:underline font-medium">
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

// ── Avatar ───────────────────────────────────────────────────────────────────
// pictureUrl: LINE profile picture (stored in chat_sessions.follower_picture_url)
// name: display name — used for the alt text and initial fallback

function Avatar({ pictureUrl, name, size = 8 }: { pictureUrl?: string; name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase() || "?";
  const sizeClass = `w-${size} h-${size}`;

  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border border-gray-200`}
        onError={(e) => {
          // Fallback to initials on broken image
          (e.currentTarget as HTMLImageElement).style.display = "none";
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
  lastMessage,
  isSelected,
  unread,
  onClick,
}: {
  session: ChatSession;
  lastMessage?: ChatMessage;
  isSelected: boolean;
  unread: boolean;
  onClick: () => void;
}) {
  // Use denormalized display name stored on the session; fall back to LINE chat ID
  const name = session.follower_display_name || session.line_chat_id;
  const lastTime = session.last_message_at ? relativeTime(session.last_message_at) : null;
  const chatTypeLabel = CHAT_TYPE_LABELS[session.chat_type] ?? session.chat_type;
  const isGroup = session.chat_type === "group" || session.chat_type === "room";
  const avatarUrl = isGroup
    ? (session.group_picture_url || session.follower_picture_url)
    : session.follower_picture_url;

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
          <Avatar pictureUrl={avatarUrl} name={name} size={9} />
          {unread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
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

function MessageBubble({
  message,
  followerName,
  followerPicUrl,
  isGroupChat,
}: {
  message: ChatMessage;
  followerName?: string;
  followerPicUrl?: string;
  isGroupChat?: boolean;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAgent = message.role === "human_agent";
  const isImage = message.message_type === "image";
  const isFlex = message.message_type === "flex";

  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-400 py-1 px-4">
        <span className="bg-gray-200 rounded-full px-3 py-1">{message.content}</span>
      </div>
    );
  }

  const timeStr = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const senderLabel = isAgent ? "You" : "Auto-Reply";
  const groupSenderLabel = isGroupChat && isUser
    ? (message.sender_display_name || message.sender_user_id || null)
    : null;

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-start" : "justify-end"}`}>
      {/* User avatar (left side) */}
      {isUser && (
        <div className="flex-shrink-0 mb-1">
          <Avatar pictureUrl={followerPicUrl} name={followerName || "User"} size={7} />
        </div>
      )}

      {isImage ? (
        /* ── Image bubble ── */
        <div className={`max-w-xs lg:max-w-sm rounded-2xl overflow-hidden shadow-sm ${isUser ? "rounded-tl-sm" : "rounded-tr-sm"}`}>
          {!isUser && (
            <div className={`text-xs px-3 pt-1.5 pb-0.5 font-medium opacity-80 ${isAgent ? "bg-orange-500 text-white" : "bg-green-500 text-white"}`}>
              {senderLabel}
            </div>
          )}
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
      ) : isFlex ? (
        /* ── Flex message card ── */
        <div className={`max-w-xs lg:max-w-sm rounded-2xl shadow-sm border overflow-hidden ${isUser ? "rounded-tl-sm border-gray-200" : "rounded-tr-sm border-green-300"}`}>
          {/* header bar */}
          <div className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold ${isUser ? "bg-gray-100 text-gray-600" : isAgent ? "bg-orange-500 text-white" : "bg-green-500 text-white"}`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0">
              <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm0 6a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V9zm8-1a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 001-1V9a1 1 0 00-1-1h-2z" />
            </svg>
            {isUser ? "Flex Card" : senderLabel + " · Flex"}
          </div>
          {/* alt text body */}
          <div className={`px-3 py-2.5 text-sm ${isUser ? "bg-white text-gray-800" : isAgent ? "bg-orange-50 text-gray-800" : "bg-green-50 text-gray-800"}`}>
            <p className="font-medium text-gray-700">{message.content}</p>
            <p className="text-[10px] text-gray-400 mt-1">Rich card sent via LINE</p>
          </div>
          <div className="text-xs px-3 py-1 flex justify-end border-t text-gray-400 border-gray-100">
            {timeStr}
          </div>
        </div>
      ) : (
        /* ── Text bubble ── */
        <div className="flex flex-col">
          {groupSenderLabel && (
            <div className="text-xs text-gray-500 mb-1 px-1">{groupSenderLabel}</div>
          )}
        <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isUser
            ? "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
            : isAgent
            ? "bg-orange-500 text-white rounded-tr-sm"
            : "bg-green-500 text-white rounded-tr-sm"
        }`}>
          {!isUser && (
            <div className="text-xs opacity-75 mb-1 font-medium">{senderLabel}</div>
          )}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <div className={`text-xs mt-1.5 ${isUser ? "text-gray-400" : "opacity-60"}`}>
            {timeStr}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
