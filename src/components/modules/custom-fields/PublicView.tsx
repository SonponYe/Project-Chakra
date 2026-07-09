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
    <dl className="flex flex-col gap-2.5 text-[14px]">
      {entries.map((e) => (
        <div key={e.label} className="flex gap-2">
          <dt className="font-medium text-ink">{e.label}:</dt>
          <dd className="text-muted">{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}
