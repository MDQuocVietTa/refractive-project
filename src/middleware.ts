import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api/auth|login|favicon.ico|.*\\.(?:png|jpg|svg|ico|css|js)).*)"],
};

export default function middleware(req: NextRequest) {
  return NextResponse.next(); // tắt kiểm tra
}
