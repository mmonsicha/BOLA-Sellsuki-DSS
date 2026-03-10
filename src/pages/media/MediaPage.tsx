import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload, RefreshCw, Copy, Trash2, FileImage, Film, Music, File,
  Edit, Link, Tag, RotateCcw, AlertTriangle, Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { mediaApi } from "@/api/media";
import type { Media } from "@/types";
import { UploadMediaDialog } from "./UploadMediaDialog";
import { EditMediaDialog } from "./EditMediaDialog";

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

interface MediaCardProps {
  m: Media;
  onDelete: (id: string) => void;
  onEdit: (m: Media) => void;
  deletingId: string | null;
}

function MediaCard({ m, onDelete, onEdit, deletingId }: MediaCardProps) {
  const TypeIcon = typeIcon[m.type] ?? File;
  const isFile = m.type === "file";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {m.thumbnail_url || (m.type === "image" && m.url) ? (
            <img
              src={m.thumbnail_url || m.url}
              alt={m.alt_text || m.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <TypeIcon size={20} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{m.name}</span>
            <Badge variant={typeVariant[m.type] ?? "secondary"}>{m.type}</Badge>
            {isFile && (
              <Badge variant="warning" className="text-xs gap-0.5">
                <AlertTriangle size={10} /> LINE
              </Badge>
            )}
            {m.usage_count > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                Used {m.usage_count}x
              </Badge>
            )}
          </div>

          {/* Alt text */}
          {m.alt_text && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-blue-500 truncate max-w-xs">{m.alt_text}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{m.original_name}</span>
            <span>·</span>
            <span>{formatBytes(m.size)}</span>
            {m.width > 0 && <><span>·</span><span>{m.width}x{m.height}px</span></>}
            {m.mime_type && <><span>·</span><span>{m.mime_type}</span></>}
          </div>

          {/* Tags */}
          {m.tags && m.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <Tag size={10} className="text-muted-foreground" />
              {m.tags.map(tag => (
                <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          )}

          {/* URL + action URL */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground truncate max-w-xs">{m.url}</span>
            {m.url && (
              <button
                onClick={() => navigator.clipboard.writeText(m.url)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                title="Copy URL"
              >
                <Copy size={11} />
              </button>
            )}
            {m.action_url && (
              <a
                href={m.action_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-blue-500 flex-shrink-0"
                title="Action URL"
              >
                <Link size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground flex-shrink-0 text-right hidden sm:block">
          <div>{new Date(m.created_at).toLocaleDateString()}</div>
          {m.updated_at && m.updated_at !== m.created_at && (
            <div className="text-muted-foreground/60">
              upd {new Date(m.updated_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(m)} title="Edit">
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${m.usage_count > 0 ? "text-muted-foreground/40 cursor-not-allowed" : "text-destructive hover:text-destructive"}`}
            disabled={deletingId === m.id || m.usage_count > 0}
            onClick={() => onDelete(m.id)}
            title={m.usage_count > 0 ? "Cannot delete: asset is in use" : "Move to trash"}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

  useEffect(() => {
    if (activeTab === "trash") loadDeleted();
  }, [activeTab]);

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

  const handleUploaded = (m: Media) => {
    setMedia(prev => [m, ...prev]);
  };

  const handleUpdated = (updated: Media) => {
    setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
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
              <Button className="gap-2" onClick={() => setShowUpload(true)}>
                <Upload size={16} />
                Upload
              </Button>
            )}
          </div>

          {/* Library Tab */}
          <TabsContent value="library">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input
                type="text"
                className="border rounded-md px-3 py-1.5 text-sm bg-background flex-1 min-w-[180px]"
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
                <RefreshCw size={16} className="animate-spin" />
                Loading...
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="font-medium">No media files yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload images and files to use in your messages.
                  </p>
                  <Button className="mt-4 gap-2" onClick={() => setShowUpload(true)}>
                    <Upload size={16} />
                    Upload
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid gap-3">
                {filtered.map(m => (
                  <MediaCard
                    key={m.id}
                    m={m}
                    onDelete={handleDelete}
                    onEdit={setEditMedia}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recently Deleted Tab */}
          <TabsContent value="trash">
            <p className="text-sm text-muted-foreground mb-4">
              Deleted files are kept for 7 days. After that they are permanently removed.
            </p>

            {loadingDeleted && (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Loading...
              </div>
            )}

            {!loadingDeleted && deletedMedia.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-3">🗑️</div>
                  <p className="font-medium">Nothing here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deleted items are kept for 7 days.
                  </p>
                </CardContent>
              </Card>
            )}

            {!loadingDeleted && deletedMedia.length > 0 && (
              <div className="grid gap-3">
                {deletedMedia.map(m => {
                  const TypeIcon = typeIcon[m.type] ?? File;
                  return (
                    <Card key={m.id} className="opacity-80">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {m.thumbnail_url || (m.type === "image" && m.url) ? (
                            <img src={m.thumbnail_url || m.url} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <TypeIcon size={20} className="text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{m.name}</span>
                            <Badge variant={typeVariant[m.type] ?? "secondary"}>{m.type}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatBytes(m.size)}</div>
                          {m.deleted_at && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock size={10} className="text-orange-500" />
                              <span className="text-xs text-orange-500">{trashCountdown(m.deleted_at)}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 flex-shrink-0"
                          disabled={restoringId === m.id}
                          onClick={() => handleRestore(m.id)}
                        >
                          <RotateCcw size={12} />
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

      <UploadMediaDialog
        open={showUpload}
        workspaceId={WORKSPACE_ID}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
      />

      <EditMediaDialog
        open={!!editMedia}
        media={editMedia}
        onClose={() => setEditMedia(null)}
        onUpdated={handleUpdated}
      />
    </AppLayout>
  );
}
