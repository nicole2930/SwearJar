-- Run this entire file in your Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run)

-- Profiles table extends auth.users with a display name
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now() not null
);

-- Coin deposits: one row per coin dropped
create table public.coin_deposits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  jar_id integer not null check (jar_id in (1, 2, 3)),
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.coin_deposits enable row level security;

-- All authenticated users can read profiles
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- Users can only insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- All authenticated users can read coin deposits (for leaderboard)
create policy "Coin deposits viewable by authenticated users"
  on coin_deposits for select
  to authenticated
  using (true);

-- Users can only insert their own coins
create policy "Users can insert their own coins"
  on coin_deposits for insert
  to authenticated
  with check (auth.uid() = user_id);
