-- ═══════════════════════════════════════════════════════════════
-- PONTO MAJOLI — Quadro de horários (migração)
-- Se já tens o app a funcionar, cola SÓ este ficheiro no SQL Editor
-- do Supabase e clica "Run". (Instalações novas: já vem no supabase-schema.sql)
-- ═══════════════════════════════════════════════════════════════

-- Horário previsto de cada funcionário por dia da semana
-- dia_semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
create table if not exists horarios (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid references funcionarios(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  folga boolean default false,
  entrada time,
  saida_almoco time,
  volta_almoco time,
  saida time,
  created_at timestamptz default now(),
  unique (funcionario_id, dia_semana)
);

alter table horarios enable row level security;

drop policy if exists "permitir tudo horarios" on horarios;
create policy "permitir tudo horarios" on horarios
  for all using (true) with check (true);
