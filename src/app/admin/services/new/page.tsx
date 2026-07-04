import NewServiceTypeForm from "./NewServiceTypeForm";

export default function NewServiceTypePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">New service type</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick the closest archetype to pre-fill a sensible module set, then adjust before saving as
        a draft. The layout locks the moment the first worker&apos;s data is saved.
      </p>

      <div className="mt-8">
        <NewServiceTypeForm />
      </div>
    </main>
  );
}
