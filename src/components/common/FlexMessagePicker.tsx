import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlexMessage } from "@/api/flexMessage";

interface FlexMessagePickerProps {
  value: string;
  onChange: (id: string) => void;
  flexMessages: FlexMessage[];
  disabled?: boolean;
  loading?: boolean;
}

function getFlexType(content: string): string {
  try {
    return (JSON.parse(content) as { type?: string })?.type ?? "bubble";
  } catch {
    return "bubble";
  }
}

export function FlexMessagePicker({
  value,
  onChange,
  flexMessages,
  disabled,
  loading,
}: FlexMessagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = flexMessages.find((fm) => fm.id === value);
  const filtered = flexMessages.filter(
    (fm) =>
      (fm.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (fm.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate dropdown position every time it opens
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(288, spaceBelow - 8); // max-h-72 = 288px

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(dropdownHeight, 120),
        zIndex: 9999,
      });
    }
  }, [open]);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-background text-left disabled:bg-muted disabled:cursor-not-allowed"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || loading}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate font-medium">{selected.name}</span>
            <span className="font-mono text-muted-foreground text-xs flex-shrink-0">
              #{selected.id.slice(-8)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            {loading ? "Loading templates..." : "Select a Flex Message template..."}
          </span>
        )}
        <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground ml-2" />
      </button>

      {/* Dropdown panel — rendered via portal to escape dialog overflow:hidden */}
      {open && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            className="bg-background border rounded-md shadow-lg overflow-y-auto"
            style={dropdownStyle}
          >
            {/* Search */}
            <div className="p-2 border-b sticky top-0 bg-background">
              <input
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Items */}
            {filtered.map((fm) => (
              <button
                key={fm.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-start gap-2 border-b last:border-b-0",
                  value === fm.id && "bg-muted"
                )}
                onClick={() => {
                  onChange(fm.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{fm.name}</span>
                    <span className="font-mono text-muted-foreground text-xs">
                      #{fm.id.slice(-8)}
                    </span>
                  </div>
                  {fm.description && (
                    <p className="text-xs text-muted-foreground truncate">{fm.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-0.5">
                  <Badge variant="outline" className="text-xs capitalize">
                    {getFlexType(fm.content)}
                  </Badge>
                  {(fm.variables ?? []).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {fm.variables.length} var{fm.variables.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {search ? "No templates match your search." : "No Flex Message templates found."}
              </p>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
