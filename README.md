# IA Traduzida

Notícias de IA para quem **não** é de tecnologia — escritas por agentes, auditadas por um professor de IA.

> Fonte de verdade do produto: [`docs/EXPORT_IA_TRADUZIDA.md`](docs/EXPORT_IA_TRADUZIDA.md). As decisões registradas lá foram debatidas e aprovadas; não reabrir escopo.

## O que é

Uma redação autônoma que coleta, filtra, traduz e escreve notícias de IA em linguagem para leigos. Cada notícia passa por um **Editor-Cético** (agente que verifica afirmações contra as fontes e barra hype) e por **aprovação humana obrigatória** antes de publicar. A meta-narrativa é o produto: *"escrito por agentes, auditado por um professor de IA"*.

Diferenciais: selo **Hype vs. Realidade** (nota 0–10 por notícia), seção **"E eu com isso?"** (impacto na vida de quem não é de tecnologia), **Aula de 1 Minuto** (1 paper do arXiv/semana com analogia do cotidiano) e **Termômetro da IA** (índice semanal de sentimento).

## Arquitetura

| Camada | Onde roda | O quê |
|---|---|---|
| Redação (agentes) | VPS — n8n + Flowise + Browserless | RSS → classificação → redação → Editor-Cético → aprovação via Telegram → publicação |
| Site (este repo) | Vercel — Next.js | Vitrine, arquivo de posts, SEO, página Bastidores, API de publicação |

## Estrutura do repo

```
agents/      prompts dos agentes (Flowise/n8n)
workflows/   exports JSON dos workflows n8n
templates/   templates HTML/CSS → PNG (imagens das redes)
docs/        EXPORT_IA_TRADUZIDA.md (fonte de verdade) + SETUP.md
app/         site Next.js (App Router) + API
scripts/legacy/  pipeline antigo do Neural Drop (aposentado)
```

## Desenvolvimento

```bash
npm install
npm run dev   # http://localhost:3000
```

Variáveis de ambiente: ver `docs/EXPORT_IA_TRADUZIDA.md` e `.env.local` (não commitado). A escrita via API (`POST/PUT/DELETE /api/admin/posts`) exige `Authorization: Bearer $BLOG_API_TOKEN` ou sessão de admin.

## Histórico

Este repositório nasceu como **Neural Drop** (blog de IA com tom sensacionalista e publicação 100% automática). Em jun/2026 foi transformado no IA Traduzida — público, tom e pipeline novos. O código antigo está em `scripts/legacy/`.
