# Leitor Dinâmico Imersivo

[![CI](https://github.com/puppe1990/speed-reading-app/actions/workflows/ci.yml/badge.svg)](https://github.com/puppe1990/speed-reading-app/actions/workflows/ci.yml)

Leitor de leitura dinâmica com **HTMX + Tailwind + HTML renderizado no servidor (SSR)** e persistência em **SQLite (Turso/libSQL)**. Multi-usuário, com biblioteca de textos, quatro técnicas de leitura progressivas e estatísticas de treino.

Construído sobre o padrão do [`htmx-turso-starter`](https://github.com/puppe1990/htmx-turso-starter): JavaScript ESM puro, **sem build step**, Node 22+.

## Funcionalidades

- **Contas de usuário**: cadastro e login com senha via **bcrypt** e sessão em cookie `HttpOnly` assinado (HMAC).
- **Biblioteca**: textos compartilhados (seed) + textos do próprio usuário (colar artigo/notícia).
- **Níveis de leitura**:
  - Nível 1 · Varredura de Pacing
  - Nível 2 · Agrupamento (Chunks)
  - Nível 3 · Salto Periférico
  - Nível 4 · Foco Centrado RSVP (com ORP — ponto ótimo de reconhecimento)
- **Ajustes**: WPM, tamanho do chunk, fonte, linhas guia e profundidade (desfoque dos parágrafos vizinhos).
- **Preferências do usuário** reaproveitadas entre textos (novos textos herdam os últimos ajustes).
- **Progresso por texto** (parágrafo/palavra) e **estatísticas**: textos concluídos, minutos ativos, WPM médio e pico.
- **Atalhos de teclado**, sidebar de níveis no desktop e layout responsivo.

## Requisitos

- Node.js **22+** (usa `--env-file-if-exists` e `@libsql/client`).
- Uma conta [Turso](https://turso.tech) apenas para produção.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:4173 e crie sua conta em `/signup`.

Localmente o app usa um arquivo SQLite (`src/data/leitor.db`, gitignored) e semeia a biblioteca a partir de `src/data/texts.json` na inicialização.

## Variáveis de ambiente

Copie `.env.example` para `.env` — ele é carregado automaticamente por `npm run dev`/`npm run seed`.

| Variável             | Obrigatória | Descrição                                                  |
| -------------------- | ----------- | ---------------------------------------------------------- |
| `SESSION_SECRET`     | produção    | Segredo para assinar o cookie de sessão (dev tem default). |
| `TURSO_DATABASE_URL` | produção    | URL do banco (`libsql://...`). Vazio = SQLite local.       |
| `TURSO_AUTH_TOKEN`   | produção    | Token de acesso ao Turso.                                  |
| `PORT`               | não         | Porta do servidor local (default `4173`).                  |

## Scripts

| Script               | O que faz                                              |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Sobe o servidor local em http://localhost:4173.        |
| `npm run seed`       | Semeia a biblioteca a partir de `src/data/texts.json`. |
| `npm test`           | Roda a suíte (Vitest).                                 |
| `npm run test:watch` | Testes em modo watch.                                  |
| `npm run lint`       | ESLint.                                                |
| `npm run format`     | Prettier (`--write`).                                  |
| `npm run ci`         | `format:check` + `lint` + `test` (mesmo gate do CI).   |

Pre-commit (husky + lint-staged) roda ESLint/Prettier nos arquivos staged e a suíte de testes.

## Estrutura

```
src/render-auth.mjs        Telas de sign in / sign up (HTML)
src/render-reader.mjs      Página do leitor, sidebar de níveis e modal (HTML)
src/db.mjs                 Repositório Turso/libSQL (users, texts, stats, progress, preferences)
src/auth.mjs               bcrypt + sessão assinada + cookies
src/text.mjs               Helpers de texto e constantes de leitura
src/tips.mjs               Dicas e níveis
src/api.mjs                Rotas: auth, texts, progress, complete, stats
src/server.mjs             Adapter local (Node http)
netlify/functions/api.mjs  Adapter de produção (Netlify)
public/app.js              Interações do leitor (playback, teclado, persistência)
public/reader-engine.js    Motor das técnicas (RSVP, chunking, periférico, varredura)
src/data/texts.json        Seed da biblioteca
scripts/seed.mjs           Script de seed
tests/                     Vitest (auth, db, api, render, engine)
```

Fluxo: navegador (`public/`) → `src/api.mjs` → `src/db.mjs`; `src/render-*.mjs` monta todo o HTML.

## Dados (SQLite)

| Tabela             | Conteúdo                                                        |
| ------------------ | --------------------------------------------------------------- |
| `users`            | Contas (nome, e-mail único, hash de senha).                     |
| `texts`            | Biblioteca compartilhada (`user_id` nulo) e textos por usuário. |
| `reading_stats`    | Texto ativo, concluídos, minutos, WPM médio e pico.             |
| `reading_progress` | Posição (parágrafo/palavra) e ajustes por texto.                |
| `user_preferences` | Ajustes globais do leitor reaproveitados entre textos.          |

## Atalhos de teclado

| Tecla     | Ação                       |
| --------- | -------------------------- |
| `Espaço`  | Play / pausar              |
| `←` / `→` | Parágrafo anterior/próximo |
| `↑` / `↓` | Aumentar/diminuir WPM      |
| `Esc`     | Fechar o painel do leitor  |

## Deploy (Netlify + Turso)

```bash
turso db create speed-reading-app
turso db show speed-reading-app --url          # -> TURSO_DATABASE_URL
turso db tokens create speed-reading-app       # -> TURSO_AUTH_TOKEN

TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed

netlify link
netlify env:set TURSO_DATABASE_URL "..."
netlify env:set TURSO_AUTH_TOKEN "..."
netlify env:set SESSION_SECRET "$(openssl rand -hex 32)"
netlify deploy --prod
```

O `netlify.toml` publica `public/` e roteia `/`, `/signin`, `/signup`, `/logout` e `/api/*` para a função.
