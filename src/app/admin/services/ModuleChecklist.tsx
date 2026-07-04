"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { MODULE_REGISTRY, getModuleDefinition } from "@/lib/modules/registry";
import type { ModuleKey } from "@/lib/supabase/database.types";

interface ModuleChecklistProps {
  selected: ModuleKey[];
  onChange: (next: ModuleKey[]) => void;
}

// Ordered list of currently-selected modules (contact always last, locked on),
// plus the remaining unselected modules to toggle on.
export default function ModuleChecklist({ selected, onChange }: ModuleChecklistProps) {
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
              className="flex items-start gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2"
            >
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
