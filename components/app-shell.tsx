"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, ClipboardCheck, FileSpreadsheet, GraduationCap, KeyRound, LogOut, Menu, Search, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getUser } from "@/lib/api";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "ภาพรวม", icon: BarChart3 },
  { href: "/students", label: "รายชื่อนักเรียน", icon: UsersRound },
  { href: "/student-accounts", label: "บัญชีนักเรียน", icon: KeyRound },
  { href: "/attendance", label: "บันทึกการเข้าเรียน", icon: ClipboardCheck },
  { href: "/attendance-logs", label: "ประวัติและส่งออก CSV", icon: FileSpreadsheet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ fullName?: string; role?: string }>({});

  useEffect(() => setUser(getUser()), []);

  function logout() {
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <>
      <div className="flex h-20 items-center gap-3 px-6">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-white"><GraduationCap className="size-6" /></span>
        <div><p className="font-bold leading-5">เช็กชื่อ</p><p className="text-xs text-muted-foreground">School Attendance</p></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[.18em] text-muted-foreground">เมนูหลัก</p>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", pathname === href && "bg-primary/10 text-primary")}>
            <Icon className="size-5" />{label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600">
          <LogOut className="size-5" />ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex">{sidebar}</aside>
      {open && <button aria-label="ปิดเมนู" className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col bg-white shadow-xl transition-transform lg:hidden", open && "translate-x-0")}>
        <Button variant="ghost" size="icon" className="absolute right-3 top-5" onClick={() => setOpen(false)}><X className="size-5" /></Button>
        {sidebar}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input className="h-10 w-64 rounded-lg bg-muted pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ค้นหาเมนู..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" /></Button>
            <div className="h-8 w-px bg-border" />
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.fullName || "ผู้ดูแลระบบ"}</p><p className="text-xs text-muted-foreground">{user.role || "Admin"}</p></div>
            <div className="grid size-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{(user.fullName || "ผ")[0]}</div>
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
