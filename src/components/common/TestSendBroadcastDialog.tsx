import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Send, CheckCircle, AlertCircle, X } from "lucide-react";
import { broadcastApi, type BroadcastMessageInput } from "@/api/broadcast";
import type { LineOA } from "@/types";

interface TestSendBroadcastDialogProps {
  onClose: () => void;
  lineOAs: LineOA[];
  defaultLineOAId?: string;
  messages: BroadcastMessageInput[];
}

export function TestSendBroadcastDialog({
  onClose,
  lineOAs,
  defaultLineOAId,
  messages,
}: TestSendBroadcastDialogProps) {
  const [lineOAId, setLineOAId] = useState(defaultLineOAId ?? lineOAs[0]?.id ?? "");
  const [lineUserId, setLineUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!lineUserId.trim()) {
      setError("Please enter a LINE User ID.");
      return;
    }
    if (!lineOAId) {
      setError("Please select a LINE OA.");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      await broadcastApi.testSend({
        line_oa_id: lineOAId,
        messages,
        line_user_id: lineUserId.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Send Test Message</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Send a preview to your own LINE User ID before sending to real recipients.
          No broadcast record will be created.
        </p>

        {/* LINE OA selector — only if multiple OAs available */}
        {lineOAs.length > 1 && (
          <div className="space-y-1">
            <label className="text-sm font-medium">LINE OA</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={lineOAId}
              onChange={(e) => setLineOAId(e.target.value)}
              disabled={sending}
            >
              {lineOAs.map((oa) => (
                <option key={oa.id} value={oa.id}>
                  {oa.name}{oa.basic_id ? ` (@${oa.basic_id})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* LINE User ID input */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            LINE User ID <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={lineUserId}
            onChange={(e) => { setLineUserId(e.target.value); setError(null); setSuccess(false); }}
            disabled={sending}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Find your User ID in the LINE Developers Console or the Followers list in BOLA.
          </p>
        </div>

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
            <CheckCircle size={14} />
            Test message sent — check your LINE app.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => { void handleSend(); }}
            disabled={sending || !lineUserId.trim()}
            className="bg-[#06C755] hover:bg-[#05a847] text-white"
          >
            {sending ? (
              <RefreshCw size={13} className="mr-1.5 animate-spin" />
            ) : (
              <Send size={13} className="mr-1.5" />
            )}
            {sending ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </div>
    </div>
  );
}
