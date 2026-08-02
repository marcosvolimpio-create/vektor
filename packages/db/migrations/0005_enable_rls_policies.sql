-- Sprint 5 — Habilita Row Level Security em todas as 13 tabelas de domínio.
-- Desenho: docs/database/rls-policies.md. Resolução de recursão em `members`:
-- ARCHITECTURE_RESOLUTION.md A7 ("function security definer"). Papel de
-- `service_role`/transação por requisição: ADR-014 (DECISIONS.md).
--
-- RLS é defesa em profundidade (IMPLEMENTATION_STANDARDS.md Regra Absoluta
-- nº7) — nunca substitui a validação de regra de negócio já feita em
-- packages/services (ADR-004, ADR-012, dupla amarração de Experimento, etc.).
-- Nenhuma política abaixo decide invariante de produto, só isolamento de
-- tenant, exatamente como rls-policies.md especifica.

-- ---------------------------------------------------------------------------
-- Função security definer: resolve pertencimento a Workspace sem recursão.
-- SECURITY DEFINER ignora RLS internamente ao consultar `members` — é
-- exatamente o mecanismo que A7 decidiu para evitar a autorreferência
-- (política de `members` que precisaria consultar `members` para se avaliar).
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and status = 'ativo'
  );
$$;

-- Segunda função security definer, mesmo motivo da primeira: uma subquery
-- comum contra `members` dentro de uma policy fica sujeita à própria RLS de
-- `members`, o que faria "nenhum Membro existe" parecer verdadeiro para
-- qualquer usuário que não seja membro (porque a política de `members`
-- filtraria as linhas da visão dele) — vazando a condição de bootstrap para
-- qualquer Workspace alheio. SECURITY DEFINER ignora RLS aqui, vendo a
-- existência real de Membros, não a visão filtrada do chamador.
create or replace function public.workspace_is_new(target_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from members where workspace_id = target_workspace_id
  );
$$;

-- ---------------------------------------------------------------------------
-- workspaces — select/insert (ADR-013: criação self-service, sem exigir
-- pertencimento prévio). Sem update/delete: nenhuma fonte documenta edição
-- ou remoção de Workspace após criado.
-- ---------------------------------------------------------------------------
alter table workspaces enable row level security;

-- `using` cobre dois caminhos: (1) membro ativo, caso normal; (2) bootstrap
-- — no instante em que `WorkspaceService.criarWorkspace` insere a linha em
-- `workspaces`, a linha de `members` do fundador ainda não existe (é o passo
-- seguinte, mesma transação). Sem essa segunda condição, o `RETURNING` do
-- INSERT falha a checagem de visibilidade de SELECT e o Postgres rejeita o
-- INSERT inteiro — mesmo tipo de janela já tratado em `members_insert`.
-- Não abre brecha: nenhum Workspace já fundado permanece com zero Membros,
-- e `workspace_is_new` (security definer) vê a existência real de Membros,
-- não a visão filtrada de RLS do chamador (ver comentário da função acima).
create policy workspaces_select on workspaces
  for select to authenticated
  using (
    public.is_workspace_member(id)
    or public.workspace_is_new(id)
  );

create policy workspaces_insert on workspaces
  for insert to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- members — select/insert/update. `insert` cobre dois caminhos legítimos:
-- (1) convite, por um admin que já é membro ativo do Workspace; (2) fundação
-- self-service (ADR-013), em que o próprio usuário se insere como primeiro
-- Membro de um Workspace que acabou de criar — nesse instante ele ainda não
-- é membro, então a condição de bootstrap (nenhum Membro existe ainda para
-- este Workspace) libera exatamente essa única inserção. `role`/`status` só
-- podem ser decididos por admin — isso é validado em ConfiguracoesService,
-- não aqui (rls-policies.md é explícito: RLS garante só isolamento).
-- Sem delete: remoção é sempre status = 'removido' (Regra Absoluta nº8).
-- ---------------------------------------------------------------------------
alter table members enable row level security;

-- `or user_id = auth.uid()`: mesma classe de correção de `workspaces_select`
-- — o RETURNING do insert do fundador (bootstrap, ADR-013) precisa que a
-- linha recém-inserida seja visível no mesmo instante, e `is_workspace_member`
-- ainda não teria como enxergar essa própria linha a tempo. Ver sempre a
-- própria linha de Membro (independente de status) não vaza dado de
-- terceiros — é o usuário vendo só a si mesmo.
create policy members_select on members
  for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    or user_id = (select auth.uid())
  );

