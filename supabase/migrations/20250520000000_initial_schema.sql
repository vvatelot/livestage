-- LiveStage schema
-- gen_random_uuid() : natif PostgreSQL 13+ / Supabase (évite uuid-ossp hors search_path)

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null default '',
  key text not null default '',
  capo integer not null default 0,
  chordpro_content text not null,
  source_url text,
  youtube_url text,
  tags text[],
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists setlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  event_date date,
  notes text,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists setlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setlist_id uuid not null references setlists(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  position integer not null default 0,
  notes text,
  transpose integer default 0,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists songs_user_id_idx on songs(user_id);
create index if not exists songs_updated_at_idx on songs(updated_at);
create index if not exists setlists_user_id_idx on setlists(user_id);
create index if not exists setlists_updated_at_idx on setlists(updated_at);
create index if not exists setlist_items_setlist_id_idx on setlist_items(setlist_id);
create index if not exists setlist_items_updated_at_idx on setlist_items(updated_at);

-- RLS
alter table songs enable row level security;
alter table setlists enable row level security;
alter table setlist_items enable row level security;

create policy "Users can manage their own songs"
  on songs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own setlists"
  on setlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own setlist items"
  on setlist_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger songs_updated_at
  before update on songs
  for each row execute function update_updated_at();

create trigger setlists_updated_at
  before update on setlists
  for each row execute function update_updated_at();

create trigger setlist_items_updated_at
  before update on setlist_items
  for each row execute function update_updated_at();
