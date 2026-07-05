import { customFieldsDataSchema, type CustomFieldDefinition } from "@/lib/modules/schemas";

export default function CustomFieldsPublicView({
  data,
  fieldDefinitions,
}: {
  data: unknown;
  fieldDefinitions: CustomFieldDefinition[];
}) {
  const parsed = customFieldsDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const entries = fieldDefinitions
    .map((f) => ({ label: f.label, value: parsed.data.values[f.key] }))
    .filter((e) => e.value);
  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Details</h2>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        {entries.map((e) => (
          <div key={e.label} className="flex gap-2">
            <dt className="font-medium text-neutral-700">{e.label}:</dt>
            <dd className="text-neutral-600">{e.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
