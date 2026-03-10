import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload, RefreshCw, Copy, Trash2, FileImage, Film, Music, File,
  Edit, Tag, RotateCcw, AlertTriangle, Clock, X, ExternalLink, Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { mediaApi } from "@/api/media";
import type { Media } from "@/types";
import { UploadMediaDialog } from "./UploadMediaDialog";
import { EditMediaDialog } from "./EditMediaDialog";

import { toDisplayUrl } from "@/lib/mediaUtils";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const typeIcon: Record<string, React.ElementType> = {
  image:     FileImage,
  video:     Film,
  audio:     Music,
  file:      File,
  rich_menu: FileImage,
};

const typeVariant: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  image:     "success",
  video:     "default",
  audio:     "warning",
  file:      "secondary",
  rich_menu: "outline",
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function trashCountdown(deletedAt: string): string {
  const deleted = new Date(deletedAt);
  const expiry = new Date(deleted.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const msLeft = expiry.getTime() - now.getTime();
  if (msLeft <= 0) return "Expired";
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  const daysAgo = Math.floor((now.getTime() - deleted.getTime()) / (24 * 60 * 60 * 1000));
  return `Deleted ${daysAgo}d ago · Expires in ${daysLeft}d`;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ media, onClose }: { media: Media; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white"
        >
          <X size={24} />
        </button>

        {media.type === "image" || media.type === "rich_menu" ? (
          <img
            src={toDisplayUrl(media.url)}
            alt={media.alt_text || media.name}
            className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl"
          />
        ) : media.type === "video" ? (
          <video src={toDisplayUrl(media.url)} controls className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
        ) : media.type === "audio" ? (
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Music size={48} className="text-muted-foreground" />
            <p className="font-medium">{media.name}</p>
            <audio src={toDisplayUrl(media.url)} controls />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <File size={48} className="text-muted-foreground" />
            <p className="font-medium">{media.name}</p>
            <a href={media.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink size={14} /> Open file
              </Button>
            </a>
          </div>
        )}

        <div className="mt-3 text-white/70 text-sm text-center">
          {media.name}
          {media.width > 0 && <span className="ml-2 text-white/40">{media.width}×{media.height}px</span>}
          <span className="ml-2 text-white/40">{formatBytes(media.size)}</span>
        </div>
      </div>
    </div>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────────
function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
      title="Copy URL"
    >
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

// ── MediaCard ─────────────────────────────────────────────────────────────────
interface MediaCardProps {
  m: Media;
  onDelete: (id: string) => void;
  onEdit: (m: Media) => void;
  onPreview: (m: Media) => void;
  deletingId: string | null;
}

function MediaCard({ m, onDelete, onEdit, onPreview, deletingId }: MediaCardProps) {
  const TypeIcon = typeIcon[m.type] ?? File;
  const isFile = m.type === "file";
  const canPreview = ["image", "rich_menu", "video", "audio"].includes(m.type);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="flex items-center gap-3 p-3">
        {/* Thumbnail — clickable */}
        <div
          className={`w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center ${canPreview ? "cursor-pointer hover:opacity-80 transition-opacity ring-offset-1 hover:ring-2 hover:ring-primary/40" : ""}`}
          onClick={() => canPreview && onPreview(m)}
          title={canPreview ? "Click to preview" : undefined}
        >
          {m.thumbnail_url || (m.type === "image" && m.url) ? (
            <img
              src={toDisplayUrl(m.thumbnail_url || m.url)}
              alt={m.alt_text || m.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <TypeIcon size={18} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm truncate max-w-[200px]">{m.name}</span>
            <Badge variant={typeVariant[m.type] ?? "secondary"} className="text-xs">{m.type}</Badge>
            {isFile && (
              <Badge variant="warning" className="text-xs gap-0.5 py-0">
                <AlertTriangle size={9} /> LINE
              </Badge>
            )}
            {m.usage_count > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 py-0">
                ×{m.usage_count}
              </Badge>
            )}
          </div>

          {/* Row 2: size · dimensions · alt text */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{formatBytes(m.size)}</span>
            {m.width > 0 && <span className="text-xs text-muted-foreground">{m.width}×{m.height}</span>}
            {m.alt_text && (
              <span className="text-xs text-blue-500 truncate max-w-[160px]" title={m.alt_text}>
                "{m.alt_text}"
              </span>
            )}
          </div>

          {/* Row 3: tags + copy button */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {m.tags && m.tags.length > 0 && (
              <>
                <Tag size={9} className="text-muted-foreground" />
                {m.tags.map(tag => (
                  <span key={tag} className="text-xs bg-muted px-1 py-0 rounded">{tag}</span>
                ))}
              </>
            )}
            {m.url && <CopyButton url={m.url} />}
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground flex-shrink-0 text-right hidden md:block">
          {new Date(m.created_at).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(m)} title="Edit">
            <Edit size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${m.usage_count > 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-destructive/70 hover:text-destructive"}`}
            disabled={deletingId === m.id || m.usage_count > 0}
            onClick={() => onDelete(m.id)}
            title={m.usage_count > 0 ? "In use — cannot delete" : "Move to trash"}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── MediaPage ─────────────────────────────────────────────────────────────────
export function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [deletedMedia, setDeletedMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [activeTab, setActiveTab] = useState("library");

  const loadLibrary = () => {
    setLoading(true);
    mediaApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setMedia(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadDeleted = () => {
    setLoadingDeleted(true);
    mediaApi
      .listDeleted({ workspace_id: WORKSPACE_ID })
      .then((res) => setDeletedMedia(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingDeleted(false));
  };

  useEffect(() => { loadLibrary(); }, []);
  useEffect(() => { if (activeTab === "trash") loadDeleted(); }, [activeTab]);

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewMedia(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Move this file to trash? You can restore it within 7 days.")) return;
    setDeletingId(id);
    try {
      await mediaApi.delete(id);
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      alert(msg.includes("in use") ? "Cannot delete: this asset is currently used in a message." : msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await mediaApi.restore(id);
      setDeletedMedia(prev => prev.filter(m => m.id !== id));
      setMedia(prev => [res, ...prev]);
    } catch {
      alert("Failed to restore media");
    } finally {
      setRestoringId(null);
    }
  };

  const filtered = media.filter(m => {
    if (filter && m.type !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.original_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout title="Media Library">
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="library">Library ({media.length})</TabsTrigger>
              <TabsTrigger value="trash">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Recently Deleted
                  {deletedMedia.length > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-medium">
                      {deletedMedia.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "library" && (
              <Button size="sm" className="gap-2" onClick={() => setShowUpload(true)}>
                <Upload size={14} />
                Upload
              </Button>
            )}
          </div>

          {/* Library Tab */}
          <TabsContent value="library">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <input
                type="text"
                className="border rounded-md px-3 py-1.5 text-sm bg-background flex-1 min-w-[160px]"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="border rounded-md px-3 py-1.5 text-sm bg-background"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="file">Files</option>
              </select>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <RefreshCw size={16} className="animate-spin" /> Loading...
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="font-medium">No media files yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload images and files to use in your messages.</p>
                  <Button className="mt-4 gap-2" size="sm" onClick={() => setShowUpload(true)}>
                    <Upload size={14} /> Upload
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid gap-2">
                {filtered.map(m => (
                  <MediaCard
                    key={m.id}
                    m={m}
                    onDelete={handleDelete}
                    onEdit={setEditMedia}
                    onPreview={setPreviewMedia}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recently Deleted Tab */}
          <TabsContent value="trash">
            <p className="text-xs text-muted-foreground mb-3">
              Deleted files are kept for 7 days, then permanently removed.
            </p>

            {loadingDeleted && (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <RefreshCw size={16} className="animate-spin" /> Loading...
              </div>
            )}

            {!loadingDeleted && deletedMedia.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-3">🗑️</div>
                  <p className="font-medium">Nothing here</p>
                  <p className="text-sm text-muted-foreground mt-1">Deleted items are kept for 7 days.</p>
                </CardContent>
              </Card>
            )}

            {!loadingDeleted && deletedMedia.length > 0 && (
              <div className="grid gap-2">
                {deletedMedia.map(m => {
                  const TypeIcon = typeIcon[m.type] ?? File;
                  return (
                    <Card key={m.id} className="opacity-75">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {m.thumbnail_url || (m.type === "image" && m.url) ? (
                            <img src={toDisplayUrl(m.thumbnail_url || m.url)} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <TypeIcon size={18} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{m.name}</span>
                            <Badge variant={typeVariant[m.type] ?? "secondary"} className="text-xs">{m.type}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatBytes(m.size)}</div>
                          {m.deleted_at && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={9} className="text-orange-500" />
                              <span className="text-xs text-orange-500">{trashCountdown(m.deleted_at)}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 flex-shrink-0 text-xs h-7"
                          disabled={restoringId === m.id}
                          onClick={() => handleRestore(m.id)}
                        >
                          <RotateCcw size={11} />
                          {restoringId === m.id ? "Restoring..." : "Restore"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      {previewMedia && <Lightbox media={previewMedia} onClose={() => setPreviewMedia(null)} />}

      <UploadMediaDialog
        open={showUpload}
        workspaceId={WORKSPACE_ID}
        onClose={() => setShowUpload(false)}
        onUploaded={(m) => setMedia(prev => [m, ...prev])}
      />

      <EditMediaDialog
        open={!!editMedia}
        media={editMedia}
        onClose={() => setEditMedia(null)}
        onUpdated={(updated) => setMedia(prev => prev.map(m => m.id === updated.id ? updated : m))}
      />
    </AppLayout>
  );
}
