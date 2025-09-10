"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AFTER_LOGIN = "/patients/search";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Nếu đã có session thì vào thẳng
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        router.replace(AFTER_LOGIN);
        router.refresh();
      }
    });

    // Đồng bộ cookie cho server + redirect khi đăng nhập xong
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, session }),
        }).catch(() => {});

        if (session) {
          router.replace(AFTER_LOGIN);
          router.refresh();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    // Phòng hờ nếu sự kiện onAuthStateChange chưa kịp bắn
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.replace(AFTER_LOGIN);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-xl">
        <h1 className="text-xl font-semibold">Đăng nhập</h1>

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />

        <input
          type="password"
          required
          placeholder="Mật khẩu"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
        >
          {busy ? "Đang vào..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
