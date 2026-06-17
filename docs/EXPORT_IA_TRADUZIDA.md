# EXPORT COMPLETO — Projeto "IA Traduzida"
> Documento de handoff gerado a partir da sessão de estratégia (Claude.ai, jun/2026).
> Uso: colocar em `docs/EXPORT_IA_TRADUZIDA.md` no repositório do projeto. O `CLAUDE.md` na raiz aponta para este arquivo como fonte de verdade.

---

## 0. Como usar este documento no Claude Code
1. Crie o repositório `ia-traduzida` com a estrutura sugerida na seção 9.
2. Coloque o `CLAUDE.md` na raiz e este arquivo em `docs/`.
3. Comece pelo backlog (seção 8), na ordem de prioridade. Cada tarefa foi escrita para ser dada diretamente ao Claude Code como instrução.
4. Toda decisão registrada aqui já foi debatida e aprovada — não reabrir discussões de escopo; em caso de bloqueio técnico, propor alternativa que respeite as restrições da seção 1.

---

## 1. Restrições inegociáveis (contexto do criador)
- Criador: Thales Levi Carnete — AI & Automation Manager na iD\TBWA, professor de IA, DPO. Stack dominado: n8n, Flowise, Python, APIs, RAG, prompt engineering.
- Tempo: **~3h/semana** no total (≈10 min/dia de operação + ~50 min/semana de conteúdo autoral e auditoria).
- Orçamento: **quase zero**. LLMs baratos (Gemini Flash / Claude Haiku), ferramentas gratuitas ou self-hosted na hospedagem já existente.
- Qualidade: **nada é publicado sem aprovação humana** (human-in-the-loop). Um erro publicado fere a credibilidade de um DPO que vende governança de IA.
- Público: **leigo / não-técnico** (recepcionista, advogado, dono de padaria, estudante). Zero jargão sem tradução.
- Funil duplo: corporativo (atrair empresas/pessoas para a comunidade guiada) + comunidade aberta a qualquer interessado em IA.
- Monetização: futura (patrocínio, comunidade paga, consultoria). Não é prioridade na v1.
- Vetado: API do X/Twitter (custo), Canva Pro/Bannerbear (custo), avatar com voz clonada (fase 2, condicionado a teste), TTS robótico, cross-posting idêntico entre redes.

## 2. O produto
**"IA Traduzida"** (nome provisório — validar com 2 alternativas junto a pessoas leigas; se entendem o nome sem explicação, passou).

Uma **redação 100% autônoma** orquestrada em n8n + Flowise, onde agentes coletam, filtram, classificam e escrevem notícias de IA para leigos — e Thales atua como editor-chefe humano por ~10 min/dia. A meta-narrativa é o produto: **"escrito por agentes, auditado por um professor de IA"**.

### Diferenciais proprietários
1. **Selo "Hype vs. Realidade"** — nota 0–10 por notícia, gerada por agente avaliador e calibrada pelo Thales. Métrica proprietária e compartilhável.
2. **Seção "E eu com isso?"** — 2 linhas por notícia traduzindo o impacto para a vida de quem não é de tecnologia.
3. **"Aula de 1 Minuto"** — 1 paper do arXiv por semana explicado com analogia do cotidiano (herança do professor do Via Rápida).
4. **"Termômetro da IA"** — índice semanal de sentimento construído com fontes gratuitas: API do Bluesky + RSS de subreddits (r/artificial, r/ChatGPT) + Google Trends BR.
5. **Seção "Bastidores"** — página com prints/diagramas dos workflows n8n. Prova viva de autoridade técnica.
6. **Post mensal "o que minha IA errou este mês"** — transparência radical a partir da auditoria semanal; jogada de autoridade em governança.

### Canais
- **Canal de WhatsApp** = âncora (público leigo brasileiro vive no WhatsApp).
- **Newsletter Beehiiv** (plano gratuito) = compilado semanal automático.
- **LinkedIn** = funil corporativo e autoridade pessoal.
- **Instagram** = alcance do público leigo via carrosséis/cards.
- **Site simples** = vitrine, arquivo, SEO e seção Bastidores.

