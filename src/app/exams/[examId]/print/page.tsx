"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";


// ==== Types ====
type Exam = {
  id: string;
  patient_id: string;
  exam_type:
    | "myopia_progression"
    | "refractive_exam"
    | "myopia_control"
    | "comprehensive";
  exam_date: string | null;
  status: "draft" | "final" | null;
  payload_inputs: Record<string, unknown> | null;
};

type Patient = {
  full_name_vi: string | null;
  patient_code: string | null;
  birth_year: number | null;
  sex: "M" | "F" | null;
};

// ==== Helpers ====
const fmt = (v: unknown) => (v == null || v === "" ? "—" : String(v));
const prettyDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export default function PrintPage() {
  const { examId } = useParams<{ examId: string }>();

  const [exam, setExam] = useState<Exam | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      const ex = await supabase
        .from("exams")
        .select("id, patient_id, exam_type, exam_date, status, payload_inputs")
        .eq("id", examId)
        .single();

      if (!alive) return;
      if (ex.error) {
        setErr(ex.error.message);
        setLoading(false);
        return;
      }

      const e = ex.data as Exam;
      setExam(e);

      const pt = await supabase
        .from("patients")
        .select("full_name_vi, patient_code, birth_year, sex")
        .eq("id", e.patient_id)
        .single();

      if (!pt.error) setPatient(pt.data as Patient);

      document.title = `Myopia result #${e.id.slice(0, 8)}`;
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [examId]);

  if (loading) return <main className="p-6">Loading…</main>;
  if (err) return <main className="p-6 text-red-600">Error: {err}</main>;
  if (!exam) return <main className="p-6">Không tìm thấy exam.</main>;
  if (exam.exam_type !== "myopia_progression")
    return <main className="p-6">Không phải phiếu Myopia.</main>;

  const p = exam.payload_inputs ?? {};

  return (
    <main>
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        html, body { height: auto; }
        body { margin: 0; background: #fff; color: #111; font: 12px/1.45 ui-sans-serif, system-ui; }
        @media print { .no-print { display: none !important } }

        .sheet {
          width: 100%;
          max-width: 190mm;                 /* 210 - 2*10mm */
          margin: 0 auto;
          padding: 6mm;
          box-sizing: border-box;
        }

        h1 { font-size: 18px; margin: 0 0 6mm }
        h2 { font-size: 13px; margin: 5mm 0 2mm; border-bottom: 1px solid #bbb; padding-bottom: 2mm }

        .meta { display:flex; gap:12px; flex-wrap:wrap; margin-bottom: 4mm; color:#333 }
        .meta b { color:#111 }

        table { width:100%; border-collapse: collapse; margin-top: 2mm; }
        th, td { border: 1px solid #bbb; padding: 3mm 2mm; text-align: left; vertical-align: middle; }
        thead th { background: #f4f4f4; }

        section { break-inside: avoid; page-break-inside: avoid; }
        tr, td, th { break-inside: avoid; page-break-inside: avoid; }
      `}</style>

      <div
        className="no-print"
        style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}
      >
        <a href={`/exams/${exam.id}`} style={{ marginRight: 8 }}>
          Back
        </a>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="sheet">
        <h1>Myopia progression — Result</h1>

        <div className="meta">
          <div>
            <b>Patient:</b> {patient?.full_name_vi ?? "—"} —{" "}
            {patient?.patient_code ?? "—"}
          </div>
          <div>
            <b>Sex:</b> {patient?.sex ?? "—"}
          </div>
          <div>
            <b>YOB:</b> {patient?.birth_year ?? "—"}
          </div>
          <div>
            <b>Date:</b> {prettyDate(exam.exam_date)}
          </div>
          <div>
            <b>Status:</b> {exam.status ?? "draft"}
          </div>
        </div>

        <section>
          <h2>Axial / ACD / Lens</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>OD</th>
                <th>OS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Axial length (mm)</td>
                <td>{fmt(p["al_od"])}</td>
                <td>{fmt(p["al_os"])}</td>
              </tr>
              <tr>
                <td>ACD (mm)</td>
                <td>{fmt(p["acd_od"])}</td>
                <td>{fmt(p["acd_os"])}</td>
              </tr>
              <tr>
                <td>Lens thickness (mm)</td>
                <td>{fmt(p["lt_od"])}</td>
                <td>{fmt(p["lt_os"])}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Keratometry</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>K1</th>
                <th>Axis</th>
                <th>K2</th>
                <th>Axis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OD</td>
                <td>{fmt(p["kera_od_k1"])}</td>
                <td>{fmt(p["kera_od_k1_axis"])}</td>
                <td>{fmt(p["kera_od_k2"])}</td>
                <td>{fmt(p["kera_od_k2_axis"])}</td>
              </tr>
              <tr>
                <td>OS</td>
                <td>{fmt(p["kera_os_k1"])}</td>
                <td>{fmt(p["kera_os_k1_axis"])}</td>
                <td>{fmt(p["kera_os_k2"])}</td>
                <td>{fmt(p["kera_os_k2_axis"])}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Manifest refraction</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Sphere</th>
                <th>Cylinder</th>
                <th>Axis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OD</td>
                <td>{fmt(p["mani_od_sph"])}</td>
                <td>{fmt(p["mani_od_cyl"])}</td>
                <td>{fmt(p["mani_od_axis"])}</td>
              </tr>
              <tr>
                <td>OS</td>
                <td>{fmt(p["mani_os_sph"])}</td>
                <td>{fmt(p["mani_os_cyl"])}</td>
                <td>{fmt(p["mani_os_axis"])}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Dry — Skiascopy</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Sphere</th>
                <th>Cylinder</th>
                <th>Axis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OD</td>
                <td>{fmt(p["dry_od_sph"])}</td>
                <td>{fmt(p["dry_od_cyl"])}</td>
                <td>{fmt(p["dry_od_axis"])}</td>
              </tr>
              <tr>
                <td>OS</td>
                <td>{fmt(p["dry_os_sph"])}</td>
                <td>{fmt(p["dry_os_cyl"])}</td>
                <td>{fmt(p["dry_os_axis"])}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Wet — Skiascopy</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Sphere</th>
                <th>Cylinder</th>
                <th>Axis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OD</td>
                <td>{fmt(p["wet_od_sph"])}</td>
                <td>{fmt(p["wet_od_cyl"])}</td>
                <td>{fmt(p["wet_od_axis"])}</td>
              </tr>
              <tr>
                <td>OS</td>
                <td>{fmt(p["wet_os_sph"])}</td>
                <td>{fmt(p["wet_os_cyl"])}</td>
                <td>{fmt(p["wet_os_axis"])}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
