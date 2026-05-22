-- Fix RLS: enforce owner on insert + explicit policies

-- Default owner from JWT (inserts without user_id still work)
alter table songs alter column user_id set default auth.uid();
alter table setlists alter column user_id set default auth.uid();
alter table setlist_items alter column user_id set default auth.uid();

-- Always set owner from session on insert (overrides client-sent user_id)
create or replace function public.set_owner_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists songs_set_user_id on songs;
create trigger songs_set_user_id
  before insert on songs
  for each row execute function public.set_owner_user_id();

drop trigger if exists setlists_set_user_id on setlists;
create trigger setlists_set_user_id
  before insert on setlists
  for each row execute function public.set_owner_user_id();

drop trigger if exists setlist_items_set_user_id on setlist_items;
create trigger setlist_items_set_user_id
  before insert on setlist_items
  for each row execute function public.set_owner_user_id();

-- Replace broad policies with explicit ones (UPSERT-friendly)
drop policy if exists "Users can manage their own songs" on songs;
drop policy if exists "Users can manage their own setlists" on setlists;
drop policy if exists "Users can manage their own setlist items" on setlist_items;

create policy "songs_select_own"
  on songs for select
  using (auth.uid() = user_id);

create policy "songs_insert_own"
  on songs for insert
  with check (auth.uid() = user_id);

create policy "songs_update_own"
  on songs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "songs_delete_own"
  on songs for delete
  using (auth.uid() = user_id);

create policy "setlists_select_own"
  on setlists for select
  using (auth.uid() = user_id);

create policy "setlists_insert_own"
  on setlists for insert
  with check (auth.uid() = user_id);

create policy "setlists_update_own"
  on setlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "setlists_delete_own"
  on setlists for delete
  using (auth.uid() = user_id);

create policy "setlist_items_select_own"
  on setlist_items for select
  using (auth.uid() = user_id);

create policy "setlist_items_insert_own"
  on setlist_items for insert
  with check (auth.uid() = user_id);

create policy "setlist_items_update_own"
  on setlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "setlist_items_delete_own"
  on setlist_items for delete
  using (auth.uid() = user_id);
