import { NextResponse } from "next/server";
import { getCurrentUserRole, homePathForRole } from "@/lib/auth";

// Hit via a hard navigation right after a successful client-side
// signInWithPassword/signUp call, so this request carries the fresh session
// cookie and can route each role to its home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const role = await getCurrentUserRole();
  const destination = next !== "/" ? next : homePathForRole(role);
  return NextResponse.redirect(`${origin}${destination}`);
}
