import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { mediaApi } from "@/api/media";
import type { Media } from "@/types";

interface Props {
  open: boolean;
  media: Media | null;
  onClose: () => void;
  onUpdated: (m: Media) => void;
}

export function EditMediaDialog({ open, media, onClose, onUpdated }: Props) {
  const [name, setName] = useState("");
  const [altText, setAltText] = useState("");
  const [actionURL, setActionURL] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (media) {
      setName(media.name);
      setAltText(media.alt_text ?? "");
      setActionURL(media.action_url ?? "");
      setTagsInput((media.tags ?? []).join(", "));
      setError(null);
    }
  }, [media]);

  const handleSave = async () => {
    if (!media) return;
    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      const res = await mediaApi.update(media.id, { name, alt_text: altText, action_url: actionURL, tags });
      onUpdated(res);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Edit Media</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
            </div>

            {media?.type === "image" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="edit-alt">Alt Text (LINE preview)</Label>
                  <Input
                    id="edit-alt"
                    value={altText}
                    onChange={e => setAltText(e.target.value)}
                    placeholder="Text shown in LINE chat list"
                    maxLength={400}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-url">Action URL</Label>
                  <Input
                    id="edit-url"
                    value={actionURL}
                    onChange={e => setActionURL(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="banner, sale, summer"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
