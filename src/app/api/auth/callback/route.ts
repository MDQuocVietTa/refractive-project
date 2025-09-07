import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(req: Request) {
  const { event, session } = await req.json();

  const cookieStore = await cookies();                 // <-- await
  const res = NextResponse.json({ ok: true });         // response để set cookie

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });   // <-- set trên res
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 }); // hoặc res.cookies.delete(name)
        },
      },
    }
  );

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    await supabase.auth.setSession(session);
  }
  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return res;                                          // trả về res đã set cookie
}
