import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api/auth|login|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js)).*)"],
};

export default function middleware(req: NextRequest) {
  // Tìm cookie Supabase auth (bắt đầu bằng "sb-" và kết thúc bằng "-auth-token")
  const hasSupabaseAuth = req.cookies
    .getAll()
    .some(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  // chưa đăng nhập => ép về /login
  if (!hasSupabaseAuth && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // đã đăng nhập mà vào /login => ép sang /patients/search
  if (hasSupabaseAuth && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/patients/search", req.url));
  }

  return NextResponse.next();
}
