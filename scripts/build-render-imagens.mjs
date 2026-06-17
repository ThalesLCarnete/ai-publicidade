#!/usr/bin/env node
/**
 * Builder do workflow n8n "Render de Imagens" (Pipeline 4 — Fábrica de imagens / T07).
 *
 * Sub-workflow REUTILIZÁVEL: recebe { template, data } e devolve um PNG 1080×1350.
 * Quem chama: o Brief Diário (derivados Instagram), o Termômetro (T08) e a Aula de
 * 1 Minuto — todos via nó "Execute Sub-workflow" apontando para este workflow.
 *
 * Por que um builder (igual ao build-brief-diario.mjs):
 *  - os templates ficam com fonte única em templates/*.html (este script lê de lá e embute);
 *  - mudou um template? rode `node scripts/build-render-imagens.mjs` para regenerar o JSON.
 *
 * Render: Browserless self-hosted (mesmo container já previsto na arquitetura). O nó
 * HTTP Request faz POST em {BROWSERLESS}/screenshot com o HTML montado e recebe o PNG.
 *
 * Saída: workflows/render-imagens.json (importável no n8n).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TEMPLATES = path.join(ROOT, 'templates')

// ---------------------------------------------------------------------------
// 1. Ler os templates (fonte única em templates/*.html)
// ---------------------------------------------------------------------------
function template(file) {
  return fs.readFileSync(path.join(TEMPLATES, file), 'utf8')
}
const SELO = template('selo-hype.html')
const TERMO = template('termometro.html')

// Browserless configurável por env no momento do build (default = rede docker-compose).
// Ex. na VPS (n8n npm, container em localhost): BROWSERLESS_URL=http://127.0.0.1:3000 node scripts/build-render-imagens.mjs
const BROWSERLESS_URL = process.env.BROWSERLESS_URL || 'http://browserless:3000'
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || ''

// ---------------------------------------------------------------------------
// 2. Helpers de nós (mesmo estilo do build-brief-diario.mjs)
// ---------------------------------------------------------------------------
const nodes = []
const connections = {}
let X = 0
const COL = 260
function pos(row = 0) {
  const p = [X, 300 + row * 180]
  X += COL
  return p
}
function add(node) {
  nodes.push(node)
  return node.name
}
function connect(from, to, outIndex = 0) {
  connections[from] = connections[from] || { main: [] }
  while (connections[from].main.length <= outIndex) connections[from].main.push([])
  connections[from].main[outIndex].push({ node: to, type: 'main', index: 0 })
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

// ---------------------------------------------------------------------------
// 3. Os nós
// ---------------------------------------------------------------------------

// 3.1 Entrada de produção: outros workflows chamam este como sub-workflow.
//     Contrato de entrada por item: { template: 'selo-hype'|'termometro', data: {...} }
const nTrigger = add({
  name: 'Quando chamado por outro workflow',
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  typeVersion: 1.1,
  position: pos(),
  parameters: {},
})

// 3.2 Gatilho manual de teste (não usado pelos callers; só para "Execute Workflow" no canvas)
const nManual = add({
  name: 'Disparo manual (teste)',
  type: 'n8n-nodes-base.manualTrigger',
  typeVersion: 1,
  position: pos(1),
})

// 3.3 Dados de exemplo para o teste manual (um de cada template)
const nExemplo = code(
  'Exemplo p/ teste',
  `// Dois itens de exemplo — um selo, um termômetro. Edite à vontade para testar.
return [
  { json: { template: 'selo-hype', data: {
    titulo: 'Modelo de IA promete diagnosticar doenças, mas estudo ainda é preliminar',
    nota_hype: 8,
    nota_realidade: 4,
  } } },
  { json: { template: 'termometro', data: {
    indice: 62,
    semana: 'Semana de 9 a 13 de junho',
  } } },
];`,
  { row: 1 }
)

// 3.4 Injetar template: escolhe o HTML, troca os {{placeholders}} e monta o endpoint do Browserless.
//     >>> EDITE a URL/token do Browserless aqui (constantes no topo) <<<
const nInject = code(
  'Injetar template',
  `// Browserless self-hosted (definido no build via BROWSERLESS_URL/BROWSERLESS_TOKEN; ver scripts/build-render-imagens.mjs).
const BROWSERLESS = ${JSON.stringify(BROWSERLESS_URL)};
const TOKEN = ${JSON.stringify(BROWSERLESS_TOKEN)};

const TEMPLATES = {
  'selo-hype': ${JSON.stringify(SELO)},
  'termometro': ${JSON.stringify(TERMO)},
};

const tplName = $json.template;
const data = $json.data || {};
const tpl = TEMPLATES[tplName];
if (!tpl) throw new Error('template desconhecido: "' + tplName + '" (use "selo-hype" ou "termometro")');

let html = tpl;
for (const [k, v] of Object.entries(data)) {
  const safe = String(v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  html = html.split('{{' + k + '}}').join(safe);
}

const faltando = html.match(/\\{\\{\\s*[\\w.-]+\\s*\\}\\}/g);
if (faltando) throw new Error('placeholders sem valor para "' + tplName + '": ' + [...new Set(faltando)].join(', '));

const endpoint = BROWSERLESS.replace(/\\/$/, '') + '/screenshot' + (TOKEN ? ('?token=' + encodeURIComponent(TOKEN)) : '');
const filename = tplName + '-' + new Date().toISOString().slice(0, 10) + '.png';
return { json: { html, endpoint, filename, template: tplName } };`,
  { mode: 'runOnceForEachItem' }
)

// 3.5 Render no Browserless → PNG (saída binária)
const nRender = add({
  name: 'Render PNG (Browserless)',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: pos(),
  parameters: {
    method: 'POST',
    url: '={{ $json.endpoint }}',
    sendBody: true,
    specifyBody: 'json',
    jsonBody:
      "={{ JSON.stringify({ html: $json.html, " +
      "options: { type: 'png', fullPage: false }, " +
      "viewport: { width: 1080, height: 1350, deviceScaleFactor: 1 }, " +
      "gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 } }) }}",
    options: {
      response: { response: { responseFormat: 'file', outputPropertyName: 'data' } },
      timeout: 60000,
    },
  },
  onError: 'continueRegularOutput',
})

// 3.6 Nomear o binário (selo-hype-2026-06-17.png etc.) para o caller receber um arquivo pronto
const nNomear = code(
  'Nomear arquivo',
  `const item = $input.item;
const fname = $('Injetar template').item.json.filename || 'imagem.png';
if (item.binary && item.binary.data) {
  item.binary.data.fileName = fname;
  item.binary.data.fileExtension = 'png';
  item.binary.data.mimeType = 'image/png';
}
return item;`,
  { mode: 'runOnceForEachItem' }
)

// ---------------------------------------------------------------------------
// 4. Conexões
// ---------------------------------------------------------------------------
connect(nTrigger, nInject) // entrada de produção
connect(nManual, nExemplo) // entrada de teste
connect(nExemplo, nInject)
connect(nInject, nRender)
connect(nRender, nNomear)

// ---------------------------------------------------------------------------
// 5. Sticky notes (documentação no canvas)
// ---------------------------------------------------------------------------
nodes.push({
  name: 'README',
  type: 'n8n-nodes-base.stickyNote',
  typeVersion: 1,
  position: [-60, 20],
  parameters: {
    width: 540,
    height: 300,
    content:
      '## Render de Imagens — IA Traduzida (T07)\\n' +
      'Gerado por `scripts/build-render-imagens.mjs` — não edite à mão; edite os `templates/*.html` e regenere.\\n\\n' +
      '**Sub-workflow reutilizável.** Outros workflows chamam via *Execute Sub-workflow* passando, por item:\\n' +
      '```\\n{ "template": "selo-hype", "data": { "titulo": "...", "nota_hype": 8, "nota_realidade": 4 } }\\n' +
      '{ "template": "termometro", "data": { "indice": 62, "semana": "Semana de 9 a 13 de junho" } }\\n```\\n' +
      'Devolve o PNG 1080×1350 na propriedade binária `data`.\\n\\n' +
      '**Antes de usar:** edite `BROWSERLESS`/`TOKEN` no nó *Injetar template* (Browserless self-hosted).',
  },
})
nodes.push({
  name: 'Nota teste',
  type: 'n8n-nodes-base.stickyNote',
  typeVersion: 1,
  position: [pos(1)[0] - 40, 560],
  parameters: {
    width: 320,
    height: 160,
    content:
      '### Testar\\n' +
      'Clique **Execute Workflow** — o ramo *Disparo manual → Exemplo* gera um selo e um termômetro de teste. ' +
      'Confira o PNG na aba de output do nó *Nomear arquivo*.',
  },
})

// ---------------------------------------------------------------------------
// 6. Escrever o arquivo
// ---------------------------------------------------------------------------
const workflow = {
  name: 'IA Traduzida — Render de Imagens',
  nodes,
  connections,
  active: false,
  settings: { executionOrder: 'v1' },
  meta: { generatedBy: 'scripts/build-render-imagens.mjs', generatedAt: new Date().toISOString() },
}

const outDir = path.join(ROOT, 'workflows')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'render-imagens.json')
fs.writeFileSync(outFile, JSON.stringify(workflow, null, 2) + '\n', 'utf8')
console.log(`✓ ${path.relative(ROOT, outFile)} — ${nodes.length} nós`)
