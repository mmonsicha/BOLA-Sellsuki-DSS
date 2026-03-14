import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { MessageSquare, Star, X, CheckCircle, Camera, MousePointer, Loader2 } from "lucide-react";
import { getToken, getWorkspaceId } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BreadcrumbEntry {
  tag: string;
  id?: string;
  text?: string;
  ariaLabel?: string;
  classHint?: string;
}

interface FeedbackContext {
  breadcrumbs: BreadcrumbEntry[];
  pickedElement?: BreadcrumbEntry;
  scrollY: number;
  visibleHeadings: string[];
  activeField?: string;
  screenshot?: string; // base64 JPEG, max 800px wide
}

// ---------------------------------------------------------------------------
// DOM breadcrumb helpers (Option D — passive tracking)
// ---------------------------------------------------------------------------

function elementBreadcrumb(el: Element): BreadcrumbEntry {
  const entry: BreadcrumbEntry = { tag: el.tagName.toLowerCase() };
  if (el.id) entry.id = el.id;
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) entry.ariaLabel = ariaLabel;
  const text = el.textContent?.trim().slice(0, 60);
  if (text) entry.text = text;
  // Pick the most meaningful class hint (first non-utility class)
  const cls = Array.from(el.classList).find(
    (c) => !c.match(/^(flex|grid|text-|bg-|px-|py-|p-|m-|w-|h-|gap-|font-|border|rounded|hover|focus|transition|cursor|z-|overflow|sr-only|hidden|block|inline|items-|justify-)/)
  );
  if (cls) entry.classHint = cls;
  return entry;
}

function collectAncestors(el: Element, maxDepth = 5): BreadcrumbEntry[] {
  const result: BreadcrumbEntry[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && current !== document.body && depth < maxDepth) {
    result.unshift(elementBreadcrumb(current));
    current = current.parentElement;
    depth++;
  }
  return result;
}

