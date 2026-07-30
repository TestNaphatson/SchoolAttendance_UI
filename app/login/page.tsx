"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { api, saveSession } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginResponse = {
  accessToken: string;
  expiresAt: string;
  username: string;
  fullName: string;
  role: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api<LoginResponse>("/Auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ username, password }),
      });
      saveSession(result.accessToken, {
        username: result.username,
        fullName: result.fullName,
        role: result.role,
      });
      router.replace(result.role === "Student" ? "/check-in" : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden bg-[#243b91] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border-[48px] border-white/5" />
        <div className="absolute -bottom-28 left-10 size-96 rounded-full bg-[#5f7df1]/30 blur-3xl" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <GraduationCap className="size-6" />
          </span>
          School Attendance
        </div>
        <div className="relative max-w-xl pb-12">
          <div className="mb-6 h-1 w-14 rounded-full bg-[#91a5f5]" />
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">ทุกวันเรียนรู้<br />เริ่มจากการมาเรียน</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/80">
            จัดการข้อมูลการเข้าเรียนของนักเรียนอย่างเป็นระบบ รวดเร็ว และตรวจสอบได้ในที่เดียว
          </p>
        </div>
        <p className="relative text-sm text-blue-200/70">ระบบบริหารจัดการสำหรับบุคลากรโรงเรียน</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-background p-6 sm:p-10">
        <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-8">
            <div className="mb-7 grid size-12 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 lg:hidden">
              <GraduationCap className="size-7" />
            </div>
            <CardTitle className="text-3xl">ยินดีต้อนรับกลับ</CardTitle>
            <CardDescription className="pt-2 text-base">เข้าสู่ระบบเพื่อจัดการข้อมูลการเข้าเรียน</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 text-red-700">
                <AlertCircle className="absolute left-4 top-4 size-4" />
                <div className="pl-7">
                  <AlertTitle>เข้าสู่ระบบไม่สำเร็จ</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="กรอกชื่อผู้ใช้" className="h-11 pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" className="h-11 px-10" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ยังไม่มีบัญชีนักเรียน?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  สมัครสมาชิก
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
