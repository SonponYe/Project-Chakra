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
    const result = await createServiceTypeAction(values);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/admin/services/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium text-neutral-700">Name</label>
        <input
          {...register("name")}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Hairdressing"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700">Slug</label>
        <input
          {...register("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            setValue("slug", e.target.value);
          }}
          placeholder="hairdressing"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700">Archetype</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ARCHETYPES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => handleArchetypeChange(a.key)}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                archetype === a.key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span className="block font-medium">{a.label}</span>
              <span className={`block text-xs ${archetype === a.key ? "text-neutral-300" : "text-neutral-500"}`}>
                {a.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Controller
        control={control}
        name="moduleKeys"
        render={({ field }) => (
          <ModuleChecklist selected={field.value} onChange={field.onChange} />
        )}
      />
      {errors.moduleKeys && (
        <p className="text-xs text-red-600">{errors.moduleKeys.message as string}</p>
      )}

      <p className="text-xs text-neutral-400">
        Starting from the {currentArchetypeDef.label} preset — adjust modules above before saving.
      </p>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save as draft"}
      </button>
    </form>
  );
}
