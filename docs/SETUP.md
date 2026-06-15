# SETUP — IA Traduzida na VPS (n8n)

Guia de instalação/configuração dos workflows. Arquitetura: **n8n puro** (sem Flowise — ver decisão no `CLAUDE.md`). Cada agente é um nó HTTP Request chamando a API da Anthropic.

> Este documento cobre o que o **Brief Diário** (`workflows/brief-diario.json`) precisa. Os demais pipelines (termômetro, aula de 1 minuto, newsletter, render de imagens) acrescentam credenciais próprias e serão documentados quando construídos.

---

## 1. Importar o workflow

No n8n: **Workflows → ⋯ → Import from File** → selecione `workflows/brief-diario.json`.

Ele vem com `active: false` — só ative depois de configurar tudo abaixo e rodar um teste manual.

> O JSON é **gerado** por `scripts/build-brief-diario.mjs` a partir dos prompts em `agents/*.md`. Não edite o JSON na mão: edite o prompt ou o builder e rode `node scripts/build-brief-diario.mjs` para regenerar.

---

## 2. Credenciais (3)

Crie em **Credentials → New** e depois associe a cada nó (o n8n marca os nós que precisam de credencial ao importar).

### 2.1 Anthropic API key — tipo **Header Auth**
- **Name:** `Anthropic API key (x-api-key)`
- **Header Name:** `x-api-key`
- **Header Value:** sua chave da Anthropic (`sk-ant-...`)
- Usada por todos os 5 nós `LLM · ...`. (O header `anthropic-version` já vai fixo no nó.)
- Pegue a chave em https://console.anthropic.com/ → API Keys. Modelo padrão: `claude-haiku-4-5` (barato). Para trocar o modelo, edite `MODEL` no builder e regenere.

### 2.2 Token do site — tipo **Header Auth**
- **Name:** `IA Traduzida site (Authorization: Bearer)`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer SEU_BLOG_API_TOKEN`  ← o `BLOG_API_TOKEN` que está no `.env.local`
- Usada pelo nó `Publicar no site`.
- ⚠️ **Esse mesmo token precisa estar nas Environment Variables da Vercel** (`BLOG_API_TOKEN`), senão a publicação volta 401.

### 2.3 Bot do Telegram — tipo **Telegram API**
- **Name:** `IA Traduzida Bot`
- **Access Token:** token gerado pelo **@BotFather** (`/newbot`)
- Usada pelos nós `Aprovação no Telegram`, `Confirma publicado`, `Avisa descartado`.

---

## 3. Dois ajustes manuais no canvas

1. **Chat ID** — troque os **3** `REPLACE_CHAT_ID` (nós de Telegram) pelo seu chat ID.
   Pegue-o mandando qualquer mensagem para **@userinfobot** no Telegram.
2. **URL do site** — no nó **`Montar pacote`**, edite a linha `const SITE = 'https://SEU-SITE.vercel.app';` com o domínio real do deploy.

---

## 4. Feeds (opcional)

A lista de feeds RSS está no nó **`Feeds (editar aqui)`** — edite à vontade (15–20 feeds recomendados, mix BR + internacional). O nó `Ler RSS` lê todos e o `Dedup + recentes` remove repetidos e descarta o que tiver mais de 36h.

---

## 5. Corpus de voz (RAG) — pendente

O redator usa a sua voz. Hoje `agents/voz/` está vazio, então ele roda com um **fallback de tom** (funciona, mas genérico).

Para ativar a voz de verdade:
1. Coloque 10–15 posts seus do LinkedIn em `agents/voz/post-01.md`, `post-02.md`, …
2. Rode `node scripts/build-brief-diario.mjs` — o builder concatena os posts e os injeta direto no prompt do redator (sem vector store; o corpus cabe no contexto).
3. Reimporte o `brief-diario.json` no n8n.

---

## 6. Teste antes de ativar

1. Configure credenciais + ajustes manuais.
2. Abra o workflow e clique **Execute Workflow** (roda na hora, ignora o cron).
3. Acompanhe nó a nó. Pontos de atenção comuns:
   - `Buscar fonte` pode falhar em sites que bloqueiam bots → o nó está como `continue on error`; a notícia segue com o resumo do RSS e o Editor-Cético sinaliza falta de fonte.
   - Se um nó LLM retornar texto fora do JSON, o `pj()` dos Code nodes ainda extrai o primeiro `{...}`; se mesmo assim falhar, baixe o `max_tokens` ou reforce "responda só com JSON" no prompt.
4. Você deve receber o **pacote no Telegram** com os botões Aprovar/Recusar. Aprovar publica em `/api/admin/posts`; o post aparece no site.
5. Rode em modo privado por ~3 dias (calibragem do Editor-Cético, Fase 1 do export) antes de ligar o cron (`active: true`).

---

## 7. Requisito de versão

O nó `Aprovação no Telegram` usa **Send and Wait for Response** (n8n ≥ 1.15). Em n8n mais antigo, substitua por **Telegram → Send Message** + nó **Wait (On webhook call)** e ligue o botão ao webhook de retomada.
