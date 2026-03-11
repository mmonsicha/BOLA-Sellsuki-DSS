import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { replyTemplateApi, type ReplyTemplate } from "@/api/adminPerformance";

// ---- Template form dialog ----

interface TemplateDialogProps {
  open: boolean;
  editing: ReplyTemplate | null;
  onClose: () => void;
  onSaved: (t: ReplyTemplate) => void;
}

function TemplateDialog({ open, editing, onClose, onSaved }: TemplateDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setContent(editing.content);
      setTagsInput(editing.tags?.join(", ") ?? "");
    } else {
      setTitle("");
      setContent("");
      setTagsInput("");
    }
    setError(null);
  }, [editing, open]);

  const parseTags = (raw: string): string[] =>
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tags = parseTags(tagsInput);
      const result = editing
        ? await replyTemplateApi.update(editing.id, title.trim(), content.trim(), tags).then(
            () =>
              ({
                ...editing,
                title: title.trim(),
                content: content.trim(),
                tags,
              } as ReplyTemplate)
          )
        : await replyTemplateApi.create(title.trim(), content.trim(), tags);
      onSaved(result);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Template" : "Add Reply Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tpl-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shipping inquiry response"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-content">
              Content <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="tpl-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type the reply text here…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tpl-tags">Tags</Label>
            <Input
              id="tpl-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="shipping, order, refund (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas. Used for searching templates in Chat.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? (
              <>
                <RefreshCw size={14} className="mr-1.5 animate-spin" />
                Saving…
              </>
            ) : editing ? (
              "Save Changes"
            ) : (
              "Add Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Template card ----

interface TemplateCardProps {
  template: ReplyTemplate;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function TemplateCard({ template, onEdit, onDelete, deleting }: TemplateCardProps) {
  const preview =
    template.content.length > 100
      ? `${template.content.slice(0, 100)}…`
      : template.content;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{template.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used {template.use_count} time{template.use_count !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              title="Edit template"
              aria-label="Edit template"
            >
              <Edit3 size={13} className="mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={deleting}
              title="Delete template"
              aria-label="Delete template"
            >
              {deleting ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </Button>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground leading-relaxed">{preview}</p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Main page ----

export function ReplyTemplatesPage() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [displayTemplates, setDisplayTemplates] = useState<ReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReplyTemplate | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ReplyTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    setLoading(true);
    replyTemplateApi
      .list()
      .then((res) => {
        setTemplates(res);
        setDisplayTemplates(res);
      })
      .catch(() => {
        setTemplates([]);
        setDisplayTemplates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setDisplayTemplates(templates);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      replyTemplateApi
        .search(searchQuery.trim())
        .then((res) => setDisplayTemplates(res))
        .catch(() => setDisplayTemplates([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, templates]);

  const handleSaved = (saved: ReplyTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    // Also update display list if not searching
    if (!searchQuery.trim()) {
      setDisplayTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setDeletingId(id);
    try {
      await replyTemplateApi.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDisplayTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Reply Templates">
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-line p-2">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Reply Templates</h1>
              <p className="text-sm text-muted-foreground">
                Reusable responses for the Chat interface. Type "/" in chat to search.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setDialogOpen(true);
            }}
            className="flex-shrink-0"
          >
            <Plus size={15} className="mr-1.5" />
            Add Template
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            className="pl-9 pr-9"
            placeholder="Search templates by title or content…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <RefreshCw
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </div>

        {/* Template list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <RefreshCw size={16} className="animate-spin" />
            Loading templates…
          </div>
        ) : displayTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <FileText size={48} className="mx-auto text-muted-foreground opacity-30" />
              {searchQuery.trim() ? (
                <>
                  <p className="font-medium text-muted-foreground">No templates match your search</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different keyword, or clear the search to see all templates.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-muted-foreground">No reply templates yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create reusable responses so your team can reply faster in Chat.
                  </p>
                  <Button
                    className="mt-2"
                    onClick={() => {
                      setEditingTemplate(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus size={14} className="mr-1.5" />
                    Create First Template
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => {
                  setEditingTemplate(t);
                  setDialogOpen(true);
                }}
                onDelete={() => setDeleteTarget(t)}
                deleting={deletingId === t.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <TemplateDialog
        open={dialogOpen}
        editing={editingTemplate}
        onClose={() => {
          setDialogOpen(false);
          setEditingTemplate(null);
        }}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently deleted. Admins who have this template
              saved in their chat will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
