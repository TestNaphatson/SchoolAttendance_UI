"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, GraduationCap, Loader2, LockKeyhole, School, UserRound } from "lucide-react";
import { api, saveSession } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterResponse = {
  accessToken: string;
  expiresAt: string;
  username: string;
  fullName: string;
  role: string;
};

const initialForm = {
  studentCode: "",
  firstName: "",
  lastName: "",
  classroom: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const result = await api<RegisterResponse>("/Auth/register-student", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          studentCode: form.studentCode.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          classroom: form.classroom.trim(),
          password: form.password,
        }),
      });
      saveSession(result.accessToken, {
        username: result.username,
        fullName: result.fullName,
        role: result.role,
      });
      router.replace("/check-in");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <Card className="overflow-hidden border-0 shadow-[0_12px_50px_rgba(25,38,70,.1)]">
          <div className="grid md:grid-cols-[.72fr_1.28fr]">
            <section className="relative hidden overflow-hidden bg-[#243b91] p-8 text-white md:flex md:flex-col md:justify-between">
              <div className="absolute -right-16 -top-12 size-48 rounded-full border-[30px] border-white/5" />
              <span className="relative grid size-12 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <GraduationCap className="size-7" />
              </span>
              <div className="relative">
                <h2 className="text-2xl font-semibold leading-relaxed">เริ่มต้นเช็กอิน<br />ด้วยบัญชีนักเรียน</h2>
                <p className="mt-3 text-sm leading-6 text-blue-100/75">
                  ใช้รหัสนักเรียนเป็น Username สำหรับเข้าสู่ระบบในครั้งถัดไป
                </p>
              </div>
            </section>
            <section>
              <CardHeader className="px-6 pt-7 sm:px-8">
                <CardTitle className="text-2xl">สมัครสมาชิกนักเรียน</CardTitle>
                <CardDescription>กรอกข้อมูลให้ตรงกับรายชื่อของโรงเรียน</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8 sm:px-8">
                {error && (
                  <Alert className="mb-5 border-red-200 bg-red-50 text-red-700">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <div><AlertTitle>สมัครสมาชิกไม่สำเร็จ</AlertTitle><AlertDescription>{error}</AlertDescription></div>
                    </div>
                  </Alert>
                )}
                <form onSubmit={submit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">รหัสนักเรียน</Label>
                    <div className="relative"><UserRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" /><Input id="studentCode" value={form.studentCode} onChange={(e) => update("studentCode", e.target.value)} placeholder="เช่น 65001" className="pl-10" required /></div>
                    <p className="text-xs text-muted-foreground">รหัสนักเรียนนี้จะใช้เป็น Username</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="firstName">ชื่อ</Label><Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="ชื่อ" required /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">นามสกุล</Label><Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="นามสกุล" required /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom">ห้องเรียน</Label>
                    <div className="relative"><School className="absolute left-3.5 top-3 size-4 text-muted-foreground" /><Input id="classroom" value={form.classroom} onChange={(e) => update("classroom", e.target.value)} placeholder="เช่น ม.1/1" className="pl-10" required /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="password">รหัสผ่าน</Label><div className="relative"><LockKeyhole className="absolute left-3.5 top-3 size-4 text-muted-foreground" /><Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="อย่างน้อย 8 ตัว" className="pl-10" minLength={8} required /></div></div>
                    <div className="space-y-2"><Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label><Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="กรอกอีกครั้ง" minLength={8} required /></div>
                  </div>
                  <Button type="submit" className="h-11 w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิกและเข้าสู่ระบบ"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">มีบัญชีแล้ว? <Link href="/login" className="font-semibold text-primary hover:underline">เข้าสู่ระบบ</Link></p>
                </form>
              </CardContent>
            </section>
          </div>
        </Card>
      </div>
    </main>
  );
}
