# ATENDE. → VEKTOR | ESPECIFICAÇÃO MESTRE DE UX E CRM
Data: 10/11/2026
Status: arquitetura funcional aprovada; implementação incremental, com validação por fluxo.
Fonte: ATENDE. independente em demos/crm-kanban; destino futuro: módulo CRM do VEKTOR Oficial.
**Regra:** não substituir arquivos, tabelas, permissões ou módulos do VEKTOR Oficial nesta fase.

## 1. Princípios do produto
- Uma única fonte de verdade para leads, conversas, agendamentos, follow-ups e eventos.
- Um único lead pode ter vários canais/conversas, várias atividades e agendamentos.
- Permissões reais no servidor por empresa e perfil, além de navegação adaptativa na interface.
- A interface de atendimento não deve exigir abrir uma janela separada ou retornar ao início do VEKTOR.
- O ATENDE. deve ser multiempresa, com estrutura configurável. Aloe e Nagel são empresas distintas com gestão e equipe compartilhadas, mas dados sempre identificados por empresa.
- Nunca usar dados de demonstração como se fossem dados reais. Indicadores devem mencionar fonte, período e denominador.
- Interfaces sem integração real devem mostrar estado indisponível, nunca simular conexão/envio real.

## 2. Papéis e ponto de entrada
| Papel | Início | Escopo principal |
|---|---|---|
| Administração | Visão Geral consolidada | Todas as empresas autorizadas, permissões, auditoria e integrações |
| Gestão | Visão Geral gerencial | Indicadores, operações, campanhas, equipe e supervisão |
| Supervisão | Caixa de Entrada / fila da equipe | Redistribuição, SLA, qualidade e acompanhamento do atendimento |
| Recepção | Caixa de Entrada | Atender, assumir conversa livre, registrar atividade, atualizar lead e agenda |
| Viewer | Visão Geral limitada | Somente dados autorizados explicitamente |

Ao trocar de empresa: atualizar imediatamente informações e opções; nenhuma consulta pode vazar dados da empresa anterior. Uma preferência visual de empresa principal não amplia permissões. Na implantação futura do VEKTOR, os perfis serão derivados do sistema de usuários oficial, sem segundo login obrigatória.

## 3. Estrutura de navegação proposta
### Operação (Recepção)
1. Caixa de Entrada (ponto de entrada)
2. Kanban
3. Agenda
4. Leads
5. Minhas tarefas (follow-ups vencidos, hoje, próximos; não uma segunda fonte de dados)
### Coordenação (Supervisão)
Todos os itens da operação + Fila da Equipe, distribuição, pendências, SLA e qualidade.
### Gestão
1. Visão Geral e Radar Comercial (ponto de entrada)
2. Caixa de Entrada (leitura e supervisão)
3. Kanban
4. Agenda
5. Leads e tarefas
6. Campanhas e Conversão
7. Equipe e Produtividade
### Administração
Todos os itens gerenciais + Pessoas, Permissões, Configurações, Integrações e Auditoria.
Não criar links de navegação para funções ainda não implementadas; só anunciar recursos quando forem acionáveis.

## 4. Central de Atendimento: layout e comportamento
- Lista lateral: pesquisa; filtros por empresa, canal, status, atendente, pendência; não lidas e prioridade; número de mensagens não respondidas.
- Centro: histórico cronológico, autoria e origem, anexos com privacidade, caixa de composição; envio exige confirmação de backend.
- Painel direito: dados essenciais do lead, etapa, responsável, etiquetas, procedimento/interesse, fonte, próxima ação, agenda e histórico de alterações.
- Ao abrir conversa desde Kanban: preservar cartão/coluna/filtros/scroll. Voltar retorna ao Kanban no mesmo contexto.
- Ao abrir desde Caixa de Entrada: voltar retorna à lista com seleção/filtros preservados.
- Notas internas claramente separadas das mensagens enviadas para o cliente.
- Alterações de etapa, responsável, follow-up e agendamento atualizam imediatamente tanto o lead quanto os indicadores relacionados, idealmente por mutação transacional e invalidação seletiva de cache.
- Conversas podem ser vistas por toda a recepção autorizada. Uma conversa livre pode ser assumida atomicamente. Transferências de conversa já atribuída são de supervisão/gestão/administração.
- Atribuição e retorno registram autoria e horário.
- Não abrir em janela externa; não oferecer Voltar para VEKTOR dentro do fluxo operacional.

## 5. Kanban
- Colunas personalizáveis por empresa e transições com regras verificáveis, inclusive cancelamento/perda.
- Cartão mínimo: contato, canal/origem, assunto/interesse, responsável, etiquetas, última interação, próxima ação e sinalização de pendência.
- Drag and drop: confirmação visual, persistência e rollback explícito se falhar. Não mudar silenciosamente status de follow-up ou agendamento.
- Busca rápida e filtros compostos; opção de salvar visualizações pessoais.
- Múltiplas etiquetas coloridas por lead, edição com auditoria e escopo de empresa.
- Ações em lote com confirmação e exclusão lógica quando pertinente.
- Dados reais provenientes de backend, sem listas fictícias misturadas.