## 3. Decisões aprovadas — Rodada 1 do conselho
| Decisão | Racional |
|---|---|
| Sem API do X; social listening via Bluesky + Reddit RSS + Google Trends | Custo zero, fontes públicas, métrica defensável |
| Human-in-the-loop obrigatório (aprovação via Telegram/WhatsApp) | Mitiga alucinação; vira bandeira de marca: "IA escreve, humano responde" |
| Avatar/voz clonada adiado para fase 2 | Custo + risco de vale do estranho |
| Bastidores como página estática com prints dos fluxos | Custo zero, prova técnica máxima |
| WhatsApp como canal âncora | Público-alvo não abre portal de notícias |
| RAG de voz com 10–15 posts do LinkedIn do Thales | Consistência de tom em todos os agentes |

## 4. Decisões aprovadas — Rodada 2 do conselho (redes sociais)
| Decisão | Racional |
|---|---|
| **Esteira "1 → 7"**: um conteúdo-mãe diário gera até 7 derivados | Automação máxima sem cross-posting preguiçoso |
| **Agentes-dialeto** (um por rede) | Cada rede tem um dialeto; algoritmos punem conteúdo idêntico |
| **Imagens por template HTML/CSS → PNG** (Puppeteer/Browserless self-hosted no n8n) | Custo zero + assinatura visual consistente no feed |
| **Agente "Editor-Cético"** roda antes da revisão humana | Checagem contra fontes, score 0–100; score < 80 volta para reescrita automática |
| **Aprovação em pacote único diário** via Telegram (~10 min, no celular) | Elimina o gargalo de 20 decisões/dia |
| Publicação automática onde há API (LinkedIn, Beehiiv); semiautomática onde não há (WhatsApp, Instagram: copiar/colar em 3 toques) | Instagram exige app aprovado pela Meta; canal de WhatsApp não tem API de publicação |
| **Auditoria de sexta**: 15 min, 3 posts sorteados vs. fontes | "Confiança se verifica, não se presume" |
| Áudio TTS de 60s = experimento de fase 2, condicionado a teste privado de qualidade de voz | TTS robótico mata a marca |
| Cadência mínima viável travada por 30 dias | Provar o sistema antes de expandir |

## 5. A Esteira 1 → 7 (calendário)
| # | Derivado | Rede | Quem produz | Frequência / horário |
|---|---|---|---|---|
| 1 | Brief do dia (3–5 notícias + notas + "E eu com isso?") | WhatsApp | Agentes + aprovação | Seg–sex, 7h30 |
| 2 | Carrossel Hype vs. Realidade | Instagram | Template HTML→PNG | 1×/semana |
| 3 | Card do Termômetro da IA | Instagram + LinkedIn | Template HTML→PNG | Segunda, 9h |
| 4 | Post de autoridade (opinião) | LinkedIn | **Thales (100% humano)** | Quarta, 12h |
| 5 | Aula de 1 Minuto (paper arXiv) | LinkedIn + WhatsApp | Agente + aprovação | Sexta, 9h |
| 6 | Newsletter compilada da semana | Beehiiv | Agente monta sozinho | Sexta, 11h |
| 7 | Bastidores / "o que minha IA errou" | LinkedIn | Thales + prints n8n | Mensal |

## 6. Arquitetura técnica
> **Adendo técnico (2026-06-14):** o Flowise foi removido da arquitetura. Era pedido só pelo RAG de voz, mas 10–15 posts (~20–30k tokens) cabem inteiros no contexto do Haiku/Gemini Flash — vector store é desnecessário. Os agentes rodam como nós LLM direto no n8n (HTTP Request → API Anthropic), com os prompts dos `agents/*.md` embutidos e o corpus de voz concatenado no prompt do redator. Onde se lê "Flowise" abaixo, leia "nó LLM no n8n".

### Pipeline 1 — Brief diário (n8n)
1. Cron 5h → nó RSS nativo lê 15–20 feeds (TechCrunch AI, The Verge, Ars Technica, blogs OpenAI/Anthropic/Google, portais BR).
2. Deduplicação por similaridade de título.
3. Agente classificador (Gemini Flash / Claude Haiku) ranqueia por relevância **para leigos**.
4. Agente "Tradutor de Hype": nota 0–10 + seção "E eu com isso?".
5. Agente redator (Flowise, com RAG de voz) monta o brief.
6. Agentes-dialeto derivam versões por rede.
7. **Editor-Cético** valida tudo contra os links das fontes (score 0–100; <80 = reescrita automática).
8. Pacote único → bot do Telegram → Thales aprova ("ok") ou edita.
9. Pós-aprovação: publica via API (LinkedIn/Beehiiv) e entrega texto+imagem prontos para colar (WhatsApp/Instagram).

