"use client";

import { ArrowDown, ArrowUp, Trash2, Plus } from "lucide-react";
import { MODULE_REGISTRY, getModuleDefinition } from "@/lib/modules/registry";
import type { ModuleKey } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";

interface ModuleChecklistProps {
  selected: ModuleKey[];
  onChange: (next: ModuleKey[]) => void;
  customFieldDefinitions?: CustomFieldDefinition[];
  onCustomFieldDefinitionsChange?: (next: CustomFieldDefinition[]) => void;
}

// Ordered list of currently-selected modules (contact always last, locked on),
// plus the remaining unselected modules to toggle on.
export default function ModuleChecklist({
  selected,
  onChange,
  customFieldDefinitions,
  onCustomFieldDefinitionsChange,
}: ModuleChecklistProps) {
  const orderedSelected = selected.filter((k) => k !== "contact");
  const unselected = MODULE_REGISTRY.filter(
    (m) => !m.alwaysIncluded && !selected.includes(m.key)
  );

  function toggleOn(key: ModuleKey) {
    onChange([...orderedSelected, key]);
  }

  function toggleOff(key: ModuleKey) {
    onChange(orderedSelected.filter((k) => k !== key));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...orderedSelected];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-700">Modules, in profile order</p>

      <ul className="flex flex-col gap-2">
        {orderedSelected.map((key, index) => {
          const def = getModuleDefinition(key);
          return (
            <li
              key={key}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggleOff(key)}
                  className="mt-1"
                  aria-label={`Remove ${def.label}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{def.label}</p>
                  <p className="text-xs text-neutral-500">{def.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded border border-neutral-200 p-1 disabled:opacity-30"
                    aria-label={`Move ${def.label} up`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === orderedSelected.length - 1}
                    className="rounded border border-neutral-200 p-1 disabled:opacity-30"
                    aria-label={`Move ${def.label} down`}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              {key === "custom_fields" && onCustomFieldDefinitionsChange && (
                <CustomFieldsEditor
                  definitions={customFieldDefinitions ?? []}
                  onChange={onCustomFieldDefinitionsChange}
                />
              )}
            </li>
          );
        })}

        <li className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <input type="checkbox" checked disabled className="mt-1" aria-label="Contact (always included)" />
          <div className="flex-1">
            <p className="text-sm font-medium">Contact</p>
            <p className="text-xs text-neutral-500">
              Always present on every worker profile regardless of service type.
            </p>
          </div>
        </li>
      </ul>

      {unselected.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-700">Add a module</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unselected.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleOn(m.key)}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
              >
                + {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomFieldsEditor({
  definitions,
  onChange,
}: {
  definitions: CustomFieldDefinition[];
  onChange: (next: CustomFieldDefinition[]) => void;
}) {
  function update(index: number, patch: Partial<CustomFieldDefinition>) {
    onChange(definitions.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function remove(index: number) {
    onChange(definitions.filter((_, i) => i !== index));
  }

  function add() {
    const n = definitions.length + 1;
    onChange([...definitions, { key: `field_${n}`, label: "", fieldType: "text" }]);
  }

  return (
    <div className="ml-7 flex flex-col gap-2 border-l border-neutral-200 pl-3">
      <p className="text-xs font-medium text-neutral-500">Field definitions (workers fill these in)</p>
      {definitions.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            placeholder="Label"
            value={d.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="flex-1 rounded border border-neutral-200 px-2 py-1 text-xs"
          />
          <select
            value={d.fieldType}
            onChange={(e) => update(i, { fieldType: e.target.value as CustomFieldDefinition["fieldType"] })}
            className="rounded border border-neutral-200 px-2 py-1 text-xs"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="url">URL</option>
            <option value="textarea">Long text</option>
          </select>
          <button type="button" onClick={() => remove(i)} className="text-red-600">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 self-start rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
      >
        <Plus size={12} /> Add field
      </button>
    </div>
  );
}
