import Link from "next/link";

export default function BackToDashboard() {
  return (
    <Link href="/" className="inline-block rounded-xl border px-4 py-2">
      ← Dashboard
    </Link>
  );
}