function getVisibleHeadings(): string[] {
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,[role='heading']"));
  const viewH = window.innerHeight;
  return headings
    .filter((h) => {
      const rect = h.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= viewH;
    })
    .map((h) => h.textContent?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Screenshot helper (Option A)
// ---------------------------------------------------------------------------

async function captureScreenshot(): Promise<string | undefined> {
  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.5,
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.id === "feedback-widget-root",
    });

    // Resize to max 800px wide
    const maxW = 800;
    let { width, height } = canvas;
    if (width > maxW) {
      height = Math.round((height * maxW) / width);
      width = maxW;
    }
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(canvas, 0, 0, width, height);
    return out.toDataURL("image/jpeg", 0.6);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function saveFeedback(payload: {
  page: string;
  rating: number;
  category: string;
  comment: string;
  context: string;
}) {
  const workspaceId = getWorkspaceId();
  const token = getToken();
  if (!workspaceId || !token) return;

  await fetch(`/api/v1/workspaces/${workspaceId}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Element Picker overlay (Option B)
// ---------------------------------------------------------------------------

function ElementPickerOverlay({
  onPick,
  onCancel,
}: {
  onPick: (entry: BreadcrumbEntry) => void;
  onCancel: () => void;
}) {
  const [hovered, setHovered] = useState<Element | null>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.id !== "feedback-picker-overlay") setHovered(el);
    };
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el && el.id !== "feedback-picker-overlay") {
        onPick(elementBreadcrumb(el));
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onPick, onCancel]);

  // Highlight the hovered element with an outline
  useEffect(() => {
    if (!hovered) return;
    const prev = (hovered as HTMLElement).style.outline;
    (hovered as HTMLElement).style.outline = "2px solid #06C755";
    return () => {
      (hovered as HTMLElement).style.outline = prev;
    };
  }, [hovered]);

  return (
    <div
      id="feedback-picker-overlay"
      className="fixed inset-0 z-[9998]"
      style={{ cursor: "crosshair", background: "rgba(0,0,0,0.1)" }}
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg">
        คลิกที่องค์ประกอบที่ต้องการแจ้ง — กด Esc เพื่อยกเลิก
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Context state
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const [pickedElement, setPickedElement] = useState<BreadcrumbEntry | undefined>();
  const [picking, setPicking] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>();
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const lastClickedRef = useRef<Element | null>(null);

  // Option D: track last clicked element passively
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as Element;
      if (el && !el.closest("#feedback-widget-root")) {
        lastClickedRef.current = el;
        setBreadcrumbs(collectAncestors(el));
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setCategory("");
    setComment("");
    setSubmitted(false);
    setSubmitting(false);
    setBreadcrumbs([]);
    setPickedElement(undefined);
    setScreenshotDataUrl(undefined);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(resetForm, 300);
  }

  const handleScreenshot = useCallback(async () => {
    setTakingScreenshot(true);
    setOpen(false);
    // Small delay so panel hides before capture
    await new Promise((r) => setTimeout(r, 120));
    const url = await captureScreenshot();
    setScreenshotDataUrl(url);
    setTakingScreenshot(false);
    setOpen(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);

    const ctx: FeedbackContext = {
      breadcrumbs,
      pickedElement,
      scrollY: window.scrollY,
      visibleHeadings: getVisibleHeadings(),
      activeField: (document.activeElement as HTMLElement)?.getAttribute("name") ?? undefined,
      screenshot: screenshotDataUrl,
    };

    // Strip screenshot from context JSON if it's huge — keep it as a separate field
    // Actually send the full context (screenshot included) — backend stores as TEXT
    const contextJSON = JSON.stringify(ctx);

    await saveFeedback({
      page: window.location.pathname,
      rating,
      category,
      comment,
      context: contextJSON,
    });

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(handleClose, 1800);
  }

  const displayRating = hoverRating || rating;

  return (
    <div id="feedback-widget-root">
      {/* Element picker overlay */}
      {picking && (
        <ElementPickerOverlay
          onPick={(entry) => {
            setPickedElement(entry);
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}

      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="ส่งความคิดเห็น"
          title="ส่งความคิดเห็น"
          className="fixed bottom-6 right-6 z-[9990] flex items-center gap-2 bg-line hover:bg-line/90 text-white rounded-full px-4 py-2.5 shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm font-medium"
        >
          <MessageSquare size={16} />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      )}

      {/* Slide-up panel — fixed bottom-right */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-[9990] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
          style={{ maxHeight: "calc(100vh - 3rem)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">ส่งความคิดเห็น</span>
            <button
              onClick={handleClose}
              aria-label="ปิด"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-4">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={36} className="text-line" />
                <p className="font-medium text-gray-800">ขอบคุณสำหรับความคิดเห็น!</p>
                <p className="text-xs text-gray-500">ทีมงานจะนำไปปรับปรุงผลิตภัณฑ์ให้ดียิ่งขึ้น</p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {/* Star rating */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    คุณให้คะแนน BOLA เท่าไร?
                  </label>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} ดาว`}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={
                            star <= displayRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  {rating === 0 && (
                    <p className="text-xs text-gray-400 mt-1">กรุณาเลือกคะแนน</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="fb-category"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    ประเภทความคิดเห็น
                  </label>
                  <select
                    id="fb-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-line/50"
                  >
                    <option value="">เลือกประเภท (ไม่บังคับ)</option>
                    <option value="feature-request">ฟีเจอร์ที่อยากได้</option>
                    <option value="bug">พบปัญหา / Bug</option>
                    <option value="ux">ประสบการณ์การใช้งาน</option>
                    <option value="performance">ประสิทธิภาพ</option>
                    <option value="general">ความคิดเห็นทั่วไป</option>
                  </select>
                </div>

                {/* Comment */}
                <div>
                  <label
                    htmlFor="fb-comment"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    รายละเอียด
                  </label>
                  <textarea
                    id="fb-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="บอกเราเพิ่มเติม..."
                    className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-line/50 resize-none"
                  />
                </div>

                {/* Context capture tools */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">ระบุจุดที่มีปัญหา (ไม่บังคับ)</p>
                  <div className="flex gap-2">
                    {/* Option B — Element picker */}
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      title="คลิกเพื่อชี้ไปยังองค์ประกอบที่ต้องการแจ้ง"
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                        pickedElement
                          ? "bg-line/10 border-line text-line"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <MousePointer size={13} />
                      {pickedElement ? "ชี้แล้ว ✓" : "ชี้องค์ประกอบ"}
                    </button>

                    {/* Option A — Screenshot */}
                    <button
                      type="button"
                      onClick={() => void handleScreenshot()}
                      disabled={takingScreenshot}
                      title="ถ่ายภาพหน้าจอ"
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                        screenshotDataUrl
                          ? "bg-line/10 border-line text-line"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      } disabled:opacity-50`}
                    >
                      {takingScreenshot ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Camera size={13} />
                      )}
                      {screenshotDataUrl ? "ภาพแล้ว ✓" : "ภาพหน้าจอ"}
                    </button>
                  </div>

                  {/* Show picked element info */}
                  {pickedElement && (
                    <div className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1 gap-2">
                      <span className="text-gray-500 truncate">
                        {pickedElement.ariaLabel || pickedElement.text || `<${pickedElement.tag}>`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickedElement(undefined)}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}

                  {/* Show screenshot thumbnail */}
                  {screenshotDataUrl && (
                    <div className="relative">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot preview"
                        className="w-full rounded border border-gray-200 object-cover max-h-24"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshotDataUrl(undefined)}
                        className="absolute top-1 right-1 bg-gray-900/60 text-white rounded-full p-0.5 hover:bg-gray-900"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}

                  {/* Option D indicator: show last clicked area as breadcrumb hint */}
                  {breadcrumbs.length > 0 && !pickedElement && (
                    <p className="text-xs text-gray-400 leading-tight">
                      บริเวณล่าสุด:{" "}
                      {breadcrumbs
                        .slice(-2)
                        .map((b) => b.ariaLabel || b.text || `<${b.tag}>`)
                        .filter(Boolean)
                        .join(" › ")
                        .slice(0, 60)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!rating || submitting}
                  className="w-full bg-line hover:bg-line/90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  ส่งความคิดเห็น
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
