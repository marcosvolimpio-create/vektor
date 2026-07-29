# Backend — Services

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Catalogar os serviços de aplicação (casos de uso) por módulo, cada um implementando os Critérios de aceite já escritos na RFC correspondente.

## Responsabilidade

Um serviço por responsabilidade de módulo — ex.: `EstrategiaService` (RFC-001: formulação, handoff — aprovação de etapa/síntese exige Membro `role = 'admin'`, ADR-012), `ExecucaoService` (RFC-002: decomposição, produção de Evidência), `GrowthService` (RFC-003: dupla amarração, aprovação de Experimento exige Membro `role = 'admin'`, ADR-012), `AprendizadoService` (RFC-005: registro, Evoluir Estratégia — disparo exige Membro `role = 'admin'`, ADR-012).

## Conteúdo esperado

- Lista de serviços por módulo, um método por Critério de aceite da RFC correspondente.
- Invariantes de `DECISIONS.md` que cada serviço precisa impor antes de persistir (ex.: `ExecucaoService.criarCampanha` verifica ADR-008 antes de qualquer escrita).

## Relação com os documentos de produto

Critérios de aceite de cada RFC (mapeamento direto, um a um); `DECISIONS.md` para invariantes transversais.

## Dependências

`backend/repositories.md` (dados), `backend/validation.md` (regras); [Implementation Plan](../../implementation-plan.md), Fases 2 a 6.

## O que NÃO pertence a este documento

Acesso direto a SQL/Drizzle (`repositories.md`), formato de request/response HTTP (`api/contracts.md`).
