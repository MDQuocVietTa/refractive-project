"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const CompareExamsMyopia = dynamic(
  () => import("../../../../components/exams/CompareExamsMyopia"),
  { ssr: false }
);

export default function ComparePage() {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-semibold">So sánh các lần khám</h1>
      <CompareExamsMyopia patientId={patientId} />
    </div>
  );
}
