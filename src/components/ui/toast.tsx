import * as React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, 0 = sticky
}

// ── Context ────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration ?? (opts.variant === "error" ? 8000 : 4000);
    setToasts((prev) => [...prev, { ...opts, id, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = React.useCallback(
    (title: string, description?: string) => toast({ variant: "success", title, description }),
    [toast]
  );
  const error = React.useCallback(
    (title: string, description?: string) => toast({ variant: "error", title, description }),
    [toast]
  );
  const warning = React.useCallback(
    (title: string, description?: string) => toast({ variant: "warning", title, description }),
    [toast]
  );
  const info = React.useCallback(
    (title: string, description?: string) => toast({ variant: "info", title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Toaster (render container) ─────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-green-50 border-green-200 text-green-900",
  error:   "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info:    "bg-blue-50 border-blue-200 text-blue-900",
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />,
  error:   <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />,
  info:    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />,
};

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 w-96 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex gap-3 items-start rounded-lg border px-4 py-3 shadow-lg",
            "animate-in slide-in-from-right-4 duration-200",
            variantStyles[t.variant]
          )}
          role="alert"
        >
          {variantIcons[t.variant]}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">{t.title}</p>
            {t.description && (
              <p className="text-sm mt-0.5 opacity-80 whitespace-pre-wrap break-words leading-snug">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
