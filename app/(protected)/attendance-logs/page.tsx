"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarRange, Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { AttendanceLog, AttendanceLogResponse, AttendanceStatus } from "@/lib/types";
import { attendanceToday } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusLabels: Record<AttendanceStatus, string> = {
  Present: "มา",
  Late: "สาย",
  Leave: "ลา",
  Absent: "ขาด",
  NotRecorded: "ยังไม่บันทึก",
};

const leaveTypeLabels = { Sick: "ลาป่วย", Personal: "ลากิจ" } as const;
const approvalLabels = { Pending: "รออนุมัติ", Approved: "อนุมัติ", Rejected: "ไม่อนุมัติ" } as const;

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function displayTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function AttendanceLogsPage() {
  const currentDate = attendanceToday();
  const [fromDate, setFromDate] = useState(currentDate);
  const [toDate, setToDate] = useState(currentDate);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (fromDate > toDate) {
      setError("วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ fromDate, toDate });
      const result = await api<AttendanceLogResponse>(`/Attendances/history?${params}`);
      setLogs(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดประวัติการเข้าเรียนได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function downloadCsv() {
    const header = ["วันที่", "เวลาเข้า", "รหัสนักเรียน", "ชื่อ", "นามสกุล", "ห้องเรียน", "สถานะ", "ประเภทการลา", "สถานะอนุมัติ", "เหตุผล/หมายเหตุ"];
    const rows = logs.map((item) => [
      item.attendanceDate,
      displayTime(item.checkedInAt),
      item.studentCode,
      item.firstName,
      item.lastName,
      item.classroom,
      statusLabels[item.status],
      item.leaveType ? leaveTypeLabels[item.leaveType] : "",
      item.leaveApprovalStatus ? approvalLabels[item.leaveApprovalStatus] : "",
      item.remark ?? "",
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">สำหรับผู้ดูแลระบบ</p>
        <h1 className="text-2xl font-bold sm:text-3xl">ประวัติการเข้าเรียน</h1>
        <p className="mt-2 text-sm text-muted-foreground">ข้อมูลแต่ละวันจะถูกเก็บเป็น Log ถาวร ระบบเริ่มรอบวันใหม่เวลา 03:00 น. ตามเวลาประเทศไทย</p>
      </div>

      {error && <Alert className="border-red-200 bg-red-50 text-red-700"><AlertCircle className="absolute left-4 top-4 size-4" /><div className="pl-7"><AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle><AlertDescription>{error}</AlertDescription></div></Alert>}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2"><CalendarRange className="size-5 text-primary" />เลือกช่วงวันที่</CardTitle>
          <CardDescription>ค้นหา Log และดาวน์โหลดเป็นไฟล์ CSV ภาษาไทย</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div className="space-y-2"><Label htmlFor="fromDate">ตั้งแต่วันที่</Label><Input id="fromDate" type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="toDate">ถึงวันที่</Label><Input id="toDate" type="date" value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} /></div>
          <Button type="button" variant="outline" onClick={load} disabled={loading}><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />ค้นหา</Button>
          <Button type="button" onClick={downloadCsv} disabled={loading || logs.length === 0}><Download className="size-4" />ดาวน์โหลด CSV</Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-emerald-600" />รายการทั้งหมด</CardTitle>
          <CardDescription>{logs.length.toLocaleString("th-TH")} รายการ</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>วันที่</TableHead><TableHead>เวลาเข้า</TableHead><TableHead>นักเรียน</TableHead><TableHead>ห้อง</TableHead><TableHead>สถานะ</TableHead><TableHead>รายละเอียดการลา/หมายเหตุ</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /><p className="mt-2 text-muted-foreground">กำลังโหลด Log...</p></TableCell></TableRow>
              : logs.length === 0 ? <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">ไม่พบข้อมูลในช่วงวันที่นี้</TableCell></TableRow>
              : logs.map((item) => <TableRow key={item.id}>
                <TableCell>{item.attendanceDate}</TableCell>
                <TableCell>{displayTime(item.checkedInAt)}</TableCell>
                <TableCell><p className="font-medium">{item.firstName} {item.lastName}</p><p className="text-xs text-muted-foreground">{item.studentCode}</p></TableCell>
                <TableCell>{item.classroom}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell><p>{item.leaveType ? leaveTypeLabels[item.leaveType] : item.remark || "—"}</p>{item.leaveApprovalStatus && <p className="text-xs text-muted-foreground">{approvalLabels[item.leaveApprovalStatus]}{item.remark ? ` · ${item.remark}` : ""}</p>}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
