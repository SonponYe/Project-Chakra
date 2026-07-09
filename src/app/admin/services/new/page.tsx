import NewServiceTypeForm from "./NewServiceTypeForm";

export default function NewServiceTypePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Admin</p>
      <h1 className="mt-2 font-display text-2xl font-medium">New service type</h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        Pick the closest archetype to pre-fill a sensible module set, then adjust before saving as
        a draft. The layout locks the moment the first worker&apos;s data is saved.
      </p>

      <div className="mt-10">
        <NewServiceTypeForm />
      </div>
    </main>
  );
}
