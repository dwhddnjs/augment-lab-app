-- 즐겨찾기 테이블
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  entity_type text check (entity_type in ('champion','item','augment')),
  entity_id text not null,
  created_at timestamptz default now(),
  unique(user_id, entity_type, entity_id)
);

-- 빌드 테이블
create table builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  champion_id text not null,
  item_ids text[] not null default '{}',
  augment_ids text[] not null default '{}',
  created_at timestamptz default now()
);

-- RLS 활성화
alter table favorites enable row level security;
alter table builds enable row level security;

-- 자기 데이터만 읽기/쓰기/삭제 허용
create policy "own favorites" on favorites
  for all using (auth.uid() = user_id);

create policy "own builds" on builds
  for all using (auth.uid() = user_id);
