@AGENTS.md

# IA Traduzida

Este repositório era o blog "Neural Drop" e está sendo transformado no **IA Traduzida** — notícias de IA para leigos, escritas por agentes e auditadas por humano.

**Fonte de verdade do produto: `docs/EXPORT_IA_TRADUZIDA.md`** (export da sessão de estratégia com o conselho, jun/2026). As decisões registradas lá são fechadas — não reabrir discussões de escopo. Em bloqueio técnico, propor alternativa que respeite as restrições da seção 1 do export.

## Divisão de responsabilidades
- **Este repo (Next.js/Vercel):** site-vitrine, arquivo de posts, SEO, página Bastidores, API de publicação (`/api/admin/posts`), prompts dos agentes (`agents/`), templates de imagem (`templates/`), exports de workflows n8n (`workflows/`).
- **VPS do Thales (n8n + Browserless):** orquestração da redação — RSS, agentes (chamadas LLM direto do n8n), Editor-Cético, aprovação humana via Telegram, publicação via API deste site.

## Decisão técnica: sem Flowise (2026-06-14)
O export pedia Flowise só pelo "RAG de voz". Com 10–15 posts (~20–30k tokens) não há motivo para vector store — o corpus inteiro cabe no contexto do Haiku/Gemini Flash. Decisão: **n8n puro**, os agentes são nós LLM (HTTP Request → API Anthropic) com os prompts dos `agents/*.md` embutidos. O `{{contexto_rag_de_voz}}` passa a ser todos os posts de `agents/voz/` concatenados (ou a string de fallback se vazio). Menos um serviço na VPS, menos um ponto de falha. Se o corpus crescer para centenas de docs, usar os nós de Vector Store nativos do n8n — não voltar ao Flowise.

## Regras permanentes
- Tom **anti-hype**, linguagem para **leigos** (zero jargão sem tradução). O tom sensacionalista do Neural Drop foi aposentado — ver palavras proibidas em `agents/editor-cetico.md`.
- **Nada é publicado sem aprovação humana.**
- Custo quase zero: Claude Haiku / Gemini Flash, ferramentas gratuitas ou self-hosted.
- `scripts/legacy/` contém o pipeline antigo do Neural Drop (aposentado, manter só como referência).
- Escrita via API exige `Authorization: Bearer $BLOG_API_TOKEN` (ou cookie de sessão do admin).
