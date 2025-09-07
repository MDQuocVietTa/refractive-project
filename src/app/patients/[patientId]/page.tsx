"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type Patient = {
  id: string;
  full_name_vi: string | null;
  patient_code: string | null;
  patient_category: "myopia" | "refractive";
  birth_year: number | null;
  sex: "M" | "F" | null;
  phone: string | null;
};

type Exam = {
  id: string;
  exam_date: string | null;
  status: "draft" | "final" | null;
  exam_type: "myopia_progression" | "refractive_exam";
};

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name_vi, patient_code, patient_category, birth_year, sex, phone")
          .eq("id", patientId)
          .single(),
        supabase
          .from("exams")
          .select("id, exam_date, status, exam_type")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ]);
      if (pRes.error) setErr(pRes.error.message);
      setPatient(pRes.data as Patient);
      setExams((eRes.data as Exam[]) ?? []);
      setLoading(false);
    }
    load();
  }, [patientId]);

  if (loading) return <main className="p-6">Loading...</main>;
  if (err) return <main className="p-6 text-red-600">Error: {err}</main>;
  if (!patient) return <main className="p-6">Không tìm thấy bệnh nhân.</main>;

  const examTypeLabel =
    patient.patient_category === "myopia" ? "Myopia progression" : "Refractive exam";

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{patient.full_name_vi ?? "(no name)"}</h1>
          <p className="text-sm text-neutral-600">
            Code: {patient.patient_code} • Category: {examTypeLabel}
          </p>
        </div>
        <div className="flex gap-2">
  <button
    onClick={() => router.push(`/patients/${patientId}/exams/new`)}
    className="rounded-md bg-black px-4 py-2 text-white"
  >
    New Exam
  </button>
  <Link
    href={`/patients/${patientId}/compare`}
    className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
  >
    So sánh
  </Link>
</div>

      </header>

      <section className="rounded-lg border">
        <div className="border-b p-3 font-medium">Exams</div>
        {exams.length === 0 ? (
          <div className="p-4 text-sm text-neutral-600">Chưa có exam.</div>
        ) : (
          <ul className="divide-y">
            {exams.map((x) => (
              <li key={x.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {x.exam_type === "myopia_progression" ? "Myopia" : "Refractive"} •{" "}
                    {x.exam_date ?? "(no date)"} • {x.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a className="underline" href={`/exams/${x.id}`}>Open</a>
                  <a className="underline" href={`/exams/${x.id}/print`}>Print</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
