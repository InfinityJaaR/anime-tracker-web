-- Perfiles ----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Listas ------------------------------------------------------------------
create type public.list_status as enum
  ('watching', 'plan_to_watch', 'on_hold', 'dropped', 'completed');

create table public.list_entries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mal_id integer not null,
  status public.list_status not null,
  score smallint check (score between 1 and 10),
  progress integer not null default 0 check (progress >= 0),
  title text not null,
  image text,
  genres text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, mal_id)
);
create index list_entries_user_status on public.list_entries (user_id, status);

-- Amistades ---------------------------------------------------------------
create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- RLS ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.list_entries enable row level security;
alter table public.friendships enable row level security;

create policy "profiles: lectura autenticada" on public.profiles
  for select to authenticated using (true);
create policy "profiles: editar propio" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "entries: dueño o amigo lee" on public.list_entries
  for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "entries: dueño escribe" on public.list_entries
  for insert to authenticated with check (user_id = auth.uid());
create policy "entries: dueño actualiza" on public.list_entries
  for update to authenticated using (user_id = auth.uid());
create policy "entries: dueño borra" on public.list_entries
  for delete to authenticated using (user_id = auth.uid());

create policy "friendships: partes leen" on public.friendships
  for select to authenticated using (requester = auth.uid() or addressee = auth.uid());
create policy "friendships: solicitar" on public.friendships
  for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy "friendships: destinatario acepta" on public.friendships
  for update to authenticated using (addressee = auth.uid());
create policy "friendships: partes eliminan" on public.friendships
  for delete to authenticated using (requester = auth.uid() or addressee = auth.uid());
