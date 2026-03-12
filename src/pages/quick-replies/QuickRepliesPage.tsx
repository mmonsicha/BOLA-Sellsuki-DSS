import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, RefreshCw, Edit3, MessageSquare } from "lucide-react";
import type { QuickReply, QuickReplyItem, LineOA } from "@/types";
import { quickReplyApi } from "@/api/richMenu";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";
import { useToast } from "@/components/ui/toast";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const ACTION_TYPES = [
  { value: "message", label: "Send Message" },
  { value: "uri", label: "Open URL" },
  { value: "postback", label: "Postback" },
  { value: "datetimepicker", label: "Date Picker" },
  { value: "camera", label: "Open Camera" },
  { value: "cameraRoll", label: "Open Camera Roll" },
  { value: "location", label: "Send Location" },
];

const MAX_ITEMS = 13;
const MAX_LABEL_LEN = 20;

function emptyItem(): QuickReplyItem {
  return { label: "", action_type: "message", action_value: "", image_url: "" };
}

// ---- LINE-style Quick Reply Preview ----
function QuickReplyPreview({ items }: { items: QuickReplyItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No items to preview
      </div>
    );
  }

  return (
    <div className="bg-gray-100 rounded-lg p-3">
      <div className="text-xs text-muted-foreground mb-2">LINE Preview:</div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          >
            {item.image_url ? (
              <div
                className="w-10 h-10 rounded-full bg-white border-2 border-green-400 overflow-hidden"
                style={{ backgroundImage: `url(${item.image_url})`, backgroundSize: "cover" }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white border-2 border-green-400 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-500" />
              </div>
            )}
            <span
              className="text-xs text-center leading-tight bg-white rounded-full px-2 py-0.5 border border-gray-200 max-w-[72px] truncate group-hover:bg-green-50"
              style={{ fontSize: 11 }}
            >
              {item.label || `Item ${i + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Item Editor Row ----
interface ItemRowProps {
  item: QuickReplyItem;
  index: number;
  onChange: (patch: Partial<QuickReplyItem>) => void;
  onRemove: () => void;
}

function ItemRow({ item, index, onChange, onRemove }: ItemRowProps) {
  const labelTooLong = item.label.length > MAX_LABEL_LEN;

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            Label{" "}
            <span className={`${labelTooLong ? "text-destructive" : "text-muted-foreground"}`}>
              ({item.label.length}/{MAX_LABEL_LEN})
            </span>
          </Label>
          <Input
            className={`h-7 text-xs ${labelTooLong ? "border-destructive" : ""}`}
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Button label"
            maxLength={MAX_LABEL_LEN + 5}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select value={item.action_type} onValueChange={(v) => onChange({ action_type: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((at) => (
                <SelectItem key={at.value} value={at.value} className="text-xs">
                  {at.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(item.action_type === "message" || item.action_type === "postback" || item.action_type === "uri") && (
        <div className="space-y-1">
          <Label className="text-xs">
            {item.action_type === "message" && "Message Text"}
            {item.action_type === "uri" && "URL"}
            {item.action_type === "postback" && "Postback Data"}
          </Label>
          <Input
            className="h-7 text-xs"
            value={item.action_value}
            onChange={(e) => onChange({ action_value: e.target.value })}
            placeholder={
              item.action_type === "uri"
                ? "https://..."
                : item.action_type === "postback"
                ? "action=yes"
                : "Text to send"
            }
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Image URL (optional)</Label>
        <Input
          className="h-7 text-xs"
          value={item.image_url}
          onChange={(e) => onChange({ image_url: e.target.value })}
          placeholder="https://... (40x40 PNG)"
        />
      </div>
    </div>
  );
}

// ---- Quick Reply Edit Dialog ----
interface EditDialogProps {
  open: boolean;
  editing: QuickReply | null;
  lineOAID: string;
  onClose: () => void;
  onSaved: (qr: QuickReply) => void;
}

function EditDialog({ open, editing, lineOAID, onClose, onSaved }: EditDialogProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [items, setItems] = useState<QuickReplyItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setItems(editing.items?.length ? editing.items : [emptyItem()]);
    } else {
      setName("");
      setItems([emptyItem()]);
    }
  }, [editing, open]);

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, emptyItem()]);
  };

  const updateItem = (i: number, patch: Partial<QuickReplyItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const hasLabelErrors = items.some((it) => it.label.length > MAX_LABEL_LEN);

  const handleSave = async () => {
    if (!name.trim() || hasLabelErrors) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), workspace_id: WORKSPACE_ID, line_oa_id: lineOAID, items };
      const result = editing
        ? await quickReplyApi.update(editing.id, data)
        : await quickReplyApi.create(data);
      onSaved(result);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Quick Reply Set" : "New Quick Reply Set"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-1 sm:min-h-0 sm:overflow-hidden px-6 py-4">
          {/* Items editor */}
          <div className="space-y-3 sm:flex-1 sm:overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label>Set Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Quick Replies"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>
                Items{" "}
                <span className={`text-xs ${items.length > MAX_ITEMS ? "text-destructive" : "text-muted-foreground"}`}>
                  ({items.length}/{MAX_ITEMS})
                </span>
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={addItem}
                disabled={items.length >= MAX_ITEMS}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>

            {items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                index={i}
                onChange={(patch) => updateItem(i, patch)}
                onRemove={() => removeItem(i)}
              />
            ))}
          </div>

          {/* Preview panel */}
          <div className="w-full sm:w-52 sm:flex-shrink-0 space-y-2">
            <Label className="text-sm">Preview</Label>
            <QuickReplyPreview items={items} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Max {MAX_ITEMS} items</p>
              <p>Labels max {MAX_LABEL_LEN} chars</p>
              <p>Icons: 40x40 PNG</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { void handleSave(); }} disabled={!name.trim() || hasLabelErrors || saving || items.length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Page ----
export function QuickRepliesPage() {
  const toast = useToast();
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QuickReply | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Load LINE OAs on mount
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedLineOAId(oas[0].id);
      })
      .catch(console.error);
  }, []);

  const load = (lineOAID: string) => {
    if (!lineOAID) return;
    setLoading(true);
    setError(null);
    quickReplyApi
      .list(WORKSPACE_ID, lineOAID)
      .then((res) => setQuickReplies(res.data || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedLineOAId) load(selectedLineOAId);
    else setQuickReplies([]);
  }, [selectedLineOAId]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(id);
    try {
      await quickReplyApi.delete(id);
      setQuickReplies((prev) => prev.filter((qr) => qr.id !== id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = (qr: QuickReply) => {
    setQuickReplies((prev) => {
      const idx = prev.findIndex((q) => q.id === qr.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = qr;
        return next;
      }
      return [qr, ...prev];
    });
  };

  return (
    <AppLayout title="Quick Replies">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Create sets of quick reply chips that appear above the keyboard in LINE chats.
          </p>
          {selectedLineOAId && (
            <Button
              className="self-start sm:self-auto flex-shrink-0"
              onClick={() => { setEditingQR(null); setDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Quick Reply Set
            </Button>
          )}
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={setSelectedLineOAId}
          showAll={false}
        />

        {/* Body */}
        {!selectedLineOAId ? null : loading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : quickReplies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No quick reply sets yet</p>
              <p className="text-sm mt-1">Create chips that users can tap to send predefined messages.</p>
              <Button
                className="mt-4"
                onClick={() => { setEditingQR(null); setDialogOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create First Set
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickReplies.map((qr) => (
              <Card key={qr.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{qr.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {qr.items?.length || 0} item{(qr.items?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingQR(qr); setDialogOpen(true); }}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        disabled={deletingId === qr.id}
                        onClick={() => handleDelete(qr.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Preview chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(qr.items || []).slice(0, 6).map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-green-300 text-green-700 rounded-full px-2.5 py-1"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-3.5 h-3.5 rounded-full object-cover"
                          />
                        )}
                        {item.label || `Item ${i + 1}`}
                      </span>
                    ))}
                    {(qr.items || []).length > 6 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{(qr.items || []).length - 6} more
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {new Date(qr.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EditDialog
        open={dialogOpen}
        editing={editingQR}
        lineOAID={selectedLineOAId}
        onClose={() => { setDialogOpen(false); setEditingQR(null); }}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quick reply set?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { void handleConfirmedDelete(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
