import { SIZE_OPTIONS } from "@/utils/flexComponentMeta";

interface SizeSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  label: string;
  allowFull?: boolean;
}

export function SizeSelect({ value, onChange, label, allowFull }: SizeSelectProps) {
  const options = allowFull ? [...SIZE_OPTIONS, "full" as const] : SIZE_OPTIONS;
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value || "md"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
