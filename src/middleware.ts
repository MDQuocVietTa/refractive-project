import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api/auth|login|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js)).*)"],
};

export default function middleware(req: NextRequest) {
  const has =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.get("sb-refresh-token")?.value;

  // chặn trang bảo vệ
  if (!has && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // đã đăng nhập mà vào /login -> đẩy sang app
  if (has && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/patients/search", req.url));
  }

  return NextResponse.next();
}
