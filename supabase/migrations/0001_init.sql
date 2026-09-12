-- ============================================================================
-- Inkwell MVP schema
-- Phase 1 scope: free subscriptions only. `tier`/`paid` groundwork is laid
-- but Stripe wiring is Phase 2 (see CLAUDE.md).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles: 1:1 shadow of auth.users so we can join on it from public schema
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- publications: one per writer in the MVP (unique owner_id enforces that)
-- ----------------------------------------------------------------------------
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  subdomain text not null unique check (subdomain ~ '^[a-z0-9-]{3,40}$'),
  description text,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

alter table public.publications enable row level security;

create policy "publications are publicly readable"
  on public.publications for select
  using (true);

create policy "owners can create their publication"
  on public.publications for insert
  with check (auth.uid() = owner_id);

create policy "owners can update their publication"
  on public.publications for update
  using (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- subscriptions (free tier only in MVP; `tier`/stripe columns ready for Phase 2)
-- Defined before `posts` because a posts RLS policy and get_post_for_reader()
-- both reference this table.
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications on delete cascade,
  reader_id uuid not null references auth.users on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (publication_id, reader_id)
);

alter table public.subscriptions enable row level security;

create policy "readers can see their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = reader_id);

create policy "writers can see subscribers to their own publication"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.publications p
      where p.id = subscriptions.publication_id and p.owner_id = auth.uid()
    )
  );

create policy "readers can subscribe themselves"
  on public.subscriptions for insert
  with check (auth.uid() = reader_id);

create policy "readers can cancel their own subscription"
  on public.subscriptions for update
  using (auth.uid() = reader_id);

-- ----------------------------------------------------------------------------
-- posts
-- visibility: 'public' (anyone), 'subscribers' (free or paid subs), 'paid' (Phase 2)
-- status: 'draft' | 'published'
-- ----------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications on delete cascade,
  title text not null,
  slug text not null,
  excerpt text,
  body jsonb not null default '{}'::jsonb, -- Tiptap JSON document
  visibility text not null default 'public' check (visibility in ('public', 'subscribers', 'paid')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (publication_id, slug)
);

alter table public.posts enable row level security;

-- Public preview columns (title, excerpt) are always in the row, so this
-- policy alone is NOT sufficient to hide `body` from non-subscribers on
-- gated posts -- see get_post_for_reader() below, which the app must call
-- instead of selecting `posts` directly for the reading view.
create policy "published public posts are readable by anyone"
  on public.posts for select
  using (status = 'published' and visibility = 'public');

create policy "published subscriber posts readable by active subscribers"
  on public.posts for select
  using (
    status = 'published'
    and visibility in ('subscribers', 'paid')
    and exists (
      select 1 from public.subscriptions s
      where s.publication_id = posts.publication_id
        and s.reader_id = auth.uid()
        and s.status = 'active'
    )
  );

create policy "writers can read their own posts (any status)"
  on public.posts for select
  using (
    exists (
      select 1 from public.publications p
      where p.id = posts.publication_id and p.owner_id = auth.uid()
    )
  );

create policy "writers can insert posts into their own publication"
  on public.posts for insert
  with check (
    exists (
      select 1 from public.publications p
      where p.id = posts.publication_id and p.owner_id = auth.uid()
    )
  );

create policy "writers can update their own posts"
  on public.posts for update
  using (
    exists (
      select 1 from public.publications p
      where p.id = posts.publication_id and p.owner_id = auth.uid()
    )
  );

-- Server-side helper: returns the post with `body` redacted (null) unless the
-- caller is entitled to read it. Call this from the reading page instead of
-- a bare `select * from posts` so a not-yet-subscribed visitor still gets the
-- title/excerpt (for SEO + the "subscribe to read" paywall card) but never
-- receives the full body in the payload.
create function public.get_post_for_reader(p_publication_id uuid, p_slug text)
returns table (
  id uuid,
  title text,
  excerpt text,
  body jsonb,
  visibility text,
  published_at timestamptz,
  is_locked boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_entitled boolean := false;
begin
  select * into v_post
  from public.posts
  where publication_id = p_publication_id and slug = p_slug and status = 'published';

  if not found then
    return;
  end if;

  if v_post.visibility = 'public' then
    v_entitled := true;
  elsif auth.uid() is not null then
    select exists (
      select 1 from public.subscriptions s
      where s.publication_id = v_post.publication_id
        and s.reader_id = auth.uid()
        and s.status = 'active'
    ) into v_entitled;
  end if;

  return query select
    v_post.id,
    v_post.title,
    v_post.excerpt,
    case when v_entitled then v_post.body else null end,
    v_post.visibility,
    v_post.published_at,
    not v_entitled;
end;
$$;

-- Helpful indexes
create index posts_publication_id_status_idx on public.posts (publication_id, status);
create index subscriptions_publication_id_idx on public.subscriptions (publication_id);
