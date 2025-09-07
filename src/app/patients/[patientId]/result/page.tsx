import dynamic from "next/dynamic";

const CompareExamsMyopia = dynamic(
  () => import("../../../../components/exams/CompareExamsMyopia"),
  { ssr: false }
);

export default function Page({ params }: { params: { patientId: string } }) {

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-semibold">Kết quả khám</h1>

      {/* Bảng so sánh */}
      <CompareExamsMyopia patientId={params.patientId} />

    </div>
  );
}
