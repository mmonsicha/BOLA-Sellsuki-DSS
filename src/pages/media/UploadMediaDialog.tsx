import { useState, useRef, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ChevronDown, ChevronUp, AlertTriangle, FileImage, Film, Music, File } from "lucide-react";
import { mediaApi } from "@/api/media";
import type { Media, MediaType } from "@/types";

// LINE API limits
const LINE_LIMITS = {
  image: { maxMB: 10, maxPx: 1024, formats: "JPEG, PNG" },
  video: { maxMB: 200, formats: "MP4 (H.264 + AAC)" },
  audio: { maxMB: 200, formats: "M4A" },
  file:  { maxMB: 20, formats: "Any format", note: "Cannot send to LINE directly" },
} as const;

const MIME_TO_TYPE: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/png":  "image",
  "image/gif":  "image",
  "image/webp": "image",
  "video/mp4":  "video",
  "audio/m4a":  "audio",
  "audio/x-m4a": "audio",
  "audio/mpeg": "audio",
};

function getMimeType(file: File): MediaType {
  return MIME_TO_TYPE[file.type] ?? "file";
}

// Resize image to fit LINE constraints using Canvas API
async function resizeImage(file: File, maxPx: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, file.type || "image/jpeg", 0.9);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Create 240x240 thumbnail by cropping center
async function createThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 240;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const { width, height } = img;
      const min = Math.min(width, height);
      const sx = (width - min) / 2;
      const sy = (height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Thumbnail toBlob failed"));
      }, "image/jpeg", 0.8);
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface Props {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
  onUploaded: (m: Media) => void;
}

type UploadStep = "idle" | "resizing" | "uploading" | "confirming" | "done";

