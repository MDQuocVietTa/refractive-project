import Link from "next/link";

export default function MyopiaDashboard() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Myopia progression</h1>
      <div className="grid gap-4">
        <Link href="/patients/new?category=myopia" className="block p-6 rounded-2xl border">
          New patient
        </Link>
        <Link href="/patients/search?category=myopia" className="block p-6 rounded-2xl border">
          Search patient
        </Link>
        <Link href="/admin" className="block p-6 rounded-2xl border">
          Admin
        </Link>
      </div>
    </main>
  );
}
