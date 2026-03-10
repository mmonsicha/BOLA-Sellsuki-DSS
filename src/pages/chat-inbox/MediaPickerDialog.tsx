import { useState, useEffect } from "react";
import { mediaApi } from "@/api/media";
import type { Media } from "@/types";
import { X, RefreshCw, FileImage, Film, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function toDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.pathname.startsWith("/media/")) return u.pathname;
  } catch { /* already relative */ }
  return url;
}

type MediaFilter = "all" | "image" | "video";

interface MediaPickerDialogProps {
  onSelect: (media: Media) => void;
  onClose: () => void;
}

export function MediaPickerDialog({ onSelect, onClose }: MediaPickerDialogProps) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MediaFilter>("image");
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    mediaApi.list({ workspace_id: WORKSPACE_ID, page: 1, page_size: 60 })
      .then((res) => setItems(res.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((m) => {
    if (filter !== "all" && m.type !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return m.upload_status === "ready" || !m.upload_status;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50">
      <div className="bg-background rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileImage size={18} className="text-muted-foreground" />
            <h2 className="font-semibold text-base">Media Library</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="p-1.5 hover:bg-muted rounded" title="Refresh">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="px-5 py-3 border-b flex items-center gap-3 flex-shrink-0">
          <div className="flex gap-1 rounded-md overflow-hidden border text-xs">
            {(["image", "video", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-md pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground gap-2">
              <RefreshCw size={14} className="animate-spin" /> Loading media...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground gap-2">
              <FileImage size={32} className="opacity-30" />
              <span>No {filter !== "all" ? filter + "s" : "media"} found</span>
              {search && <span className="text-xs">Try a different search term</span>}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map((m) => (
                <MediaThumb
                  key={m.id}
                  media={m}
                  hovered={hoveredId === m.id}
                  onHover={setHoveredId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ---- MediaThumb ----

function MediaThumb({
  media,
  hovered,
  onHover,
  onSelect,
}: {
  media: Media;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (m: Media) => void;
}) {
  const isVideo = media.type === "video";
  const thumbUrl = media.thumbnail_url || (isVideo ? undefined : media.url);

  return (
    <button
      onClick={() => onSelect(media)}
      onMouseEnter={() => onHover(media.id)}
      onMouseLeave={() => onHover(null)}
      className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/30 transition-all group bg-muted"
      title={media.name}
    >
      {thumbUrl ? (
        <img
          src={toDisplayUrl(thumbUrl)}
          alt={media.alt_text || media.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film size={24} className="text-muted-foreground" />
        </div>
      )}

      {/* Video overlay */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Hover info overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-end p-1.5">
          <p className="text-white text-[10px] font-medium text-center leading-tight line-clamp-2 w-full">
            {media.name}
          </p>
        </div>
      )}
    </button>
  );
}
