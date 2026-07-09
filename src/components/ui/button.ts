export type ButtonVariant = "solid" | "ghost" | "danger-ghost";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-emerald text-[#06120C] hover:bg-emerald-bright",
  ghost: "border border-ink/15 text-ink hover:border-ink/35 bg-transparent",
  "danger-ghost": "border border-red-900/50 text-red-400 hover:border-red-500/60 bg-transparent",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

export function btnClass(variant: ButtonVariant = "solid", size: ButtonSize = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}
