# ATENDE. CRM temporário para Aloe e Nagel

**Interface preservada:** `demos/crm-kanban/index.html` é a mesma demonstração publicada em raw.githack. O ATENDE. não usa banco, API nem login do VEKTOR, embora os arquivos desta versão continuem armazenados temporariamente no repositório público `vektor`.

## Estado

- **Modo demonstração:** `config.js` vazio, apenas registros fictícios na interface original.
- **Modo conectado:** com URL + publishable key do **novo** Supabase exclusivo, `live.js` habilita login e operações persistentes, desde que o schema de banco esteja provisionado e as contas da equipe estejam autorizadas.
- **Meta/WhatsApp:** caixa de entrada e botão de resposta estão preparados para consumir `conversations`, `messages` e a Edge Function `send-message`, mas **não são conexão ativa**.
- Não cadastre dados reais no modo de demonstração.

## Publicar em domínio próprio sem alterar o visual

1. Cloudflare > Workers & Pages > Create > Pages > Connect to Git.
2. Selecionar o repositório `marcosvolimpio-create/vektor`.
3. Definir a branch de produção como `public-crm-demo-20261109`.
4. Build command: `exit 0` (HTML estático, sem compilação).
5. Build output directory: `demos/crm-kanban`.
6. Publicar e testar o novo `*.pages.dev` no celular e no computador.

**Esta etapa requer uma conexão/autorização no Cloudflare.** Não deduza uma URL `pages.dev` antes de a publicação ser confirmada.

## Backend independente

Use **outro projeto Supabase**, nunca `VEKTOR` nem `vektor-staging`. O pacote `atende-crm-independente.zip` preparado na conversa inclui uma migração com RLS para `companies`, `company_members`, `leads`, `activities`, `appointments`, `conversations`, `messages` e os adaptadores Meta para desenvolvimento. Revise e teste a migração antes de aplicar.

Somente após configurar o banco e usuários reais, preencher no `config.js`:
- `supabaseUrl`: URL do Supabase exclusivo.
- `supabasePublishableKey`: chave publicável do Supabase exclusivo.

**Nunca colocar senhas, service_role, Meta App Secret, token de WhatsApp ou tokens de páginas no repositório ou no frontend.**

## Autorização da equipe

Aloe e Nagel devem ser linhas separadas em `companies`. A equipe da Aloe só recebe vínculo em `company_members` com a Aloe. A da Nagel recebe vínculo com a Nagel. O admin pode receber vínculo em ambas. Confirmar as políticas RLS com dois usuários de teste antes de colocar pacientes reais.

## Meta/WhatsApp

1. WhatsApp: aprovar a Cloud API para os números empresariais e decidir se a conta manterá o WhatsApp Business no telefone (coexistência, quando elegível).
2. Instagram: autenticar cada conta profissional e obter permissões de mensagens, incluindo `instagram_business_manage_messages` no fluxo de Instagram Login.
3. Facebook: autenticar cada Página com permissões de Messenger, incluindo `pages_messaging` e as permissões de gerenciamento necessárias.
4. Configurar webhooks públicos HTTPS, validar assinatura HMAC, vincular cada ID de número/Página/Instagram ao tenant correto e testar recebimento + envio.
5. Edge Functions devem conferir a sessão/empresa e armazenar segredos no servidor. O envio pelo navegador só chama uma função autenticada.

**A integração não é operacional até que as autorizações e os webhooks sejam testados em contas reais.** Não prometer sincronização histórica sem verificar as limitações do canal.

## Limitações desta implementação inicial

- `live.js` é integração web inicial, não substitui os testes de segurança, LGPD, mídia, mensagens simultâneas, idempotência, controle de sessão, backups e janela de WhatsApp.
- Não há pagamento estruturado nem acompanhamento completo de conversão nesta versão da interface original.
- Evitar compartilhar links públicos com dados de pacientes. A página publica apenas código estático; dados reais só são carregados com autenticação e RLS.
