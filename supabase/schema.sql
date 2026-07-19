-- Allergy-Aware Food Discovery App — database schema
--
-- How to run: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
--
-- Design notes (see ARCHITECTURE.md and DATA_SOURCES.md for the reasoning):
--   * Enum-like fields use CHECK constraints on text, not native Postgres ENUM
--     types, so the vocabulary can be extended with a simple migration later
--     rather than an ALTER TYPE dance.
--   * "restaurants"/"menu_items"/etc. are readable by anyone (it's the app's
--     curated public dataset) but writable only via the service-role key
--     (seed scripts) — there is deliberately no INSERT/UPDATE/DELETE policy
--     for the anon/authenticated roles on those tables.
--   * "profiles" and "favorites" are private per-user data, restricted by RLS
--     to auth.uid().

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- trigram similarity for craving search

-- ---------------------------------------------------------------------------
-- profiles: one row per registered user, holding their saved food profile.
-- Guest users never get a row here — their profile lives in client state only.
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  allergies jsonb not null default '[]',
  -- allergies shape: [{ "allergen": "peanuts", "severity": "severe" }, ...]
  dietary_restrictions text[] not null default '{}',
  matching_strictness text not null default 'standard'
    check (matching_strictness in ('standard', 'cautious', 'cross_contact_sensitive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles: select own" on profiles;
create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: insert own" on profiles;
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles: delete own" on profiles;
create policy "profiles: delete own" on profiles
  for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- restaurants: the curated dataset. Public read, service-role write only.
-- ---------------------------------------------------------------------------
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  cuisine text,
  price_level smallint check (price_level between 1 and 4),
  hours jsonb,
  phone text,
  website text,
  source_url text not null,
  source_type text not null,
  data_collected_at date not null,
  last_checked_at date not null,
  created_at timestamptz not null default now()
);

alter table restaurants enable row level security;

drop policy if exists "restaurants: public read" on restaurants;
create policy "restaurants: public read" on restaurants
  for select using (true);

create index if not exists restaurants_location_idx on restaurants (latitude, longitude);

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(6, 2),
  category text,
  source_url text not null,
  source_type text not null,
  data_collected_at date not null,
  last_checked_at date not null,
  created_at timestamptz not null default now()
);

alter table menu_items enable row level security;

drop policy if exists "menu_items: public read" on menu_items;
create policy "menu_items: public read" on menu_items
  for select using (true);

create index if not exists menu_items_restaurant_idx on menu_items (restaurant_id);
create index if not exists menu_items_name_trgm_idx on menu_items using gin (name gin_trgm_ops);
create index if not exists menu_items_description_trgm_idx on menu_items using gin (description gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- item_ingredients
-- ---------------------------------------------------------------------------
create table if not exists item_ingredients (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  ingredient_name text not null,
  evidence_source text not null default 'unknown'
    check (evidence_source in (
      'official_allergen_guide', 'official_ingredient_list', 'official_menu_description',
      'restaurant_written_confirmation', 'student_analysis_of_public_description',
      'community_report', 'unknown'
    )),
  confidence text not null default 'insufficient'
    check (confidence in ('high', 'medium', 'low', 'insufficient'))
);

alter table item_ingredients enable row level security;

drop policy if exists "item_ingredients: public read" on item_ingredients;
create policy "item_ingredients: public read" on item_ingredients
  for select using (true);

create index if not exists item_ingredients_menu_item_idx on item_ingredients (menu_item_id);

-- ---------------------------------------------------------------------------
-- item_allergens: the core evidence-tagged allergen assessment table.
-- ---------------------------------------------------------------------------
create table if not exists item_allergens (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  allergen text not null,
  assessment text not null
    check (assessment in (
      'restaurant_disclosed_contains', 'official_guide_contains', 'ingredient_explicitly_listed',
      'possible_based_on_description', 'not_identified_in_available_source',
      'restaurant_disclosed_absent', 'unknown'
    )),
  evidence_source text not null default 'unknown'
    check (evidence_source in (
      'official_allergen_guide', 'official_ingredient_list', 'official_menu_description',
      'restaurant_written_confirmation', 'student_analysis_of_public_description',
      'community_report', 'unknown'
    )),
  confidence text not null default 'insufficient'
    check (confidence in ('high', 'medium', 'low', 'insufficient')),
  evidence_note text,
  last_verified_at date not null default current_date,
  unique (menu_item_id, allergen)
);

alter table item_allergens enable row level security;

drop policy if exists "item_allergens: public read" on item_allergens;
create policy "item_allergens: public read" on item_allergens
  for select using (true);

create index if not exists item_allergens_menu_item_idx on item_allergens (menu_item_id);
create index if not exists item_allergens_allergen_idx on item_allergens (allergen);

-- ---------------------------------------------------------------------------
-- item_dietary_attributes
-- ---------------------------------------------------------------------------
create table if not exists item_dietary_attributes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  attribute text not null
    check (attribute in (
      'vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal', 'kosher', 'pescatarian'
    )),
  status text not null
    check (status in (
      'restaurant_confirmed', 'certified', 'supported_by_ingredients',
      'possible', 'not_compatible', 'unknown'
    )),
  evidence_source text not null default 'unknown'
    check (evidence_source in (
      'official_allergen_guide', 'official_ingredient_list', 'official_menu_description',
      'restaurant_written_confirmation', 'student_analysis_of_public_description',
      'community_report', 'unknown'
    )),
  confidence text not null default 'insufficient'
    check (confidence in ('high', 'medium', 'low', 'insufficient')),
  last_verified_at date not null default current_date,
  unique (menu_item_id, attribute)
);

