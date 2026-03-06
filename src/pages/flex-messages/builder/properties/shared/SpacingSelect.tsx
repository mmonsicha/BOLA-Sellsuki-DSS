import { SPACING_OPTIONS } from "@/utils/flexComponentMeta";

interface SpacingSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
}

export function SpacingSelect({ value, onChange, label }: SpacingSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Default</option>
        {SPACING_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
