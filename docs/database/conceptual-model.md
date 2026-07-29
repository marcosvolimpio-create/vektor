# Modelo Conceitual

> Parte do [Modelo de Dados VEKTOR](./README.md). Ver legenda de símbolos (🔒/⚠️/🚧) no README.

## Entidades

Nove entidades oficiais de [`architecture/domain.md`](../architecture/domain.md) 🔒, mais quatro elementos de suporte exigidos pela modelagem:

| Entidade conceitual | Natureza | Origem |
|---|---|---|
| Workspace | Entidade oficial | 🔒 `domain.md` |
| Membro | Identity/Access, fora das nove entidades do ciclo | 🔒 ADR-011 (`DECISIONS.md`) |
| Estratégia | Entidade oficial | 🔒 `domain.md`; RFC-001 |
| Etapa de formulação (Diagnóstico, SWOT, ICP...) | Composição interna da Estratégia, não entidade própria | 🔒 `domain.md`, "Composição interna da Estratégia"; ⚠️ normalizada em tabela própria por decisão de modelagem (ver Nota 1) |
| Objetivo | Elemento da etapa "Objetivos" da Estratégia | ⚠️ normalizado para ser referenciável por Experimento (RFC-003, critério nº2) |
| Campanha | Entidade oficial | 🔒 `domain.md`; RFC-002 |
| Tática | Entidade oficial | 🔒 `domain.md`; RFC-002 |
| Ação | Entidade oficial | 🔒 `domain.md`; RFC-002; RFC-004 |
| Evidência | Entidade oficial | 🔒 `domain.md`; RFC-002; RFC-003 |
| Hipótese | Entidade oficial | 🔒 `domain.md`; RFC-003; RFC-004 |
| Experimento | Entidade oficial | 🔒 `domain.md`; RFC-002; RFC-003; RFC-004 |
| Aprendizado | Entidade oficial | 🔒 `domain.md`; RFC-005 |
| Integração | Parâmetro de Configurações | 🔒 RFC-008 (existência); ⚠️ estrutura genérica (nenhum tipo específico documentado) |

**Explicitamente sem entidade própria** (já decidido nas fontes, não reaberto aqui): Biblioteca (RFC-006), Relatórios (RFC-007), Dashboard (ADR-001), Configurações como um todo além de Membro/Integração (RFC-008 não documenta estrutura de Permissões).

### Nota 1 — por que "etapas de formulação" viram tabela

`architecture/domain.md` é explícito: "Diagnóstico, Mercado, Concorrentes, SWOT, ICP, Personas, Jornada do Cliente, Funis, Objetivos e Posicionamento são elementos que compõem a Estratégia, **não entidades de domínio independentes**." Isso é uma afirmação sobre o **domínio de produto** — não impede uma decisão de **modelagem física** de normalizar esses elementos em linhas de uma tabela em vez de 11 colunas soltas na tabela `strategies`. A tabela `strategy_steps` não cria uma entidade de produto nova; é a tradução técnica de uma única entidade (Estratégia) cuja composição interna é estruturada (RFC-001, tabela do Marketing Planning Framework, com ordem de dependência explícita entre as 11 etapas).

## Relacionamentos e cardinalidade

| Relação | Cardinalidade | Origem |
|---|---|---|
| Workspace → Membro | 1:N | 🔒 ADR-011; RFC-008 |
| Workspace → Estratégia | 1:N | 🔒 `domain.md`: "um Workspace acumula múltiplas Estratégias" |
| Workspace → Integração | 1:N | 🔒 RFC-008 |
| Estratégia → Estratégia (evolução) | 1:0..1 (cadeia linear, não árvore) | ⚠️ inferência a partir de ADR-003 (uma ativa por vez) + RFC-005 (nova Estratégia recebe Aprendizado da anterior) |
| Estratégia → Etapa de formulação | 1:N (exatamente 11 por Estratégia) | 🔒 RFC-001 |
| Estratégia → Objetivo | 1:N | 🔒 RFC-001 (etapa Objetivos pode conter mais de um objetivo) |
| Estratégia → Campanha | 1:N | 🔒 `domain.md`; ADR-008 (só quando ativa) |
| Campanha → Tática | 1:N | 🔒 `domain.md` |
| Tática → Ação | 1:N | 🔒 `domain.md` |
| Tática ou Ação → Experimento | 1:N (polimórfico — exatamente um dos dois) | 🔒 `domain.md`: "Experimento existe dentro de Tática ou Ação" |
| Ação ou Experimento → Evidência | 1:N (polimórfico — exatamente um dos dois) | 🔒 `domain.md`: "Evidência existe dentro de Ação ou Experimento" |
| Evidência → Hipótese | 1:N | 🔒 `domain.md`: "Hipótese nasce de uma Evidência observada" |
| Hipótese → Experimento | 1:N | 🔒 `domain.md`: "Experimento sempre justificado por uma Hipótese" — fontes não limitam a um único Experimento por Hipótese, então o modelo não inventa esse limite |
| Objetivo → Experimento | 1:N | 🔒 RFC-003, critério nº2: "todo Experimento declara... a qual Objetivo... ele serve" |
| Evidência → Aprendizado | 1:N | 🔒 RFC-005: "Aprendizado é Evidência interpretada" |
| Membro → (Etapa aprovada, Campanha criada, Ação aprovada, Experimento aprovado) | 1:N cada | 🔒 ADR-011 (Membro); 🔒 ADR-012 (aprovação de etapa/síntese e de Experimento exige `role = 'admin'`; criação de Campanha e aprovação de Ação exigem apenas Membro `ativo`, qualquer `role`) |

## Ownership (quem é dono de quem)

| Entidade | Contida/possuída por | Apenas referenciada por (sem posse) |
|---|---|---|
| Workspace | — (raiz, limite de tenant) | — |
| Membro | Workspace | Toda entidade com coluna `*_by` |
| Estratégia | Workspace | Aprendizado (referencia a próxima Estratégia sem "possuí-la") |
| Etapa de formulação / Objetivo | Estratégia | Experimento (referencia Objetivo, não o possui) |
| Campanha | Estratégia | — |
| Tática | Campanha | — |
| Ação | Tática | Evidência, Experimento (referenciam sem possuir) |
| Experimento | Tática **ou** Ação (posse polimórfica, nunca ambas) | Hipótese, Objetivo (referenciados, não possuídos) |
| Evidência | Ação **ou** Experimento (posse polimórfica, nunca ambas) | Hipótese, Aprendizado (referenciam sem possuir) |
| Hipótese | Evidência | Experimento (referencia, não possui) |
| Aprendizado | Evidência (dado de origem) | Estratégia seguinte (referencia como ponto de partida do Diagnóstico, RFC-005 — não é FK de posse, é informacional) |
| Integração | Workspace | — |

A distinção "possui" vs. "referencia" importa para `ON DELETE`: exclusão de um dono em cascata é defensável (ex.: excluir uma Tática exclui suas Ações); exclusão de uma entidade apenas referenciada nunca deve cascatear (ex.: excluir uma Hipótese não pode arrastar o Experimento que a referencia — ver `logical-model.md` para a política de `ON DELETE` por chave estrangeira).
