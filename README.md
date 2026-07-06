# Ponto Majoli — Guia de instalação

App de controle de ponto para os funcionários da Majoli Tiles. Cada funcionário
bate o próprio ponto com um PIN de 4 dígitos; tu (admin) vês tudo, corriges
erros e tiras o resumo mensal para pagamento.

Tempo estimado: 15–20 minutos, sem precisar programar nada.

---

## PARTE 1 — Criar o banco de dados (Supabase) — 5 min

1. Vai a **supabase.com** → "Start your project" → cria conta grátis (podes usar o Google).
2. Clica **"New project"**.
   - Nome: `ponto-majoli`
   - Password: cria uma password forte e **guarda-a** (não precisas dela no dia a dia, mas guarda por segurança)
   - Região: escolhe a mais perto de Portugal (ex: `eu-west` / Irlanda ou Frankfurt)
3. Espera ~2 minutos enquanto o projeto é criado.
4. No menu da esquerda, clica em **"SQL Editor"**.
5. Clica **"New query"**, abre o ficheiro `supabase-schema.sql` (está nesta pasta), copia tudo e cola no editor.
6. Clica **"Run"** (ou Ctrl+Enter). Deve aparecer "Success".
   - Isto cria as tabelas `funcionarios` e `registros`, e já cadastra um utilizador admin com PIN **0000**.
7. No menu da esquerda, vai a **"Settings" → "API"**.
   - Copia o **"Project URL"** — vais precisar dele.
   - Copia a chave **"anon public"** — vais precisar dela também.

---

## PARTE 2 — Publicar o app (Vercel) — 8 min

1. Vai a **vercel.com** → cria conta grátis (podes usar o GitHub, Google, ou email).
2. Vais precisar de subir esta pasta do projeto para o Vercel. A forma mais fácil sem usar terminal:
   - Cria uma conta grátis em **github.com** (se ainda não tiveres)
   - Cria um novo repositório (ex: `ponto-majoli`)
   - Arrasta todos os ficheiros desta pasta para dentro do repositório pelo site do GitHub ("Add file" → "Upload files")
3. Volta ao Vercel → **"Add New" → "Project"** → escolhe o repositório `ponto-majoli` que acabaste de criar.
4. Antes de clicar em "Deploy", abre **"Environment Variables"** e adiciona:
   - `VITE_SUPABASE_URL` → cola o Project URL que copiaste do Supabase
   - `VITE_SUPABASE_ANON_KEY` → cola a chave anon public
5. Clica **"Deploy"**. Espera 1–2 minutos.
6. Pronto! O Vercel vai te dar um link tipo `ponto-majoli.vercel.app` — esse é o link do teu app.

---

## PARTE 3 — Instalar no celular de cada funcionário — 2 min cada

1. Envia o link (`ponto-majoli.vercel.app`) para cada funcionário por WhatsApp.
2. Cada um abre o link no navegador do celular (Chrome no Android, Safari no iPhone).
3. **Android (Chrome):** aparece um aviso "Adicionar à tela inicial" — ou toca no menu (⋮) → "Adicionar à tela inicial".
4. **iPhone (Safari):** toca no ícone de partilhar (□↑) → "Adicionar à Tela de Início".
5. Agora aparece um ícone "Ponto Majoli" na tela deles, como um app normal.

---

## PARTE 4 — Cadastrar os funcionários

1. Abre o app com o PIN **0000** (é o admin, o teu acesso).
2. Vai à aba **"Equipa"** → adiciona cada funcionário com nome, função, valor/hora, e um **PIN de 4 dígitos único** para cada um.
3. Muda o teu próprio PIN de admin depois: no SQL Editor do Supabase, roda:
   ```sql
   update funcionarios set pin = '1234' where is_admin = true;
   ```
   (troca `1234` pelo PIN que quiseres)

---

## Como funciona no dia a dia

- **Funcionário:** abre o app, digita o PIN, vê 4 botões (Entrada, Saída Almoço, Volta Almoço, Saída) e toca em "Bater agora" na hora certa.
- **Tu (admin):** abre com o teu PIN, tens 4 abas — Ponto (visão do dia, podes corrigir horários manualmente), Histórico (filtra por funcionário/mês, apaga erros), Equipa (cadastra/edita funcionários), Resumo (total de horas e valor a pagar por mês, por funcionário).

## Dúvidas comuns

**"Um funcionário esqueceu o PIN"** → vais à aba Equipa, editas o funcionário e vês/trocas o PIN.

**"Bati errado, como corrijo?"** → aba Ponto ou Histórico, ambas permitem editar/apagar horários manualmente.

**"Quero adicionar mais um administrador (ex: um encarregado)"** → no Supabase, na tabela `funcionarios`, edita o registo da pessoa e marca `is_admin` como `true`.

**"O app parou de funcionar"** → confere se as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) estão certas no Vercel, em Settings → Environment Variables.

---

## Sobre custos

- **Supabase:** grátis até 500MB de banco de dados — mais que suficiente para anos de registos de ponto.
- **Vercel:** grátis para projetos pessoais/pequenas empresas com este volume de uso.

Ou seja: **custo zero** para operar, a não ser que a equipa cresça muito (dezenas de funcionários por anos).
