"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarDays, Check, CheckCircle2, Clock3, GraduationCap, Loader2, LocateFixed, LogOut, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { api, clearSession, getUser } from "@/lib/api";
import { thaiDate, today } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CheckInData = {
  date: string;
  checkInDeadline: string;
  student: {
    id: number;
    studentCode: string;
    firstName: string;
    lastName: string;
    classroom: string;
  };
  checkedIn: boolean;
  attendance: null | {
    id: number;
    status: "Present" | "Late" | "Absent";
    remark?: string;
    createdAt: string;
  };
};

type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export default function CheckInPage() {
  const router = useRouter();
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());
  const [position, setPosition] = useState<Position | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const user = typeof window !== "undefined" ? getUser() : {};

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api<CheckInData>("/StudentCheckIn/today"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  const requestLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setLocationLoading(false);
      },
      (geolocationError) => {
        const messages: Record<number, string> = {
          1: "กรุณาอนุญาตให้เว็บไซต์เข้าถึงตำแหน่งของคุณ",
          2: "ไม่สามารถระบุตำแหน่งปัจจุบันได้",
          3: "ใช้เวลาค้นหาตำแหน่งนานเกินไป กรุณาลองใหม่",
        };
        setLocationError(messages[geolocationError.code] ?? "ไม่สามารถแสดงตำแหน่งได้");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    void load();
    requestLocation();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [requestLocation]);

  async function checkIn() {
    setSaving(true);
    setError("");
    try {
      await api("/StudentCheckIn", { method: "POST", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เช็กอินไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  const checkInTime = data?.attendance?.createdAt
    ? new Intl.DateTimeFormat("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      }).format(new Date(data.attendance.createdAt))
    : null;
  const isLate = data?.attendance?.status === "Late";
  const isAbsent = data?.attendance?.status === "Absent";
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl = position
    ? mapsApiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsApiKey)}&q=${position.latitude},${position.longitude}&zoom=17&language=th`
      : `https://maps.google.com/maps?q=${position.latitude},${position.longitude}&z=17&output=embed`
    : "";
  const directionsUrl = position
    ? `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
    : "";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-white"><GraduationCap className="size-6" /></span>
            <div><p className="font-bold leading-5">เช็กชื่อ</p><p className="text-xs text-muted-foreground">Student Check-in</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.fullName || "นักเรียน"}</p><p className="text-xs text-muted-foreground">Student</p></div>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="size-4" />ออกจากระบบ</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary"><CalendarDays className="mr-1.5 size-3.5" />{thaiDate(data?.date ?? today())}</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">เช็กอินเข้าเรียน</h1>
          <p className="mt-3 text-muted-foreground">ภายใน 08:30 = มา · หลัง 08:30 = สาย · ไม่เช็กอินภายในวัน = ขาดเรียน</p>
        </div>

        {error && <Alert className="mx-auto mb-5 max-w-2xl border-red-200 bg-red-50 text-red-700"><AlertCircle className="absolute left-4 top-4 size-4" /><div className="pl-7"><AlertTitle>เกิดข้อผิดพลาด</AlertTitle><AlertDescription>{error}</AlertDescription></div></Alert>}

        <div className="mx-auto grid max-w-2xl gap-5">
          <Card className="overflow-hidden border-0 shadow-[0_10px_40px_rgba(25,38,70,.1)]">
            <div className={`h-1.5 ${data?.checkedIn ? isAbsent ? "bg-red-500" : isLate ? "bg-amber-500" : "bg-emerald-500" : "bg-primary"}`} />
            <CardHeader className="items-center pb-3 text-center">
              {loading ? (
                <div className="grid size-20 place-items-center rounded-full bg-muted"><Loader2 className="size-8 animate-spin text-primary" /></div>
              ) : data?.checkedIn ? (
                <div className={`grid size-20 place-items-center rounded-full ${isAbsent ? "bg-red-100 text-red-600" : isLate ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}><Check className="size-10" /></div>
              ) : (
                <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary"><Clock3 className="size-9" /></div>
              )}
              <CardTitle className="pt-3 text-2xl">{data?.checkedIn ? "เช็กอินเรียบร้อยแล้ว" : "พร้อมเช็กอิน"}</CardTitle>
              <CardDescription>{data?.checkedIn ? `บันทึกเวลา ${checkInTime} น.` : now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" }) + " น."}</CardDescription>
              {data?.checkedIn && (
                <Badge className={isAbsent ? "mt-2 border-red-200 bg-red-50 text-red-700" : isLate ? "mt-2 border-amber-200 bg-amber-50 text-amber-700" : "mt-2 border-emerald-200 bg-emerald-50 text-emerald-700"}>
                  {isLate || isAbsent ? <Clock3 className="mr-1.5 size-3.5" /> : <CheckCircle2 className="mr-1.5 size-3.5" />}
                  {isAbsent ? "ขาดเรียน" : isLate ? "มาสาย" : "มาเรียน"}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {data && (
                <div className="rounded-xl bg-muted p-4">
                  <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-white font-semibold text-primary shadow-sm">{data.student.firstName[0]}</span><div><p className="font-semibold">{data.student.firstName} {data.student.lastName}</p><p className="text-sm text-muted-foreground">{data.student.studentCode} · {data.student.classroom}</p></div></div>
                </div>
              )}
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" />มาเรียน</span><strong>ไม่เกิน 08:30 น.</strong></div>
                  <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><Clock3 className="size-4 text-amber-600" />มาสาย</span><strong>หลัง 08:30 น.</strong></div>
                  <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><AlertCircle className="size-4 text-red-600" />ขาดเรียน</span><strong>ไม่เช็กอินก่อน 00:00 น.</strong></div>
                </div>
              </div>
              <Button className={`h-14 w-full text-base ${data?.checkedIn ? isAbsent ? "bg-red-600 hover:bg-red-600" : isLate ? "bg-amber-600 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-600" : ""}`} disabled={loading || saving || data?.checkedIn} onClick={checkIn}>
                {saving ? <><Loader2 className="size-5 animate-spin" />กำลังเช็กอิน...</> : data?.checkedIn ? <><CheckCircle2 className="size-5" />เช็กอินวันนี้แล้ว</> : <><MapPin className="size-5" />เช็กอินเข้าเรียน</>}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />เวลาตัดสินสถานะอ้างอิงจากเวลาเซิร์ฟเวอร์ประเทศไทย</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between border-b">
              <div><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />ตำแหน่งปัจจุบัน</CardTitle><CardDescription className="mt-2">แสดงตำแหน่งจากอุปกรณ์บน Google Maps</CardDescription></div>
              <Button variant="outline" size="sm" onClick={requestLocation} disabled={locationLoading}><LocateFixed className={locationLoading ? "size-4 animate-pulse" : "size-4"} />ค้นหาตำแหน่ง</Button>
            </CardHeader>
            <CardContent className="p-0">
              {locationLoading ? (
                <div className="grid h-72 place-items-center bg-muted/50"><div className="text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-3 size-7 animate-spin text-primary" />กำลังระบุตำแหน่ง...</div></div>
              ) : locationError ? (
                <div className="grid h-72 place-items-center bg-muted/50 px-6 text-center"><div><MapPin className="mx-auto mb-3 size-9 text-muted-foreground/50" /><p className="font-medium">ไม่สามารถแสดงแผนที่ได้</p><p className="mt-1 text-sm text-muted-foreground">{locationError}</p><Button className="mt-4" variant="outline" size="sm" onClick={requestLocation}>ลองอีกครั้ง</Button></div></div>
              ) : position ? (
                <>
                  <iframe title="ตำแหน่งปัจจุบันบน Google Maps" src={mapUrl} className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                  <div className="flex flex-col justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
                    <span>พิกัด {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} · คลาดเคลื่อนประมาณ {Math.round(position.accuracy)} เมตร</span>
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><Navigation className="size-3.5" />เปิดใน Google Maps</a>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
