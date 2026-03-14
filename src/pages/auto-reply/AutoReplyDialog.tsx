import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, X, ImageIcon, Film, Type, Code2, Layers, Sticker, AlertTriangle } from "lucide-react";
import { autoReplyApi } from "@/api/autoReply";
import { quickReplyApi } from "@/api/richMenu";
import { flexMessageApi, type FlexMessage } from "@/api/flexMessage";
import { FlexMessagePicker } from "@/components/common/FlexMessagePicker";
import type { AutoReply, QuickReply, TriggerType, MatchMode, Media } from "@/types";
import { MediaPickerDialog } from "@/pages/chat-inbox/MediaPickerDialog";
import { toDisplayUrl } from "@/lib/mediaUtils";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// ── Constants ──────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS: { value: TriggerType; label: string; description: string; icon: string }[] = [
  { value: "keyword",  label: "Keyword",  description: "Message matches a keyword",         icon: "🔑" },
  { value: "follow",   label: "Follow",   description: "User follows the LINE OA",           icon: "➕" },
  { value: "unfollow", label: "Unfollow", description: "User unfollows the LINE OA",         icon: "➖" },
  { value: "postback", label: "Postback", description: "User taps a Flex / template button", icon: "🔘" },
  { value: "default",  label: "Default",  description: "Catch-all — no other rule matched",  icon: "🔀" },
];

const MATCH_MODE_OPTIONS: { value: MatchMode; label: string }[] = [
  { value: "exact",    label: "Exact match" },
  { value: "contains", label: "Contains" },
  { value: "prefix",   label: "Starts with" },
  { value: "regex",    label: "Regex" },
];

const MESSAGE_TYPE_OPTIONS = [
  { value: "text",     label: "Text",         Icon: Type },
  { value: "image",    label: "Image",        Icon: ImageIcon },
  { value: "video",    label: "Video",        Icon: Film },
  { value: "sticker",  label: "Sticker",      Icon: Sticker },
  { value: "flex",     label: "Flex Message", Icon: Layers },
  { value: "raw_json", label: "Raw JSON",     Icon: Code2 },
] as const;

type MessageType = typeof MESSAGE_TYPE_OPTIONS[number]["value"];

// ── MessageItem types ──────────────────────────────────────────────────────

type MessageItem =
  | { type: "text";     payload: { text: string } }
  | { type: "image";    payload: { original_content_url: string; preview_image_url: string } }
  | { type: "video";    payload: { original_content_url: string; preview_image_url: string } }
  | { type: "sticker";  payload: { package_id: string; sticker_id: string } }
  | { type: "flex";     payload: { flex_message_id: string; alt_text: string } }
  | { type: "raw_json"; payload: { json: string } }

