# Neural Drop — Documentação Técnica Completa

> Blog de IA em PT-BR com publicação automática diária. Este documento cobre toda a arquitetura, fluxo de dados, variáveis de ambiente e procedimentos de manutenção.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack de Tecnologias](#2-stack-de-tecnologias)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Como os Posts são Armazenados](#5-como-os-posts-são-armazenados)
6. [Fluxo de Publicação Automática](#6-fluxo-de-publicação-automática)
7. [Sistema de Imagens](#7-sistema-de-imagens)
8. [Autenticação Admin](#8-autenticação-admin)
9. [Rotas da API](#9-rotas-da-api)
10. [Design System](#10-design-system)
11. [Deploy e CI/CD](#11-deploy-e-cicd)
12. [Manutenção Comum](#12-manutenção-comum)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Visão Geral

**Neural Drop** é um blog de notícias sobre IA em português brasileiro. Funciona em dois modos:

- **Automático:** GitHub Actions roda todo dia às 09:00 BRT, busca notícias de feeds RSS, avalia relevância com Claude, gera artigos com tom sensacionalista e publica via API.
- **Manual:** Painel admin em `/admin` permite criar, editar e deletar posts pelo browser.

**URL de produção:** configurada em `BLOG_URL` (secret do GitHub). Hospedado no Vercel.

---

## 2. Stack de Tecnologias

| Camada | Tecnologia | Versão | Para quê |
|--------|-----------|--------|----------|
| Framework | Next.js (App Router) | 16.2.9 | Roteamento, SSR, API routes |
| Runtime | React | 19.2.4 | UI components |
| Estilização | Tailwind CSS | v4 | Classes utilitárias |
| Conteúdo | next-mdx-remote | 6.0.0 | Renderiza MDX em runtime |
| Storage | @vercel/blob | 2.4.0 | Banco de dados de posts (produção) |
| IA — Texto | Anthropic Claude | SDK 0.104.1 | Gerar artigos e pontuar notícias |
| IA — Imagem | HuggingFace FLUX.1-schnell | — | Gerar imagens para os artigos |
| Fontes | Bebas Neue + Geist | — | Display (títulos) + sans (corpo) |
| Automação | GitHub Actions | — | Cron diário de publicação |
| Scripts | tsx | 4.22.4 | Executar TypeScript direto no Node |

### Dependências que NÃO estão em uso ativo
- `gray-matter` — instalado mas não usado (metadata fica no manifest.json, não em frontmatter)
- `@mdx-js/loader`, `@mdx-js/react`, `@next/mdx` — instalados, mas MDX é renderizado por `next-mdx-remote`

---

## 3. Estrutura de Arquivos

```
ai-publicidade/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raiz: fontes, metadata, Header
│   ├── page.tsx                  # Homepage: masthead + 3 cards featured + arquivo
│   ├── globals.css               # Tailwind v4 + animações CSS custom
│   │
│   ├── posts/[slug]/
│   │   └── page.tsx              # Página individual de artigo (renderiza MDX)
│   │
│   ├── admin/                    # Painel CMS (protegido por cookie)
│   │   ├── layout.tsx            # Shell admin com sidebar
│   │   ├── page.tsx              # Lista de posts com Edit/Delete
│   │   ├── login/page.tsx        # Formulário de login
│   │   ├── posts/new/page.tsx    # Criar novo post
│   │   ├── posts/[slug]/edit/    # Editar post existente
│   │   ├── PostForm.tsx          # Formulário reutilizável (Client Component)
│   │   ├── DeleteButton.tsx      # Botão de deletar com confirm (Client Component)
│   │   └── LogoutButton.tsx      # Botão de logout (Client Component)
│   │
│   └── api/
│       ├── image/route.ts        # Proxy de imagem: HuggingFace → Blob cache
│       └── admin/
│           ├── auth/login/       # POST: login, emite cookie
│           ├── auth/logout/      # POST: limpa cookie
│           └── posts/
│               ├── route.ts      # GET: listar | POST: criar
│               └── [slug]/route.ts # GET: detalhes | PUT: editar | DELETE: deletar
│
├── components/
│   ├── Header.tsx                # Navbar sticky com logo e ThemeToggle
│   ├── ArticleCard.tsx           # Card de post para o grid "arquivo"
│   └── ThemeToggle.tsx           # Botão light/dark (salva no localStorage)
│
├── lib/
│   ├── posts.ts                  # Abstração de leitura de posts (Blob ou arquivo)
│   ├── blob-store.ts             # Todas as operações no @vercel/blob
│   └── auth.ts                   # signToken, verifyToken, hashPassword, cookieOptions
│
├── proxy.ts                      # Middleware Next.js: protege /admin/* com HMAC
│
├── content/posts/                # Storage local (dev / fallback)
│   ├── manifest.json             # Array JSON com metadata de todos os posts
│   ├── *.mdx                     # Conteúdo MDX de cada post
│
├── scripts/                      # Rodam via GitHub Actions (npx tsx)
│   ├── auto-post.ts              # Orquestrador principal do cron
│   ├── rss.ts                    # Busca e parseia feeds RSS
│   ├── generate.ts               # Pontua notícias e gera artigos via Claude
│   └── publish.ts                # Faz login e publica via API do blog
│
└── .github/workflows/
    └── auto-post.yml             # Cron diário 12:00 UTC (09:00 BRT)
```

---

## 4. Variáveis de Ambiente

### `.env.local` (desenvolvimento local — nunca commitar)

```env
# Autenticação do admin
ADMIN_EMAIL=thaleslevic@gmail.com
ADMIN_PASSWORD_HASH=3701218693f9b72910324ae741a616d60a42bf0aad631e5f6b342a0ad83c13b3
# ^ SHA-256 de Thca479835# — NUNCA guardar a senha em texto plano

COOKIE_SECRET=<string aleatória de 32+ caracteres hex>
# ^ Assina os tokens de sessão. Se mudar, todos os logins existentes invalidam.

# Storage Vercel Blob (produção)
BLOB_READ_WRITE_TOKEN=<token do painel Vercel → Storage → seu blob>

# APIs externas
ANTHROPIC_API_KEY=sk-ant-api03-...
HUGGINGFACE_TOKEN=hf_...

# URL do próprio site (usada pelos scripts)
BLOG_URL=https://neuraldrop.vercel.app

# Credenciais do admin para os scripts (GitHub Actions)
BLOG_ADMIN_EMAIL=thaleslevic@gmail.com
BLOG_ADMIN_PASSWORD=<senha em texto plano, só para o script de automação>
```

### Secrets do GitHub Actions (Settings → Secrets → Actions)

Todos os valores acima devem existir como secrets no repositório:

| Secret | Onde usar |
|--------|-----------|
| `ANTHROPIC_API_KEY` | Gerar artigos (Claude) |
| `HUGGINGFACE_TOKEN` | Gerar imagens (FLUX.1-schnell) |
| `BLOB_READ_WRITE_TOKEN` | Ler slugs publicados via `/api/admin/posts` |
| `BLOG_URL` | URL base do site em produção |
| `BLOG_ADMIN_EMAIL` | Login automático para publicar |
| `BLOG_ADMIN_PASSWORD` | Login automático para publicar |

### Variáveis no painel Vercel (Settings → Environment Variables)

As mesmas acima (exceto `BLOG_ADMIN_PASSWORD` e `BLOG_ADMIN_EMAIL` se quiser) precisam estar no Vercel para o servidor Next.js funcionar em produção. O `BLOB_READ_WRITE_TOKEN` é o mais crítico — sem ele o site cai para modo arquivo local e não encontra posts.

---

## 5. Como os Posts são Armazenados

O sistema tem **dois modos**, determinado pela presença de `BLOB_READ_WRITE_TOKEN`:

### Modo Produção (Vercel Blob)

```
@vercel/blob
└── ai-publicidade/
    ├── posts-db.json          ← todos os posts + conteúdo MDX em um único JSON
    └── images/
        ├── 123456-cover-1200x630.jpg
        ├── 123457-mid-1200x630.jpg
        └── ...
```

**`posts-db.json`** é um array de objetos com esta forma:
```json
[
  {
    "slug": "nome-do-artigo",
    "title": "Título do Artigo",
    "excerpt": "Resumo em 1-2 frases.",
    "date": "2026-06-12",
    "readTime": "5 min",
    "category": "Modelos",
    "content": "# Conteúdo MDX completo aqui..."
  }
]
```

O arquivo é sobrescrito inteiro a cada criação/edição/deleção (`allowOverwrite: true`). Leituras sempre passam `useCache: false` para evitar stale data.

### Modo Local / Dev (arquivo)

```
content/posts/
├── manifest.json              ← metadata apenas (sem content)
├── meu-artigo.mdx             ← conteúdo MDX do artigo
└── outro-artigo.mdx
```

A função `useBlob()` em `lib/posts.ts` e nas API routes decide qual modo usar:
```typescript
function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}
```

**Seed automático:** Se o Blob estiver vazio na primeira requisição, `blob-store.ts` lê os arquivos locais e migra automaticamente para o Blob.

---

## 6. Fluxo de Publicação Automática

O GitHub Actions dispara todo dia às 12:00 UTC (09:00 BRT) e executa `npx tsx scripts/auto-post.ts`.

### Passo a passo

```
1. scripts/rss.ts — fetchAllFeeds()
   ↓ busca 6 feeds (TechCrunch, VentureBeat, TNW, SiliconAngle, Adweek, VB feed)
   ↓ parseia RSS/Atom, filtra artigos dos últimos 5 dias
   ↓ deduplica por URL

2. auto-post.ts — loadPublishedSlugs()
   ↓ GET /api/admin/posts (sem autenticação — rota pública de leitura)
   ↓ coleta slugs já publicados para deduplicar

3. scripts/generate.ts — scoreArticles()
   ↓ envia até 30 artigos para Claude Haiku
   ↓ recebe scores 0-10 sobre relevância para o público BR
   ↓ filtra score >= 7, ordena por score desc

4. scripts/generate.ts — generatePost() [para cada artigo top]
   ↓ calcula seed determinístico da URL (hash djb2)
   ↓ monta 3 URLs de imagem: /api/image?seed=X&type=cover|mid|end
   ↓ envia para Claude Sonnet com system prompt "Neural Drop editor-chefe"
   ↓ recebe: ===METADATA=== (JSON) + ===CONTENT=== (MDX)
   ↓ parseia e retorna GeneratedPost

5. scripts/publish.ts — publishPost()
   ↓ POST /api/admin/auth/login → obtém cookie de sessão
   ↓ POST /api/admin/posts com cookie → cria post no Blob
   ↓ resposta 201 = sucesso | 409 = slug duplicado (pula)

6. Repetir até MAX_PER_RUN = 3 posts publicados
```

### Modelos de IA usados

| Etapa | Modelo | Motivo |
|-------|--------|--------|
| Pontuar relevância | `claude-haiku-4-5-20251001` | Rápido, barato — só classifica |
| Escrever artigo | `claude-sonnet-4-6` | Qualidade editorial necessária |
| Fallback (sem Anthropic key) | Pollinations API (`openai`, `openai-fast`) | Gratuito, sem key |

### Feeds RSS monitorados

1. `techcrunch.com/tag/artificial-intelligence/feed/`
2. `venturebeat.com/category/ai/feed/`
3. `thenextweb.com/neural/feed/`
4. `siliconangle.com/feed/`
5. `adweek.com/feed/`
6. `feeds.feedburner.com/venturebeat/SZYF`

Para adicionar/remover feeds, edite o array `FEEDS` em `scripts/rss.ts`.

---

## 7. Sistema de Imagens

Cada artigo tem 3 imagens: `cover` (topo), `mid` (seção do meio), `end` (O que muda agora).

### Como funciona

```
URL no MDX:  /api/image?seed=123456&type=cover&w=1200&h=630
                           ↓
app/api/image/route.ts  →  1. Verifica cache no Blob: ai-publicidade/images/123456-cover-1200x630.jpg
                           ↓ cache HIT → serve direto (Cache-Control: 1 ano)
                           ↓ cache MISS →
                           2. Chama HuggingFace FLUX.1-schnell
                              POST https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell
                              { inputs: prompt, parameters: { width, height, seed, num_inference_steps: 4 } }
                           3. Salva no Blob (access: private, allowOverwrite: true)
                           4. Serve a imagem com Cache-Control: 1 ano
```

### Seed determinístico

O seed é derivado da URL do artigo de origem via hash djb2 em `scripts/generate.ts`:

```typescript
function seedFrom(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % 1_000_000
}
// cover = seed, mid = seed+1, end = seed+2
```

Mesma notícia sempre gera as mesmas imagens — regenerar não duplica no Blob.

### Prompts de imagem

| Tipo | Prompt base |
|------|-------------|
| `cover` | technological geometry hexagonal grid circuit board neural network |
| `mid` | isometric data visualization geometric mesh AI dashboard circuit nodes yellow accent dark background |
| `end` | abstract geometric diamond pattern digital technology dark minimal clean neon yellow accent lines |

Estilo comum aplicado em todos: `dark background #0A0A0A, neon yellow accent #FFE600, no text, no watermark`

### Se a imagem não aparecer

- Verificar se `HUGGINGFACE_TOKEN` está configurado
- HuggingFace pode demorar 5-15s na primeira geração
- Endpoint correto: `router.huggingface.co/hf-inference/models/...` (o antigo `api-inference.huggingface.co` está depreciado)

---

## 8. Autenticação Admin

### Fluxo

```
Browser → POST /api/admin/auth/login
         { email, password }
              ↓
         hash(password) == ADMIN_PASSWORD_HASH? → sim
              ↓
         signToken(email) = base64url( email | timestamp | HMAC(email+ts, COOKIE_SECRET) )
              ↓
         Set-Cookie: admin_session=<token>; HttpOnly; SameSite=lax; Max-Age=28800
              ↓
         Todas requisições /admin/* → proxy.ts verifica HMAC + validade (8h)
              ↓
         Token inválido/expirado → redirect /admin/login
```

### Onde fica cada peça

| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/auth.ts` | `hashPassword`, `signToken`, `verifyToken`, `cookieOptions` |
| `proxy.ts` | Middleware Next.js — verifica cookie em TODA rota `/admin/*` |
| `app/api/admin/auth/login/route.ts` | Valida credenciais, emite cookie |
| `app/api/admin/auth/logout/route.ts` | Limpa cookie |

**Proteção de rota importante:** O middleware (`proxy.ts`) protege apenas `/admin/:path*` — as rotas `/api/admin/*` **não são protegidas pelo middleware**. A API de posts (`/api/admin/posts`) aceita GET sem autenticação (usado pelo script de automação para listar slugs). POST/PUT/DELETE também não têm guard de cookie na API — dependem do middleware para as páginas. Se precisar proteger as rotas de API, adicione verificação de cookie nas próprias route handlers.

### Alterar senha

1. Calcule o SHA-256 da nova senha:
   ```bash
   echo -n "NovaSenha123" | sha256sum
   ```
2. Atualize `ADMIN_PASSWORD_HASH` no `.env.local` e no Vercel

---

## 9. Rotas da API

### Públicas

| Método | Rota | O que faz |
|--------|------|-----------|
| `GET` | `/api/admin/posts` | Lista todos os posts (sem content) |
| `GET` | `/api/image?seed=X&type=T&w=W&h=H` | Serve imagem (gera se não tiver cache) |

### Admin (requerem cookie `admin_session`)

| Método | Rota | O que faz |
|--------|------|-----------|
| `POST` | `/api/admin/auth/login` | Login → emite cookie |
| `POST` | `/api/admin/auth/logout` | Logout → limpa cookie |
| `POST` | `/api/admin/posts` | Cria post. Body: `{ slug, title, excerpt, date, readTime, category, content }` |
| `GET` | `/api/admin/posts/[slug]` | Retorna post completo com content |
| `PUT` | `/api/admin/posts/[slug]` | Atualiza campos do post |
| `DELETE` | `/api/admin/posts/[slug]` | Remove post |

### Formato de resposta

**POST /api/admin/posts** — sucesso:
```json
HTTP 201
{ "slug": "meu-artigo", "title": "...", ... }
```

**POST /api/admin/posts** — slug duplicado:
```json
HTTP 409
{ "error": "Slug já existe" }
```

---

## 10. Design System

### Paleta de cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-y` | `#FFE600` | Amarelo — accent principal, hovers, destaques |
| `--color-ink` | `#0A0A0A` | Preto profundo — backgrounds, textos escuros |
| `white` | `#FFFFFF` | Background modo claro |

No Tailwind v4, usar como `bg-y`, `text-y`, `border-y`, `bg-ink`, `text-ink`.

Transparência com `/`: `text-y/55` = amarelo a 55% de opacidade.

### Tipografia

| Variável | Fonte | Uso |
|----------|-------|-----|
| `--font-display` / `font-display` | Bebas Neue | Títulos, números grandes, labels uppercase |
| `--font-sans` / `font-sans` | Geist | Corpo de texto, UI |
| `font-mono` | Geist Mono | Timestamps, codes, labels técnicos |

### Animações CSS custom (globals.css)

| Classe | Efeito | Uso |
|--------|--------|-----|
| `.geo-grid` | Grid de linhas amarelas sutis | Background do masthead e hero de artigo |
| `.scanline` | Linha de scan em imagens | Imagens com efeito tech |
| `.stripe-hover` | Listras diagonais no hover | Cards de artigo |
| `.blink` | Cursor piscando | Cursor `▮` ao lado de labels |
| `.ticker-track` | Ticker rolando (30s loop) | Barra de modelos de IA na homepage |
| `.glitch-text` | Glitch ocasional (a cada 9s) | Textos de destaque |
| `.pulse-dot` | Ponto pulsando (2.5s) | Indicador de status ao vivo |

### SVG diamond decoration

Padrão recorrente: retângulos rotacionados 45° concêntricos em `#FFE600` com opacidade baixa. Aparece no masthead (top right) e hero de artigo (bottom right).

### Tema claro/escuro

Controlado por `data-theme` no `<html>`. O `ThemeToggle.tsx` alterna e salva no `localStorage`. As classes Tailwind usam o `@custom-variant dark` definido em globals.css:
```css
@custom-variant dark (&:is([data-theme=dark] *), &[data-theme=dark]);
```
Então use `dark:bg-ink`, `dark:text-white/50` etc.

---

## 11. Deploy e CI/CD

### Vercel (deploy do site)

- Branch `main` → deploy automático
- Build command: `next build`
- Não há migrations ou setup pós-deploy — o Blob persiste entre deploys

### GitHub Actions (publicação de conteúdo)

Arquivo: `.github/workflows/auto-post.yml`

```yaml
schedule:
  - cron: '0 12 * * *'   # 12:00 UTC = 09:00 BRT, todo dia
workflow_dispatch:         # pode rodar manualmente pelo GitHub UI
```

Para alterar o horário: edite o cron. Formato: `MINUTO HORA DIA MÊS DIA_DA_SEMANA`.

Para rodar manualmente: GitHub → Actions → Auto Post → Run workflow.

### Tokens que precisam ser rotacionados periodicamente

| Token | Onde renovar |
|-------|-------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `HUGGINGFACE_TOKEN` | huggingface.co → Settings → Access Tokens |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → seu blob → Tokens |
| `COOKIE_SECRET` | Gere novo hex: `openssl rand -hex 32` |

Após renovar: atualizar no `.env.local` (dev) + Vercel Environment Variables + GitHub Secrets.

---

## 12. Manutenção Comum

### Adicionar um post manualmente

1. Acesse `/admin` → login
2. "Novo Post" → preencha os campos
3. O content usa MDX — markdown padrão + componentes React se necessário

### Editar um post existente

1. `/admin` → clique "Editar" no post
2. Edite o MDX diretamente no textarea
3. Salvar sobrescreve no Blob

### Deletar um post

1. `/admin` → "Deletar" → confirmar
2. Remove do `posts-db.json` no Blob

### Adicionar novo feed RSS

Edite o array em `scripts/rss.ts`:
```typescript
const FEEDS = [
  // feeds existentes...
  'https://novo-feed.com/rss',
]
```

### Mudar quantidade de posts por rodada

Em `scripts/auto-post.ts`:
```typescript
const MAX_PER_RUN = 3  // altere aqui
```

### Mudar o score mínimo de relevância

Em `scripts/auto-post.ts`:
```typescript
const MIN_SCORE = 7  // 0-10, sobe para publicar menos, desce para publicar mais
```

### Regenerar imagens de um artigo

As imagens são cacheadas no Blob. Para forçar regeneração:
1. Delete o arquivo no Vercel Dashboard → Storage → `ai-publicidade/images/`
2. Próximo acesso ao artigo regenera automaticamente

### Ver logs do GitHub Actions

GitHub → Actions → Auto Post → clique no run mais recente → expandir step "Gerar e publicar posts"

### Rodar o script de automação localmente para testar

```bash
cd ai-publicidade
# Configure .env.local com todas as variáveis
npx tsx scripts/auto-post.ts
```

---

## 13. Troubleshooting

### Site não mostra posts

**Causa provável:** `BLOB_READ_WRITE_TOKEN` inválido ou não configurado no Vercel.

**Verificar:** Vercel Dashboard → Settings → Environment Variables → `BLOB_READ_WRITE_TOKEN`.

Se o token estiver correto mas o problema persistir: o Blob pode estar com o arquivo `posts-db.json` corrompido. Verifique o Storage no Vercel — delete o arquivo e crie posts novamente pelo admin.

### GitHub Actions falha no login

**Causa provável:** `BLOG_URL`, `BLOG_ADMIN_EMAIL` ou `BLOG_ADMIN_PASSWORD` errados nos secrets.

**Verificar:** Rodar manualmente pelo GitHub Actions e expandir os logs. O erro de login aparece como `Login falhou: 401`.

### Imagens não aparecem nos artigos

1. Verificar se `HUGGINGFACE_TOKEN` está no Vercel
2. HuggingFace às vezes demora ou retorna erro 503 — normal, tentar novamente
3. Se persistir: verificar se o endpoint está correto: `router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell`

### Posts sendo duplicados (slug ja existe)

O script já trata isso — pula com 409. Mas se o mesmo artigo está sendo republicado todo dia, o slug gerado pelo Claude pode estar variando. Solução: o `loadPublishedSlugs()` usa GET na API pública — verificar se está retornando os slugs corretos.

### Admin redireciona para login mas credenciais estão certas

**Causa:** `COOKIE_SECRET` mudou ou não está definido, invalidando tokens existentes.

**Solução:** Definir/verificar `COOKIE_SECRET` no Vercel. Depois de logar novamente funciona.

### `next build` falha com erro de tipos

O `proxy.ts` é importado como middleware. Se o Next.js reclamar de `middleware.ts` não encontrado, verificar se `proxy.ts` exporta `config` corretamente:
```typescript
export const config = { matcher: ['/admin/:path*'] }
```
O Next.js exige que o middleware esteja em `middleware.ts` na raiz. Se necessário, renomear de `proxy.ts` para `middleware.ts`.

---

## Segurança — Regras Permanentes

- **Nunca commitar `.env.local`** — está no `.gitignore`
- **Senha nunca em texto plano** no código — apenas o hash SHA-256
- **HUGGINGFACE_TOKEN e BLOB_READ_WRITE_TOKEN** são server-side only — nunca expor em URLs públicas ou no client
- **Tokens compartilhados em chat devem ser rotacionados** — se uma chave aparecer em conversa, trocar imediatamente
- O hash da senha admin: `3701218693f9b72910324ae741a616d60a42bf0aad631e5f6b342a0ad83c13b3` (SHA-256)
