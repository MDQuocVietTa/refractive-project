import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { event, session }: { event: AuthChangeEvent; session: Session | null } =
    await req.json();

  const cookieStore = await cookies();           // <-- cần await
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    const access_token = session?.access_token ?? "";
    const refresh_token = session?.refresh_token ?? "";
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }

  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return res;
}
