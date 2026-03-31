import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { knowledgeBaseApi } from "@/api/aiChatbot";
import type { KnowledgeBase, KBSourceType } from "@/types";
import { Plus, Pencil, Trash2, RefreshCw, Search, X, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getWorkspaceId } from "@/lib/auth";

const WORKSPACE_ID = getWorkspaceId() ?? "";

const SOURCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "manual", label: "Manual" },
  { value: "imported", label: "Imported" },
  { value: "learned_from_reply", label: "Learned" },
] as const;

const sourceBadge: Record<KBSourceType, { label: string; cls: string }> = {
  manual: { label: "Manual", cls: "bg-blue-100 text-blue-700 border-0" },
  imported: { label: "Imported", cls: "bg-gray-100 text-gray-700 border-0" },
  learned_from_reply: { label: "Learned", cls: "bg-green-100 text-green-700 border-0" },
};

interface EntryFormState {
  title: string;
  content: string;
  tags: string;
  is_active: boolean;
}

const emptyForm: EntryFormState = { title: "", content: "", tags: "", is_active: true };

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeBase[] | null>(null);

  const [sourceFilter, setSourceFilter] = useState<"all" | KBSourceType>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeBase | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setLoading(true);
    setSearchResults(null);
    knowledgeBaseApi.list(WORKSPACE_ID)
      .then((res) => setEntries(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, []);

  // All unique tags from all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Source type stats
  const sourceCounts = useMemo(() => ({
    manual: entries.filter((e) => e.source_type === "manual").length,
    imported: entries.filter((e) => e.source_type === "imported").length,
    learned_from_reply: entries.filter((e) => e.source_type === "learned_from_reply").length,
  }), [entries]);

  const openCreate = () => {
    setEditingEntry(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entry: KnowledgeBase) => {
    setEditingEntry(entry);
    setForm({ title: entry.title, content: entry.content, tags: entry.tags.join(", "), is_active: entry.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const data = {
        workspace_id: WORKSPACE_ID,
        title: form.title,
        content: form.content,
        tags,
        is_active: form.is_active,
      } as Parameters<typeof knowledgeBaseApi.create>[0] & { is_active: boolean };
      if (editingEntry) {
        await knowledgeBaseApi.update(editingEntry.id, data);
      } else {
        await knowledgeBaseApi.create(data);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmedDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await knowledgeBaseApi.delete(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (entry: KnowledgeBase) => {
    setTogglingId(entry.id);
    try {
      const tags = entry.tags;
      await knowledgeBaseApi.update(entry.id, {
        workspace_id: WORKSPACE_ID,
        title: entry.title,
        content: entry.content,
        tags,
        is_active: !entry.is_active,
      } as Parameters<typeof knowledgeBaseApi.update>[1] & { is_active: boolean });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle active");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setLoading(true);
    try {
      const res = await knowledgeBaseApi.search(WORKSPACE_ID, searchQuery, 10);
      setSearchResults(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Apply source + tag filters (only when not in search mode)
  const filteredEntries = useMemo(() => {
    let list = searchResults ?? entries;
    if (searchResults) return list; // search results bypass local filters
    if (sourceFilter !== "all") list = list.filter((e) => e.source_type === sourceFilter);
    if (tagFilter) list = list.filter((e) => e.tags.includes(tagFilter));
    return list;
  }, [entries, searchResults, sourceFilter, tagFilter]);

  return (
    <AppLayout title="Knowledge Base">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Source stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="font-medium text-foreground">{entries.length} entries</span>
            {sourceCounts.manual > 0 && (
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{sourceCounts.manual} Manual</span>
            )}
            {sourceCounts.imported > 0 && (
              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{sourceCounts.imported} Imported</span>
            )}
            {sourceCounts.learned_from_reply > 0 && (
              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{sourceCounts.learned_from_reply} Learned</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="flex flex-1 gap-1">
              <input
                type="text"
                className="flex-1 border rounded-md px-3 py-1.5 text-sm"
                placeholder="Semantic search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { void handleSearch(); } }}
              />
              {searchResults && (
                <button onClick={() => { setSearchResults(null); setSearchQuery(""); }} className="p-1.5 hover:bg-muted rounded">
                  <X size={14} />
                </button>
              )}
              <Button size="sm" variant="outline" onClick={() => { void handleSearch(); }}><Search size={14} /></Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="p-2 rounded-md hover:bg-muted" title="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" />
              Add Entry
            </Button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        {/* Source filter + Tag filter — hidden during search */}
        {!searchResults && (
          <div className="space-y-2">
            {/* Source type filter */}
            <div className="flex gap-1 flex-wrap">
              {SOURCE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSourceFilter(f.value as "all" | KBSourceType)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    sourceFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tag filter chips */}
            {allTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      tagFilter === tag
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {tagFilter && (
                  <button
                    onClick={() => setTagFilter(null)}
                    className="text-xs px-2 py-0.5 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    Clear tag filter ×
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {searchResults !== null && (
          <div className="text-sm text-muted-foreground">
            Showing {searchResults.length} result(s) for "{searchQuery}"
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {searchResults !== null
                  ? "No results found"
                  : tagFilter || sourceFilter !== "all"
                  ? "No entries match the current filters"
                  : "No knowledge base entries. Add your first entry!"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredEntries.map((entry) => {
                  const src = sourceBadge[entry.source_type] ?? sourceBadge.manual;
                  return (
                    <div key={entry.id} className="px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{entry.title}</span>
                            <Badge className={`text-xs ${src.cls}`}>{src.label}</Badge>
                            {!entry.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                          {entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {entry.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                                  className={`text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                    tagFilter === tag
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-muted hover:bg-blue-50 hover:text-blue-600"
                                  }`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Inline active toggle */}
                          <button
                            onClick={() => { void handleToggleActive(entry); }}
                            disabled={togglingId === entry.id}
                            title={entry.is_active ? "Click to deactivate" : "Click to activate"}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            {entry.is_active
                              ? <ToggleRight size={15} className="text-green-600" />
                              : <ToggleLeft size={15} className="text-gray-400" />
                            }
                          </button>
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: entry.id, name: entry.title })}
                            disabled={deletingId === entry.id}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Dialog — uses shared Dialog component */}
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Knowledge Base Entry" : "Add Knowledge Base Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update the title, content, tags, and status of this entry."
                  : "Add a new FAQ or knowledge entry for the AI chatbot to reference."}
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="FAQ title or topic"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Content</label>
                  <span className="text-xs text-muted-foreground font-mono">{form.content.length} chars</span>
                </div>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Detailed answer or knowledge content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="shipping, returns, payment"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                  Active (included in AI context search)
                </label>
              </div>

              {error && <div className="p-2 bg-red-50 rounded text-sm text-red-700">{error}</div>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { void handleSave(); }} disabled={saving || !form.title || !form.content}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ "{deleteTarget?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { void handleConfirmedDelete(deleteTarget!.id); setDeleteTarget(null); }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
