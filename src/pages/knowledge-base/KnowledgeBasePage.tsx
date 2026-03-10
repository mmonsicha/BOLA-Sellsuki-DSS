import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { knowledgeBaseApi } from "@/api/aiChatbot";
import type { KnowledgeBase, KBSourceType } from "@/types";
import { Plus, Pencil, Trash2, RefreshCw, Search, X } from "lucide-react";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const sourceBadge: Record<KBSourceType, { label: string; cls: string }> = {
  manual: { label: "Manual", cls: "bg-blue-100 text-blue-700 border-0" },
  imported: { label: "Imported", cls: "bg-gray-100 text-gray-700 border-0" },
  learned_from_reply: { label: "Learned", cls: "bg-green-100 text-green-700 border-0" },
};

interface EntryFormState {
  title: string;
  content: string;
  tags: string;
}

const emptyForm: EntryFormState = { title: "", content: "", tags: "" };

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeBase[] | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeBase | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setSearchResults(null);
    knowledgeBaseApi.list(WORKSPACE_ID)
      .then((res) => setEntries(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingEntry(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entry: KnowledgeBase) => {
    setEditingEntry(entry);
    setForm({ title: entry.title, content: entry.content, tags: entry.tags.join(", ") });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const data = { workspace_id: WORKSPACE_ID, title: form.title, content: form.content, tags };
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge base entry?")) return;
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

  const displayEntries = searchResults ?? entries;

  return (
    <AppLayout title="Knowledge Base">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{entries.length} entries</p>
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="flex flex-1 gap-1">
              <input
                type="text"
                className="flex-1 border rounded-md px-3 py-1.5 text-sm"
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {searchResults && (
                <button onClick={() => { setSearchResults(null); setSearchQuery(""); }} className="p-1.5 hover:bg-muted rounded">
                  <X size={14} />
                </button>
              )}
              <Button size="sm" variant="outline" onClick={handleSearch}><Search size={14} /></Button>
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

        {searchResults !== null && (
          <div className="text-sm text-muted-foreground">
            Showing {searchResults.length} search result(s) for "{searchQuery}"
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
            ) : displayEntries.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {searchResults !== null ? "No results found" : "No knowledge base entries. Add your first entry!"}
              </div>
            ) : (
              <div className="divide-y">
                {displayEntries.map((entry) => {
                  const src = sourceBadge[entry.source_type] ?? sourceBadge.manual;
                  return (
                    <div key={entry.id} className="px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
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
                                <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
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

        {/* Create / Edit Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                {editingEntry ? "Edit Knowledge Base Entry" : "Add Knowledge Base Entry"}
              </h2>

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
                <label className="block text-sm font-medium mb-1">Content</label>
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

              {error && <div className="p-2 bg-red-50 rounded text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !form.title || !form.content}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