### Pipeline 2 — Aula de 1 Minuto (semanal)
RSS do arXiv (cs.AI) → agente seleciona 1 paper por impacto prático → resumo + analogia cotidiana → revisão humana (~20 min) → edição de sexta.

### Pipeline 3 — Termômetro da IA (semanal)
API Bluesky + RSS Reddit + Google Trends BR → agente de sentimento → índice da semana → injeta no template HTML → PNG → publicação de segunda.

### Pipeline 4 — Fábrica de imagens
Templates HTML/CSS (1080×1350): selo Hype vs. Realidade e Termômetro. Identidade fixa (mesmas cores, fonte, logo). Render via Puppeteer/Browserless self-hosted ou community node HTML→imagem do n8n.

### Camadas de qualidade (ordem)
RAG de voz → Editor-Cético → aprovação humana em pacote → auditoria de sexta (3 posts sorteados).

## 7. Passo a passo aprovado (fases)
**Fase 0 — Fundação (~2h):** duplicar workflow do brief com saída "pacote"; criar bot Telegram (BotFather) e conectar ao n8n; escrever prompt do Editor-Cético no Flowise; montar RAG de voz com 10–15 posts do LinkedIn.
**Fase 1 — Fábrica de imagens (~2h):** templates HTML do selo e do Termômetro; nó de renderização HTML→PNG; rodar pipeline 3 dias em privado e calibrar o Editor-Cético (deve barrar ao menos um exagero).
**Fase 2 — Distribuição (~1h30):** API LinkedIn + API Beehiiv no n8n; pacote Telegram com copiar/colar para WhatsApp/Instagram; fixar horários (seção 5).
**Fase 3 — Lançamento:** post de lançamento no LinkedIn ("Construí uma redação de IA inteira que funciona com 10 minutos do meu dia") com 2 prints reais do n8n; rodar cadência mínima 30 dias sem adicionar nada; auditoria toda sexta; no dia 30, publicar "o que minha IA errou este mês" e só então decidir a fase 2 (áudio, avatar, novos canais).

**Regra de ouro:** se o pacote diário exigir mais de 15 min do Thales, o problema é do agente — consertar o prompt, não compensar com esforço.

## 8. Backlog para o Claude Code (ordem de prioridade)
> Formato: cada item pode ser passado diretamente como tarefa. Status: ☐ pendente / ☑ feito.

