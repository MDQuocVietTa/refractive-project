"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CURRENT_YEAR = new Date().getFullYear();
const phoneRe = /^0[0-9]{9}$/;

export default function NewPatientPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const category = sp.get("category") === "myopia" ? "myopia" : "refractive";

  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (birthYear === "" || birthYear < 1900 || birthYear > CURRENT_YEAR) return alert(`Birth year phải 1900–${CURRENT_YEAR}`);
    if (!gender) return alert("Gender phải là M hoặc F.");
    if (!phoneRe.test(phone)) return alert("Phone phải 10 số và bắt đầu bằng 0.");

    setSaving(true);
    const { data, error } = await supabase
      .from("patients")
      .insert({
        full_name_vi: fullName,
        birth_year: Number(birthYear),
        sex: gender,
        phone,
        patient_category: category,
      })
      .select("id")
      .single();
    setSaving(false);

    if (error) return alert("Lỗi: " + error.message);
    router.push(`/patients/${data.id}`); // chuyển thẳng sang trang bệnh nhân
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h2 className="text-xl font-semibold">New Patient</h2>
      <p className="mt-2">
        Loại hồ sơ:{" "}
        <span className="px-2 py-0.5 rounded bg-neutral-200">
          {category === "myopia" ? "Myopia progression" : "Refractive exam"}
        </span>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="mt-1 w-full rounded-md border p-2"
            value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Birth year</label>
            <input type="number" className="mt-1 w-full rounded-md border p-2"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value === "" ? "" : Number(e.target.value))}
              min={1900} max={CURRENT_YEAR} required />
          </div>
          <div>
            <label className="block text-sm">Gender</label>
            <select className="mt-1 w-full rounded-md border p-2"
              value={gender} onChange={(e) => setGender(e.target.value as "M" | "F" | "")}
              required>
              <option value="">-- select --</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm">Phone</label>
          <input className="mt-1 w-full rounded-md border p-2"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="0XXXXXXXXX" required />
        </div>

        <button type="submit" disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}
