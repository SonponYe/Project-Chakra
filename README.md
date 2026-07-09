Capital Business — multi-service worker directory and portfolio platform. Next.js 15 (App Router) + Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in your project URL, anon key, and service role key (Project Settings → API), plus `NEXT_PUBLIC_SITE_URL` (your production URL, e.g. the Vercel deployment).
3. Run every file in `supabase/migrations/` against your project, **in numeric order** (0001 → 0008) — either via the Supabase Dashboard SQL editor (paste each file's contents and run) or a direct Postgres connection (`psql`/`pg`) using the connection string from Project Settings → Database. The Supabase CLI doesn't reliably install on Windows, so the CLI-based `supabase db push` path isn't assumed here.
4. `npm install`, then `npm run dev` and open [http://localhost:3000](http://localhost:3000).
5. Sign up at `/login` → **Create account** (email + password). This creates an `auth.users` row but no role yet — you're a visitor. If you don't want the confirmation email on signup, disable **Confirm email** in Supabase Dashboard → Authentication → Providers → Email.
6. To become the first super admin, run this in the SQL editor (swap in your user's UUID, found in Authentication → Users):
   ```sql
   insert into admins (user_id, role) values ('<your-auth-user-id>', 'super_admin');
   ```
7. Reload `/admin/services` — you should now have access.

On Vercel, set the same env vars (Project Settings → Environment Variables) and redeploy.

## Auth

Email + password throughout, no magic links:

- **Visitors** self-serve sign up/in at `/login` (only required to request a booking or leave a review).
- **Workers and admins** are created by an admin (via `/admin/services/[id]/workers` or `/admin/admins`) using `auth.admin.createUser` with a generated temporary password shown once in the UI — no invite email involved. The admin relays it to that person out-of-band.
- After sign-in, `/auth/post-login` routes each role to its home (`/admin/services`, `/dashboard`, or `/`).

## Architecture

The module system is the core idea: `service_types` + `service_type_versions` hold a JSONB `module_config` describing which of the 8 reusable modules (gallery, offering list, stats/track record, case studies, booking/availability, reviews, contact, custom fields) a category uses, and in what order. A service type is `draft` (freely editable) until the first worker's module data is saved (`cb_save_worker_module_data`), at which point it locks to `standardized` and every worker in that category shares the same profile shape. Later changes to a standardized type go through a new version (`cb_create_service_type_version`) — existing workers keep whatever version their saved data already references.

`worker_module_data` stores each worker's actual content per module as JSONB. Two modules (booking/availability and reviews) also have real relational tables behind them (`worker_availability`, `worker_blocked_dates`, `bookings`, `reviews`) since visitor-facing queries need to join across workers, not just read one worker's blob.

Each module is a self-contained component pair under `src/components/modules/<key>/`: `AdminForm.tsx` (worker-facing edit form) and `PublicView.tsx` (public profile renderer). `src/lib/modules/registry.ts` and `schemas.ts` hold the shared module/archetype metadata and Zod validation.

Role checks (`super_admin` / `service_manager` / worker / visitor) are enforced via Postgres RLS policies (`supabase/migrations/0002_rls_policies.sql`, extended by `0004`–`0008`), not just in the UI. Cross-table writes that need atomicity (creating a service type + its first version, saving module data + locking, publishing a new version) go through `security definer` RPC functions rather than sequential client-side calls, so they can't partially fail.

Images go through the `worker-media` Supabase Storage bucket (`0005_storage_bucket.sql`), client-side compressed before upload (`src/lib/upload.ts`), with write access scoped to the worker who owns the path.

## Pages

- **Public**: `/` (live categories), `/services/[slug]` (workers in a category), `/services/[slug]/[workerId]` (full profile, renders every module in locked order, booking request + review forms inline).
- **Worker**: `/dashboard` — edit module data, manage weekly availability + blocked dates, respond to booking requests, respond to reviews.
- **Admin**: `/admin/services` (list + stats), `/admin/services/new` (archetype picker → module checklist → draft), `/admin/services/[id]` (edit draft / propose new version if standardized), `/admin/services/[id]/workers` (add/list workers), `/admin/admins` (super admin only — manage other admins and their scope).

## Known gaps (not yet built)

- No email/push notifications for new bookings or reviews (in-app only — the worker sees them on `/dashboard`).
- No payment processing (bookings are request/accept; product "orders" are inquiry-based) — by design, per the brief.
- No password-reset flow yet.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
