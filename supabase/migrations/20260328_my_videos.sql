-- Migration: Create my_videos table for Frames section
-- Apply via: Supabase Dashboard → SQL Editor → New Query → Paste & Run

-- Create table
create table if not exists my_videos (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  category     text,
  video_url    text,
  thumb_url    text,
  aspect_ratio text default '16/9',
  sort_order   int  default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Enable RLS
alter table my_videos enable row level security;

-- Public read (anon) for active videos
create policy "Public read my_videos"
  on my_videos for select
  to anon
  using (is_active = true);

-- Authenticated full write
create policy "Admin write my_videos"
  on my_videos for all
  to authenticated
  using (true)
  with check (true);

-- Insert frames site_setting placeholder (hero video key)
insert into site_settings (key, value)
values ('frames', '{"hero_video": ""}')
on conflict (key) do nothing;