- ☑ **T01** *(adaptado em 2026-06-12: em vez de repo novo, o repo existente `ai-publicidade`/Neural Drop foi reestruturado — estrutura da seção 9 criada, pipeline antigo arquivado em `scripts/legacy/`, cron do GitHub Actions removido, API de escrita protegida com `BLOG_API_TOKEN`)* — Criar estrutura do repositório conforme seção 9, com README explicando o projeto.
- ☑ **T02** — Escrever `agents/editor-cetico.md`: prompt completo do Editor-Cético (entrada: texto + links-fonte; saída: JSON com afirmações verificadas, score 0–100, veredito `libera|reescreve`, lista de problemas). Incluir lista de palavras proibidas (ex.: "revolucionário", "mudou tudo para sempre", "ninguém esperava").
- ☑ **T03** — Escrever `agents/tradutor-de-hype.md`: prompt que recebe uma notícia e retorna JSON `{nota_hype, nota_realidade, justificativa, e_eu_com_isso}` com linguagem para leigos.
- ☑ **T04** *(corpus do RAG de voz pendente — Thales fornecer 10–15 posts do LinkedIn em `agents/voz/`)* — Escrever `agents/redator-brief.md` + `agents/dialeto-whatsapp.md`, `agents/dialeto-linkedin.md`, `agents/dialeto-instagram.md` (tom por rede; usar RAG de voz).
- ☑ **T05** *(2026-06-14: feito sem Flowise — ver adendo na seção 6. Workflow gerado por `scripts/build-brief-diario.mjs` a partir dos `agents/*.md`; agentes = nós HTTP Request → API Anthropic Haiku. Criado `agents/classificador.md` que faltava. Credenciais em `docs/SETUP.md`. Escopo v1: brief WhatsApp como conteúdo-mãe; dialetos LinkedIn/Instagram e o loop de 2 reescritas do Editor-Cético ficam para extensões.)* — Construir `workflows/brief-diario.json`: workflow n8n completo do Pipeline 1 (cron → RSS → dedup → agentes → Editor-Cético → Telegram → publicação condicional). Documentar credenciais necessárias em `docs/SETUP.md`.
- ☑ **T06** — Construir `templates/selo-hype.html` e `templates/termometro.html` (1080×1350, CSS inline, placeholders `{{nota_hype}}`, `{{nota_realidade}}`, `{{titulo}}`, `{{indice}}`, `{{semana}}`).
- ☑ **T07** *(2026-06-17: sub-workflow reutilizável gerado por `scripts/build-render-imagens.mjs`, que embute os `templates/*.html`. Entrada `{template, data}` via Execute Sub-workflow; injeta placeholders + valida; render via Browserless `/screenshot` → PNG 1080×1350 binário. Browserless configurável no nó "Injetar template"; doc em `docs/SETUP.md` §8.)* — Construir `workflows/render-imagens.json`: nó n8n que injeta dados nos templates e renderiza PNG via Puppeteer/Browserless self-hosted.
- ☐ **T08** — Construir `workflows/termometro.json`: Pipeline 3 (Bluesky API + Reddit RSS + Google Trends → agente de sentimento → índice → imagem → pacote de segunda).
- ☐ **T09** — Construir `workflows/aula-1-minuto.json`: Pipeline 2 (RSS arXiv cs.AI → seleção → resumo com analogia → revisão → sexta).
- ☐ **T10** — Construir `workflows/newsletter-semanal.json`: compilar o melhor da semana e publicar via API do Beehiiv (sexta, 11h).
- ☐ **T11** — Script `scripts/auditoria.py`: sorteia 3 posts da semana, recupera as fontes e gera checklist de verificação para a auditoria de sexta.
- ☐ **T12** — Página estática `site/bastidores.html` com diagramas dos fluxos (pode usar Mermaid) e a narrativa "escrito por agentes, auditado por um professor de IA".
- ☐ **T13** — `docs/SETUP.md`: guia de instalação (n8n, Flowise, Browserless, credenciais LinkedIn/Beehiiv/Telegram/Bluesky) na hospedagem existente.

## 9. Estrutura de repositório sugerida
```
ia-traduzida/
├── CLAUDE.md                  # contexto p/ Claude Code (raiz)
├── README.md
├── docs/
│   ├── EXPORT_IA_TRADUZIDA.md # este arquivo (fonte de verdade)
│   └── SETUP.md
├── agents/                    # prompts dos agentes (Flowise)
│   ├── editor-cetico.md
│   ├── tradutor-de-hype.md
│   ├── redator-brief.md
│   ├── dialeto-whatsapp.md
│   ├── dialeto-linkedin.md
│   └── dialeto-instagram.md
├── workflows/                 # exports JSON do n8n
│   ├── brief-diario.json
│   ├── render-imagens.json
│   ├── termometro.json
│   ├── aula-1-minuto.json
│   └── newsletter-semanal.json
├── templates/                 # HTML/CSS → PNG
│   ├── selo-hype.html
│   └── termometro.html
├── scripts/
│   └── auditoria.py
└── site/
    └── bastidores.html
```

## 10. Transcrições resumidas dos debates (referência)
**Rodada 1 (conceito):** Cético vetou API do X (custo), alertou para saturação de newsletters de IA e risco de alucinação publicada. Visionário reposicionou: o único noticiário para quem NÃO é técnico ("o que isso muda na sua vida"), com as 3h/semana como prova do que o criador vende. Gênio propôs redação visível, selo compartilhável e avatar (avatar adiado). Líder sintetizou: human-in-the-loop como bandeira, WhatsApp como âncora, Termômetro com fontes gratuitas.

**Rodada 2 (distribuição):** Cético atacou cross-posting, custo de imagem e gargalo de aprovação. Visionário criou a esteira "1 conteúdo-mãe → agentes-dialeto → pacote único de aprovação". Gênio resolveu imagem com HTML→PNG no próprio n8n e propôs o Editor-Cético como agente. Cético aceitou sob condição da auditoria semanal de sexta. Líder fechou: produção 100% automática, publicação semiautomática onde não há API (10 min/dia), cadência mínima por 30 dias, post mensal de transparência.

---
*Fim do export. Próxima ação sugerida no Claude Code: executar T01 e T02.*
