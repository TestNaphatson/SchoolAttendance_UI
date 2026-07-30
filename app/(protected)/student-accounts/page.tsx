"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, EyeOff, FileSpreadsheet, KeyRound, Loader2, Search, ShieldCheck, Upload, UserRound, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AvailableStudent = {
  id: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  classroom: string;
};

type StudentResponse = {
  total: number;
  items: AvailableStudent[];
};

type StudentAccount = {
  id: number;
  username: string;
  fullName?: string;
  role: string;
  createdAt: string;
  studentCode: string;
  firstName?: string;
  lastName?: string;
  classroom?: string;
  isActive: boolean;
};

type AccountResponse = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: StudentAccount[];
};

type CreatedAccount = {
  username: string;
  fullName: string;
  role: string;
  studentCode: string;
  classroom: string;
};

type CsvAccount = {
  row: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  classroom: string;
  password: string;
};

type ImportError = {
  row: number;
  message: string;
};

const headerAliases: Record<string, keyof Omit<CsvAccount, "row">> = {
  studentcode: "studentCode",
  "รหัสนักเรียน": "studentCode",
  firstname: "firstName",
  "ชื่อ": "firstName",
  lastname: "lastName",
  "นามสกุล": "lastName",
  classroom: "classroom",
  "ห้องเรียน": "classroom",
  password: "password",
  "รหัสผ่าน": "password",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]/g, "");
}

