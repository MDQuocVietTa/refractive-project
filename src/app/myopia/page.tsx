import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";

export default function MyopiaDashboard() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Myopia progression</h1>

      <BackToDashboard />

      <div className="grid gap-4">
        <Link
          href="/patients/new?category=myopia"
          className="block p-6 rounded-2xl border"
        >
          New patient
        </Link>
        <Link
          href="/patients/search?category=myopia"
          className="block p-6 rounded-2xl border"
        >
          Search patient
        </Link>
        <Link href="/admin" className="block p-6 rounded-2xl border">
          Admin
        </Link>
      </div>
    </main>
  );
}
