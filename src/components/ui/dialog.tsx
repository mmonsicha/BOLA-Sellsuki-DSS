import * as React from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Context for the new-style Dialog (root + sub-components pattern)
interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
const DialogContext = React.createContext<DialogContextValue>({ open: false });

interface DialogProps {
  open: boolean;
  // Old API
  onClose?: () => void;
  title?: string;
  description?: string;
  className?: string;
  // New API (sub-components style)
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, onOpenChange, title, description, children, className }: DialogProps) {
  // Use a ref so the escape handler never becomes stale without causing effect re-runs
  const handleCloseRef = useRef<() => void>(() => {});
  handleCloseRef.current = onClose ?? (() => onOpenChange?.(false));

  // Close on Escape key — only depends on `open`, not on the close callback
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // New-style: just provide context + backdrop, render children as-is
  if (!title && !description && !onClose) {
    if (!open) return null;
    return (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />
          {children}
        </div>
      </DialogContext.Provider>
    );
  }

  // Old-style: full self-contained dialog with title/description
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div
        className={cn(
          "relative bg-background shadow-xl w-full max-h-[90vh] overflow-y-auto",
          "rounded-t-2xl sm:rounded-lg sm:max-w-lg sm:mx-4",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Sub-components for the new-style Dialog
export function DialogContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative z-10 bg-background shadow-xl w-full max-h-[90vh] overflow-y-auto",
        "rounded-t-2xl sm:rounded-lg sm:max-w-lg sm:mx-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 px-6 py-5 border-b", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function DialogFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t bg-muted/20", className)}>
      {children}
    </div>
  );
}
