import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Refractive Project</h1>
      <p className="mb-4">Chọn nhánh làm việc</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/myopia" className="block p-6 rounded-2xl border">
          Myopia progression
        </Link>
        <Link href="/refractive" className="block p-6 rounded-2xl border">
          Refractive exam
        </Link>
      </div>
    </main>
  );
}
