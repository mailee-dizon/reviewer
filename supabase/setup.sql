-- REWIND database setup for the review flow.
-- Paste this whole file into Supabase → SQL Editor → New query, and click Run.
-- It's safe to run more than once.
--
-- It does four things:
--   1. Creates a profile automatically when someone signs up.
--   2. Fills in dates automatically and keeps reviews.updated_at current.
--   3. Adds a few rules: one review per person per title, ratings 1 to 5,
--      and one media row per title.
--   4. Turns on Row Level Security, so people can only change their own data,
--      and private reviews are only visible to the person who wrote them.


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
