-- Sections setlist (pause, annonce, etc.) en plus des chansons
alter table setlist_items
  add column if not exists kind text not null default 'song',
  add column if not exists label text;

alter table setlist_items alter column song_id drop not null;

alter table setlist_items drop constraint if exists setlist_items_kind_check;
alter table setlist_items add constraint setlist_items_kind_check
  check (kind in ('song', 'marker'));

alter table setlist_items drop constraint if exists setlist_items_song_when_song_kind;
alter table setlist_items add constraint setlist_items_song_when_song_kind
  check (kind = 'marker' or song_id is not null);
