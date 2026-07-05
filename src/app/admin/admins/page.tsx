import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AddAdminForm from "./AddAdminForm";

export default async function AdminAdminsPage() {
  const role = await getCurrentUserRole();
  if (role.kind !== "admin" || role.role !== "super_admin") {
    redirect("/admin/services");
  }

  const supabase = await createClient();
  const [{ data: admins }, { data: serviceTypes }] = await Promise.all([
    supabase.from("admins").select("id, user_id, role, assigned_service_type_ids"),
    supabase.from("service_types").select("id, name"),
  ]);

  const adminClient = createAdminClient();
  const adminsWithEmail = await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await adminClient.auth.admin.getUserById(a.user_id);
      return { ...a, email: data.user?.email ?? a.user_id };
    })
  );

  const serviceTypeNameById = new Map((serviceTypes ?? []).map((st) => [st.id, st.name]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admins</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Super admins manage everything. Service managers are scoped to specific service types.
      </p>

      <div className="mt-6">
        <AddAdminForm serviceTypes={serviceTypes ?? []} />
      </div>

      <ul className="mt-8 flex flex-col gap-2">
        {adminsWithEmail.map((a) => (
          <li key={a.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>{a.email}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-600">
                {a.role}
              </span>
            </div>
            {a.role === "service_manager" && a.assigned_service_type_ids && (
              <p className="mt-1 text-xs text-neutral-500">
                Scoped to:{" "}
                {a.assigned_service_type_ids.map((id) => serviceTypeNameById.get(id) ?? id).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