export default function StudentAccountsPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [selected, setSelected] = useState<AvailableStudent | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [accounts, setAccounts] = useState<AccountResponse>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0, items: [] });
  const [accountPage, setAccountPage] = useState(1);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountRefresh, setAccountRefresh] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [csvRows, setCsvRows] = useState<CsvAccount[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvErrors, setCsvErrors] = useState<ImportError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setAccountPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = query ? `?search=${encodeURIComponent(query)}` : "";
        const result = await api<StudentResponse>(`/AdminStudentAccounts${params}`);
        setStudents(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อนักเรียนได้");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [query]);

  useEffect(() => {
    async function loadAccounts() {
      setAccountsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(accountPage), pageSize: "10" });
        if (query) params.set("search", query);
        setAccounts(await api<AccountResponse>(`/AdminStudentAccounts/accounts?${params}`));
      } catch {
        setAccounts({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0, items: [] });
      } finally {
        setAccountsLoading(false);
      }
    }
    void loadAccounts();
  }, [query, accountPage, accountRefresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCreated(null);

    if (!selected) {
      setError("กรุณาเลือกนักเรียน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setSaving(true);
    try {
      const result = await api<{ message: string; data: CreatedAccount }>("/AdminStudentAccounts", {
        method: "POST",
        body: JSON.stringify({
          studentId: selected.id,
          password,
        }),
      });
      setCreated(result.data);
      setStudents((current) => current.filter((student) => student.id !== selected.id));
      setSelected(null);
      setPassword("");
      setConfirmPassword("");
      setAccountRefresh((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างบัญชีไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function chooseCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvErrors([]);
    setImportSuccess("");
    setError("");
    setCsvFileName(file.name);

    try {
      const rawRows = parseCsv(await file.text());
      if (rawRows.length < 2) throw new Error("ไฟล์ CSV ไม่มีข้อมูล");

      const columns = rawRows[0].map((header) => headerAliases[normalizeHeader(header)]);
      const required: (keyof Omit<CsvAccount, "row">)[] = ["studentCode", "firstName", "lastName", "classroom", "password"];
      const missing = required.filter((field) => !columns.includes(field));
      if (missing.length) {
        throw new Error("หัวคอลัมน์ไม่ครบ กรุณาใช้ไฟล์ตัวอย่าง");
      }

      const parsed = rawRows.slice(1).map((values, index) => {
        const item: CsvAccount = { row: index + 2, studentCode: "", firstName: "", lastName: "", classroom: "", password: "" };
        columns.forEach((field, columnIndex) => {
          if (field) item[field] = values[columnIndex]?.trim() ?? "";
        });
        return item;
      });

      if (parsed.length > 500) throw new Error("นำเข้าได้สูงสุดครั้งละ 500 รายการ");
      const validationErrors = parsed.flatMap((item) => {
        const errors: ImportError[] = [];
        if (!item.studentCode || !item.firstName || !item.lastName || !item.classroom || !item.password) errors.push({ row: item.row, message: "ข้อมูลไม่ครบ" });
        if (item.password && item.password.length < 8) errors.push({ row: item.row, message: "รหัสผ่านสั้นกว่า 8 ตัวอักษร" });
        return errors;
      });
      setCsvRows(parsed);
      setCsvErrors(validationErrors);
    } catch (err) {
      setCsvRows([]);
      setCsvErrors([{ row: 0, message: err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ CSV ได้" }]);
    } finally {
      event.target.value = "";
    }
  }

  function clearCsv() {
    setCsvRows([]);
    setCsvFileName("");
    setCsvErrors([]);
    setImportSuccess("");
  }

  function downloadTemplate() {
    const content = "\uFEFFstudentCode,firstName,lastName,classroom,password\r\n65001,สมชาย,ใจดี,ม.1/1,Student123\r\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "student-accounts-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv() {
    if (!csvRows.length) return;
    setImporting(true);
    setError("");
    setImportSuccess("");
    try {
      const result = await api<{ message: string; imported: number; createdStudents: number }>("/AdminStudentAccounts/import", {
        method: "POST",
        body: JSON.stringify({ items: csvRows }),
      });
      setImportSuccess(`${result.message} · สร้างรายชื่อนักเรียนใหม่ ${result.createdStudents} คน`);
      setCsvRows([]);
      setCsvFileName("");
      setStudents((current) => current.filter((student) => !csvRows.some((row) => row.studentCode === student.studentCode)));
      setAccountPage(1);
      setAccountRefresh((value) => value + 1);
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "errors" in err.data) {
        setCsvErrors((err.data as { errors: ImportError[] }).errors);
      }
      setError(err instanceof Error ? err.message : "นำเข้า CSV ไม่สำเร็จ");
    } finally {
      setImporting(false);
    }
  }

  async function updateAccountStatus(account: StudentAccount) {
    setStatusUpdating(account.id);
    try {
      await api(`/AdminStudentAccounts/${account.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      setAccounts((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === account.id
            ? { ...item, isActive: !item.isActive }
            : item,
        ),
      }));
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-primary">จัดการผู้ใช้งาน</p>
        <h1 className="text-2xl font-bold sm:text-3xl">สร้างบัญชีนักเรียน</h1>
        <p className="mt-2 text-sm text-muted-foreground">เลือกนักเรียนและกำหนดรหัสผ่านเริ่มต้นสำหรับเข้าใช้งานระบบเช็กอิน</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-emerald-600" />Import บัญชีจาก CSV</CardTitle>
              <CardDescription className="mt-2">นำเข้าได้สูงสุด 500 รายการต่อครั้ง รองรับไฟล์ UTF-8</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={downloadTemplate}><Download className="size-4" />ดาวน์โหลดไฟล์ตัวอย่าง</Button>
              <Button type="button" onClick={() => fileInput.current?.click()}><Upload className="size-4" />เลือกไฟล์ CSV</Button>
              <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={chooseCsv} className="hidden" />
            </div>
          </div>
        </CardHeader>

        {(csvFileName || importSuccess) && (
          <CardContent className="space-y-4 pt-5">
            {importSuccess && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><div><AlertTitle>นำเข้าสำเร็จ</AlertTitle><AlertDescription>{importSuccess}</AlertDescription></div></div>
              </Alert>
            )}

            {csvFileName && (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3"><FileSpreadsheet className="size-5 shrink-0 text-emerald-600" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{csvFileName}</p><p className="text-xs text-muted-foreground">{csvRows.length} รายการ</p></div></div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearCsv} aria-label="ยกเลิกไฟล์"><X className="size-4" /></Button>
                </div>

                {csvRows.length > 0 && (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader><TableRow><TableHead>แถว</TableHead><TableHead>รหัสนักเรียน</TableHead><TableHead>ชื่อ–นามสกุล</TableHead><TableHead>ห้องเรียน</TableHead><TableHead>รหัสผ่าน</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {csvRows.slice(0, 5).map((item) => (
                          <TableRow key={item.row}>
                            <TableCell>{item.row}</TableCell>
                            <TableCell className="font-semibold text-primary">{item.studentCode || "—"}</TableCell>
                            <TableCell>{item.firstName} {item.lastName}</TableCell>
                            <TableCell>{item.classroom || "—"}</TableCell>
                            <TableCell>{"•".repeat(Math.min(item.password.length, 10)) || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {csvRows.length > 5 && <p className="border-t px-4 py-2 text-xs text-muted-foreground">และอีก {csvRows.length - 5} รายการ</p>}
                  </div>
                )}

                {csvErrors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50 text-red-700">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <div><AlertTitle>พบข้อมูลที่ต้องแก้ไข {csvErrors.length} รายการ</AlertTitle><AlertDescription>{csvErrors.slice(0, 5).map((item) => <span key={`${item.row}-${item.message}`} className="block">{item.row ? `แถว ${item.row}: ` : ""}{item.message}</span>)}{csvErrors.length > 5 && <span className="block">และอีก {csvErrors.length - 5} รายการ</span>}</AlertDescription></div>
                    </div>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button type="button" onClick={importCsv} disabled={!csvRows.length || importing}>
                    {importing ? <><Loader2 className="size-4 animate-spin" />กำลังนำเข้า...</> : <><Upload className="size-4" />ยืนยัน Import {csvRows.length} รายการ</>}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {created && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
          <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><div><AlertTitle>สร้างบัญชีสำเร็จ</AlertTitle><AlertDescription>Username: <strong>{created.username}</strong> · {created.fullName} · {created.classroom} กรุณาแจ้งรหัสผ่านให้นักเรียนทราบ</AlertDescription></div></div>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" />บัญชีนักเรียนในระบบ</CardTitle>
              <CardDescription className="mt-2">ข้อมูลจาก API ทั้งหมด {accounts.totalItems.toLocaleString("th-TH")} บัญชี</CardDescription>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา Username ชื่อ หรือห้อง..." className="pl-9" />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-3 text-muted-foreground" aria-label="ล้างคำค้นหา"><X className="size-4" /></button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Username</TableHead><TableHead>ชื่อ–นามสกุล</TableHead><TableHead>ห้องเรียน</TableHead><TableHead>สิทธิ์</TableHead><TableHead>วันที่สร้าง</TableHead><TableHead className="text-right">สถานะ</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {accountsLoading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="mx-auto size-6 animate-spin text-primary" /><p className="mt-2 text-muted-foreground">กำลังดึงข้อมูลจาก API...</p></TableCell></TableRow>
              ) : accounts.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><UserRound className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-2 font-medium">ยังไม่มีบัญชีนักเรียน</p></TableCell></TableRow>
              ) : accounts.items.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-semibold text-primary">{account.username}</TableCell>
                  <TableCell>{account.fullName || `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim() || "—"}</TableCell>
                  <TableCell><span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">{account.classroom || "—"}</span></TableCell>
                  <TableCell><Badge className="border-blue-200 bg-blue-50 text-blue-700">{account.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(account.createdAt))}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={statusUpdating === account.id}
                      onClick={() => updateAccountStatus(account)}
                      className={account.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}
                    >
                      {statusUpdating === account.id && <Loader2 className="size-3.5 animate-spin" />}
                      <span className={`size-2 rounded-full ${account.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {account.isActive ? "Active" : "Inactive"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">หน้า {accounts.totalPages ? accountPage : 0} จาก {accounts.totalPages}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAccountPage((page) => page - 1)} disabled={accountPage <= 1 || accountsLoading}><ChevronLeft className="size-4" />ก่อนหน้า</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setAccountPage((page) => page + 1)} disabled={accountPage >= accounts.totalPages || accountsLoading}>ถัดไป<ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" />นักเรียนที่ยังไม่มีบัญชี</CardTitle>
            <CardDescription>แสดงสูงสุด 100 รายการ · พบ {students.length} คน</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-y-auto p-2">
            {loading ? (
              <div className="grid h-56 place-items-center text-sm text-muted-foreground"><div className="text-center"><Loader2 className="mx-auto mb-2 size-6 animate-spin text-primary" />กำลังโหลดข้อมูล...</div></div>
            ) : students.length === 0 ? (
              <div className="grid h-56 place-items-center text-center text-sm text-muted-foreground">
                <div><ShieldCheck className="mx-auto mb-3 size-9 text-emerald-500" /><p className="font-medium text-foreground">ไม่พบนักเรียนที่รอสร้างบัญชี</p><p className="mt-1">นักเรียนทุกคนมีบัญชีแล้ว หรือไม่ตรงกับคำค้นหา</p></div>
              </div>
            ) : (
              <div className="space-y-1">
                {students.map((student) => {
                  const active = selected?.id === student.id;
                  return (
                    <button key={student.id} type="button" onClick={() => { setSelected(student); setCreated(null); setError(""); }} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent hover:bg-muted"}`}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{student.firstName[0]}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{student.firstName} {student.lastName}</span><span className="block text-xs text-muted-foreground">{student.studentCode} · {student.classroom}</span></span>
                      {active && <CheckCircle2 className="size-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={submit}>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" />กำหนดบัญชีผู้ใช้</CardTitle>
              <CardDescription>Username จะเป็นรหัสนักเรียนโดยอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl bg-muted p-4">
                {selected ? (
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="font-semibold">{selected.firstName} {selected.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{selected.classroom}</p></div>
                    <Badge className="border-primary/20 bg-primary/10 text-primary">Username: {selected.studentCode}</Badge>
                  </div>
                ) : (
                  <p className="py-2 text-center text-sm text-muted-foreground">เลือกนักเรียนจากรายชื่อด้านซ้าย</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่านเริ่มต้น</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!selected} placeholder="อย่างน้อย 8 ตัวอักษร" className="px-10" minLength={8} required />
                  <button type="button" disabled={!selected} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-50" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!selected} placeholder="กรอกรหัสผ่านอีกครั้ง" minLength={8} required />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                นักเรียนจะใช้รหัสนักเรียนและรหัสผ่านนี้เพื่อเข้าสู่ระบบ กรุณาส่งรหัสผ่านให้นักเรียนด้วยช่องทางที่ปลอดภัย
              </div>

              <Button type="submit" className="h-11 w-full" disabled={!selected || saving}>
                {saving ? <><Loader2 className="size-4 animate-spin" />กำลังสร้างบัญชี...</> : <><KeyRound className="size-4" />สร้างบัญชีนักเรียน</>}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
