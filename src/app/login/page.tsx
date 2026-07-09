"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnClass } from "@/components/ui/button";

// Prefer the deployed site URL when set so any email link (signup
// confirmation) always points at production instead of wherever this
// happened to be running (e.g. a local dev server).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "check-email" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const supabase = createClient();
    const origin = SITE_URL ?? window.location.origin;

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      window.location.href = `/auth/post-login?next=${encodeURIComponent(next)}`;
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      window.location.href = `/auth/post-login?next=${encodeURIComponent(next)}`;
      return;
    }

    setStatus("check-email");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Capital Business</p>
        <h1 className="mt-3 font-display text-3xl font-medium">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-[14px] text-muted">
          {mode === "signin" ? "Use your email and password." : "Visitors only need this to book or review."}
        </p>
      </div>

      {status === "check-email" ? (
        <p className="rounded-md border border-emerald-dim bg-emerald-tint p-4 text-[14px] text-emerald">
          Check {email} to confirm your account, then come back and sign in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-hairline bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-hairline bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
          />
          <button type="submit" disabled={status === "submitting"} className={btnClass("solid", "md")}>
            {status === "submitting" ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {status === "error" && errorMessage && <p className="text-[13px] text-red-400">{errorMessage}</p>}
        </form>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-[13px] text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-ink"
      >
        {mode === "signin" ? "New visitor? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
