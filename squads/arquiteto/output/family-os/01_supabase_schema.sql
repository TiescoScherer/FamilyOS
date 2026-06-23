-- ============================================================
-- FAMILY OS — Schema Supabase (versão completa)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- ── 1. MEMBROS DA FAMÍLIA ──────────────────────────────────
create table if not exists public.family_members (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  role            text not null check (role in ('admin', 'filho')),
  data_nascimento date,
  avatar_url      text,
  created_at      timestamptz default now()
);

alter table public.family_members enable row level security;

drop policy if exists "Admins podem tudo em family_members" on public.family_members;
drop policy if exists "Acesso total family_members" on public.family_members;
create policy "Acesso total family_members"
  on public.family_members
  for all
  using (true)
  with check (true);

-- Seed: membros da família (não duplica se já existir)
insert into public.family_members (nome, role, data_nascimento) values
  ('Frantiesco', 'admin', '1990-01-01'),
  ('Maiara',     'admin', '1992-01-01'),
  ('Benjamin',   'filho', '2017-07-01'),
  ('Dominic',    'filho', '2021-08-15')
on conflict do nothing;


-- ── 2. PERFIS DE SAÚDE ─────────────────────────────────────
create table if not exists public.health_profiles (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.family_members(id) on delete cascade,
  alergias            text[],
  tipo_sanguineo      text,
  contato_pediatra    text,
  observacoes         text,
  cpf                 text,
  convenio            text,
  numero_convenio     text,
  contato_emergencia  text,
  escola              text,
  serie               text,
  updated_at          timestamptz default now()
);

alter table public.health_profiles enable row level security;

drop policy if exists "Admins podem tudo em health_profiles" on public.health_profiles;
drop policy if exists "Acesso total health_profiles" on public.health_profiles;
create policy "Acesso total health_profiles"
  on public.health_profiles
  for all
  using (true)
  with check (true);


-- ── 3. ROTINAS DE REMÉDIOS ─────────────────────────────────
create table if not exists public.medications_routines (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references public.family_members(id) on delete cascade,
  nome_remedio     text not null,
  dosagem          text not null,
  frequencia_horas int not null,
  horario_inicio   time not null default '08:00',
  status_ativo     boolean not null default true,
  observacoes      text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.medications_routines enable row level security;

drop policy if exists "Admins podem tudo em medications_routines" on public.medications_routines;
drop policy if exists "Acesso total medications_routines" on public.medications_routines;
create policy "Acesso total medications_routines"
  on public.medications_routines
  for all
  using (true)
  with check (true);


-- ── 4. CARTÕES DE CRÉDITO ──────────────────────────────────
create table if not exists public.credit_cards (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  bandeira         text not null check (bandeira in ('visa', 'mastercard', 'elo', 'amex', 'outro')),
  titular          text not null,
  limite           numeric(10,2) not null default 0,
  dia_fechamento   int not null check (dia_fechamento between 1 and 31),
  dia_vencimento   int not null check (dia_vencimento between 1 and 31),
  cor              text not null default '#6C63FF',
  gasto_mes        numeric(10,2) not null default 0,
  created_at       timestamptz default now()
);

alter table public.credit_cards enable row level security;

drop policy if exists "Acesso total credit_cards" on public.credit_cards;
create policy "Acesso total credit_cards"
  on public.credit_cards
  for all
  using (true)
  with check (true);


-- ── 5. REGISTROS FINANCEIROS ────────────────────────────────
create table if not exists public.financial_records (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('receita', 'despesa')),
  descricao   text not null,
  valor       numeric(10,2) not null,
  categoria   text not null,
  data        date not null default current_date,
  member_id   uuid references public.family_members(id),
  cartao_id   uuid references public.credit_cards(id) on delete set null,
  origem      text not null default 'manual' check (origem in ('manual', 'audio', 'foto', 'importacao')),
  confirmada  boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.financial_records enable row level security;

drop policy if exists "Admins podem tudo em financial_records" on public.financial_records;
drop policy if exists "Acesso total financial_records" on public.financial_records;
create policy "Acesso total financial_records"
  on public.financial_records
  for all
  using (true)
  with check (true);

create index if not exists idx_financial_records_data on public.financial_records(data);
create index if not exists idx_financial_records_confirmada on public.financial_records(confirmada);


-- ── 6. CONTAS FIXAS ────────────────────────────────────────
create table if not exists public.fixed_bills (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  valor       numeric(10,2) not null,
  vencimento  int not null check (vencimento between 1 and 31),
  categoria   text not null,
  paga        boolean not null default false,
  created_at  timestamptz default now()
);

alter table public.fixed_bills enable row level security;

drop policy if exists "Acesso total fixed_bills" on public.fixed_bills;
create policy "Acesso total fixed_bills"
  on public.fixed_bills
  for all
  using (true)
  with check (true);


-- ── 7. METAS FUTURAS ────────────────────────────────────────
create table if not exists public.future_goals (
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

drop policy if exists "Admins podem tudo em future_goals" on public.future_goals;
drop policy if exists "Acesso total future_goals" on public.future_goals;
create policy "Acesso total future_goals"
  on public.future_goals
  for all
  using (true)
  with check (true);


-- ── 8. LISTA DE COMPRAS ─────────────────────────────────────
create table if not exists public.shopping_list (
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

drop policy if exists "Admins podem tudo em shopping_list" on public.shopping_list;
drop policy if exists "Acesso total shopping_list" on public.shopping_list;
create policy "Acesso total shopping_list"
  on public.shopping_list
  for all
  using (true)
  with check (true);


-- ── FUNÇÕES E TRIGGERS ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_medications_updated_at on public.medications_routines;
create trigger trg_medications_updated_at
  before update on public.medications_routines
  for each row execute function public.set_updated_at();

drop trigger if exists trg_goals_updated_at on public.future_goals;
create trigger trg_goals_updated_at
  before update on public.future_goals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_health_updated_at on public.health_profiles;
create trigger trg_health_updated_at
  before update on public.health_profiles
  for each row execute function public.set_updated_at();
