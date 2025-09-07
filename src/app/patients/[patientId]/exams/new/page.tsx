"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Patient = {
  id: string;
  full_name_vi: string | null;
  patient_code: string | null;
  patient_category: "myopia" | "refractive";
};

export default function NewExamPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name_vi, patient_code, patient_category")
        .eq("id", patientId)
        .single();
      if (error) setErr(error.message);
      setPatient(data as Patient);
      setLoading(false);
    }
    load();
  }, [patientId]);

  const examType =
    patient?.patient_category === "myopia"
      ? "myopia_progression"
      : "refractive_exam";

  async function onCreate() {
    if (!patient) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("exams")
      .insert({
        patient_id: patient.id,
        exam_type: examType,
        exam_date: date,
        status: "draft",
        payload_inputs: {},
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setErr(error.message);
      alert("Lỗi: " + error.message);
      return;
    }
    router.push(`/exams/${data.id}`);
  }

  if (loading) return <main className="p-6">Loading...</main>;
  if (err) return <main className="p-6 text-red-600">Error: {err}</main>;
  if (!patient) return <main className="p-6">Không tìm thấy bệnh nhân.</main>;

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">New Exam</h1>

      <div className="rounded-lg border p-4">
        <div>
          <b>Patient:</b> {patient.full_name_vi ?? "(no name)"} —{" "}
          {patient.patient_code}
        </div>
        <div className="mt-1">
          <b>Category:</b>{" "}
          {patient.patient_category === "myopia"
            ? "Myopia progression"
            : "Refractive exam"}
        </div>
        <div className="mt-1">
          <b>Exam type:</b>{" "}
          {examType === "myopia_progression"
            ? "Myopia progression"
            : "Refractive exam"}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Exam date</label>
        <input
          type="date"
          className="mt-1 w-full rounded-md border p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <button
        onClick={onCreate}
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Create draft exam"}
      </button>
    </main>
  );
}
