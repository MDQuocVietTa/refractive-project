"use client";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => { await supabase.auth.signOut(); location.assign("/login"); }}
      className="rounded-md border px-3 py-1.5 text-sm"
    >
      Đăng xuất
    </button>
  );
}
