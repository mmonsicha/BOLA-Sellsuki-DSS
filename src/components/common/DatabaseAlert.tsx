import { AlertTriangle } from "lucide-react";

interface DatabaseAlertProps {
  visible: boolean;
}

export function DatabaseAlert({ visible }: DatabaseAlertProps) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm"
    >
      <AlertTriangle size={16} className="flex-shrink-0 text-amber-500" />
      <span>
        ไม่สามารถเชื่อมต่อฐานข้อมูลได้ — ข้อมูลอาจไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ
      </span>
    </div>
  );
}
