-- REWIND database setup for reviews, saved items, and following people.
-- Paste this whole file into Supabase → SQL Editor → New query, and click Run.
-- It's safe to run more than once.
--
-- It does six things:
--   1. Creates a profile automatically when someone signs up.
--   2. Fills in dates automatically and keeps reviews.updated_at current.
--   3. Adds a few rules: one review per person per title, ratings 1 to 5,
--      and one media row per title.
--   4. Turns on Row Level Security, so people can only change their own data,
--      and private reviews are only visible to the person who wrote them.
--   5. Sets up saved_items: which list each saved title is in.
--   6. Lets people follow each other and see each other's saved lists
--      (unless they turn that off in their account settings).


-- ---------------------------------------------------------------------------
-- 1. Profiles: one per user, created at sign-up
-- ---------------------------------------------------------------------------

-- The sign-up form sends display_name and username along with the account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 2. Automatic dates
-- ---------------------------------------------------------------------------

alter table public.profiles     alter column created_at set default now();
alter table public.media        alter column created_at set default now();
alter table public.reviews      alter column created_at set default now();
alter table public.reviews      alter column updated_at set default now();
alter table public.review_likes alter column liked_at   set default now();
alter table public.reviews      alter column public     set default true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. Rules
-- ---------------------------------------------------------------------------

-- Each title appears once in media (movies use their IMDb ID as external_id).
create unique index if not exists media_type_external_id_key
  on public.media (media_type, external_id);

-- Each person has one review per title; writing again edits it.
create unique index if not exists reviews_user_media_key
  on public.reviews (user_id, media_id);

alter table public.reviews drop constraint if exists reviews_rating_range;
alter table public.reviews
  add constraint reviews_rating_range check (rating between 1 and 5);


-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.media        enable row level security;
alter table public.reviews      enable row level security;
alter table public.review_likes enable row level security;

-- Profiles: anyone can see names; people can only edit their own.
drop policy if exists "Profiles are visible to everyone" on public.profiles;
create policy "Profiles are visible to everyone"
  on public.profiles for select using (true);

drop policy if exists "People can edit their own profile" on public.profiles;
create policy "People can edit their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Media: anyone can see titles; signed-in people can add one when they
-- review it for the first time.
drop policy if exists "Media is visible to everyone" on public.media;
create policy "Media is visible to everyone"
  on public.media for select using (true);

drop policy if exists "Signed-in people can add media" on public.media;
create policy "Signed-in people can add media"
  on public.media for insert to authenticated with check (true);

-- Reviews: public ones are visible to everyone, private ones only to their author.
-- People can only write, edit, and delete their own.
drop policy if exists "Public reviews, and your own private ones, are visible" on public.reviews;
create policy "Public reviews, and your own private ones, are visible"
  on public.reviews for select
  using (public or (select auth.uid()) = user_id);

drop policy if exists "People can write their own reviews" on public.reviews;
create policy "People can write their own reviews"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "People can edit their own reviews" on public.reviews;
create policy "People can edit their own reviews"
  on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "People can delete their own reviews" on public.reviews;
create policy "People can delete their own reviews"
  on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Helpful votes: anyone can see the counts; people add and remove their own votes.
drop policy if exists "Helpful votes are visible to everyone" on public.review_likes;
create policy "Helpful votes are visible to everyone"
  on public.review_likes for select using (true);

drop policy if exists "People can add their own helpful votes" on public.review_likes;
create policy "People can add their own helpful votes"
  on public.review_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "People can remove their own helpful votes" on public.review_likes;
create policy "People can remove their own helpful votes"
  on public.review_likes for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------------
-- 5. Saved items: each person's "currently watching", "watched", and
--    "want to watch" lists (or reading/read, playing/played)
-- ---------------------------------------------------------------------------

-- Which list the title is in: 'current' (watching, reading, playing),
-- 'finished' (watched, read, played), or 'want' (want to watch, read, play).
alter table public.saved_items add column if not exists status text not null default 'want';
alter table public.saved_items drop constraint if exists saved_items_status_check;
alter table public.saved_items
  add constraint saved_items_status_check check (status in ('current', 'finished', 'want'));

alter table public.saved_items alter column saved_at set default now();

-- The title's genres (e.g. {"Drama", "Science Fiction"}), so the Saved page can filter
-- by genre. Kept here rather than on media because people can update their own saved
-- items, and the genres are filled in every time something is saved or moved.
alter table public.saved_items add column if not exists genres text[] not null default '{}';

-- Each person saves a title once; saving it again moves it to another list.
create unique index if not exists saved_items_user_media_key
  on public.saved_items (user_id, media_id);

-- Link saved items to their titles, so the site can load both in one request.
-- (Only added if the table doesn't link them already.)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.saved_items'::regclass
      and contype = 'f'
      and confrelid = 'public.media'::regclass
  ) then
    alter table public.saved_items
      add constraint saved_items_media_id_fkey
      foreign key (media_id) references public.media (id) on delete cascade;
  end if;
end;
$$;

-- People can only change their own saved items. (Who can see them is in section 6.)
alter table public.saved_items enable row level security;

drop policy if exists "People can see their own saved items" on public.saved_items;

drop policy if exists "People can save items" on public.saved_items;
create policy "People can save items"
  on public.saved_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "People can move their own saved items" on public.saved_items;
create policy "People can move their own saved items"
  on public.saved_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "People can remove their own saved items" on public.saved_items;
create policy "People can remove their own saved items"
  on public.saved_items for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------------
-- 6. Following people, and seeing their saved lists
-- ---------------------------------------------------------------------------

-- Each username belongs to one person (capitals don't count), since profile
-- addresses use it, e.g. /u/justin.
create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

-- Whether other people can see this person's saved lists. On unless they turn it off.
alter table public.profiles add column if not exists lists_public boolean not null default true;

-- Who follows whom. "follower_id follows following_id".
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_yourself check (follower_id <> following_id)
);

-- Speeds up "who follows this person?" (the primary key already covers the other way).
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

-- Anyone can see who follows whom; people can only follow and unfollow as themselves.
drop policy if exists "Follows are visible to everyone" on public.follows;
create policy "Follows are visible to everyone"
  on public.follows for select using (true);

drop policy if exists "People can follow others" on public.follows;
create policy "People can follow others"
  on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);

drop policy if exists "People can unfollow others" on public.follows;
create policy "People can unfollow others"
  on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- Saved lists: people always see their own, and everyone can see the lists of
-- people who keep them public.
drop policy if exists "Saved items are visible to their owner, or everyone if public" on public.saved_items;
create policy "Saved items are visible to their owner, or everyone if public"
  on public.saved_items for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = saved_items.user_id and profiles.lists_public
    )
  );
