"use client";

import { useEffect, useState } from "react";
import { ArrowDownAZ, ChevronLeft, ChevronRight, Loader2, Search, UsersRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { AttendanceStatus, StudentPage } from "@/lib/types";
import { today } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const empty: StudentPage = { page: 1, pageSize: 10, totalItems: 0, totalPages: 0, items: [] };

export default function StudentsPage() {
  const [data, setData] = useState(empty);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("studentCode");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      const params = new URLSearchParams({ date: today(), page: String(page), pageSize: "10", sortBy, sortDirection });
      if (query) params.set("search", query);
      if (status) params.set("status", status);
      try { setData(await api<StudentPage>(`/Students?${params}`)); }
      catch (err) { setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อได้"); }
      finally { setLoading(false); }
    }
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [query, status, sortBy, sortDirection, page]);

  function toggleSort(field: string) {
    if (sortBy === field) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDirection("asc"); }
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div><p className="mb-1 text-sm font-medium text-primary">จัดการนักเรียน</p><h1 className="text-2xl font-bold sm:text-3xl">รายชื่อนักเรียน</h1><p className="mt-2 text-sm text-muted-foreground">ค้นหา ตรวจสอบ และดูสถานะการเข้าเรียนของนักเรียนทั้งหมด</p></div>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div><CardTitle className="flex items-center gap-2"><UsersRound className="size-5 text-primary" />นักเรียนทั้งหมด</CardTitle><p className="mt-1 text-sm text-muted-foreground">{data.totalItems.toLocaleString("th-TH")} รายการ</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัส ชื่อ หรือห้องเรียน..." className="pl-9 pr-9" />{search && <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-muted-foreground"><X className="size-4" /></button>}</div>
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-w-40"><option value="">ทุกสถานะ</option><option value="Present">มา</option><option value="Late">สาย</option><option value="Leave">ลา</option><option value="Absent">ขาด</option><option value="NotRecorded">ยังไม่บันทึก</option></Select>
              <Select value={`${sortBy}:${sortDirection}`} onChange={(e) => { const [field, direction] = e.target.value.split(":"); setSortBy(field); setSortDirection(direction); setPage(1); }} className="min-w-44"><option value="studentCode:asc">รหัส: น้อยไปมาก</option><option value="studentCode:desc">รหัส: มากไปน้อย</option><option value="firstName:asc">ชื่อ: ก-ฮ</option><option value="classroom:asc">ห้องเรียน</option></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <Table>
            <TableHeader><TableRow>
              {[["studentCode", "รหัสนักเรียน"], ["firstName", "ชื่อ"], ["lastName", "นามสกุล"], ["classroom", "ห้องเรียน"], ["status", "สถานะ"]].map(([field, label]) => <TableHead key={field}><button onClick={() => toggleSort(field)} className="inline-flex items-center gap-1.5 hover:text-foreground">{label}{sortBy === field && <ArrowDownAZ className={`size-3.5 ${sortDirection === "desc" ? "rotate-180" : ""}`} />}</button></TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /><p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p></TableCell></TableRow>
              : data.items.length === 0 ? <TableRow><TableCell colSpan={5} className="h-48 text-center"><UsersRound className="mx-auto size-9 text-muted-foreground/50" /><p className="mt-3 font-medium">ไม่พบรายชื่อนักเรียน</p><p className="text-sm text-muted-foreground">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p></TableCell></TableRow>
              : data.items.map((student) => <TableRow key={student.id}><TableCell className="font-semibold text-primary">{student.studentCode}</TableCell><TableCell>{student.firstName}</TableCell><TableCell>{student.lastName}</TableCell><TableCell><span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">{student.classroom}</span></TableCell><TableCell><StatusBadge status={student.status as AttendanceStatus} /></TableCell></TableRow>)}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">หน้า {data.totalPages ? page : 0} จาก {data.totalPages} · แสดง {data.items.length} จาก {data.totalItems} รายการ</p>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || loading}><ChevronLeft className="size-4" />ก่อนหน้า</Button><Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages || loading}>ถัดไป<ChevronRight className="size-4" /></Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
