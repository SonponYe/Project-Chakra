Capital Business — multi-service worker directory and portfolio platform. Next.js 15 (App Router) + Supabase, built in phases (see project brief).

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in your project URL, anon key, and service role key (Project Settings → API).
3. Run the migrations in `supabase/migrations/` against your project, in order — either via the Supabase Dashboard SQL editor (paste each file's contents) or the Supabase CLI (`supabase db push`) once linked.
4. `npm install`, then `npm run dev` and open [http://localhost:3000](http://localhost:3000).
5. Sign in at `/login` (magic link, no password). This creates an `auth.users` row but no role yet — you're a visitor.
6. To become the first super admin, run this in the SQL editor (swap in your user's UUID, found in Authentication → Users):
   ```sql
   insert into admins (user_id, role) values ('<your-auth-user-id>', 'super_admin');
   ```
7. Reload `/admin/services` — you should now have access.

## Architecture

See the project brief for the full module system design. Key idea: `service_types` + `service_type_versions` hold a JSONB `module_config` describing which of the 8 reusable modules (gallery, offering list, stats, case studies, booking, reviews, contact, custom fields) a category uses. A service type is `draft` (freely editable) until its first worker's module data is saved, at which point it locks to `standardized` and all workers in that category share the same profile shape. `worker_module_data` stores each worker's actual content per module as JSONB, pinned to the version it was filled against.

Role checks (`super_admin` / `service_manager` / worker / visitor) are enforced via Postgres RLS policies in `supabase/migrations/0002_rls_policies.sql`, not just in the UI.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
