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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, RefreshCw, ChevronLeft, TestTube } from "lucide-react";
import type { RichMenu, RichMenuAssignment, AssignmentRule, LineOA } from "@/types";
import { richMenuAssignmentApi, richMenuApi } from "@/api/richMenu";
import { lineOAApi } from "@/api/lineOA";
import { useToast } from "@/components/ui/toast";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/** Display name for a LINE OA: prefer name, fall back to basic_id (@handle), then short ID */
function oaLabel(oa: LineOA): string {
  if (oa.name) return oa.basic_id ? `${oa.name} (${oa.basic_id})` : oa.name;
  return oa.basic_id || oa.id.slice(0, 12);
}

const RULE_FIELDS = [
  { value: "membership_tier", label: "Membership Tier" },
  { value: "tag", label: "Tag" },
  { value: "follow_status", label: "Follow Status" },
  { value: "language", label: "Language" },
  { value: "custom_field", label: "Custom Field" },
];

const RULE_OPERATORS = [
  { value: "=", label: "Equals" },
  { value: "!=", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "starts_with", label: "Starts With" },
];

const fieldLabel = (v: string) => RULE_FIELDS.find((f) => f.value === v)?.label ?? v;
const operatorLabel = (v: string) => RULE_OPERATORS.find((op) => op.value === v)?.label ?? v;

interface RuleRowProps {
  rule: AssignmentRule;
  index: number;
  onChange: (patch: Partial<AssignmentRule>) => void;
  onRemove: () => void;
}

