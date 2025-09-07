"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/patients/search");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-xl">
        <h1 className="text-xl font-semibold">Đăng nhập</h1>
        <input
          type="email" required placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          type="password" required placeholder="Mật khẩu"
          value={pw} onChange={e => setPw(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={busy} className="w-full rounded-md bg-black text-white py-2">
          {busy ? "Đang vào..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
