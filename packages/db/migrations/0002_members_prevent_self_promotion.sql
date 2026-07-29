-- F6 (Threat Modeling Review): defesa em profundidade contra autopromoção a
-- `admin` em `members`. ADR-012 já exige, na camada Service, que só um
-- Membro `admin` ativo conceda `role = 'admin'` a alguém (`assertAdmin` em
-- `ConfiguracoesService.convidarMembro`/`alterarRole`). Este trigger repete a
-- MESMA regra em nível de banco — não uma regra nova — para que uma
-- regressão futura na camada Service (ex.: um novo caminho de código que
-- esqueça `assertAdmin`) não consiga, sozinha, resultar em uma linha com
-- `role = 'admin'` sem que quem a gravou já fosse admin.
--
-- Não usa política de RLS porque a checagem depende de comparar o valor
-- ANTERIOR e o NOVO de `role` na mesma linha (para não bloquear
-- `aceitarConvite`, que atualiza `status`/`user_id` sem tocar `role`) — algo
-- que uma política declarativa de RLS não expressa com a mesma precisão que
-- um trigger com acesso a OLD/NEW.
--
-- Bootstrap preservado (ADR-013): a criação self-service de Workspace grava,
-- na mesma transação, o primeiro Membro com `role = 'admin'` — nesse
-- momento não existe nenhum outro Membro no Workspace para ser "quem
-- autoriza", então essa gravação é permitida sem checagem adicional.
--
-- `acting_user_id` lê `request.jwt.claims` diretamente (ADR-014,
-- `runInRequestContext`), em vez de chamar `auth.uid()` — elimina a
-- dependência da função gerenciada pelo Supabase, amarrando a checagem
-- exclusivamente ao contrato que este projeto já controla e documenta.
-- `SECURITY DEFINER` muda apenas a role usada para checagem de privilégio
-- (`current_user`) — nunca GUCs de sessão como `request.jwt.claims`, que só
-- mudariam com uma cláusula `SET` própria para esse parâmetro, ausente aqui
-- (só há `SET search_path`). Falha fechada por construção: se o GUC não
-- existir (ex.: `service_role` sem sessão de usuário), a extração resulta em
-- `NULL`, e `user_id = NULL` nunca é verdadeiro em SQL — cai exatamente no
-- mesmo caminho de "não privilegiado" de antes, sem branch nova.
--> statement-breakpoint
CREATE FUNCTION "public"."prevent_member_self_promotion"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_user_id uuid := (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
  role_is_new_admin boolean;
  is_privileged boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    role_is_new_admin := (NEW.role = 'admin');
  ELSE
    role_is_new_admin := (NEW.role = 'admin' AND OLD.role IS DISTINCT FROM NEW.role);
  END IF;

  IF role_is_new_admin THEN
    -- Bootstrap: nenhum outro Membro existe ainda neste Workspace (ADR-013).
    IF NOT EXISTS (
      SELECT 1 FROM members
      WHERE workspace_id = NEW.workspace_id AND id <> NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM members
      WHERE workspace_id = NEW.workspace_id
        AND user_id = acting_user_id
        AND status = 'ativo'
        AND role = 'admin'
    ) INTO is_privileged;

    IF NOT is_privileged THEN
      RAISE EXCEPTION 'Apenas um Membro admin ativo pode conceder o papel admin (ADR-012).'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "members_prevent_self_promotion"
BEFORE INSERT OR UPDATE ON "public"."members"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_member_self_promotion"();