function RuleRow({ rule, index, onChange, onRemove }: RuleRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
      <Select value={rule.field} onValueChange={(v) => onChange({ field: v })}>
        <SelectTrigger className="h-7 text-xs w-36">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {RULE_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={rule.operator} onValueChange={(v) => onChange({ operator: v })}>
        <SelectTrigger className="h-7 text-xs w-28">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {RULE_OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-7 text-xs flex-1"
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Value"
      />
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface AssignmentDialogProps {
  open: boolean;
  lineOAId: string;
  menus: RichMenu[];
  editing: RichMenuAssignment | null;
  onClose: () => void;
  onSaved: (a: RichMenuAssignment) => void;
}

function AssignmentDialog({ open, lineOAId, menus, editing, onClose, onSaved }: AssignmentDialogProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(10);
  const [isDefault, setIsDefault] = useState(false);
  const [richMenuId, setRichMenuId] = useState("");
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setPriority(editing.priority);
      setIsDefault(editing.is_default);
      setRichMenuId(editing.rich_menu_id);
      setRules(editing.rules || []);
    } else {
      setName("");
      setPriority(10);
      setIsDefault(false);
      setRichMenuId(menus[0]?.id ?? "");
      setRules([]);
    }
  }, [editing, menus, open]);

  const addRule = () => {
    setRules((prev) => [...prev, { field: RULE_FIELDS[0].value, operator: "=", value: "" }]);
  };

  const updateRule = (i: number, patch: Partial<AssignmentRule>) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const removeRule = (i: number) => {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim() || !richMenuId) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), priority, is_default: isDefault, rich_menu_id: richMenuId, line_oa_id: lineOAId, rules };
      const result = editing
        ? await richMenuAssignmentApi.update(editing.id, data)
        : await richMenuAssignmentApi.create(data);
      onSaved(result);
      onClose();
      toast.success(editing ? "Rule updated" : "Rule created");
    } catch (e: unknown) {
      toast.error("Save failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-lg">
            {editing ? "Edit Assignment Rule" : "New Assignment Rule"}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* Rule Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Rule Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Members, Gold Tier, New Users…"
              autoFocus
            />
          </div>

          {/* Priority + Rich Menu */}
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
              />
              <p className="text-[11px] text-muted-foreground leading-tight">Lower = higher priority</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Assign Rich Menu <span className="text-destructive">*</span>
              </Label>
              <Select value={richMenuId} onValueChange={setRichMenuId}>
                <SelectTrigger>
                  <SelectValue>
                    {richMenuId
                      ? (menus.find((m) => m.id === richMenuId)?.name || richMenuId.slice(0, 12))
                      : <span className="text-muted-foreground">Select a menu…</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name || m.id.slice(0, 12)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default fallback toggle */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} id="is-default" className="mt-0.5" />
            <div>
              <Label htmlFor="is-default" className="text-sm font-medium cursor-pointer">
                Default fallback rule
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Applied to followers who don't match any other rule
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Conditions</Label>
                <p className="text-xs text-muted-foreground">All conditions must match (AND logic)</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addRule}>
                <Plus className="h-3 w-3" />
                Add Condition
              </Button>
            </div>

            {rules.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2.5 bg-muted/30 rounded-lg border border-dashed">
                <span className="text-base">∅</span>
                No conditions — this rule matches everyone.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((r, i) => (
                  <RuleRow
                    key={i}
                    rule={r}
                    index={i}
                    onChange={(patch) => updateRule(i, patch)}
                    onRemove={() => removeRule(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { void handleSave(); }}
            disabled={!name.trim() || !richMenuId || saving}
            className="min-w-[100px]"
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TestPanelProps {
  assignment: RichMenuAssignment;
  lineOAId: string;
  menus: RichMenu[];
}

function TestPanel({ assignment, lineOAId, menus }: TestPanelProps) {
  const toast = useToast();
  const menuName = (id: string) => menus.find((m) => m.id === id)?.name ?? id.slice(0, 8);
  const [followerID, setFollowerID] = useState("");
  const [result, setResult] = useState<{ matched: boolean; rich_menu_id: string; reason: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTest = async () => {
    if (!followerID.trim()) return;
    setTesting(true);
    setResult(null);
    try {
      const res = await richMenuAssignmentApi.evaluate(lineOAId, followerID.trim());
      setResult(res);
    } catch (e: unknown) {
      setResult({ matched: false, rich_menu_id: "", reason: e instanceof Error ? e.message : "Error" });
    } finally {
      setTesting(false);
    }
  };

  const handleApply = async () => {
    if (!followerID.trim()) return;
    setApplying(true);
    try {
      await richMenuAssignmentApi.apply(lineOAId, followerID.trim());
      toast.success("Rich menu applied", "LINE rich menu has been updated for this follower.");
    } catch (e: unknown) {
      toast.error("Apply failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setApplying(false);
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setOpen(true)}>
        <TestTube className="h-3 w-3 mr-1" />
        Test
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="flex items-center gap-2">
        <Input
          className="h-7 text-xs flex-1"
          value={followerID}
          onChange={(e) => setFollowerID(e.target.value)}
          placeholder="Follower ID or LINE user ID"
          onKeyDown={(e) => { if (e.key === "Enter") void handleTest(); }}
        />
        <Button size="sm" className="h-7 text-xs" onClick={() => { void handleTest(); }} disabled={testing || !followerID.trim()}>
          {testing ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Evaluate"}
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
          onClick={() => { void handleApply(); }}
          disabled={applying || !followerID.trim()}
          title="Evaluate rules and immediately apply rich menu via LINE API"
        >
          {applying ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Apply"}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setOpen(false); setResult(null); }}>
          &times;
        </Button>
      </div>
      {result && (
        <div className={`text-xs px-2 py-1 rounded ${result.matched ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
          {result.matched ? "✓ Matched" : "✗ No match"} — {result.reason || assignment.name}
          {result.matched && result.rich_menu_id && (
            <span className="ml-1 font-medium">→ {menuName(result.rich_menu_id)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function RichMenuAssignmentsPage() {
  const toast = useToast();
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedOA, setSelectedOA] = useState<string>("");
  const [assignments, setAssignments] = useState<RichMenuAssignment[]>([]);
  const [menus, setMenus] = useState<RichMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RichMenuAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    lineOAApi.list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas: LineOA[] = res.data || [];
        setLineOAs(oas);
        if (oas.length > 0) setSelectedOA(oas[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedOA) return;
    setLoading(true);
    setError(null);
    Promise.all([
      richMenuAssignmentApi.list(selectedOA).then((r) => r.data || []).catch(() => []),
      richMenuApi.list(selectedOA).then((r) => r.data || []).catch(() => []),
    ])
      .then(([a, m]) => {
        setAssignments(a);
        setMenus(m);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedOA]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await richMenuAssignmentApi.delete(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Rule deleted");
    } catch (e: unknown) {
      toast.error("Delete failed", e instanceof Error ? e.message : "An unexpected error occurred.");
    }
  };

  const handleSaved = (assignment: RichMenuAssignment) => {
    setAssignments((prev) => {
      const idx = prev.findIndex((a) => a.id === assignment.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = assignment;
        return next;
      }
      return [...prev, assignment];
    });
  };

  const menuName = (id: string) => menus.find((m) => m.id === id)?.name ?? id.slice(0, 8);

  const sorted = [...assignments].sort((a, b) => {
    if (a.is_default && !b.is_default) return 1;
    if (!a.is_default && b.is_default) return -1;
    return a.priority - b.priority;
  });

  return (
    <AppLayout title="Rich Menu Assignment Rules">
      <div className="space-y-4">
        {/* Nav + Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/rich-menus"; }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Menus
            </Button>
            <Label className="whitespace-nowrap text-sm font-medium">LINE OA:</Label>
            <Select value={selectedOA} onValueChange={setSelectedOA}>
              <SelectTrigger className="w-64">
                <SelectValue>
                  {selectedOA
                    ? (lineOAs.find((o) => o.id === selectedOA) ? oaLabel(lineOAs.find((o) => o.id === selectedOA)!) : selectedOA.slice(0, 12))
                    : "Select LINE OA..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lineOAs.map((oa) => (
                  <SelectItem key={oa.id} value={oa.id}>{oaLabel(oa)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditingAssignment(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Rules are evaluated in priority order (lowest number first). The first matching rule determines which rich menu is shown to a follower.
        </p>

        {/* Body */}
        {!selectedOA ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Select a LINE OA to view assignment rules</CardContent>
          </Card>
        ) : loading ? (
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
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No assignment rules yet</p>
              <p className="text-sm mt-1">Create rules to automatically assign rich menus to followers based on their attributes.</p>
              <Button className="mt-4" onClick={() => { setEditingAssignment(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Add First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((assignment) => (
              <Card
                key={assignment.id}
                className={assignment.is_default ? "border-blue-200 bg-blue-50/40" : ""}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!assignment.is_default && (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          #{assignment.priority}
                        </span>
                      )}
                      <CardTitle className="text-sm">{assignment.name}</CardTitle>
                      {assignment.is_default && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                          Default Fallback
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <TestPanel assignment={assignment} lineOAId={selectedOA} menus={menus} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setEditingAssignment(assignment); setDialogOpen(true); }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {/* Conditions */}
                  {!assignment.is_default && (
                    <div className="flex flex-wrap gap-1.5">
                      {(assignment.rules || []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">No conditions (matches all)</span>
                      ) : (
                        assignment.rules.map((r, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {fieldLabel(r.field)} <span className="mx-0.5 opacity-60">{operatorLabel(r.operator)}</span> <span className="font-semibold">{r.value}</span>
                          </Badge>
                        ))
                      )}
                    </div>
                  )}
                  {/* Assigned menu */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Assigned menu:</span>
                    <span
                      className="font-medium text-foreground cursor-pointer hover:underline"
                      onClick={() => { window.location.href = `/rich-menus/${assignment.rich_menu_id}`; }}
                    >
                      {menuName(assignment.rich_menu_id)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AssignmentDialog
        open={dialogOpen}
        lineOAId={selectedOA}
        menus={menus}
        editing={editingAssignment}
        onClose={() => { setDialogOpen(false); setEditingAssignment(null); }}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment rule?</AlertDialogTitle>
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
