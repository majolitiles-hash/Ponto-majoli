-- ═══════════════════════════════════════════════════════════════
-- PONTO MAJOLI — Schema do banco de dados
-- Cole este ficheiro inteiro no SQL Editor do Supabase e clique "Run"
-- ═══════════════════════════════════════════════════════════════

-- Tabela de funcionários
create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text default 'Ladrilhador',
  valor_hora numeric,
  pin text not null,              -- código de 4 dígitos que o funcionário usa para entrar
  is_admin boolean default false, -- true para o Matheus (acesso total)
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Tabela de registos de ponto
create table registros (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid references funcionarios(id) on delete cascade,
  data date not null,
  entrada time,
  saida_almoco time,
  volta_almoco time,
  saida time,
  created_at timestamptz default now(),
  unique (funcionario_id, data)   -- um registo por funcionário por dia
);

-- Segurança: liga o RLS (Row Level Security)
alter table funcionarios enable row level security;
alter table registros enable row level security;

-- Políticas simples: qualquer pessoa com a chave "anon" do projeto pode ler/escrever.
-- Isto é seguro o suficiente porque a chave fica só no teu app privado (não é pública na internet)
-- mas se quiseres reforçar depois, dá para restringir por PIN validado num backend.
create policy "permitir tudo funcionarios" on funcionarios
  for all using (true) with check (true);

create policy "permitir tudo registros" on registros
  for all using (true) with check (true);

-- Funcionário administrador inicial (Matheus) — muda o PIN depois de testar!
insert into funcionarios (nome, funcao, pin, is_admin)
values ('Matheus (Admin)', 'Dono', '0000', true);
