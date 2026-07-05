-- Capital Business: storage bucket for worker media (gallery / case study images)
-- Path convention: {worker_id}/{module_key}/{filename} -- the worker_id prefix
-- is what write policies check ownership against.

insert into storage.buckets (id, name, public)
values ('worker-media', 'worker-media', true)
on conflict (id) do nothing;

create policy cb_worker_media_read on storage.objects
  for select using (bucket_id = 'worker-media');

create policy cb_worker_media_insert on storage.objects
  for insert with check (
    bucket_id = 'worker-media'
    and (
      cb_owns_worker((split_part(name, '/', 1))::uuid)
      or cb_is_admin_for_worker((split_part(name, '/', 1))::uuid)
    )
  );

create policy cb_worker_media_update on storage.objects
  for update using (
    bucket_id = 'worker-media'
    and (
      cb_owns_worker((split_part(name, '/', 1))::uuid)
      or cb_is_admin_for_worker((split_part(name, '/', 1))::uuid)
    )
  );

create policy cb_worker_media_delete on storage.objects
  for delete using (
    bucket_id = 'worker-media'
    and (
      cb_owns_worker((split_part(name, '/', 1))::uuid)
      or cb_is_admin_for_worker((split_part(name, '/', 1))::uuid)
    )
  );
