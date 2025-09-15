"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * CompareExamsMyopia.tsx — phiên bản chọn theo NHÓM chỉ số.
 * Hàng = các lần khám; Cột = (ngày, loại) + các nhóm đã chọn × (OD, OS).
 */

type ExamRow = {
  id: string;
  patient_id: string;
  exam_date: string; // ISO
  exam_type: "comprehensive" | "myopia_control";
  status: "draft" | "final";
  payload_inputs: Record<string, unknown> | null;
  created_at: string;
};

type Eye = "OD" | "OS";
type MetricKey = "AL" | "ACD" | "LT" | "K" | "MR" | "DrySki" | "WetSki";

type Field = {
  key: string;                                   // k1/k2/axis hoặc sph/cyl/ax...
  label: string;                                 // K1, K2, Axis...
  path: (eye: Eye) => string;                    // trả về dot-path trong payload_inputs
  unit?: string;
};

const GROUPS: Record<MetricKey, { label: string; fields: Field[] }> = {
  AL: {
    label: "Axial length",
    fields: [{ key: "al", label: "AL", unit: "mm", path: (e) => `biometry.${e}.AL` }],
  },
  ACD: {
    label: "ACD",
    fields: [{ key: "acd", label: "ACD", unit: "mm", path: (e) => `biometry.${e}.ACD` }],
  },
  LT: {
    label: "Lens thickness",
    fields: [{ key: "lt", label: "LT", unit: "mm", path: (e) => `biometry.${e}.LT` }],
  },
  K: {
    label: "Keratometry",
    fields: [
      { key: "k1", label: "K1", path: (e) => `k.${e}.K1` },
      { key: "k2", label: "K2", path: (e) => `k.${e}.K2` },
      { key: "axis", label: "Axis", path: (e) => `k.${e}.Axis` },
    ],
  },
  MR: {
    label: "Manifest refraction",
    fields: [
      { key: "sph", label: "Sphere", path: (e) => `mr.${e}.Sphere` },
      { key: "cyl", label: "Cylinder", path: (e) => `mr.${e}.Cylinder` },
      { key: "ax", label: "Axis", path: (e) => `mr.${e}.Axis` },
    ],
  },
  DrySki: {
    label: "Dry — Skiascopy",
    fields: [
      { key: "sph", label: "Sphere", path: (e) => `ski_dry.${e}.Sphere` },
      { key: "cyl", label: "Cylinder", path: (e) => `ski_dry.${e}.Cylinder` },
      { key: "ax", label: "Axis", path: (e) => `ski_dry.${e}.Axis` },
    ],
  },
  WetSki: {
    label: "Wet — Skiascopy",
    fields: [
      { key: "sph", label: "Sphere", path: (e) => `ski_wet.${e}.Sphere` },
      { key: "cyl", label: "Cylinder", path: (e) => `ski_wet.${e}.Cylinder` },
      { key: "ax", label: "Axis", path: (e) => `ski_wet.${e}.Axis` },
    ],
  },
};

type Props = { patientId: string };

export default function CompareExamsMyopia({ patientId }: Props) {
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyFinal, setOnlyFinal] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<MetricKey[]>([
    "AL",
    "ACD",
    "LT",
    "K",
  ]);
  const [error, setError] = useState<string | null>(null);

  // fetch exams
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("exams")
        .select(
          "id, patient_id, exam_date, exam_type, status, payload_inputs, created_at"
        )
        .eq("patient_id", patientId)
        .order("exam_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;
      if (err) {
        setError(err.message ?? "Fetch error");
        setRows([]);
      } else {
        setRows((data ?? []) as ExamRow[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [patientId]);

  const filtered = useMemo(
    () => (onlyFinal ? rows.filter((r) => r.status === "final") : rows),
    [rows, onlyFinal]
  );

  // Tính danh sách cột từ nhóm đã chọn
  const eyes: Eye[] = ["OD", "OS"];
  const columns = useMemo(() => {
    const cols: { key: string; label: string; get: (r: ExamRow) => unknown }[] = [
      { key: "date", label: "Ngày khám", get: (r) => prettyDate(r.exam_date) },
      { key: "type", label: "Loại", get: (r) => r.exam_type },
    ];
    selectedGroups.forEach((g) => {
      GROUPS[g].fields.forEach((f) => {
        eyes.forEach((e) => {
          cols.push({
            key: `${g}.${f.key}.${e}`,
            label: `${GROUPS[g].label} — ${f.label} (${e})${
              f.unit ? ` (${f.unit})` : ""
            }`,
            get: (r) => getAtPath(r.payload_inputs ?? {}, f.path(e)),
          });
        });
      });
    });
    return cols;
  }, [selectedGroups]);

  function toggleGroup(k: MetricKey) {
    setSelectedGroups((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">So sánh chỉ số</h2>
        <span className="text-sm opacity-70">
          Tổng {filtered.length}/{rows.length} lần khám
        </span>
        <div className="ml-auto flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyFinal}
              onChange={(e) => setOnlyFinal(e.target.checked)}
            />
            Chỉ hiển thị bản &quot;final&quot;
          </label>
          <button
            className="px-3 py-1.5 rounded-xl border text-sm"
            onClick={() =>
              refreshNow(setLoading, setError, setRows, patientId)
            }
          >
            Làm mới
          </button>
        </div>
      </header>

      {/* Selector nhóm */}
      <section className="rounded-2xl border p-3">
        <p className="text-sm font-medium mb-2">Chọn nhóm chỉ số</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GROUPS) as MetricKey[]).map((k) => {
            const on = selectedGroups.includes(k);
            return (
              <button
                key={k}
                onClick={() => toggleGroup(k)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  on ? "bg-white text-black" : ""
                }`}
              >
                {GROUPS[k].label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bảng */}
      <section className="rounded-2xl border overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((c) => (
                <Th key={c.key}>{c.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <Td colSpan={columns.length}>Đang tải…</Td>
              </tr>
            ) : error ? (
              <tr>
                <Td colSpan={columns.length} className="text-red-600">
                  Lỗi: {error}
                </Td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <Td colSpan={columns.length}>Không có dữ liệu</Td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  {columns.map((c) => (
                    <Td key={c.key}>{fmt(c.get(r))}</Td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <NoteBlock />
    </div>
  );
}

// ==== helpers ====

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  colSpan,
  className,
}: {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td
      className={`px-3 py-2 align-top whitespace-nowrap ${className ?? ""}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

function getAtPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return null;
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return cur;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string" && v.trim() !== "") return v;
  return "—";
}

function prettyDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return d ?? "—";
  }
}

async function refreshNow(
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  setRows: (v: ExamRow[]) => void,
  patientId: string
) {
  setLoading(true);
  setError(null);
  const { data, error } = await supabase
    .from("exams")
    .select(
      "id, patient_id, exam_date, exam_type, status, payload_inputs, created_at"
    )
    .eq("patient_id", patientId)
    .order("exam_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    setError(error.message ?? "Fetch error");
    setRows([]);
  } else {
    setRows((data ?? []) as ExamRow[]);
  }
  setLoading(false);
}

function NoteBlock() {
  return (
    <div className="text-xs opacity-70">
      Lưu ý: chỉnh lại đường dẫn `path()` trong GROUPS để khớp cấu trúc thực tế
      của <code>payload_inputs</code> (ví dụ <code>biometry.OD.AL</code>,
      <code> mr.OS.Sphere</code>…). Không cần đổi logic.
    </div>
  );
}
