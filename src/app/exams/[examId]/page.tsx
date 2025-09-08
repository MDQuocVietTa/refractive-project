"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type Patient = { full_name_vi: string | null; patient_code: string | null };

type EyePair = { od: string; os: string };
type KeraEye = { k1: string; k1_axis: string; k2: string; k2_axis: string };
type RxEye = { sph: string; cyl: string; axis: string };

// ==== Helpers ====
const toNum = (v: string | number | "" | null | undefined): number | null => {
  if (v === "" || v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const getStr = (obj: Record<string, unknown>, key: string): string => {
  const v = obj?.[key];
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  return "";
};

export default function MyopiaExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [exam, setExam] = useState<Exam | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  // form state
  const [examDate, setExamDate] = useState<string>("");

  const [al, setAl] = useState<EyePair>({ od: "", os: "" });
  const [acd, setAcd] = useState<EyePair>({ od: "", os: "" });
  const [lt, setLt] = useState<EyePair>({ od: "", os: "" });

  const [keraOD, setKeraOD] = useState<KeraEye>({
    k1: "",
    k1_axis: "",
    k2: "",
    k2_axis: "",
  });
  const [keraOS, setKeraOS] = useState<KeraEye>({
    k1: "",
    k1_axis: "",
    k2: "",
    k2_axis: "",
  });

  const [maniOD, setManiOD] = useState<RxEye>({ sph: "", cyl: "", axis: "" });
  const [maniOS, setManiOS] = useState<RxEye>({ sph: "", cyl: "", axis: "" });

  const [dryOD, setDryOD] = useState<RxEye>({ sph: "", cyl: "", axis: "" });
  const [dryOS, setDryOS] = useState<RxEye>({ sph: "", cyl: "", axis: "" });

  const [wetOD, setWetOD] = useState<RxEye>({ sph: "", cyl: "", axis: "" });
  const [wetOS, setWetOS] = useState<RxEye>({ sph: "", cyl: "", axis: "" });

  // ==== Load ====
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
      setExamDate(e.exam_date ?? new Date().toISOString().slice(0, 10));

      const p = e.payload_inputs ?? {};
      setAl({ od: getStr(p, "al_od"), os: getStr(p, "al_os") });
      setAcd({ od: getStr(p, "acd_od"), os: getStr(p, "acd_os") });
      setLt({ od: getStr(p, "lt_od"), os: getStr(p, "lt_os") });

      setKeraOD({
        k1: getStr(p, "kera_od_k1"),
        k1_axis: getStr(p, "kera_od_k1_axis"),
        k2: getStr(p, "kera_od_k2"),
        k2_axis: getStr(p, "kera_od_k2_axis"),
      });
      setKeraOS({
        k1: getStr(p, "kera_os_k1"),
        k1_axis: getStr(p, "kera_os_k1_axis"),
        k2: getStr(p, "kera_os_k2"),
        k2_axis: getStr(p, "kera_os_k2_axis"),
      });

      setManiOD({
        sph: getStr(p, "mani_od_sph"),
        cyl: getStr(p, "mani_od_cyl"),
        axis: getStr(p, "mani_od_axis"),
      });
      setManiOS({
        sph: getStr(p, "mani_os_sph"),
        cyl: getStr(p, "mani_os_cyl"),
        axis: getStr(p, "mani_os_axis"),
      });

      setDryOD({
        sph: getStr(p, "dry_od_sph"),
        cyl: getStr(p, "dry_od_cyl"),
        axis: getStr(p, "dry_od_axis"),
      });
      setDryOS({
        sph: getStr(p, "dry_os_sph"),
        cyl: getStr(p, "dry_os_cyl"),
        axis: getStr(p, "dry_os_axis"),
      });

      setWetOD({
        sph: getStr(p, "wet_od_sph"),
        cyl: getStr(p, "wet_od_cyl"),
        axis: getStr(p, "wet_od_axis"),
      });
      setWetOS({
        sph: getStr(p, "wet_os_sph"),
        cyl: getStr(p, "wet_os_cyl"),
        axis: getStr(p, "wet_os_axis"),
      });

      const pt = await supabase
        .from("patients")
        .select("full_name_vi, patient_code")
        .eq("id", e.patient_id)
        .single();
      if (!pt.error) setPatient(pt.data as Patient);

      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [examId]);

  // ==== Save ====
  async function save(status?: "draft" | "final") {
    if (!exam) return;

    const payload_inputs: Record<string, unknown> = {
      al_od: toNum(al.od),
      al_os: toNum(al.os),
      acd_od: toNum(acd.od),
      acd_os: toNum(acd.os),
      lt_od: toNum(lt.od),
      lt_os: toNum(lt.os),

      kera_od_k1: toNum(keraOD.k1),
      kera_od_k1_axis: toNum(keraOD.k1_axis),
      kera_od_k2: toNum(keraOD.k2),
      kera_od_k2_axis: toNum(keraOD.k2_axis),
      kera_os_k1: toNum(keraOS.k1),
      kera_os_k1_axis: toNum(keraOS.k1_axis),
      kera_os_k2: toNum(keraOS.k2),
      kera_os_k2_axis: toNum(keraOS.k2_axis),

      mani_od_sph: toNum(maniOD.sph),
      mani_od_cyl: toNum(maniOD.cyl),
      mani_od_axis: toNum(maniOD.axis),
      mani_os_sph: toNum(maniOS.sph),
      mani_os_cyl: toNum(maniOS.cyl),
      mani_os_axis: toNum(maniOS.axis),

      dry_od_sph: toNum(dryOD.sph),
      dry_od_cyl: toNum(dryOD.cyl),
      dry_od_axis: toNum(dryOD.axis),
      dry_os_sph: toNum(dryOS.sph),
      dry_os_cyl: toNum(dryOS.cyl),
      dry_os_axis: toNum(dryOS.axis),

      wet_od_sph: toNum(wetOD.sph),
      wet_od_cyl: toNum(wetOD.cyl),
      wet_od_axis: toNum(wetOD.axis),
      wet_os_sph: toNum(wetOS.sph),
      wet_os_cyl: toNum(wetOS.cyl),
      wet_os_axis: toNum(wetOS.axis),
    };

    const updates: {
      exam_date: string | null;
      status?: "draft" | "final" | null;
      payload_inputs: Record<string, unknown> | null;
    } = { exam_date: examDate, payload_inputs };

    if (status) updates.status = status;

    console.log("UPDATE exams =>", { id: exam.id, updates });

    const { data, error } = await supabase
      .from("exams")
      .update(updates)
      .eq("id", exam.id)
      .select("id, exam_date, status, payload_inputs")
      .single();

    if (error) {
      console.error("Update error:", error);
      alert("Update error: " + error.message);
      return;
    }

    setExam((prev) => (prev ? { ...prev, ...data } : prev));
    alert("Saved. keys=" + Object.keys(data?.payload_inputs ?? {}).length);
  }

  // ==== UI ====
  if (loading) return <main className="p-6">Loading...</main>;
  if (err) return <main className="p-6 text-red-600">Error: {err}</main>;
  if (!exam) return <main className="p-6">Không tìm thấy exam.</main>;
  if (exam.exam_type !== "myopia_progression")
    return <main className="p-6">Exam này không phải myopia.</main>;

  const statusLabel = exam.status ?? "draft";

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Myopia progression — {statusLabel}
          </h1>
          <p className="text-sm text-neutral-500">
            Exam ID: {exam.id.slice(0, 8)} • Patient:{" "}
            {patient?.full_name_vi ?? "(no name)"} — {patient?.patient_code}
          </p>
        </div>
        <a className="underline" href={`/exams/${exam.id}/print`}>
          Print
        </a>
      </header>

      <section className="rounded-lg border p-4 grid gap-4">
        <div>
          <label className="block text-sm">Exam date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border p-2"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
        </div>

        {/* Axial length / ACD / Lens thickness */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="font-medium mb-1">Axial length (mm)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border p-2"
                placeholder="OD"
                inputMode="decimal"
                value={al.od}
                onChange={(e) => setAl({ ...al, od: e.target.value })}
              />
              <input
                className="rounded-md border p-2"
                placeholder="OS"
                inputMode="decimal"
                value={al.os}
                onChange={(e) => setAl({ ...al, os: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">ACD (mm)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border p-2"
                placeholder="OD"
                inputMode="decimal"
                value={acd.od}
                onChange={(e) => setAcd({ ...acd, od: e.target.value })}
              />
              <input
                className="rounded-md border p-2"
                placeholder="OS"
                inputMode="decimal"
                value={acd.os}
                onChange={(e) => setAcd({ ...acd, os: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Lens thickness (mm)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border p-2"
                placeholder="OD"
                inputMode="decimal"
                value={lt.od}
                onChange={(e) => setLt({ ...lt, od: e.target.value })}
              />
              <input
                className="rounded-md border p-2"
                placeholder="OS"
                inputMode="decimal"
                value={lt.os}
                onChange={(e) => setLt({ ...lt, os: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Keratometry */}
        <div>
          <div className="font-medium mb-2">Keratometry</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="font-medium">OD</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="K1"
                  inputMode="decimal"
                  value={keraOD.k1}
                  onChange={(e) => setKeraOD({ ...keraOD, k1: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={keraOD.k1_axis}
                  onChange={(e) =>
                    setKeraOD({ ...keraOD, k1_axis: e.target.value })
                  }
                />
                <span className="self-center text-sm">K1 / Axis</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="K2"
                  inputMode="decimal"
                  value={keraOD.k2}
                  onChange={(e) => setKeraOD({ ...keraOD, k2: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={keraOD.k2_axis}
                  onChange={(e) =>
                    setKeraOD({ ...keraOD, k2_axis: e.target.value })
                  }
                />
                <span className="self-center text-sm">K2 / Axis</span>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="font-medium">OS</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="K1"
                  inputMode="decimal"
                  value={keraOS.k1}
                  onChange={(e) => setKeraOS({ ...keraOS, k1: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={keraOS.k1_axis}
                  onChange={(e) =>
                    setKeraOS({ ...keraOS, k1_axis: e.target.value })
                  }
                />
                <span className="self-center text-sm">K1 / Axis</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="K2"
                  inputMode="decimal"
                  value={keraOS.k2}
                  onChange={(e) => setKeraOS({ ...keraOS, k2: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={keraOS.k2_axis}
                  onChange={(e) =>
                    setKeraOS({ ...keraOS, k2_axis: e.target.value })
                  }
                />
                <span className="self-center text-sm">K2 / Axis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manifest */}
        <div>
          <div className="font-medium mb-2">Manifest refraction</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="font-medium">OD</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={maniOD.sph}
                  onChange={(e) => setManiOD({ ...maniOD, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={maniOD.cyl}
                  onChange={(e) => setManiOD({ ...maniOD, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={maniOD.axis}
                  onChange={(e) =>
                    setManiOD({ ...maniOD, axis: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">OS</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={maniOS.sph}
                  onChange={(e) => setManiOS({ ...maniOS, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={maniOS.cyl}
                  onChange={(e) => setManiOS({ ...maniOS, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={maniOS.axis}
                  onChange={(e) =>
                    setManiOS({ ...maniOS, axis: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dry */}
        <div>
          <div className="font-medium mb-2">Dry — Skiascopy</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="font-medium">OD</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={dryOD.sph}
                  onChange={(e) => setDryOD({ ...dryOD, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={dryOD.cyl}
                  onChange={(e) => setDryOD({ ...dryOD, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={dryOD.axis}
                  onChange={(e) => setDryOD({ ...dryOD, axis: e.target.value })}
                />
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">OS</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={dryOS.sph}
                  onChange={(e) => setDryOS({ ...dryOS, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={dryOS.cyl}
                  onChange={(e) => setDryOS({ ...dryOS, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={dryOS.axis}
                  onChange={(e) => setDryOS({ ...dryOS, axis: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wet */}
        <div>
          <div className="font-medium mb-2">Wet — Skiascopy</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="font-medium">OD</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={wetOD.sph}
                  onChange={(e) => setWetOD({ ...wetOD, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={wetOD.cyl}
                  onChange={(e) => setWetOD({ ...wetOD, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={wetOD.axis}
                  onChange={(e) => setWetOD({ ...wetOD, axis: e.target.value })}
                />
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="font-medium">OS</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  className="rounded-md border p-2"
                  placeholder="Sphere"
                  inputMode="decimal"
                  value={wetOS.sph}
                  onChange={(e) => setWetOS({ ...wetOS, sph: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Cylinder"
                  inputMode="decimal"
                  value={wetOS.cyl}
                  onChange={(e) => setWetOS({ ...wetOS, cyl: e.target.value })}
                />
                <input
                  className="rounded-md border p-2"
                  placeholder="Axis"
                  inputMode="numeric"
                  value={wetOS.axis}
                  onChange={(e) => setWetOS({ ...wetOS, axis: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save("draft")}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Save draft
        </button>
        <button
          onClick={() => save("final")}
          className="rounded-md border px-4 py-2"
        >
          Finalize
        </button>
        <button
          onClick={() => router.push(`/patients/${exam.patient_id}`)}
          className="ml-auto underline"
        >
          Back to patient
        </button>
      </div>
    </main>
  );
}
