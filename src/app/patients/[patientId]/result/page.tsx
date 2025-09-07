import CompareExamsMyopia from "@/components/exams/CompareExamsMyopia";

export default function Page({ params }: { params: { patientId: string } }) {
  return (
    <main className="p-4 space-y-6">
      <h1 className="text-lg font-semibold">Kết quả khám</h1>
      <CompareExamsMyopia patientId={params.patientId} />
    </main>
  );
}
