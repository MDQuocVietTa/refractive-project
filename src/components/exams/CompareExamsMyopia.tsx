"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * CompareExamsMyopia.tsx
 * Hiển thị bảng so sánh các chỉ số theo thời gian cho 1 bệnh nhân.
 * Props: patientId (UUID trong bảng patients.id)
 */

type ExamRow = {
  id: string;
  patient_id: string;
  exam_date: string; // ISO date
  exam_type: "comprehensive" | "myopia_control";
  status: "draft" | "final";
  payload_inputs: Record<string, unknown> | null;
  created_at: string;
};

type MetricDef = {
  key: string;
  label: string;
  unit?: string;
  path: string; // dot-notation trong payload_inputs
  map?: (v: unknown) => number | string | null;
};

type Props = { patientId: string };

// ==== cấu hình metric mặc định ====
const METRICS: MetricDef[] = [
  { key: "od_al", label: "AL OD", unit: "mm", path: "biometry.OD.AL", map: toNumberOrNull },
  { key: "od_acd", label: "ACD OD", unit: "mm", path: "biometry.OD.ACD", map: toNumberOrNull },
  { key: "od_lt", label: "LT OD", unit: "mm", path: "biometry.OD.LT", map: toNumberOrNull },
  { key: "os_al", label: "AL OS", unit: "mm", path: "biometry.OS.AL", map: toNumberOrNull },
];

export default function CompareExamsMyopia({ patientId }: Props) {
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyFinal, setOnlyFinal] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    METRICS.map((m) => m.key).slice(0, 3)
  );
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

  const selectedMetrics = useMemo(
    () => METRICS.filter((m) => selectedKeys.includes(m.key)),
    [selectedKeys]
  );

  const table = useMemo(() => {
    return filtered.map((r) => {
      const obj: Record<string, unknown> = {
        date: prettyDate(r.exam_date),
        type: r.exam_type,
      };

      for (const m of selectedMetrics) {
        const raw = getAtPath(r.payload_inputs ?? {}, m.path);
        const mapped = (m.map ? m.map(raw) : raw) as string | number | null;
        obj[m.key] =
          mapped === null || mapped === undefined || mapped === "" ? null : mapped;
      }

      return obj;
    });
  }, [filtered, selectedMetrics]);

  function toggleMetric(k: string) {
    setSelectedKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">So sánh chỉ số kiểm soát cận</h2>
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
            className="px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-100"
            onClick={() => refreshNow(setLoading, setError, setRows, patientId)}
          >
            Làm mới
          </button>
        </div>
      </header>

      <section className="rounded-2xl border p-3">
        <p className="text-sm font-medium mb-2">Chọn chỉ số</p>
        <div className="flex flex-wrap gap-3">
          {METRICS.map((m) => (
            <label
              key={m.key}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border"
            >
              <input
                type="checkbox"
                checked={selectedKeys.includes(m.key)}
                onChange={() => toggleMetric(m.key)}
              />
              {m.label}
              {m.unit ? <span className="opacity-60">({m.unit})</span> : null}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Ngày khám</Th>
              <Th>Loại</Th>
              {selectedMetrics.map((m) => (
                <Th key={m.key}>
                  {m.label} {m.unit ? `(${m.unit})` : ""}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <Td colSpan={2 + selectedMetrics.length}>Đang tải…</Td>
              </tr>
            ) : error ? (
              <tr>
                <Td colSpan={2 + selectedMetrics.length} className="text-red-600">
                  Lỗi: {error}
                </Td>
              </tr>
            ) : table.length === 0 ? (
              <tr>
                <Td colSpan={2 + selectedMetrics.length}>Không có dữ liệu</Td>
              </tr>
            ) : (
              table.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                  <Td>{row.date as string}</Td>
                  <Td>{row.type as string}</Td>
                  {selectedMetrics.map((m) => (
                    <Td key={m.key}>{fmt((row as Record<string, unknown>)[m.key])}</Td>
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

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
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
      Goi y: doi cac <code>path</code> trong cau hinh metric cho dung khoa thuc te
      trong <code>payload_inputs</code>. Vi du <code>biometry.OD.AL</code>,{" "}
      <code>biometry.OS.AL</code>. Khong can sua logic.
    </div>
  );
}
