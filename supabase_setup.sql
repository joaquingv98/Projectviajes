-- ============================================================
-- SETUP COMPLETO — Ejecuta esto en el SQL Editor de Supabase
-- Crea todas las tablas necesarias para Social Trip Tournament
-- ============================================================

-- 1. TOURNAMENTS
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text,
  num_participants int not null,
  participants jsonb not null default '[]',
  status text not null default 'setup'
    check (status in ('setup', 'in_progress', 'completed')),
  winner_proposal_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MATCHES
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  round text not null
    check (round in ('quarterfinals', 'semifinals', 'final')),
  match_number int not null,
  player1_name text not null,
  player2_name text,
  status text not null default 'pending'
    check (status in (
      'pending', 'proposing', 'voting',
      'tiebreak_d1', 'tiebreak_d2', 'tiebreak_vote', 'tiebreak_roulette',
      'completed'
    )),
  winner_name text,
  voting_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. PROPOSALS
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_name text not null,
  flight_link text not null default '',
  price numeric not null default 0,
  destination text,
  dates text,
  created_at timestamptz default now()
);

-- 4. VOTES
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  voter_name text not null,
  proposal_id uuid references proposals(id) on delete cascade,
  created_at timestamptz default now(),
  unique (match_id, voter_name)
);

-- 5. Desactivar RLS (Row Level Security) para acceso anónimo sin restricciones
alter table tournaments disable row level security;
alter table matches disable row level security;
alter table proposals disable row level security;
alter table votes disable row level security;
