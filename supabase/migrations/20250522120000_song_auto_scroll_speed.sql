alter table songs
  add column if not exists auto_scroll_speed integer;

comment on column songs.auto_scroll_speed is 'Vitesse auto-scroll mode scène (px/s), null = défaut app';
