-- 1. Enable UUIDs (Required for unique IDs)
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES Table (Stores user levels, badges, points)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null,
  mobile text,
  level text default 'Rookie',
  level_number int default 1,
  current_points int default 0,
  max_points int default 500,
  report_count int default 0,
  badges text[] default '{}',
  avatar_url text,
  avatar_type text default 'preset',
  gender text default 'boy',
  preset_id text,
  preferences jsonb default '{"theme": "light", "mapStyle": "satellite"}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Security (RLS)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 3. Create REPORTS Table (Stores images/videos uploaded by users)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('image', 'video')) not null,
  url text not null,
  location_lat float not null,
  location_lng float not null,
  points_earned int default 0,
  status text default 'Pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reports enable row level security;
create policy "Reports are viewable by everyone." on public.reports for select using (true);
create policy "Users can insert their own reports." on public.reports for insert with check (auth.uid() = user_id);

-- 4. Create REWARDS Table (Stores scratch cards)
create table public.rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  status text default 'unscratched',
  value int not null,
  type text default 'points',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.rewards enable row level security;
create policy "Users can see their own rewards." on public.rewards for select using (auth.uid() = user_id);
create policy "Users can update their own rewards." on public.rewards for update using (auth.uid() = user_id);
create policy "Users can insert their own rewards." on public.rewards for insert with check (auth.uid() = user_id);

-- 5. Create HAZARDS Table (Stores community & AI alerts)
create table public.hazards (
  id uuid default uuid_generate_v4() primary key,
  latitude float not null,
  longitude float not null,
  type text not null,
  title text not null,
  severity text not null,
  source text not null,
  description text,
  confidence float,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.hazards enable row level security;
create policy "Hazards are viewable by everyone." on public.hazards for select using (true);
create policy "Users can insert hazards." on public.hazards for insert with check (true);

-- OPTIONAL: Storage Bucket Setup
-- 1. Go to "Storage" in Supabase Dashboard.
-- 2. Create a new public bucket named 'reports'.
-- 3. Run these policies if you want to set permissions via SQL:
-- insert into storage.buckets (id, name, public) values ('reports', 'reports', true);
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'reports' );
-- create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'reports' and auth.role() = 'authenticated' );