## 6. Follow-up e Agenda
- Follow-up é entidade/atividade vinculada a lead, com ação, prazo, responsável, situação, canal e resultado. Uma coluna chamada Follow-up não substitui a agenda de atividades.
- Vistas: Atrasados, Hoje, Próximos, Concluídos e Sem responsável.
- Motor de prioridades baseado em regras transparentes; IA pode sugerir prioridade, nunca inventar intenção de compra.
- Agenda: empresa, profissional, serviço, lead, horário, confirmação, comparecimento, falta, reagendamento, conclusão, valores e trilha de alterações.
- Não confundir agendado, compareceu, converteu e receita recebida.

## 7. Visão Geral / Radar Comercial
- Administração e Gestão: volume por empresa, funil, novas conversas, tempo da primeira resposta, follow-ups vencidos, agendamentos confirmados, comparecimentos, conversão e origem comprovada.
- Radar: leads com intenção explícita de agendamento sem resposta, respostas atrasadas, follow-ups com prazo vencido e oportunidades de recuperação. Cada alerta tem ação direta.
- Métricas de campanhas apenas quando origem, eventos e período estiverem disponíveis; taxa sempre com numerador, denominador e janela.
- Recepção não precisa do dashboard estratégico como tela inicial.
- Nunca chamar valores estimados de faturamento efetivo.

## 8. Papéis e segurança
- Admin: visão consolidada; configura integrações, permissões, auditoria.
- Manager: duas clínicas compartilhadas quando aprovado; métricas e gestão de equipe; sem segredos técnicos.
- Supervisor: fila e transferência de conversas, sem integradores e relatórios financeiros sensíveis.
- Reception: leitura de todas as conversas da(s) clínica(s) autorizada(s), assume conversa livre, atualiza atendimento; não gerencia permissões/tokens.
- Papéis e acesso por empresa armazenados no banco e validados por RLS/RPC; esconder menu não é proteção de dados.
- Durante Modo Observação: somente Administração opera, independentemente do papel cadastrado.
- Auditoria: criar/editar/excluir, atribuir/transferir, etapa do funil, agenda, envio, consulta a informações sensíveis.
- LGPD: princípio de minimização; anexos privados; consentimento, retenção e acesso apropriados; IA com revisão humana.

## 9. Compatibilidade futura com VEKTOR
- Criar contrato de integração e mapeamento de entidades: vektor.company_id ↔ atende.company_id, usuários/roles, leads, chats, mensagens, tarefas e eventos.
- Verificar o esquema REAL do VEKTOR antes de elaborar scripts; não assumir que colunas, serviços, rotas, papéis e RLS têm nomes iguais.
- Plano de migração: inventário, backup e congelamento controlado, mapeamento, scripts idempotentes, testes em staging, testes de isolamento e regressão, migração piloto, comutação, monitoramento e plano de rollback.
- Preservar IDs externos, histórico, anexos, autoria e relacionamentos; quando não for possível, criar tabela de mapeamento de IDs.
- Substituir somente o CRM Oficial, mantendo Home, Estratégia, Demandas, Calendários, Growth, Relatórios e Portal do Cliente intactos.
- Adaptar tokens visuais e navegação à marca vektor. sem alterar domínio/modelo de negócio do ATENDE.
- Não migrar integrações experimentais ou dados fictícios.

## 10. Critérios de aceite do primeiro ciclo
- [ ] Admin/Manager abre na Visão Geral; Recepção abre na Caixa de Entrada; Supervisor na fila.
- [ ] Menu do perfil mostra só as páginas pertinentes; backend aplica controles reais.
- [ ] Mesma alteração de lead refletida nas vistas Kanban, Inbox, Agenda e Radar.
- [ ] Seleção de empresa não cruza dados entre Aloe e Nagel.
- [ ] Abrir lead e voltar preserva contexto de origem.
- [ ] Follow-up não duplica evento ou aba sem conexão.
- [ ] Estados de loading, vazio, erro e sem permissão claros.
- [ ] Funcionalidades que dependem de integrações aparecem como indisponíveis, não como conectadas.
- [ ] Testes de permissões de usuário com papéis distintos e Modo Observação.
- [ ] Nenhuma mudança no VEKTOR Oficial até aprovação expressa.

## 11. Sequência de desenvolvimento
Ciclo 1: shell de navegação por perfil, contexto de empresa e abertura da conversa.
Ciclo 2: Kanban configurável e ficha 360° persistentes.
Ciclo 3: tarefas/follow-ups, agenda e histórico sincronizados.
Ciclo 4: Radar/indicadores, produtividade e auditoria.
Ciclo 5: integrações e inteligência comercial, com consentimento e segurança.
Ciclo 6: homologação do ATENDE. e preparação do Prompt Mestre de Migração ao VEKTOR Oficial.