export function UploadMediaDialog({ open, workspaceId, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  const [name, setName] = useState("");
  const [altText, setAltText] = useState("");
  const [actionURL, setActionURL] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [step, setStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview("");
    setResizedBlob(null);
    setThumbBlob(null);
    setImgDimensions({ w: 0, h: 0 });
    setName("");
    setAltText("");
    setActionURL("");
    setTagsInput("");
    setStep("idle");
    setProgress("");
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = useCallback(async (f: File) => {
    setError(null);
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));

    const type = getMimeType(f);
    const maxMB = (type === "image" ? 10 : type === "video" ? 200 : type === "audio" ? 200 : 20);
    if (f.size > maxMB * 1024 * 1024) {
      setError(`File too large. ${type.toUpperCase()} max size is ${maxMB} MB.`);
      return;
    }

    if (type === "image") {
      setStep("resizing");
      setProgress("Resizing image to fit LINE constraints...");
      try {
        const resized = await resizeImage(f, 1024);
        const thumb = await createThumbnail(f);
        setResizedBlob(resized);
        setThumbBlob(thumb);

        // Get dimensions of resized
        const url = URL.createObjectURL(resized);
        const img = new Image();
        img.onload = () => {
          setImgDimensions({ w: img.width, h: img.height });
          URL.revokeObjectURL(url);
        };
        img.src = url;

        // Preview
        const previewUrl = URL.createObjectURL(resized);
        setPreview(previewUrl);
        setStep("idle");
        setProgress("");
      } catch {
        setError("Failed to process image. Please try another file.");
        setStep("idle");
      }
    } else {
      setPreview("");
      setStep("idle");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    const type = getMimeType(file);
    const isImage = type === "image";
    const uploadBlob = isImage && resizedBlob ? resizedBlob : file;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

    try {
      setStep("uploading");
      setProgress("Requesting upload URL...");

      // Step 1: Get presigned URL
      const res = await mediaApi.requestUpload({
        workspace_id: workspaceId,
        name,
        original_name: file.name,
        type,
        mime_type: file.type,
        size: uploadBlob.size,
        width: imgDimensions.w,
        height: imgDimensions.h,
        alt_text: altText,
        action_url: actionURL,
        tags,
        has_thumbnail: isImage && !!thumbBlob,
      });

      const presigned = res;

      // Step 2: Upload original to S3
      setProgress("Uploading file...");
      if (presigned.upload_url && !presigned.upload_url.includes("noop")) {
        await mediaApi.uploadToS3(presigned.upload_url, uploadBlob, file.type);
      }

      // Step 3: Upload thumbnail if image
      if (isImage && thumbBlob && presigned.thumbnail_upload_url && !presigned.thumbnail_upload_url.includes("noop")) {
        setProgress("Uploading thumbnail...");
        await mediaApi.uploadToS3(presigned.thumbnail_upload_url, thumbBlob, "image/jpeg");
      }

      // Step 4: Confirm upload
      setStep("confirming");
      setProgress("Finalizing...");
      const confirmRes = await mediaApi.confirmUpload(presigned.media_id);
      setStep("done");
      onUploaded(confirmRes);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setStep("idle");
    }
  };

  const isProcessing = step === "resizing" || step === "uploading" || step === "confirming";
  const mediaType = file ? getMimeType(file) : null;

  // Suppress unused variable warning — LINE_LIMITS is referenced in JSX below
  void LINE_LIMITS;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Upload Media</h2>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Drop zone */}
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium text-sm">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images (JPEG/PNG), Videos (MP4), Audio (M4A), Files (PDF, etc.)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,audio/m4a,audio/x-m4a,audio/mpeg,application/pdf,.pdf"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {preview ? (
                  <img src={preview} className="w-16 h-16 object-cover rounded" alt="preview" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    {mediaType === "video" ? <Film size={24} className="text-gray-500" /> :
                     mediaType === "audio" ? <Music size={24} className="text-gray-500" /> :
                     <File size={24} className="text-gray-500" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {imgDimensions.w > 0 && ` · ${imgDimensions.w}×${imgDimensions.h}px (resized)`}
                  </p>
                  {mediaType === "file" && (
                    <Badge variant="warning" className="mt-0.5 text-xs">
                      <AlertTriangle size={10} className="mr-0.5" /> Cannot send to LINE
                    </Badge>
                  )}
                </div>
                <button onClick={() => { setFile(null); setPreview(""); setResizedBlob(null); setThumbBlob(null); }} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
            )}

            {step === "resizing" && (
              <p className="text-xs text-muted-foreground text-center">{progress}</p>
            )}

            {/* Metadata fields */}
            {file && step !== "resizing" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="media-name">Name *</Label>
                  <Input id="media-name" value={name} onChange={e => setName(e.target.value)} placeholder="Asset name" />
                </div>

                {(mediaType === "image") && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="alt-text">Alt Text (LINE preview)</Label>
                      <Input
                        id="alt-text"
                        value={altText}
                        onChange={e => setAltText(e.target.value)}
                        placeholder="Text shown in LINE chat list when image can't load"
                        maxLength={400}
                      />
                      <p className="text-xs text-muted-foreground">Shown in LINE chat list as message preview</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="action-url">Action URL</Label>
                      <Input
                        id="action-url"
                        value={actionURL}
                        onChange={e => setActionURL(e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                      />
                      <p className="text-xs text-muted-foreground">URL opened when user taps the image in LINE</p>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="banner, sale, summer (comma-separated)"
                  />
                </div>
              </>
            )}

            {/* LINE API Guidelines (collapsible) */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
                onClick={() => setShowGuidelines(!showGuidelines)}
              >
                <span className="flex items-center gap-2">
                  <FileImage size={14} />
                  LINE API Size Guidelines
                </span>
                {showGuidelines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showGuidelines && (
                <div className="px-4 py-3 text-xs space-y-1.5 bg-background">
                  <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                    <span className="font-medium text-green-600">Image</span>
                    <span>JPEG/PNG · max <strong>10 MB</strong> · max <strong>1024×1024 px</strong></span>
                    <span className="text-muted-foreground"></span>
                    <span className="text-muted-foreground">Thumbnail auto-generated at 240×240 px</span>
                    <span className="font-medium text-blue-600">Video</span>
                    <span>MP4 (H.264+AAC) · max <strong>200 MB</strong></span>
                    <span className="font-medium text-yellow-600">Audio</span>
                    <span>M4A · max <strong>200 MB</strong></span>
                    <span className="font-medium text-orange-600">File</span>
                    <span className="flex items-center gap-1">
                      Any format · max <strong>20 MB</strong>
                      <span className="text-orange-500 font-medium">Cannot send to LINE</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <p className="text-sm text-muted-foreground text-center">{progress}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !name.trim() || isProcessing || step === "resizing"}
              className="gap-2"
            >
              <Upload size={14} />
              {isProcessing ? progress || "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
