-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- WATCHLIST: User sieht/bearbeitet nur eigene
alter table public.watchlist enable row level security;
create policy "watchlist_owner_all" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MESSAGES: jeder authentifizierte darf lesen, nur eigene schreiben
alter table public.messages enable row level security;
create policy "messages_select_authenticated" on public.messages
  for select using (auth.role() = 'authenticated');
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

-- CHANNELS: alle dürfen lesen, nur Admins schreiben (via service_role)
alter table public.channels enable row level security;
create policy "channels_select_all" on public.channels
  for select using (true);

-- TEAMS / PLAYERS / GAMES / PLAYER_STATS / ARTICLES: public read
alter table public.teams enable row level security;
create policy "teams_select_all" on public.teams for select using (true);

alter table public.players enable row level security;
create policy "players_select_all" on public.players for select using (true);

alter table public.games enable row level security;
create policy "games_select_all" on public.games for select using (true);

alter table public.player_stats enable row level security;
create policy "player_stats_select_all" on public.player_stats for select using (true);

alter table public.articles enable row level security;
create policy "articles_select_published" on public.articles
  for select using (published_at <= now());

-- TRIGGER: bei neuem auth.users automatisch profile anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
