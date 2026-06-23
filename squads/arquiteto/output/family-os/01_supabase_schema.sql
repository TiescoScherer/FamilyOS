-- ============================================================
-- FAMILY OS — Schema Supabase
-- ============================================================

-- ── 1. MEMBROS DA FAMÍLIA ──────────────────────────────────
create table public.family_members (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  role          text not null check (role in ('admin', 'filho')),
  data_nascimento date,
  avatar_url    text,
  created_at    timestamptz default now()
);

alter table public.family_members enable row level security;

create policy "Admins podem tudo em family_members"
  on public.family_members
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Seed: membros fixos
insert into public.family_members (nome, role, data_nascimento) values
  ('Frantiesco', 'admin',  '1990-01-01'),
  ('Maiara',     'admin',  '1992-01-01'),
  ('Benjamin',   'filho',  '2017-01-01'),
  ('Dominic',    'filho',  '2021-01-01');


-- ── 2. PERFIS DE SAÚDE (filhos) ────────────────────────────
create table public.health_profiles (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.family_members(id) on delete cascade,
  alergias            text[],
  tipo_sanguineo      text,
  contato_pediatra    text,
  observacoes         text,
  updated_at          timestamptz default now()
);

alter table public.health_profiles enable row level security;

create policy "Admins podem tudo em health_profiles"
  on public.health_profiles
  for all
  using (auth.jwt() ->> 'role' = 'admin');


-- ── 3. ROTINAS DE REMÉDIOS ─────────────────────────────────
create table public.medications_routines (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.family_members(id) on delete cascade,
  nome_remedio    text not null,
  dosagem         text not null,
  frequencia_horas int not null,
  horario_inicio  time not null default '08:00',
  status_ativo    boolean not null default true,
  observacoes     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.medications_routines enable row level security;

create policy "Admins podem tudo em medications_routines"
  on public.medications_routines
  for all
  using (auth.jwt() ->> 'role' = 'admin');


-- ── 4. REGISTROS FINANCEIROS ────────────────────────────────
create table public.financial_records (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('receita', 'despesa')),
  descricao   text not null,
  valor       numeric(10,2) not null,
  categoria   text not null,
  data        date not null default current_date,
  member_id   uuid references public.family_members(id),
  created_at  timestamptz default now()
);

alter table public.financial_records enable row level security;

create policy "Admins podem tudo em financial_records"
  on public.financial_records
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Índice para consultas por mês
create index idx_financial_records_data on public.financial_records(data);


-- ── 5. METAS FUTURAS ────────────────────────────────────────
create table public.future_goals (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  descricao     text,
  valor_alvo    numeric(10,2) not null,
  valor_atual   numeric(10,2) not null default 0,
  prazo         date,
  categoria     text,
  status        text not null default 'em_andamento' check (status in ('em_andamento', 'concluida', 'pausada')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.future_goals enable row level security;

create policy "Admins podem tudo em future_goals"
  on public.future_goals
  for all
  using (auth.jwt() ->> 'role' = 'admin');


-- ── 6. LISTA DE COMPRAS ─────────────────────────────────────
create table public.shopping_list (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references public.family_members(id),
  item        text not null,
  categoria   text,
  quantidade  int default 1,
  comprado    boolean default false,
  urgente     boolean default false,
  created_at  timestamptz default now()
);

alter table public.shopping_list enable row level security;

create policy "Admins podem tudo em shopping_list"
  on public.shopping_list
  for all
  using (auth.jwt() ->> 'role' = 'admin');


-- ── FUNÇÃO: atualizar updated_at automaticamente ────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_medications_updated_at
  before update on public.medications_routines
  for each row execute function public.set_updated_at();

create trigger trg_goals_updated_at
  before update on public.future_goals
  for each row execute function public.set_updated_at();

create trigger trg_health_updated_at
  before update on public.health_profiles
  for each row execute function public.set_updated_at();