function emptyMessage(type: MessageType): MessageItem {
  switch (type) {
    case "image":    return { type, payload: { original_content_url: "", preview_image_url: "" } };
    case "video":    return { type, payload: { original_content_url: "", preview_image_url: "" } };
    case "sticker":  return { type, payload: { package_id: "", sticker_id: "" } };
    case "flex":     return { type, payload: { flex_message_id: "", alt_text: "" } };
    case "raw_json": return { type, payload: { json: "" } };
    default:         return { type: "text", payload: { text: "" } };
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function LocalhostWarning({ url }: { url: string }) {
  if (!url || !url.includes("localhost")) return null;
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-700">
      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
      <span>
        <strong>localhost URLs won't work in LINE.</strong> LINE's servers can't reach your local machine.
        Use an ngrok tunnel or a public URL instead.
      </span>
    </div>
  );
}

// ── Per-type payload editors ───────────────────────────────────────────────

function TextEditor({ payload, onChange, index }: {
  payload: { text: string };
  onChange: (p: { text: string }) => void;
  index: number;
}) {
  return (
    <div className="relative">
      <textarea
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder={`Message ${index + 1} text…`}
        value={payload.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <span className="absolute bottom-2 right-2 text-[10px] text-gray-300">
        {payload.text.length}/2000
      </span>
    </div>
  );
}

function ImageVideoEditor({ payload, onChange, mediaType }: {
  payload: { original_content_url: string; preview_image_url: string };
  onChange: (p: { original_content_url: string; preview_image_url: string }) => void;
  mediaType: "image" | "video";
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasUrl = !!payload.original_content_url.trim();
  const isImage = mediaType === "image";

  const handlePickMedia = (media: Media) => {
    onChange({
      original_content_url: media.url,
      preview_image_url: media.thumbnail_url || media.url,
    });
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Preview + pick button row */}
      <div className="flex items-start gap-3">
        {/* Thumbnail preview */}
        <div
          className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center bg-gray-50 transition-colors ${
            hasUrl ? "border-gray-300" : "border-gray-200"
          }`}
        >
          {hasUrl && isImage ? (
            <img
              src={toDisplayUrl(payload.original_content_url)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }}
            />
          ) : hasUrl && !isImage ? (
            <Film size={24} className="text-gray-400" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-300">
              {isImage ? <ImageIcon size={20} /> : <Film size={20} />}
              <span className="text-[9px] uppercase tracking-wide">{mediaType}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            {isImage ? <ImageIcon size={14} /> : <Film size={14} />}
            Choose from Media Library
          </button>
          {hasUrl && (
            <button
              type="button"
              onClick={() => onChange({ original_content_url: "", preview_image_url: "" })}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* Localhost warning */}
      <LocalhostWarning url={payload.original_content_url} />

      {/* Manual URL fields (collapsible) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
          Or enter URL manually
        </summary>
        <div className="mt-2 space-y-2">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Original content URL (https://…)"
            value={payload.original_content_url}
            onChange={(e) => onChange({ ...payload, original_content_url: e.target.value })}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Preview image URL (optional, falls back to original)"
            value={payload.preview_image_url}
            onChange={(e) => onChange({ ...payload, preview_image_url: e.target.value })}
          />
        </div>
      </details>

      {/* Media picker overlay */}
      {pickerOpen && (
        <MediaPickerDialog onSelect={handlePickMedia} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function StickerEditor({ payload, onChange }: {
  payload: { package_id: string; sticker_id: string };
  onChange: (p: { package_id: string; sticker_id: string }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder="Package ID"
        value={payload.package_id}
        onChange={(e) => onChange({ ...payload, package_id: e.target.value })}
      />
      <input
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder="Sticker ID"
        value={payload.sticker_id}
        onChange={(e) => onChange({ ...payload, sticker_id: e.target.value })}
      />
    </div>
  );
}

function FlexEditor({ payload, onChange, flexMessages }: {
  payload: { flex_message_id: string; alt_text: string };
  onChange: (p: { flex_message_id: string; alt_text: string }) => void;
  flexMessages: FlexMessage[];
}) {
  return (
    <div className="space-y-2">
      <FlexMessagePicker
        value={payload.flex_message_id}
        onChange={(id) => onChange({ ...payload, flex_message_id: id })}
        flexMessages={flexMessages}
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder="Alt text (shown in notification / unsupported clients)"
        value={payload.alt_text}
        onChange={(e) => onChange({ ...payload, alt_text: e.target.value })}
      />
    </div>
  );
}

function RawJsonEditor({ payload, onChange }: {
  payload: { json: string };
  onChange: (p: { json: string }) => void;
}) {
  const isValid = (() => {
    if (!payload.json.trim()) return true;
    try { JSON.parse(payload.json); return true; } catch { return false; }
  })();

  return (
    <div className="space-y-1">
      <textarea
        className={`w-full border rounded-lg px-3 py-2 text-sm font-mono resize-none min-h-[120px] focus:outline-none focus:ring-1 focus:ring-green-500 ${
          !isValid ? "border-red-400 bg-red-50/30" : ""
        }`}
        placeholder={'{"type": "text", "text": "Hello"}'}
        value={payload.json}
        onChange={(e) => onChange({ json: e.target.value })}
        spellCheck={false}
      />
      {!isValid && <p className="text-xs text-red-500">Invalid JSON</p>}
      <p className="text-xs text-gray-400">Any valid LINE Messaging API message object.</p>
    </div>
  );
}

// ── Message composer ───────────────────────────────────────────────────────

function MessageEditor({ messages, onChange, flexMessages }: {
  messages: MessageItem[];
  onChange: (msgs: MessageItem[]) => void;
  flexMessages: FlexMessage[];
}) {
  const addMessage = () => {
    if (messages.length >= 5) return;
    onChange([...messages, emptyMessage("text")]);
  };

  const removeMessage = (i: number) => onChange(messages.filter((_, idx) => idx !== i));

  const changeType = (i: number, newType: MessageType) => {
    onChange(messages.map((m, idx) => idx === i ? emptyMessage(newType) : m));
  };

  const updatePayload = (i: number, payload: MessageItem["payload"]) => {
    onChange(messages.map((m, idx) => idx === i ? { ...m, payload } as MessageItem : m));
  };

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => {
        const typeInfo = MESSAGE_TYPE_OPTIONS.find((o) => o.value === msg.type)!;
        const TypeIcon = typeInfo.Icon;
        return (
          <div key={i} className="border rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex-shrink-0">
                {i + 1}
              </span>
              <TypeIcon size={13} className="text-gray-500 flex-shrink-0" />
              <select
                className="flex-1 text-sm bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer"
                value={msg.type}
                onChange={(e) => changeType(i, e.target.value as MessageType)}
              >
                {MESSAGE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeMessage(i)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>

            {/* Card body */}
            <div className="px-3 py-3">
              {msg.type === "text" && (
                <TextEditor payload={msg.payload} onChange={(p) => updatePayload(i, p)} index={i} />
              )}
              {(msg.type === "image" || msg.type === "video") && (
                <ImageVideoEditor
                  payload={msg.payload}
                  onChange={(p) => updatePayload(i, p)}
                  mediaType={msg.type}
                />
              )}
              {msg.type === "sticker" && (
                <StickerEditor payload={msg.payload} onChange={(p) => updatePayload(i, p)} />
              )}
              {msg.type === "flex" && (
                <FlexEditor payload={msg.payload} onChange={(p) => updatePayload(i, p)} flexMessages={flexMessages} />
              )}
              {msg.type === "raw_json" && (
                <RawJsonEditor payload={msg.payload} onChange={(p) => updatePayload(i, p)} />
              )}
            </div>
          </div>
        );
      })}

      {messages.length < 5 && (
        <button
          type="button"
          onClick={addMessage}
          className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          <Plus size={14} />
          Add message {messages.length > 0 ? `(${messages.length}/5)` : "(1/5)"}
        </button>
      )}
      {messages.length === 0 && (
        <p className="text-xs text-red-500">At least one message is required.</p>
      )}
    </div>
  );
}

// ── Keyword tag input ──────────────────────────────────────────────────────

function KeywordInput({ keywords, onChange }: {
  keywords: string[];
  onChange: (kws: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addKeyword = (raw: string) => {
    const kw = raw.trim();
    if (!kw || keywords.includes(kw)) return;
    onChange([...keywords, kw]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(input);
    } else if (e.key === "Backspace" && !input && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  return (
    <div
      className="min-h-[42px] border rounded-lg px-2.5 py-2 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {keywords.map((kw) => (
        <span key={kw} className="flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
          {kw}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(keywords.filter((k) => k !== kw)); }}
            className="text-green-600 hover:text-green-900 ml-0.5"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="flex-1 min-w-[100px] outline-none bg-transparent text-sm placeholder:text-gray-400"
        placeholder={keywords.length === 0 ? "Type keyword and press Enter…" : ""}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addKeyword(input)}
      />
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  trigger: TriggerType;
  is_enabled: boolean;
  priority: number;
  match_mode: MatchMode;
  keywords: string[];
  postback_data: string;
  quick_reply_id: string;
  messages: MessageItem[];
}

const defaultForm = (): FormState => ({
  name: "",
  trigger: "keyword",
  is_enabled: true,
  priority: 10,
  match_mode: "contains",
  keywords: [],
  postback_data: "",
  quick_reply_id: "",
  messages: [{ type: "text", payload: { text: "" } }],
});

function formFromAutoReply(ar: AutoReply): FormState {
  return {
    name: ar.name,
    trigger: ar.trigger,
    is_enabled: ar.is_enabled,
    priority: ar.priority,
    match_mode: ar.match_mode || "contains",
    keywords: ar.keywords || [],
    postback_data: ar.postback_data || "",
    quick_reply_id: ar.quick_reply_id || "",
    messages: (ar.messages as unknown as MessageItem[]) || [{ type: "text", payload: { text: "" } }],
  };
}

// ── Dialog ─────────────────────────────────────────────────────────────────

export interface AutoReplyDialogProps {
  open: boolean;
  lineOAId: string;
  existing?: AutoReply | null;
  onClose: () => void;
  onSaved: (ar: AutoReply) => void;
}

export function AutoReplyDialog({ open, lineOAId, existing, onClose, onSaved }: AutoReplyDialogProps) {
  const isEdit = !!existing;
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quickReplySets, setQuickReplySets] = useState<QuickReply[]>([]);
  const [flexMessages, setFlexMessages] = useState<FlexMessage[]>([]);

  useEffect(() => {
    if (open) {
      setForm(existing ? formFromAutoReply(existing) : defaultForm());
      setError("");
      if (lineOAId) {
        quickReplyApi.list(WORKSPACE_ID, lineOAId)
          .then((res) => setQuickReplySets(res.data ?? []))
          .catch(() => setQuickReplySets([]));
      }
      flexMessageApi.list({ workspace_id: WORKSPACE_ID })
        .then((res) => setFlexMessages(res.data ?? []))
        .catch(() => setFlexMessages([]));
    }
  }, [open, existing, lineOAId]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string => {
    if (!form.name.trim()) return "Name is required.";
    if (form.trigger === "keyword" && form.keywords.length === 0)
      return "At least one keyword is required.";
    if (form.trigger === "postback" && !form.postback_data.trim())
      return "Postback data is required.";
    if (form.messages.length === 0) return "At least one message is required.";
    for (const m of form.messages) {
      switch (m.type) {
        case "text":
          if (!m.payload.text.trim()) return "All text messages must have content.";
          break;
        case "image":
          if (!m.payload.original_content_url.trim()) return "Image messages require a URL. Choose from the media library or enter a URL manually.";
          break;
        case "video":
          if (!m.payload.original_content_url.trim()) return "Video messages require a URL.";
          break;
        case "sticker":
          if (!m.payload.package_id.trim() || !m.payload.sticker_id.trim())
            return "Sticker messages require Package ID and Sticker ID.";
          break;
        case "flex":
          if (!m.payload.flex_message_id) return "Please select a Flex Message template.";
          break;
        case "raw_json":
          if (!m.payload.json.trim()) return "Raw JSON message cannot be empty.";
          try { JSON.parse(m.payload.json); } catch { return "Raw JSON message contains invalid JSON."; }
          break;
      }
    }
    return "";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      const msgs = form.messages.map((m) => ({ type: m.type, payload: m.payload }));
      let saved: AutoReply;
      if (isEdit && existing) {
        saved = await autoReplyApi.update(existing.id, {
          name: form.name,
          is_enabled: form.is_enabled,
          priority: form.priority,
          keywords: form.trigger === "keyword" ? form.keywords : [],
          match_mode: form.trigger === "keyword" ? form.match_mode : undefined,
          postback_data: form.trigger === "postback" ? form.postback_data : undefined,
          quick_reply_id: form.quick_reply_id || undefined,
          messages: msgs,
        });
      } else {
        saved = await autoReplyApi.create({
          workspace_id: WORKSPACE_ID,
          line_oa_id: lineOAId,
          name: form.name,
          is_enabled: form.is_enabled,
          priority: form.priority,
          trigger: form.trigger,
          keywords: form.trigger === "keyword" ? form.keywords : [],
          match_mode: form.trigger === "keyword" ? form.match_mode : undefined,
          postback_data: form.trigger === "postback" ? form.postback_data : undefined,
          quick_reply_id: form.quick_reply_id || undefined,
          messages: msgs,
        });
      }
      onSaved(saved);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base text-gray-900">
              {isEdit ? "Edit Auto Reply" : "New Auto Reply"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update the rule settings below" : "Configure trigger and response messages"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name + Enabled toggle — side by side */}
          <div className="flex gap-3 items-end">
            <Field label="Rule name" required>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Welcome message"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            {/* Priority */}
            <div className="w-24 flex-shrink-0 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <input
                type="number"
                min={1}
                max={999}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={form.priority}
                onChange={(e) => set("priority", Number(e.target.value))}
              />
            </div>

            {/* Enabled */}
            <div className="flex-shrink-0 space-y-1.5 pb-0.5">
              <label className="text-sm font-medium text-gray-700 block">Status</label>
              <button
                type="button"
                onClick={() => set("is_enabled", !form.is_enabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.is_enabled
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${form.is_enabled ? "bg-green-500" : "bg-gray-400"}`} />
                {form.is_enabled ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Trigger selector */}
          <Field
            label="Trigger"
            hint={isEdit ? "Trigger cannot be changed after creation." : undefined}
          >
            <div className="grid grid-cols-5 gap-1.5">
              {TRIGGER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isEdit}
                  onClick={() => set("trigger", opt.value)}
                  title={opt.description}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    form.trigger === opt.value
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : isEdit
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="text-base leading-none">{opt.icon}</span>
                  <span className="truncate w-full text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Keyword-specific fields */}
          {form.trigger === "keyword" && (
            <div className="space-y-4 pl-3 border-l-2 border-green-200">
              <Field label="Keywords" required hint="Press Enter or comma to add each keyword.">
                <KeywordInput keywords={form.keywords} onChange={(kws) => set("keywords", kws)} />
              </Field>

              <Field label="Match mode" required>
                <div className="grid grid-cols-4 gap-1.5">
                  {MATCH_MODE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set("match_mode", o.value)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.match_mode === o.value
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Postback-specific field */}
          {form.trigger === "postback" && (
            <div className="pl-3 border-l-2 border-blue-200">
              <Field label="Postback data" required hint="Exact postback data string from the button action.">
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. action=buy&item=123"
                  value={form.postback_data}
                  onChange={(e) => set("postback_data", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* Priority hint */}
          <p className="text-xs text-gray-400">
            Priority {form.priority} — lower number = fires first. Rules are evaluated in ascending order.
          </p>

          {/* Reply Messages */}
          <Field label="Reply messages" required hint="Up to 5 messages. Mix types freely. Sent in order.">
            <MessageEditor
              messages={form.messages}
              onChange={(msgs) => set("messages", msgs)}
              flexMessages={flexMessages}
            />
          </Field>

          {/* Quick Reply Set */}
          <Field label="Quick Reply Set" hint="Optional. Attach tap-able chips to the last message.">
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={form.quick_reply_id}
              onChange={(e) => set("quick_reply_id", e.target.value)}
            >
              <option value="">None</option>
              {quickReplySets.map((qr) => (
                <option key={qr.id} value={qr.id}>
                  {qr.name} ({qr.items?.length ?? 0} chips)
                </option>
              ))}
            </select>
          </Field>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </form>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400">
            {isEdit ? `Editing rule for ${form.trigger} trigger` : `New ${form.trigger} rule`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
