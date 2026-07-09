import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AddAdminForm from "./AddAdminForm";
import AdminsTable from "./AdminsTable";

export default async function AdminAdminsPage() {
  const role = await getCurrentUserRole();
  if (role.kind !== "admin" || role.role !== "super_admin") {
    redirect("/admin/services");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Admin</p>
      <h1 className="mt-2 font-display text-2xl font-medium">Admins</h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        Super admins manage everything. Service managers are scoped to specific service types.
      </p>

      <div className="mt-8">
        <AddAdminForm serviceTypes={serviceTypes ?? []} />
      </div>

      <AdminsTable
        admins={adminsWithEmail.map((a) => ({
          id: a.id,
          email: a.email,
          role: a.role,
          scopeLabel:
            a.role === "service_manager" && a.assigned_service_type_ids?.length
              ? a.assigned_service_type_ids.map((id) => serviceTypeNameById.get(id) ?? id).join(", ")
              : a.role === "super_admin"
                ? "All"
                : "—",
          isSelf: a.user_id === user?.id,
        }))}
      />
    </main>
  );
}
