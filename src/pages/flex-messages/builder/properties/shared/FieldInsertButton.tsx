import { useState, useRef, useEffect } from "react";
import type { FlexMessageVariable } from "@/api/flexMessage";

interface FieldInsertButtonProps {
  variables: FlexMessageVariable[];
  onInsert: (fieldName: string) => void;
}

export function FieldInsertButton({ variables, onInsert }: FieldInsertButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Insert webhook field"
        className={`px-1.5 py-0.5 text-xs rounded border transition-colors font-mono ${
          open
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {"{x}"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md min-w-[180px] max-w-[260px] overflow-hidden">
          {variables.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground italic">
              No fields defined yet. Add variables in the Variables panel.
            </p>
          ) : (
            <ul className="py-1">
              {variables.map((v) => (
                <li key={v.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onInsert(v.name);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-blue-600 flex-shrink-0">
                        {"{" + v.name + "}"}
                      </code>
                      {v.required && (
                        <span className="text-destructive text-xs flex-shrink-0">*</span>
                      )}
                    </div>
                    {v.description && (
                      <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
