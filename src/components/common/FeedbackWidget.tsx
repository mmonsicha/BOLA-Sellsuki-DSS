import { useState } from "react";
import { MessageSquare, Star, X, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedbackEntry {
  id: string;
  timestamp: string;
  page: string;
  rating: number;
  category: string;
  comment: string;
}

const STORAGE_KEY = "bola_feedback_entries";

function saveFeedback(entry: Omit<FeedbackEntry, "id" | "timestamp">) {
  // TODO: replace with POST /v1/feedback once backend endpoint is ready
  const entries: FeedbackEntry[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ?? "[]"
  );
  entries.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setCategory("");
    setComment("");
    setSubmitted(false);
  }

  function handleClose() {
    setOpen(false);
    // Delay reset so close animation finishes
    setTimeout(resetForm, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    saveFeedback({
      page: window.location.pathname,
      rating,
      category,
      comment,
    });

    setSubmitted(true);
    setTimeout(handleClose, 1800);
  }

  const displayRating = hoverRating || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="ส่งความคิดเห็น"
        title="ส่งความคิดเห็น"
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 bg-line hover:bg-line/90 text-white rounded-full px-4 py-2.5 shadow-lg transition-all hover:shadow-xl hover:scale-105 text-sm font-medium"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Feedback dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>ส่งความคิดเห็น</DialogTitle>
              <button
                onClick={handleClose}
                aria-label="ปิด"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6">
            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={40} className="text-line" />
                <p className="font-medium text-gray-800">ขอบคุณสำหรับความคิดเห็น!</p>
                <p className="text-sm text-muted-foreground">
                  ทีมงานจะนำไปปรับปรุงผลิตภัณฑ์ให้ดียิ่งขึ้น
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คุณให้คะแนน BOLA เท่าไร?
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} ดาว`}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      กรุณาเลือกคะแนน
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="feedback-category"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    ประเภทความคิดเห็น
                  </label>
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                    htmlFor="feedback-comment"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    รายละเอียด
                  </label>
                  <textarea
                    id="feedback-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="บอกเราเพิ่มเติมเกี่ยวกับประสบการณ์ของคุณ..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                  />
                </div>

                {/* Page context (hidden, auto-captured) */}
                <input
                  type="hidden"
                  name="page"
                  value={window.location.pathname}
                  readOnly
                />

                <button
                  type="submit"
                  disabled={!rating}
                  className="w-full bg-line hover:bg-line/90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md text-sm transition-colors"
                >
                  ส่งความคิดเห็น
                </button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
