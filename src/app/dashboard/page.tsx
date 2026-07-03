import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";

export default async function WorkerDashboardPage() {
  const role = await getCurrentUserRole();

  if (role.kind !== "worker") {
    redirect("/login?next=/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Your dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Profile editing, availability, bookings, and reviews land in later phases.
      </p>
    </main>
  );
}
