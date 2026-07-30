import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMap: Record<AttendanceStatus, { label: string; className: string; dot: string }> = {
  Present: { label: "มา", className: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Late: { label: "สาย", className: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Leave: { label: "ลา", className: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  Absent: { label: "ขาด", className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" },
  NotRecorded: { label: "ยังไม่บันทึก", className: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" },
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const item = statusMap[status] ?? statusMap.NotRecorded;
  return <Badge className={cn("gap-1.5 font-medium", item.className)}><span className={cn("size-1.5 rounded-full", item.dot)} />{item.label}</Badge>;
}
