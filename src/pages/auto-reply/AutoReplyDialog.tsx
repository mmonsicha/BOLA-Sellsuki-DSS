import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, GripVertical, Trash2 } from "lucide-react";
import { autoReplyApi } from "@/api/autoReply";
import { quickReplyApi } from "@/api/richMenu";
import type { AutoReply, QuickReply, TriggerType, MatchMode } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

// ---- constants ----

const TRIGGER_OPTIONS: { value: TriggerType; label: string; description: string }[] = [
  { value: "follow",   label: "Follow",       description: "User follows the LINE OA" },
  { value: "unfollow", label: "Unfollow",     description: "User unfollows the LINE OA" },
  { value: "keyword",  label: "Keyword",      description: "Message matches a keyword" },
  { value: "postback", label: "Postback",     description: "User taps a Flex / template button" },
  { value: "default",  label: "Default",      description: "Catch-all — no other rule matched" },
];

const MATCH_MODE_OPTIONS: { value: MatchMode; label: string }[] = [
  { value: "exact",    label: "Exact match" },
  { value: "contains", label: "Contains" },
  { value: "prefix",   label: "Starts with" },
  { value: "regex",    label: "Regex" },
];

// ---- helpers ----

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---- Message composer ----

interface MessageItem {
  type: "text";
  payload: { text: string };
}

function MessageEditor({
  messages,
  onChange,
}: {
  messages: MessageItem[];
  onChange: (msgs: MessageItem[]) => void;
}) {
  const addMessage = () => {
    if (messages.length >= 5) return;
    onChange([...messages, { type: "text", payload: { text: "" } }]);
  };

  const removeMessage = (i: number) => {
    onChange(messages.filter((_, idx) => idx !== i));
  };

  const updateText = (i: number, text: string) => {
    const updated = messages.map((m, idx) =>
      idx === i ? { ...m, payload: { text } } : m
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 relative">
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none min-h-[72px]"
              placeholder={`Message ${i + 1}`}
              value={msg.payload.text}
              onChange={(e) => updateText(i, e.target.value)}
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {msg.payload.text.length}/2000
            </span>
          </div>
          <button
            type="button"
            onClick={() => removeMessage(i)}
            className="mt-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {messages.length < 5 && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addMessage}>
          <Plus size={14} />
          Add message {messages.length > 0 && `(${messages.length}/5)`}
        </Button>
      )}
      {messages.length === 0 && (
        <p className="text-xs text-destructive">At least one message is required.</p>
      )}
    </div>
  );
}

// ---- Keyword tag input ----

function KeywordInput({
  keywords,
  onChange,
}: {
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
      className="min-h-[38px] border rounded-md px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text bg-background"
      onClick={() => inputRef.current?.focus()}
    >
      {keywords.map((kw) => (
        <span key={kw} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-sm">
          {kw}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(keywords.filter((k) => k !== kw)); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
        placeholder={keywords.length === 0 ? "Type and press Enter…" : ""}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addKeyword(input)}
      />
    </div>
  );
}

// ---- Form state ----

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

// ---- Dialog ----

export interface AutoReplyDialogProps {
  open: boolean;
  lineOAId: string;
  existing?: AutoReply | null; // null = create mode
  onClose: () => void;
  onSaved: (ar: AutoReply) => void;
}

export function AutoReplyDialog({ open, lineOAId, existing, onClose, onSaved }: AutoReplyDialogProps) {
  const isEdit = !!existing;
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quickReplySets, setQuickReplySets] = useState<QuickReply[]>([]);

  useEffect(() => {
    if (open) {
      setForm(existing ? formFromAutoReply(existing) : defaultForm());
      setError("");
      // Load quick reply sets for this OA
      if (lineOAId) {
        quickReplyApi.list(WORKSPACE_ID, lineOAId)
          .then((res) => setQuickReplySets(res.data ?? []))
          .catch(() => setQuickReplySets([]));
      }
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
    if (form.messages.some((m) => !m.payload.text.trim()))
      return "All messages must have content.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">
            {isEdit ? "Edit Auto Reply" : "New Auto Reply"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <Field label="Name" required>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              placeholder="e.g. Welcome message"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          {/* Trigger — only editable in create mode */}
          <Field label="Trigger" required hint={isEdit ? "Trigger cannot be changed after creation." : undefined}>
            <div className="grid grid-cols-1 gap-2">
              {TRIGGER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    form.trigger === opt.value
                      ? "border-blue-500 bg-blue-50/50"
                      : "hover:bg-muted/40"
                  } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="trigger"
                    value={opt.value}
                    checked={form.trigger === opt.value}
                    disabled={isEdit}
                    onChange={() => set("trigger", opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </Field>

          {/* Keyword-specific fields */}
          {form.trigger === "keyword" && (
            <>
              <Field label="Keywords" required hint="Press Enter or comma to add. At least one required.">
                <KeywordInput keywords={form.keywords} onChange={(kws) => set("keywords", kws)} />
              </Field>
              <Field label="Match mode" required>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.match_mode}
                  onChange={(e) => set("match_mode", e.target.value as MatchMode)}
                >
                  {MATCH_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {/* Postback-specific field */}
          {form.trigger === "postback" && (
            <Field label="Postback data" required hint="Exact postback data string from the button action.">
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
                placeholder="e.g. action=buy&item=123"
                value={form.postback_data}
                onChange={(e) => set("postback_data", e.target.value)}
              />
            </Field>
          )}

          {/* Priority */}
          <Field label="Priority" hint="Lower number = higher priority. Rules are evaluated in ascending order.">
            <input
              type="number"
              min={1}
              max={999}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={form.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
            />
          </Field>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.is_enabled}
                onChange={(e) => set("is_enabled", e.target.checked)}
              />
              <div className="w-10 h-5 bg-muted peer-checked:bg-line rounded-full transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
            </label>
            <span className="text-sm font-medium">
              {form.is_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {/* Messages */}
          <Field label="Reply messages" required hint="Up to 5 text messages. Sent in order.">
            <MessageEditor
              messages={form.messages}
              onChange={(msgs) => set("messages", msgs)}
            />
          </Field>

          {/* Quick Reply Set */}
          <Field label="Quick Reply Set" hint="Optional. Attach tap-able chips to the last message.">
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
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

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
        </form>

        {/* footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
