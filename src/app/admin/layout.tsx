import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRole();

  if (role.kind !== "admin") {
    redirect("/login?next=/admin/services");
  }

  return <div className="min-h-screen bg-void">{children}</div>;
}
