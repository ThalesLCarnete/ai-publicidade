#!/usr/bin/env node
/**
 * Builder do workflow n8n "Brief Diário" (Pipeline 1).
 *
 * Por que um builder em vez de editar o JSON na mão:
 *  - os prompts dos agentes ficam com fonte única nos agents/*.md (este script lê de lá);
 *  - o JSON do n8n sai sempre válido (escapes de \n, aspas etc. são responsabilidade do JSON.stringify);
 *  - regenerável: mudou um prompt ou o corpus de voz? rode `node scripts/build-brief-diario.mjs`.
 *
 * Arquitetura (decisão de 2026-06-14): SEM Flowise. Cada agente é um nó HTTP Request
 * chamando a API da Anthropic (Haiku). O RAG de voz vira o corpus inteiro de agents/voz/
 * concatenado e injetado no prompt do redator (cabe no contexto; 15 posts não precisam de vector store).
 *
 * Saída: workflows/brief-diario.json (importável no n8n).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const AGENTS = path.join(ROOT, 'agents')

const MODEL = 'claude-haiku-4-5' // troque por gemini/sonnet aqui se quiser; ver CLAUDE.md

// URL pública do site (entra no nó "Montar pacote" como base do /api/admin/posts)
// e chat_id do Telegram para onde vai o pacote de aprovação e os avisos.
// Defaults mantêm os placeholders pra quem importa sem env vars (e edita no canvas).
// Ex.: IA_TRADUZIDA_SITE_URL=https://meu-site.com IA_TRADUZIDA_CHAT_ID=123456789 node scripts/build-brief-diario.mjs
const SITE_URL = process.env.IA_TRADUZIDA_SITE_URL || 'https://SEU-SITE.vercel.app'
const CHAT_ID = process.env.IA_TRADUZIDA_CHAT_ID || 'REPLACE_CHAT_ID'

// ---------------------------------------------------------------------------
// 1. Extrair os system prompts dos agents/*.md (primeiro bloco ``` após "## System prompt")
// ---------------------------------------------------------------------------
function systemPrompt(file) {
  const md = fs.readFileSync(path.join(AGENTS, file), 'utf8')
  const afterHeader = md.split('## System prompt')[1]
  if (!afterHeader) throw new Error(`"## System prompt" não encontrado em ${file}`)
  const m = afterHeader.match(/```[a-z]*\n([\s\S]*?)\n```/)
  if (!m) throw new Error(`bloco de prompt (\`\`\`) não encontrado em ${file}`)
  return m[1].trim()
}

const P_CLASSIFICADOR = systemPrompt('classificador.md')
const P_CURADOR = systemPrompt('curador-utilidade.md')
// Debate em UMA chamada: o orquestrador (debate.md) recebe as duas personas injetadas.
// Fonte única de cada persona nos arquivos visionario.md / cetico-debate.md.
const P_DEBATE = systemPrompt('debate.md')
  .replace('{{persona_visionario}}', systemPrompt('visionario.md'))
  .replace('{{persona_cetico}}', systemPrompt('cetico-debate.md'))
let P_REDATOR = systemPrompt('redator-brief.md')
const P_DIALETO_WA = systemPrompt('dialeto-whatsapp.md')
const P_DIALETO_BLOG = systemPrompt('dialeto-blog.md')
const P_EDITOR = systemPrompt('editor-cetico.md')

// Injetar o corpus de voz (RAG de voz vira contexto direto). Sem posts → fallback.
function vozCorpus() {
  const dir = path.join(AGENTS, 'voz')
  if (!fs.existsSync(dir)) return ''
  const files = fs.readdirSync(dir).filter((f) => /^post-.*\.md$/i.test(f)).sort()
  return files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('\n\n---\n\n')
}
const VOZ = vozCorpus()
P_REDATOR = P_REDATOR.replace(
  '{{contexto_rag_de_voz}}',
  VOZ || '(sem exemplos disponíveis — use o tom descrito nas regras)'
)
if (!VOZ) console.warn('[aviso] agents/voz/ vazio — redator usará fallback de tom. Adicione post-XX.md e regenere.')

// ---------------------------------------------------------------------------
// 2. Helpers de nós
// ---------------------------------------------------------------------------
const nodes = []
const connections = {}
let X = 0
const COL = 240
function pos(row = 0) {
  const p = [X, 300 + row * 180]
  X += COL
  return p
}
function add(node) {
  nodes.push(node)
  return node.name
}
function connect(from, to, outIndex = 0, inIndex = 0) {
  connections[from] = connections[from] || { main: [] }
  while (connections[from].main.length <= outIndex) connections[from].main.push([])
  connections[from].main[outIndex].push({ node: to, type: 'main', index: inIndex })
}

function code(name, jsCode, { row = 0, mode = 'runOnceForAllItems' } = {}) {
  return add({
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: pos(row),
    parameters: { mode, jsCode },
  })
}

// nó LLM Anthropic: espera $json.system e $json.userMessage no item de entrada
function llm(name, maxTokens, { row = 0 } = {}) {
  const body =
    `={{ JSON.stringify({ model: "${MODEL}", max_tokens: ${maxTokens}, ` +
    `system: $json.system, messages: [ { role: "user", content: $json.userMessage } ] }) }}`
  return add({
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: pos(row),
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: body,
      options: { timeout: 120000 },
    },
    credentials: { httpHeaderAuth: { id: 'ANTHROPIC_KEY', name: 'Anthropic API key (x-api-key)' } },
  })
}

// helper de parse JSON reaproveitado nos Code nodes (model às vezes embrulha em ```)
const PJ = `function pj(t){const a=String(t).indexOf('{');const b=String(t).lastIndexOf('}');return JSON.parse(String(t).slice(a,b+1));}`

// ---------------------------------------------------------------------------
// 3. Os nós, em ordem
// ---------------------------------------------------------------------------

// 3.1 Disparo
const nTrigger = add({
  name: 'Disparo 5h (seg–sex)',
  type: 'n8n-nodes-base.scheduleTrigger',
  typeVersion: 1.2,
  position: pos(),
  parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 5 * * 1-5' }] } },
})

// 3.2 Lista de feeds (EDITE AQUI)
const nFeeds = code(
  'Feeds (editar aqui)',
  `// 15-20 feeds de IA. Edite/adicione à vontade. Um item por feed.
const feeds = [
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
  'http://feeds.arstechnica.com/arstechnica/index',
  'https://blog.google/technology/ai/rss/',
  'https://venturebeat.com/category/ai/feed/',
  'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  'https://openai.com/blog/rss.xml',
  'https://tecnoblog.net/feed/',
  'https://olhardigital.com.br/feed/',
  'https://canaltech.com.br/rss/',
];
return feeds.map((feedUrl) => ({ json: { feedUrl } }));`
)

// 3.3 Ler RSS (roda 1x por feed, concatena tudo)
const nRss = add({
  name: 'Ler RSS',
  type: 'n8n-nodes-base.rssFeedRead',
  typeVersion: 1.1,
  position: pos(),
  parameters: { url: '={{ $json.feedUrl }}', options: {} },
  onError: 'continueRegularOutput',
})

// 3.4 Dedup + recentes
const nDedup = code(
  'Dedup + recentes',
  `// dedup por título normalizado + descarta itens com mais de 36h
const items = $input.all();
const seen = new Set();
const out = [];
const cutoff = Date.now() - 36 * 3600 * 1000;
for (const it of items) {
  const j = it.json || {};
  const title = String(j.title || '').trim();
  if (!title) continue;
  const norm = title.toLowerCase().replace(/[^\\p{L}\\p{N} ]/gu, '').replace(/\\s+/g, ' ').trim();
  if (seen.has(norm)) continue;
  const d = j.isoDate || j.pubDate || j.date || '';
  const t = d ? Date.parse(d) : NaN;
  if (!isNaN(t) && t < cutoff) continue;
  let host = '';
  try { host = j.link ? new URL(j.link).hostname.replace(/^www\\./, '') : ''; } catch (e) {}
  seen.add(norm);
  out.push({ json: {
    title,
    link: j.link || j.guid || '',
    source: j.creator || j.author || host,
    resumo: String(j.contentSnippet || j.summary || j.content || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 300),
    isoDate: d,
  }});
}
return out.slice(0, 40);`
)

// 3.5 Juntar manchetes em 1 item
const nAggManchetes = add({
  name: 'Juntar manchetes',
  type: 'n8n-nodes-base.aggregate',
  typeVersion: 1,
  position: pos(),
  parameters: { aggregate: 'aggregateAllItemData', destinationFieldName: 'manchetes' },
})

// 3.6 Montar input do classificador
const nInClass = code(
  'Montar input · classificador',
  `const manchetes = $input.first().json.manchetes || [];
const linhas = manchetes.map((m, i) => '[' + i + '] ' + m.title + ' — ' + (m.source || '') + '\\n    ' + (m.resumo || '')).join('\\n\\n');
const userMessage = 'MANCHETES DE HOJE (' + manchetes.length + ' candidatas):\\n\\n' + linhas;
const system = ${JSON.stringify(P_CLASSIFICADOR)};
return [{ json: { system, userMessage, manchetes } }];`
)

// 3.7 LLM classificador
const nLlmClass = llm('LLM · Classificador', 1024)

// 3.8 Expandir seleção (1 -> N itens)
const nExpand = code(
  'Expandir seleção',
  `${PJ}
const resp = pj($json.content[0].text);
const manchetes = $('Montar input · classificador').first().json.manchetes || [];
const out = [];
for (const s of (resp.selecionadas || [])) {
  const m = manchetes[s.indice];
  if (!m) continue;
  out.push({ json: { title: m.title, link: m.link, source: m.source, resumo: m.resumo, angulo: s.angulo_leigo || '' } });
}
if (!out.length) throw new Error('Classificador não retornou seleções válidas');
return out;`
)

// 3.9 Buscar fonte (por item)
const nFetch = add({
  name: 'Buscar fonte',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: pos(),
  parameters: {
    method: 'GET',
    url: '={{ $json.link }}',
    options: { timeout: 15000, response: { response: { responseFormat: 'text' } } },
  },
  onError: 'continueRegularOutput',
})

// 3.10 Extrair texto + montar input do DEBATE (por item)
const nExtractDebate = code(
  'Extrair texto + input debate',
  `const meta = $('Expandir seleção').item.json;
let html = $json.data;
if (html == null) html = $json.body;
if (typeof html !== 'string') html = html ? JSON.stringify(html) : '';
const text = html
  .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
  .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\\s+/g, ' ')
  .trim()
  .slice(0, 6000);
const userMessage = 'NOTÍCIA EM DEBATE:\\nTÍTULO: ' + meta.title + '\\nRESUMO: ' + meta.resumo +
  '\\nFONTE (' + meta.link + '):\\n' + (text || '(não foi possível extrair o texto da fonte)');
const system = ${JSON.stringify(P_DEBATE)};
return { json: { title: meta.title, link: meta.link, source: meta.source, resumo: meta.resumo, fonte_texto: text, system, userMessage } };`,
  { mode: 'runOnceForEachItem' }
)

// 3.11 LLM debate — Caio (Visionário) x Rafael (Cético) numa única chamada (por item)
const nLlmDebate = llm('LLM · Debate', 2500)

// 3.12 Parse debate (XML, fail-fast) (por item)
const nParseDebate = code(
  'Parse debate',
  `const meta = $('Extrair texto + input debate').item.json;
const raw = String($json.content[0].text);
const relevancia = parseInt((raw.match(/<relevancia>\\s*(\\d+)\\s*<\\/relevancia>/i) || [])[1] || '', 10);
const confiabilidade = parseInt((raw.match(/<confiabilidade>\\s*(\\d+)\\s*<\\/confiabilidade>/i) || [])[1] || '', 10);
const justificativa = ((raw.match(/<justificativa>([\\s\\S]*?)<\\/justificativa>/i) || [])[1] || '').trim();
const e_eu_com_isso = ((raw.match(/<e_eu_com_isso>([\\s\\S]*?)<\\/e_eu_com_isso>/i) || [])[1] || '').trim();
const debate = ((raw.match(/<debate>([\\s\\S]*?)<\\/debate>/i) || [])[1] || '').trim();
if (Number.isNaN(relevancia) || Number.isNaN(confiabilidade)) throw new Error('tags <relevancia>/<confiabilidade> não encontradas no output do debate');
return { json: {
  tipo: 'debate',
  title: meta.title, link: meta.link, source: meta.source, resumo: meta.resumo, fonte_texto: meta.fonte_texto,
  relevancia, confiabilidade, justificativa, e_eu_com_isso, debate,
}};`,
  { mode: 'runOnceForEachItem' }
)

// --- Ramo paralelo: UTILIDADE DO DIA (fora do debate, sem notas) ---

// 3.12a Montar input do curador (mesma lista de manchetes)
const nInCurador = code(
  'Montar input · curador',
  `const manchetes = $input.first().json.manchetes || [];
const linhas = manchetes.map((m, i) => '[' + i + '] ' + m.title + ' — ' + (m.source || '') + '\\n    ' + (m.resumo || '')).join('\\n\\n');
const userMessage = 'MANCHETES DE HOJE (' + manchetes.length + ' candidatas):\\n\\n' + linhas;
const system = ${JSON.stringify(P_CURADOR)};
return [{ json: { system, userMessage, manchetes } }];`,
  { row: 2 }
)

// 3.12b LLM curador de utilidade
const nLlmCurador = llm('LLM · Curador utilidade', 512, { row: 2 })

// 3.12c Expandir utilidade (1 -> 0 ou 1 item; indice -1 = sem utilidade hoje)
const nExpandUtil = code(
  'Expandir utilidade',
  `${PJ}
let resp; try { resp = pj($json.content[0].text); } catch (e) { return []; }
const manchetes = $('Montar input · curador').first().json.manchetes || [];
const idx = (resp && Number.isInteger(resp.indice)) ? resp.indice : -1;
if (idx < 0 || !manchetes[idx]) return [];
const m = manchetes[idx];
return [{ json: { title: m.title, link: m.link, source: m.source, resumo: m.resumo, dica_pratica: resp.dica_pratica || '' } }];`,
  { row: 2 }
)

// 3.12d Buscar fonte da utilidade (por item)
const nFetchUtil = add({
  name: 'Buscar fonte (utilidade)',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: pos(2),
  parameters: {
    method: 'GET',
    url: '={{ $json.link }}',
    options: { timeout: 15000, response: { response: { responseFormat: 'text' } } },
  },
  onError: 'continueRegularOutput',
})

// 3.12e Extrair texto da utilidade (por item, sem LLM, sem notas)
const nExtractUtil = code(
  'Extrair texto (utilidade)',
  `const meta = $('Expandir utilidade').item.json;
let html = $json.data;
if (html == null) html = $json.body;
if (typeof html !== 'string') html = html ? JSON.stringify(html) : '';
const text = html
  .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
  .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\\s+/g, ' ')
  .trim()
  .slice(0, 4000);
return { json: {
  tipo: 'utilidade',
  title: meta.title, link: meta.link, source: meta.source, resumo: meta.resumo,
  fonte_texto: text, dica_pratica: meta.dica_pratica || '',
}};`,
  { mode: 'runOnceForEachItem', row: 2 }
)

// 3.12f Merge: junta as 2 de debate (input 0) + a utilidade (input 1)
const nMergeBranches = add({
  name: 'Juntar debate + utilidade',
  type: 'n8n-nodes-base.merge',
  typeVersion: 2.1,
  position: pos(1),
  parameters: { mode: 'append' },
})

// 3.13 Juntar notícias enriquecidas
const nAggNoticias = add({
  name: 'Juntar notícias',
  type: 'n8n-nodes-base.aggregate',
  typeVersion: 1,
  position: pos(),
  parameters: { aggregate: 'aggregateAllItemData', destinationFieldName: 'noticias' },
})

// 3.14 Montar input do redator
const nInRedator = code(
  'Montar input · redator',
  `const noticias = $input.first().json.noticias || [];
const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const debates = noticias.filter((n) => n.tipo !== 'utilidade');
const utils = noticias.filter((n) => n.tipo === 'utilidade');
const blocosDebate = debates.map((n, i) =>
  (i + 1) + '. TÍTULO: ' + n.title +
  '\\n   FATOS (da fonte): ' + String(n.fonte_texto || '').slice(0, 1500) +
  '\\n   NOTAS: relevância ' + n.relevancia + '/10, confiabilidade ' + n.confiabilidade + '/10' +
  '\\n   JUSTIFICATIVA: ' + n.justificativa +
  '\\n   E EU COM ISSO?: ' + n.e_eu_com_isso +
  '\\n   FONTE: ' + n.link
).join('\\n\\n');
const blocosUtil = utils.map((n) =>
  '- TÍTULO: ' + n.title +
  '\\n  FATOS (da fonte): ' + String(n.fonte_texto || '').slice(0, 1200) +
  '\\n  DICA PRÁTICA: ' + (n.dica_pratica || '') +
  '\\n  FONTE: ' + n.link
).join('\\n\\n');
let userMessage = 'DATA: ' + data + '\\n\\nNOTÍCIAS DE DEBATE (' + debates.length + '):\\n\\n' + blocosDebate;
if (utils.length) userMessage += '\\n\\nUTILIDADE DO DIA (' + utils.length + ', sem notas):\\n\\n' + blocosUtil;
const system = ${JSON.stringify(P_REDATOR)};
return [{ json: { system, userMessage, noticias } }];`
)

// 3.15 LLM redator
const nLlmRedator = llm('LLM · Redator do Brief', 2500)

// 3.16 Parse brief + input dialeto
// redator-brief.md retorna em tags XML (mesmo motivo do dialeto-whatsapp/editor-cético:
// evitar JSON.parse com aspas internas mal escapadas no texto longo do brief_whatsapp).
const nParseBrief = code(
  'Parse brief + input dialeto',
  `const raw = String($json.content[0].text);
const titulo_do_dia = ((raw.match(/<titulo_do_dia>([\\s\\S]*?)<\\/titulo_do_dia>/i) || [])[1] || '').trim();
const brief_whatsapp = ((raw.match(/<brief_whatsapp>([\\s\\S]*?)<\\/brief_whatsapp>/i) || [])[1] || '').trim();
const fontesRaw = (raw.match(/<fontes>([\\s\\S]*?)<\\/fontes>/i) || [])[1] || '';
const fontes = fontesRaw.split('\\n').map((l) => l.replace(/^\\s*[-•*]\\s*/, '').trim()).filter((l) => /^https?:\\/\\//i.test(l));
if (!brief_whatsapp) throw new Error('tag <brief_whatsapp> não encontrada ou vazia no output do redator');
const userMessage = 'BRIEF DO DIA (saída do redator):\\n<<<\\n' + brief_whatsapp + '\\n>>>';
const system = ${JSON.stringify(P_DIALETO_WA)};
return [{ json: { system, userMessage, titulo_do_dia, fontes, brief_original: brief_whatsapp } }];`
)

// 3.17 LLM dialeto whatsapp
const nLlmDialeto = llm('LLM · Dialeto WhatsApp', 2500)

// 3.18 Parse dialeto + input editor
// dialeto-whatsapp.md retorna em tags XML (mais robusto que JSON quando o texto tem aspas)
const nParseDialeto = code(
  'Parse dialeto + input editor',
  `const raw = String($json.content[0].text);
const m = raw.match(/<texto_whatsapp>([\\s\\S]*?)<\\/texto_whatsapp>/i);
if (!m) throw new Error('tag <texto_whatsapp> não encontrada no output do dialeto');
const texto_whatsapp = m[1].trim();
const prev = $('Parse brief + input dialeto').first().json;
const noticias = $('Montar input · redator').first().json.noticias || [];
const fontesTxt = noticias.map((n, i) => (i + 1) + '. ' + n.link + '\\n' + String(n.fonte_texto || '').slice(0, 1500)).join('\\n\\n');
const userMessage = 'TEXTO PARA REVISÃO:\\n<<<\\n' + texto_whatsapp + '\\n>>>\\n\\nTÍTULO: ' + prev.titulo_do_dia + '\\n\\nFONTES:\\n' + fontesTxt;
const system = ${JSON.stringify(P_EDITOR)};
return [{ json: { system, userMessage, texto_final: texto_whatsapp, titulo_do_dia: prev.titulo_do_dia, fontes: prev.fontes } }];`
)

// 3.19 LLM editor-cético
const nLlmEditor = llm('LLM · Editor-Cético', 3000)

// 3.20 Montar pacote (texto Telegram + payload do post)
// editor-cetico.md retorna em tags XML simples (score/veredito/problemas) — mesmo motivo
// do dialeto-whatsapp: evitar JSON.parse com aspas internas mal escapadas.
const nPacote = code(
  'Montar pacote',
  `const SITE = ${JSON.stringify(SITE_URL)};

const raw = String($json.content[0].text);
const score = parseInt((raw.match(/<score>\\s*(\\d+)\\s*<\\/score>/i) || [])[1] || '0', 10);
const veredito = ((raw.match(/<veredito>\\s*(\\w+)\\s*<\\/veredito>/i) || [])[1] || 'reescreve').toLowerCase();
const probsRaw = (raw.match(/<problemas>([\\s\\S]*?)<\\/problemas>/i) || [])[1] || '';
const problemas = probsRaw.split('\\n').map((l) => l.replace(/^\\s*[-•*]\\s*/, '').trim()).filter((l) => l && l.toLowerCase() !== 'nenhum');
const ed = { score, veredito, problemas };
const prev = $('Parse dialeto + input editor').first().json;
const hoje = new Date().toISOString().slice(0, 10);
const slug = String(prev.titulo_do_dia).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '-' + hoje;
const flag = ed.veredito === 'libera' ? '✅ liberado' : '⚠️ revisar';
const problemasTxt = (ed.problemas || []).map((p) => '• ' + p).join('\\n');
const telegramText = flag + ' — Editor-Cético: ' + ed.score + '/100\\n\\n' + prev.texto_final +
  '\\n\\n— — —\\n' + (problemasTxt ? 'Apontamentos:\\n' + problemasTxt : 'Sem apontamentos.') +
  '\\n\\nAprovar = publica no site. Recusar = descarta.';
// Telegram limita mensagens a 4096 chars; trunca a prévia (o texto completo vai pro site).
const TG_MAX = 3900;
const telegramTextSafe = telegramText.length > TG_MAX ? (telegramText.slice(0, TG_MAX) + '\\n\\n[...] texto completo será publicado no site') : telegramText;
const post = {
  slug, title: prev.titulo_do_dia, excerpt: String(prev.texto_final).replace(/[*_]/g, '').slice(0, 160),
  date: hoje, readTime: '3 min', category: 'Brief', content: prev.texto_final,
};
return [{ json: { telegramText: telegramTextSafe, post, apiUrl: SITE + '/api/admin/posts', score: ed.score, veredito: ed.veredito } }];`
)

// 3.21 Aprovação no Telegram (pausa a execução até o clique)
const nApproval = add({
  name: 'Aprovação no Telegram',
  type: 'n8n-nodes-base.telegram',
  typeVersion: 1.2,
  position: pos(),
  parameters: {
    operation: 'sendAndWait',
    chatId: CHAT_ID,
    message: '={{ $json.telegramText }}',
    responseType: 'approval',
    approvalOptions: { values: { approvalType: 'double', buttonApprovalLabel: 'Aprovar', buttonDisapprovalLabel: 'Recusar' } },
    options: {},
  },
  credentials: { telegramApi: { id: 'TELEGRAM_BOT', name: 'IA Traduzida Bot' } },
})

// 3.22 IF aprovado?
const nIf = add({
  name: 'Aprovado?',
  type: 'n8n-nodes-base.if',
  typeVersion: 2,
  position: pos(),
  parameters: {
    conditions: {
      options: { caseSensitive: true, typeValidation: 'loose', version: 2 },
      combinator: 'and',
      conditions: [
        {
          leftValue: '={{ $json.data.approved }}',
          rightValue: true,
          operator: { type: 'boolean', operation: 'true', singleValue: true },
        },
      ],
    },
  },
})

const xAfterIf = X

// 3.23a (true) Montar input · dialeto blog
// Passa o brief WhatsApp aprovado + trechos das fontes pro LLM expandir cada notícia
// com base nas fontes (não inventar). As notícias com fonte_texto vieram do "Montar input · redator".
const nInBlog = code(
  'Montar input · blog',
  `const pkg = $('Montar pacote').first().json;
const noticias = $('Montar input · redator').first().json.noticias || [];
const fontesTxt = noticias.map((n, i) =>
  (i + 1) + '. [' + n.link + ']\\n' + String(n.fonte_texto || '(fonte não disponível)').slice(0, 2500)
).join('\\n\\n');
const userMessage = 'BRIEF APROVADO (formato WhatsApp):\\n<<<\\n' + pkg.post.content + '\\n>>>\\n\\nFONTES ORIGINAIS (matéria-prima para expandir as notícias do blog — use APENAS o que estiver aqui):\\n\\n' + fontesTxt;
const system = ${JSON.stringify(P_DIALETO_BLOG)};
return [{ json: { system, userMessage, _pkg: pkg } }];`,
  { row: -1 }
)

// 3.23b (true) LLM dialeto blog (max_tokens 5000 — 2 debates x ~400 palavras + utilidade + lede + fontes)
const nLlmBlog = llm('LLM · Dialeto Blog', 5000, { row: -1 })

// 3.23c (true) Parse blog + montar post
// dialeto-blog.md retorna em tag XML (mesmo motivo do dialeto-whatsapp: evitar JSON.parse com aspas).
const nParseBlog = code(
  'Parse blog + montar post',
  `const raw = String($json.content[0].text);
let contentMarkdown;
const m = raw.match(/<post_markdown>([\\s\\S]*?)<\\/post_markdown>/i);
if (m) {
  contentMarkdown = m[1].trim();
} else {
  // tag aberta mas não fechada (resposta truncada por max_tokens): aproveita o que veio
  const open = raw.match(/<post_markdown>([\\s\\S]*)/i);
  if (!open) throw new Error('tag <post_markdown> não encontrada no output do dialeto blog');
  contentMarkdown = open[1].replace(/<\\/post_markdown>\\s*$/i, '').trim();
}
if (!contentMarkdown) throw new Error('<post_markdown> veio vazio no output do dialeto blog');
const pkg = $('Montar input · blog').first().json._pkg;
const post = { ...pkg.post, content: contentMarkdown };
return [{ json: { post, apiUrl: pkg.apiUrl } }];`,
  { row: -1 }
)

// 3.24 (true) Publicar no site
const nPublicar = add({
  name: 'Publicar no site',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: pos(-1),
  parameters: {
    method: 'POST',
    url: '={{ $json.apiUrl }}',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.post) }}',
    options: { timeout: 30000 },
  },
  credentials: { httpHeaderAuth: { id: 'SITE_TOKEN', name: 'IA Traduzida site (Authorization: Bearer)' } },
})

// 3.25 (true) Confirma publicado
const nConfirma = add({
  name: 'Confirma publicado',
  type: 'n8n-nodes-base.telegram',
  typeVersion: 1.2,
  position: pos(-1),
  parameters: {
    chatId: CHAT_ID,
    text: '=Publicado ✅  {{ $json.slug || $json.post?.slug || "" }}',
    additionalFields: {},
  },
  credentials: { telegramApi: { id: 'TELEGRAM_BOT', name: 'IA Traduzida Bot' } },
})

// 3.26 (false) Avisa descartado
X = xAfterIf
const nDescarta = add({
  name: 'Avisa descartado',
  type: 'n8n-nodes-base.telegram',
  typeVersion: 1.2,
  position: pos(1),
  parameters: {
    chatId: CHAT_ID,
    text: '=Brief descartado ❌ (recusado na aprovação).',
    additionalFields: {},
  },
  credentials: { telegramApi: { id: 'TELEGRAM_BOT', name: 'IA Traduzida Bot' } },
})

// ---------------------------------------------------------------------------
// 4. Conexões (cadeia linear + ramo do IF)
// ---------------------------------------------------------------------------
// Parte linear até as manchetes
const head = [nTrigger, nFeeds, nRss, nDedup, nAggManchetes]
for (let i = 0; i < head.length - 1; i++) connect(head[i], head[i + 1])

// Ramo do debate (2 notícias mais incríveis)
connect(nAggManchetes, nInClass)
const debateChain = [nInClass, nLlmClass, nExpand, nFetch, nExtractDebate, nLlmDebate, nParseDebate]
for (let i = 0; i < debateChain.length - 1; i++) connect(debateChain[i], debateChain[i + 1])

// Ramo paralelo da utilidade (1 notícia prática, fora do debate)
connect(nAggManchetes, nInCurador)
const utilChain = [nInCurador, nLlmCurador, nExpandUtil, nFetchUtil, nExtractUtil]
for (let i = 0; i < utilChain.length - 1; i++) connect(utilChain[i], utilChain[i + 1])

// Junta os dois ramos: debate -> input 0, utilidade -> input 1 (define a ordem no brief)
connect(nParseDebate, nMergeBranches, 0, 0)
connect(nExtractUtil, nMergeBranches, 0, 1)

// Parte linear final
const tail = [nMergeBranches, nAggNoticias, nInRedator, nLlmRedator, nParseBrief,
  nLlmDialeto, nParseDialeto, nLlmEditor, nPacote, nApproval, nIf]
for (let i = 0; i < tail.length - 1; i++) connect(tail[i], tail[i + 1])

connect(nIf, nInBlog, 0) // true
connect(nInBlog, nLlmBlog)
connect(nLlmBlog, nParseBlog)
connect(nParseBlog, nPublicar)
connect(nPublicar, nConfirma)
connect(nIf, nDescarta, 1) // false

// ---------------------------------------------------------------------------
// 5. Sticky notes (documentação dentro do canvas)
// ---------------------------------------------------------------------------
nodes.push({
  name: 'README',
  type: 'n8n-nodes-base.stickyNote',
  typeVersion: 1,
  position: [-40, 40],
  parameters: {
    width: 520,
    height: 260,
    content:
      '## Brief Diário — IA Traduzida (Pipeline 1)\\n' +
      'Gerado por `scripts/build-brief-diario.mjs` — não edite à mão; edite os prompts em `agents/*.md` e regenere.\\n\\n' +
      '**Antes de ativar, configure 3 credenciais** (ver docs/SETUP.md):\\n' +
      '1. *Anthropic API key (x-api-key)* — HTTP Header Auth, header `x-api-key`.\\n' +
      '2. *IA Traduzida site* — HTTP Header Auth, header `Authorization` = `Bearer SEU_BLOG_API_TOKEN`.\\n' +
      '3. *IA Traduzida Bot* — credencial Telegram (token do BotFather).\\n\\n' +
      'URL do site e chat_id do Telegram entram no JSON via env vars do builder ' +
      '(`IA_TRADUZIDA_SITE_URL`, `IA_TRADUZIDA_CHAT_ID`); se o JSON foi gerado sem elas, ' +
      'edite manualmente os 3 `REPLACE_CHAT_ID` e o `SITE` no nó "Montar pacote".',
  },
})
const approvalX = nodes.find((n) => n.name === nApproval).position[0]
nodes.push({
  name: 'Nota aprovação',
  type: 'n8n-nodes-base.stickyNote',
  typeVersion: 1,
  position: [approvalX - 20, 40],
  parameters: {
    width: 360,
    height: 220,
    content:
      '### Aprovação humana\\n' +
      '"Aprovação no Telegram" usa **Send and Wait for Response** (n8n ≥ 1.15). ' +
      'Pausa a execução e manda os botões Aprovar/Recusar no seu Telegram.\\n\\n' +
      'n8n antigo? Substitua por *Telegram → Send Message* + nó **Wait (On webhook call)**.',
  },
})

// ---------------------------------------------------------------------------
// 6. Escrever o arquivo
// ---------------------------------------------------------------------------
const workflow = {
  name: 'IA Traduzida — Brief Diário',
  nodes,
  connections,
  active: false,
  settings: { executionOrder: 'v1' },
  meta: { generatedBy: 'scripts/build-brief-diario.mjs', generatedAt: new Date().toISOString() },
}

const outDir = path.join(ROOT, 'workflows')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'brief-diario.json')
fs.writeFileSync(outFile, JSON.stringify(workflow, null, 2) + '\n', 'utf8')
console.log(`✓ ${path.relative(ROOT, outFile)} — ${nodes.length} nós, voz: ${VOZ ? 'corpus carregado' : 'fallback'}`)
