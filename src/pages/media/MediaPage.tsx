import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, RefreshCw, Copy, Trash2, FileImage, Film, Music, File } from "lucide-react";
import { useState, useEffect } from "react";
import { mediaApi } from "@/api/media";
import type { Media, MediaType } from "@/types";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const typeIcon: Record<MediaType, React.ElementType> = {
  image:     FileImage,
  video:     Film,
  audio:     Music,
  file:      File,
  rich_menu: FileImage,
};

const typeVariant: Record<MediaType, "default" | "secondary" | "success" | "warning" | "outline"> = {
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

export function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    mediaApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => setMedia(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media file? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await mediaApi.delete(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Failed to delete media");
    } finally {
      setDeletingId(null);
    }
  };

  const copyURL = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const filtered = filter
    ? media.filter((m) => m.type === filter)
    : media;

  return (
    <AppLayout title="Media">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Manage images, videos, and files used in your broadcasts and auto replies.
            </p>
            <select
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="file">Files</option>
            </select>
          </div>
          <Button className="gap-2" onClick={() => alert("Upload media — coming soon")}>
            <Upload size={16} />
            Upload
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">🖼️</div>
              <p className="font-medium">No media files yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload images and files to use in your messages.
              </p>
              <Button className="mt-4 gap-2" onClick={() => alert("Upload media — coming soon")}>
                <Upload size={16} />
                Upload
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-3">
            {filtered.map((m) => {
              const TypeIcon = typeIcon[m.type] ?? File;
              return (
                <Card key={m.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {m.thumbnail_url || (m.type === "image" && m.url) ? (
                        <img
                          src={m.thumbnail_url || m.url}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <TypeIcon size={20} className="text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{m.name}</span>
                        <Badge variant={typeVariant[m.type]}>{m.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {m.original_name} · {formatBytes(m.size)}
                        {m.mime_type && ` · ${m.mime_type}`}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground truncate max-w-xs">{m.url}</span>
                        <button
                          onClick={() => copyURL(m.url)}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          title="Copy URL"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(m.created_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
