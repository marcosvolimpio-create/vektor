# API — Errors

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Definir uma taxonomia de erro única, usada tanto por REST quanto por Server Actions, mapeando toda violação de invariante a um código e mensagem consistentes.

## Responsabilidade

Catalogar erro por causa: violação de ADR (ex.: tentar criar Campanha sem Estratégia ativa → erro referenciando ADR-008), erro de validação de forma (Zod), erro de autorização (Membro sem `role` suficiente para a operação — estrutura definida em ADR-012, `DECISIONS.md`).

## Conteúdo esperado

Tabela erro → causa → ADR/RFC de origem → mensagem para o usuário, seguindo a linguagem do Product Canon (nunca expor jargão técnico ao usuário final).

## Relação com os documentos de produto

Todo erro de regra de negócio aponta para um ADR ou Critério de aceite específico — nenhum erro pode existir neste catálogo sem essa referência.

## Dependências

`backend/validation.md`.

## O que NÃO pertence a este documento

A lógica de verificação em si (`backend/validation.md`), o formato de payload de sucesso (`api/contracts.md`).
