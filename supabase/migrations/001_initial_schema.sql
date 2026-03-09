-- Profiles (parents)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Children
create table children (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references profiles on delete cascade not null,
  name text not null,
  birth_date date not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table children enable row level security;

create policy "Parents can manage own children"
  on children for all
  using (auth.uid() = parent_id);

-- Sessions
create table sessions (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references children on delete cascade not null,
  parent_id uuid references profiles on delete cascade not null,
  duration_minutes int not null,
  mood text not null,
  goals text[] not null default '{}',
  status text not null default 'pending',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

alter table sessions enable row level security;

create policy "Parents can manage own sessions"
  on sessions for all
  using (auth.uid() = parent_id);

-- Session activities
create table session_activities (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions on delete cascade not null,
  activity_type text not null,
  title text not null,
  content jsonb not null default '{}',
  engagement_score int,
  completed boolean default false not null,
  order_index int not null,
  created_at timestamptz default now() not null
);

alter table session_activities enable row level security;

create policy "Parents can manage own session activities"
  on session_activities for all
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_activities.session_id
      and sessions.parent_id = auth.uid()
    )
  );

-- Development reports
create table development_reports (
  id uuid default gen_random_uuid() primary key,
  child_id uuid references children on delete cascade not null,
  session_id uuid references sessions on delete cascade not null,
  summary text not null,
  skills_practiced text[] not null default '{}',
  highlights jsonb not null default '{}',
  created_at timestamptz default now() not null
);

alter table development_reports enable row level security;

create policy "Parents can read own reports"
  on development_reports for select
  using (
    exists (
      select 1 from children
      where children.id = development_reports.child_id
      and children.parent_id = auth.uid()
    )
  );
