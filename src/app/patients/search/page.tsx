"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  full_name_vi: string | null;
  patient_code: string | null;
  patient_category: "myopia" | "refractive";
};

export default function PatientSearchPage() {
  const sp = useSearchParams();
  const category = sp.get("category") === "myopia" ? "myopia" : "refractive";

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const placeholder = useMemo(
    () => (category === "myopia" ? "Tìm bệnh nhân (Myopia)" : "Tìm bệnh nhân (Refractive)"),
    [category]
  );

  async function runSearch(text: string) {
    setLoading(true);
    const base = supabase
      .from("patients")
      .select("id, full_name_vi, patient_code, patient_category")
      .eq("patient_category", category)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data, error } =
      text.trim() === ""
        ? await base
        : await base.or(
            `full_name_vi.ilike.%${text}%,patient_code.ilike.%${text}%`
          );

    setLoading(false);
    if (error) return alert("Lỗi: " + error.message);
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => {
    runSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Search Patient</h1>
      <div className="flex gap-2">
        <input
          className="w-full rounded-md border p-2"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(q)}
        />
        <button
          onClick={() => runSearch(q)}
          className="rounded-md bg-black px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-3 font-medium">
          Kết quả ({rows.length})
        </div>
        {rows.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">Không có kết quả.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.full_name_vi ?? "(no name)"}</div>
                  <div className="text-sm text-neutral-600">
                    {r.patient_code} • {r.patient_category}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a className="underline" href={`/patients/${r.id}`}>View</a>
                  <a className="underline" href={`/patients/${r.id}/exams/new`}>New Exam</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
