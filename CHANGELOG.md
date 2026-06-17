# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado] — IA Traduzida (rumo à v3.0.0)

Transição de Neural Drop → **IA Traduzida** (notícias de IA para leigos,
escritas por agentes e auditadas por humano; tom anti-hype). Em desenvolvimento;
ainda não publicado em produção. Fonte de verdade: `docs/EXPORT_IA_TRADUZIDA.md`.

### Added
- Prompts dos agentes em `agents/` (classificador, tradutor-de-hype, redator-brief,
  editor-cetico, dialetos WhatsApp/LinkedIn/Instagram).
- `workflows/brief-diario.json` — Pipeline 1 em n8n puro (sem Flowise), gerado por
  `scripts/build-brief-diario.mjs`.
- **T07** — `workflows/render-imagens.json`: sub-workflow reutilizável que renderiza os
  templates em PNG 1080×1350 via Browserless. Gerado por `scripts/build-render-imagens.mjs`.
- Templates de imagem `templates/selo-hype.html` e `templates/termometro.html`.
- `docs/EXPORT_IA_TRADUZIDA.md` (fonte de verdade) e `docs/SETUP.md` (com §8 do render).

### Pendente (backlog T08–T13)
- Workflows: termometro, aula-1-minuto, newsletter-semanal.
- `scripts/auditoria.py`, página Bastidores, expansão do SETUP.
- Rebrand do frontend para IA Traduzida + corpus de voz em `agents/voz/`.

## [2.0.0] — 2026-06-17 — Neural Drop

Versão atualmente em produção em https://ai-publicidade.vercel.app.
Rebrand do blog para **Neural Drop** com infraestrutura consolidada.

### Added
- Rebrand visual Neural Drop: drops diários, identidade tech-geometric,
  hero full-viewport, layout de cards featured.
- Geração de imagens server-side (HuggingFace FLUX.1-schnell) com cache em
  Vercel Blob via route handler `/api/image`.
- `DOCS.md`: documentação técnica completa do sistema.

### Changed
- Armazenamento de posts migrado de Vercel Postgres para **Vercel Blob**.
- Texto via API Anthropic; imagens via FLUX.1-schnell.

### Security
- API de escrita (`POST/PUT/DELETE /api/admin/posts`) protegida com
  `BLOG_API_TOKEN` (Bearer, `timingSafeEqual`) ou sessão de admin.
- Removido o cron do GitHub Actions (auto-post); pipeline antigo arquivado
  em `scripts/legacy/`.

## [1.0.0] — 2026-06-10 — AI & Publicidade

Lançamento inicial do blog.

### Added
- Blog "AI & Publicidade" com identidade visual TBWA.
- Painel admin (CMS) com autenticação e CRUD de posts.
