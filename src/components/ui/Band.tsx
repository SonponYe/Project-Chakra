import type { ReactNode } from "react";

// Full-width alternating band used on the worker profile "dossier" layout --
// each module gets its own band so scrolling reads as turning sealed pages.
export default function Band({
  tone = "void",
  id,
  children,
}: {
  tone?: "void" | "surface";
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`border-b border-hairline-emerald py-16 sm:py-20 last:border-b-0 ${
        tone === "surface" ? "bg-surface" : "bg-void"
      }`}
    >
      <div className="mx-auto max-w-2xl px-6">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</p>;
}
