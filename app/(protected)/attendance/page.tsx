"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, FileText, Loader2, Search, UserCheck, UserMinus } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { AttendanceStatus, Student, StudentPage } from "@/lib/types";
import { attendanceToday, thaiDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statuses: { value: Exclude<AttendanceStatus, "NotRecorded">; label: string; description: string; icon: typeof CheckCircle2; active: string }[] = [
  { value: "Present", label: "มา", description: "เข้าเรียนตรงเวลา", icon: CheckCircle2, active: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500" },
  { value: "Late", label: "สาย", description: "เข้าห้องเรียนสาย", icon: Clock3, active: "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500" },
  { value: "Leave", label: "ลา", description: "แจ้งลาหยุดเรียน", icon: FileText, active: "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" },
  { value: "Absent", label: "ขาด", description: "ไม่มาเรียน", icon: UserMinus, active: "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500" },
];

export default function AttendancePage() {
  const [date, setDate] = useState(attendanceToday());
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [status, setStatus] = useState<Exclude<AttendanceStatus, "NotRecorded">>("Present");
  const [remark, setRemark] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadStudents() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await api<StudentPage>(`/Students?date=${date}&page=1&pageSize=100&sortBy=studentCode&sortDirection=asc`);
      setStudents(result.items);
      setStudentId(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อนักเรียนได้" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadStudents(); }, [date]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return students;
    return students.filter((s) => `${s.studentCode} ${s.firstName} ${s.lastName} ${s.classroom}`.toLowerCase().includes(keyword));
  }, [students, search]);
  const selected = students.find((item) => item.id === studentId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!studentId) {
      setMessage({ type: "error", text: "กรุณาเลือกนักเรียนที่ต้องการบันทึก" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await api<{ message: string }>("/Attendances", {
        method: "POST",
        body: JSON.stringify({ studentId, attendanceDate: date, status, remark: remark.trim() || null }),
      });
      setMessage({ type: "success", text: result.message || "บันทึกการเข้าเรียนสำเร็จ" });
      setStudents((current) => current.map((item) => item.id === studentId ? { ...item, status, remark } : item));
      setStudentId(null);
      setRemark("");
      setStatus("Present");
    } catch (err) {
      const duplicate = err instanceof ApiError && err.status === 409;
      setMessage({ type: "error", text: duplicate ? "นักเรียนคนนี้ถูกบันทึกการเข้าเรียนในวันนี้แล้ว" : err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="mb-1 text-sm font-medium text-primary">เช็กชื่อประจำวัน</p><h1 className="text-2xl font-bold sm:text-3xl">บันทึกการเข้าเรียน</h1><p className="mt-2 text-sm text-muted-foreground">เลือกนักเรียนและระบุสถานะการเข้าเรียนของวันที่เลือก</p></div>
        <div className="relative"><CalendarDays className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[200px] bg-white pl-10" /></div>
      </div>

      {message && <Alert className={message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}><div className="flex items-start gap-3">{message.type === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}<div><AlertTitle>{message.type === "success" ? "บันทึกเรียบร้อย" : "ไม่สามารถบันทึกได้"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></div></div></Alert>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2"><UserCheck className="size-5 text-primary" />เลือกนักเรียน</CardTitle>
            <CardDescription>วันที่ {thaiDate(date)} · บันทึกแล้ว {students.filter((s) => s.status !== "NotRecorded").length}/{students.length} คน</CardDescription>
            <div className="relative pt-3"><Search className="absolute left-3 top-6 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัส ชื่อ หรือห้องเรียน..." className="pl-9" /></div>
          </CardHeader>
          <CardContent className="max-h-[540px] overflow-y-auto p-2">
            {loading ? <div className="grid h-56 place-items-center text-sm text-muted-foreground"><div className="text-center"><Loader2 className="mx-auto mb-2 size-6 animate-spin text-primary" />กำลังโหลดรายชื่อ...</div></div>
            : filtered.length === 0 ? <div className="grid h-56 place-items-center text-sm text-muted-foreground">ไม่พบรายชื่อนักเรียน</div>
            : <div className="space-y-1">
              {filtered.map((student) => {
                const recorded = student.status !== "NotRecorded";
                const active = studentId === student.id;
                return <button key={student.id} type="button" disabled={recorded} onClick={() => { setStudentId(student.id); setMessage(null); }} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent hover:bg-muted"} ${recorded ? "cursor-not-allowed opacity-60" : ""}`}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{student.firstName[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{student.firstName} {student.lastName}</span><span className="block text-xs text-muted-foreground">{student.studentCode} · {student.classroom}</span></span>
                  <StatusBadge status={student.status} />
                </button>;
              })}
            </div>}
          </CardContent>
        </Card>

        <form onSubmit={submit}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-primary" />รายละเอียดการเข้าเรียน</CardTitle>
              <CardDescription>{selected ? `${selected.studentCode} · ${selected.firstName} ${selected.lastName} · ${selected.classroom}` : "กรุณาเลือกนักเรียนจากรายชื่อด้านซ้าย"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-7 pt-6">
              <div className="space-y-3">
                <Label>สถานะการเข้าเรียน</Label>
                <div className="grid grid-cols-2 gap-3">
                  {statuses.map(({ value, label, description, icon: Icon, active }) => <button key={value} type="button" disabled={!selected} onClick={() => setStatus(value)} className={`rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${status === value && selected ? active : "bg-white hover:border-slate-300 hover:bg-muted/40"}`}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-current/10"><Icon className="size-5" /></span><span><span className="block font-semibold">{label}</span><span className="text-xs opacity-70">{description}</span></span></div></button>)}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remark">หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
                <textarea id="remark" value={remark} onChange={(e) => setRemark(e.target.value)} disabled={!selected} rows={5} maxLength={500} placeholder="เช่น รถติด, ลาป่วย, มีใบรับรองแพทย์..." className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50" />
                <p className="text-right text-xs text-muted-foreground">{remark.length}/500</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><strong>หมายเหตุ:</strong> นักเรียนหนึ่งคนสามารถบันทึกได้เพียงหนึ่งครั้งต่อวัน เมื่อต้องการแก้ไขโปรดติดต่อผู้ดูแลระบบ</div>
              <Button type="submit" className="h-11 w-full" disabled={!selected || saving}>{saving ? <><Loader2 className="size-4 animate-spin" />กำลังบันทึก...</> : <><ClipboardCheck className="size-4" />บันทึกการเข้าเรียน</>}</Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
