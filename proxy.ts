import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const path = request.nextUrl.pathname;
  const isPublic = path === "/login" || path === "/register";

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (token && isPublic) {
    return NextResponse.redirect(
      new URL(role === "Student" ? "/check-in" : "/dashboard", request.url),
    );
  }
  if (token && role === "Student" && path !== "/check-in") {
    return NextResponse.redirect(new URL("/check-in", request.url));
  }
  if (token && role && role !== "Student" && path === "/check-in") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
