"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ARCHETYPES, MODULE_REGISTRY, slugify } from "@/lib/modules/registry";
import ModuleChecklist from "../ModuleChecklist";
import { createServiceTypeAction } from "../actions";
import type { ServiceTypeArchetype } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { FIELD } from "@/components/ui/card";

const archetypeKeys = ARCHETYPES.map((a) => a.key) as [ServiceTypeArchetype, ...ServiceTypeArchetype[]];
const moduleKeyValues = MODULE_REGISTRY.map((m) => m.key) as [
  (typeof MODULE_REGISTRY)[number]["key"],
  ...(typeof MODULE_REGISTRY)[number]["key"][],
];

const formSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  archetype: z.enum(archetypeKeys),
  moduleKeys: z.array(z.enum(moduleKeyValues)).min(1, "Select at least one module"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewServiceTypeForm() {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);

  const defaultArchetype = ARCHETYPES[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      archetype: defaultArchetype.key,
      moduleKeys: defaultArchetype.defaultModules,
    },
  });

  const archetype = watch("archetype");
  const currentArchetypeDef = useMemo(
    () => ARCHETYPES.find((a) => a.key === archetype) ?? defaultArchetype,
    [archetype, defaultArchetype]
  );

  function handleNameChange(value: string) {
    setValue("name", value);
    if (!slugTouched) setValue("slug", slugify(value));
  }

  function handleArchetypeChange(key: ServiceTypeArchetype) {
    setValue("archetype", key);
    const def = ARCHETYPES.find((a) => a.key === key)!;
    setValue("moduleKeys", def.defaultModules);
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const result = await createServiceTypeAction({ ...values, customFieldDefinitions });
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/admin/services/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Name</label>
        <input
          {...register("name")}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Hairdressing"
          className={`mt-1.5 w-full ${FIELD}`}
        />
        {errors.name && <p className="mt-1 text-[12px] text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Slug</label>
        <input
          {...register("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            setValue("slug", e.target.value);
          }}
          placeholder="hairdressing"
          className={`mt-1.5 w-full ${FIELD}`}
        />
        {errors.slug && <p className="mt-1 text-[12px] text-red-400">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Archetype</label>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {ARCHETYPES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => handleArchetypeChange(a.key)}
              className={`rounded-md border px-3.5 py-3 text-left transition-colors ${
                archetype === a.key
                  ? "border-emerald bg-emerald-tint"
                  : "border-hairline bg-surface hover:border-emerald-dim"
              }`}
            >
              <span className={`block text-[13.5px] font-medium ${archetype === a.key ? "text-emerald" : "text-ink"}`}>
                {a.label}
              </span>
              <span className="mt-0.5 block text-[12px] text-muted">{a.description}</span>
            </button>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name="moduleKeys"
        render={({ field }) => (
          <ModuleChecklist
            selected={field.value}
            onChange={field.onChange}
            customFieldDefinitions={customFieldDefinitions}
            onCustomFieldDefinitionsChange={setCustomFieldDefinitions}
          />
        )}
      />
      {errors.moduleKeys && (
        <p className="text-[12px] text-red-400">{errors.moduleKeys.message as string}</p>
      )}

      <p className="text-[12px] text-muted/80">
        Starting from the {currentArchetypeDef.label} preset — adjust modules above before saving.
      </p>

      {submitError && <p className="text-[13px] text-red-400">{submitError}</p>}

      <button type="submit" disabled={isSubmitting} className={`${btnClass("solid", "md")} self-start`}>
        {isSubmitting ? "Saving…" : "Save as draft"}
      </button>
    </form>
  );
}