alter table item_dietary_attributes enable row level security;

drop policy if exists "item_dietary_attributes: public read" on item_dietary_attributes;
create policy "item_dietary_attributes: public read" on item_dietary_attributes
  for select using (true);

create index if not exists item_dietary_attributes_menu_item_idx on item_dietary_attributes (menu_item_id);

-- ---------------------------------------------------------------------------
-- cross_contact_notes: attached to a menu item OR a whole restaurant.
-- ---------------------------------------------------------------------------
create table if not exists cross_contact_notes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  cross_contact_type text not null,
  note text not null,
  source_url text,
  evidence_source text not null default 'unknown'
    check (evidence_source in (
      'official_allergen_guide', 'official_ingredient_list', 'official_menu_description',
      'restaurant_written_confirmation', 'student_analysis_of_public_description',
      'community_report', 'unknown'
    )),
  confidence text not null default 'insufficient'
    check (confidence in ('high', 'medium', 'low', 'insufficient')),
  last_verified_at date not null default current_date,
  check (menu_item_id is not null or restaurant_id is not null)
);

alter table cross_contact_notes enable row level security;

drop policy if exists "cross_contact_notes: public read" on cross_contact_notes;
create policy "cross_contact_notes: public read" on cross_contact_notes
  for select using (true);

create index if not exists cross_contact_notes_menu_item_idx on cross_contact_notes (menu_item_id);
create index if not exists cross_contact_notes_restaurant_idx on cross_contact_notes (restaurant_id);

-- ---------------------------------------------------------------------------
-- modifications
-- ---------------------------------------------------------------------------
create table if not exists modifications (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  description text not null,
  source_url text,
  evidence_source text not null default 'unknown'
    check (evidence_source in (
      'official_allergen_guide', 'official_ingredient_list', 'official_menu_description',
      'restaurant_written_confirmation', 'student_analysis_of_public_description',
      'community_report', 'unknown'
    )),
  confidence text not null default 'insufficient'
    check (confidence in ('high', 'medium', 'low', 'insufficient'))
);

alter table modifications enable row level security;

drop policy if exists "modifications: public read" on modifications;
create policy "modifications: public read" on modifications
  for select using (true);

create index if not exists modifications_menu_item_idx on modifications (menu_item_id);

-- ---------------------------------------------------------------------------
-- favorites: private per-user saved restaurants/dishes.
-- ---------------------------------------------------------------------------
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('restaurant', 'dish')),
  target_id uuid not null,
  list_name text not null default 'Favorites',
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, list_name)
);

alter table favorites enable row level security;

drop policy if exists "favorites: select own" on favorites;
create policy "favorites: select own" on favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites: insert own" on favorites;
create policy "favorites: insert own" on favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites: delete own" on favorites;
create policy "favorites: delete own" on favorites
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_reports: stretch feature (community corrections). Built now so the
-- schema is ready, even though the UI for it comes later.
-- ---------------------------------------------------------------------------
create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  report_type text not null,
  description text not null,
  status text not null default 'unreviewed'
    check (status in ('unreviewed', 'community_reported', 'restaurant_confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

alter table user_reports enable row level security;

drop policy if exists "user_reports: select own" on user_reports;
create policy "user_reports: select own" on user_reports
  for select using (auth.uid() = user_id);

drop policy if exists "user_reports: insert own" on user_reports;
create policy "user_reports: insert own" on user_reports
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();
