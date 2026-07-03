import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Capital Business</h1>
      <p className="max-w-md text-neutral-500">
        Service category browsing lands in Phase 5. For now:
      </p>
      <Link href="/login" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Sign in
      </Link>
    </main>
  );
}
