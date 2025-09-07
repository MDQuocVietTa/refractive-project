"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

/**
 * Compare exams: rows = exam instances, columns = chosen metrics.
 * Drop-in client component for /patients/[id]/result.
 *
 * USAGE in a page:
 *   <CompareExamsMyopia patientId={params.id} />
 *
 * Required env (already typical in this project):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

// ==== 1) Supabase browser client ====


// ==== 2) Types ====
export type ExamRow = {
  id: string;
  patient_id: string;
  exam_date: string; // ISO date
  exam_type: "myopia_progression" | "refractive_exam";
  status: "draft" | "final";
  payload_inputs: any; // JSONB
  created_at: string;
};

// ==== 3) Metric config: add more later without changing logic ====
// JSON paths are dot-notation inside payload_inputs
// Adjust paths to match your real payload schema.
type MetricDef = {
  key: string;
  label: string;
  path?: string;
  compute?: (p: any) => any;
};

const METRIC_CATALOG: MetricDef[] = [
  { key: "AL_OD",  label: "AL OD (mm)",  path: "al_od" },
  { key: "AL_OS",  label: "AL OS (mm)",  path: "al_os" },
  { key: "ACD_OD", label: "ACD OD (mm)", path: "acd_od" },
  { key: "ACD_OS", label: "ACD OS (mm)", path: "acd_os" },
  { key: "LT_OD",  label: "LT OD (mm)",  path: "lt_od" },
  { key: "LT_OS",  label: "LT OS (mm)",  path: "lt_os" },
  { key: "SEQ_OD", label: "SEQ OD (D)",  compute: (p) => seqFrom("od", p) },
  { key: "SEQ_OS", label: "SEQ OS (D)",  compute: (p) => seqFrom("os", p) },
];

// ==== 4) Helpers ====
function getAt(obj: any, path: string) {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function byDateAsc(a: ExamRow, b: ExamRow) {
  return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
}

// ==== 5) Component ====
export default function CompareExamsMyopia({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamRow[]>([]);

  // checked exam ids
  const [selected, setSelected] = useState<string[]>([]);

  // chosen metric keys
  const [metrics, setMetrics] = useState<string[]>(["AL_OD","AL_OS","ACD_OD","ACD_OS","LT_OD","LT_OS","SEQ_OD","SEQ_OS"]);
  // fetch exams for this patient (myopia_control only by default but allow toggle)
  const [onlyMyopia, setOnlyMyopia] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const q = supabase
        .from("exams")
        .select("id, patient_id, exam_date, exam_type, status, payload_inputs, created_at")
        .eq("patient_id", patientId)
        .order("exam_date", { ascending: true });

      const { data, error } = await q;
      if (!mounted) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows = (data as ExamRow[]) || [];
      const filtered = onlyMyopia ? rows.filter(r => r.exam_type === "myopia_progression") : rows;
      setExams(filtered);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [patientId, onlyMyopia]);

  // computed view
  const metricDefs = METRIC_CATALOG.filter(m => metrics.includes(m.key));

  const allChecked = selected.length > 0 && selected.length === exams.length;
  const anyChecked = selected.length > 0;

  function toggleOne(id: string) {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }
  function toggleAll() {
    if (allChecked) setSelected([]);
    else setSelected(exams.map(e => e.id));
  }

  const rows = useMemo(() => {
    const base = exams.slice().sort(byDateAsc);
    const chosen = anyChecked ? base.filter(e => selected.includes(e.id)) : base;
    return chosen;
  }, [exams, selected, anyChecked]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">So sánh thẻ khám</h2>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMyopia} onChange={e => setOnlyMyopia(e.target.checked)} />
          Chỉ hiển thị loại "myopia_progression"
        </label>
        <button
          className="px-3 py-1.5 rounded-xl border hover:shadow text-sm"
          onClick={toggleAll}
          disabled={exams.length === 0}
        >
          {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
        <MetricPicker metrics={metrics} setMetrics={setMetrics} />
      </div>

      {loading && <div className="text-sm">Đang tải...</div>}
      {error && <div className="text-sm text-red-600">Lỗi: {error}</div>}

      {!loading && exams.length === 0 && (
        <div className="text-sm">Không có thẻ khám phù hợp.</div>
      )}

      {!loading && exams.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="p-2 w-8 text-left"></th>
                        <th className="p-2 text-left whitespace-nowrap">Ngày khám</th>
                        {metricDefs.map((m) => (
                        <th key={m.key} className="p-2 text-left whitespace-nowrap">
                            {m.label}
                        </th>
                        ))}
                    </tr>
                </thead>

            <tbody>
                {rows.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-gray-50/50">
                        {/* checkbox */}
                        <td className="p-2 align-top">
                        <input
                            type="checkbox"
                            checked={selected.includes(e.id)}
                            onChange={() => toggleOne(e.id)}
                            aria-label={`chọn thẻ ${e.id}`}
                        />
                        </td>

                        {/* ngày khám */}
                        <td className="p-2 align-top">
                        {e.exam_date ? new Date(e.exam_date).toLocaleDateString("vi-VN") : "—"}
                        </td>

                        {/* các chỉ số */}
                        {metricDefs.map(m => {
                        const v = m.compute ? m.compute(e.payload_inputs) : getAt(e.payload_inputs, m.path!);
                        return (
                            <td key={m.key} className="p-2 align-top tabular-nums">
                            {formatValue(v)}
                            </td>
                        );
                        })}
                    </tr>
                    ))}

                </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-500">Gợi ý: nếu chưa chọn thẻ nào, bảng sẽ hiển thị tất cả. Khi chọn, chỉ hiển thị các thẻ được chọn.</div>
    </div>
  );
}

function formatValue(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}
function isNum(x: any) { return typeof x === "number" && Number.isFinite(x); }
function round2(n: number) { return Math.round(n * 100) / 100; }

function seqFrom(side: "od" | "os", p: any) {
  const sph1 = getAt(p, `mani_${side}_sph`);
  const cyl1 = getAt(p, `mani_${side}_cyl`);
  if (isNum(sph1) && isNum(cyl1)) return round2(sph1 + cyl1 / 2);

  const sph2 = getAt(p, `wet_${side}_sph`);
  const cyl2 = getAt(p, `wet_${side}_cyl`);
  if (isNum(sph2) && isNum(cyl2)) return round2(sph2 + cyl2 / 2);

  const sph3 = getAt(p, `dry_${side}_sph`);
  const cyl3 = getAt(p, `dry_${side}_cyl`);
  if (isNum(sph3) && isNum(cyl3)) return round2(sph3 + cyl3 / 2);

  return null;
}


function MetricPicker({ metrics, setMetrics }: { metrics: string[]; setMetrics: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="px-3 py-1.5 rounded-xl border hover:shadow text-sm" onClick={() => setOpen(o => !o)}>
        Chọn chỉ số ({metrics.length})
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 max-h-72 overflow-auto rounded-xl border bg-white shadow">
          <div className="p-2 text-xs text-gray-500">Bật/tắt cột</div>
          <ul className="p-2 space-y-1">
            {METRIC_CATALOG.map(m => {
              const checked = metrics.includes(m.key);
              return (
                <li key={m.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) setMetrics(metrics.filter(k => k !== m.key));
                      else setMetrics([...metrics, m.key]);
                    }}
                    id={`metric-${m.key}`}
                  />
                  <label htmlFor={`metric-${m.key}`} className="cursor-pointer select-none">{m.label}</label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