-- `workspace_is_new` (já definida acima para `workspaces_select`) substitui
-- uma subquery crua contra `members` aqui — essa subquery direta contra a
-- própria tabela é exatamente o padrão que causa "infinite recursion
-- detected in policy for relation members" quando `members_insert` precisa
-- ser avaliada junto com `members_select` (RETURNING do insert do fundador).
-- Reutilizar a função security definer evita a autorreferência.
create policy members_insert on members
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    or (
      user_id = (select auth.uid())
      and public.workspace_is_new(workspace_id)
    )
  );

create policy members_update on members
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- strategies / strategy_steps / strategy_objectives — select/insert/update,
-- isolamento puro. ADR-003 (uma ativa por vez) é imposto pelo índice único
-- parcial já existente no schema, não por RLS (rls-policies.md é explícito
-- sobre isso).
-- ---------------------------------------------------------------------------
alter table strategies enable row level security;

create policy strategies_select on strategies
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy strategies_insert on strategies
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy strategies_update on strategies
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

alter table strategy_steps enable row level security;

create policy strategy_steps_select on strategy_steps
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy strategy_steps_insert on strategy_steps
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy strategy_steps_update on strategy_steps
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

alter table strategy_objectives enable row level security;

create policy strategy_objectives_select on strategy_objectives
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy strategy_objectives_insert on strategy_objectives
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy strategy_objectives_update on strategy_objectives
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- campaigns / tactics — select/insert apenas. Sem update/delete documentado
-- (CampaignsRepository/TacticsRepository não expõem esses métodos hoje).
-- ---------------------------------------------------------------------------
alter table campaigns enable row level security;

create policy campaigns_select on campaigns
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy campaigns_insert on campaigns
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

alter table tactics enable row level security;

create policy tactics_select on tactics
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy tactics_insert on tactics
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- actions — select/insert/update (RFC-004: transições de status).
-- ---------------------------------------------------------------------------
alter table actions enable row level security;

create policy actions_select on actions
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy actions_insert on actions
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy actions_update on actions
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- evidences — select/insert apenas. Append-only por design (RFC-005 crit. 2).
-- ---------------------------------------------------------------------------
alter table evidences enable row level security;

create policy evidences_select on evidences
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy evidences_insert on evidences
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- hypotheses / experiments — select/insert/update (máquina de estados,
-- RFC-004). A política não decide quem pode setar approved_by — isso é
-- regra de aplicação (ADR-012), não de isolamento de tenant.
-- ---------------------------------------------------------------------------
alter table hypotheses enable row level security;

create policy hypotheses_select on hypotheses
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy hypotheses_insert on hypotheses
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy hypotheses_update on hypotheses
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

alter table experiments enable row level security;

create policy experiments_select on experiments
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy experiments_insert on experiments
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy experiments_update on experiments
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- learnings — select/insert apenas. Append-only (RFC-005 crit. 2).
-- ---------------------------------------------------------------------------
alter table learnings enable row level security;

create policy learnings_select on learnings
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy learnings_insert on learnings
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- integrations — select/insert/update/delete. Única tabela com delete
-- documentável (rls-policies.md) — hoje sem nenhum Service/UI a utilizá-la
-- (RFC-008, Fase 9), mas a política já reflete o desenho documentado.
-- ---------------------------------------------------------------------------
alter table integrations enable row level security;

create policy integrations_select on integrations
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy integrations_insert on integrations
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy integrations_update on integrations
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy integrations_delete on integrations
  for delete to authenticated
  using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- execution_recommendations (Sprint 4) — não coberta por rls-policies.md
-- (escrito antes da entidade existir). Mesmo padrão de actions/hypotheses/
-- experiments: select/insert/update (status pendente→aceita/descartada),
-- sem delete (ExecutionRecommendationsRepository não expõe esse método).
-- ---------------------------------------------------------------------------
alter table execution_recommendations enable row level security;

create policy execution_recommendations_select on execution_recommendations
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy execution_recommendations_insert on execution_recommendations
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy execution_recommendations_update on execution_recommendations
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
