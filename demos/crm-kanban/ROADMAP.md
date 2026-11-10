# ATENDE. | Plano de produto aprovado | 10 nov 2026

**Escopo:** CRM temporário independente, exclusivo Aloe Medicina Estética e Nagel Anatomia dos Pés. Não integrar ao VEKTOR Oficial. UI atual da Vercel preservada.

## 1. Fundamentos obrigatórios antes de dados reais
- Novo projeto Supabase em organização explicitamente aprovada, sujeito à autorização de custos.
- Autenticação, RLS por empresa e papel, registro de auditoria, política de retenção LGPD.
- Testes de isolamento, backups, monitoramento, armazenamento privado e permissões.
- O sistema público atual é **demonstração**, nunca usar dados reais nele.

## 2. Caixa de entrada omnichannel
- Meta WhatsApp Cloud API, Instagram Login, Facebook Messenger com autenticação e webhooks oficiais.
- Configuração de conexão por clínica, sem copiar token no navegador.
- Atribuição e transferência de atendente, não lidas, notas privadas, histórico de conversa e status de entrega.
- Anexos múltiplos e vídeos de até 500 MB no armazenamento próprio; limites de envio de cada canal respeitados.
- Coexistência WhatsApp Business sujeita à elegibilidade de cada número. Não migrar nem remover apps sem teste.

## 3. IA de apoio comercial
- IA exclusivamente como rascunho, jamais envio automático.
- Corrigir, refinar, resumir conversas e sugerir follow-ups com base em dados verificáveis.
- Limites de dados enviados ao modelo, política de privacidade, auditoria e revisão humana.
- Não inventar valores, indicações ou promessas clínicas.

## 4. Motor de follow-up
- Próxima ação, prazo, responsável, lembretes, status de execução, canal e resultado registrado.
- Priorização por demanda e intenção explícita; regras de janela de mensagens e templates WhatsApp.
- Análise de eficácia por abordagem somente a partir de envios/resultados reais; apresentar amostras e ressalvas.

## 5. Kanban flexível
- Etiquetas coloridas múltiplas, separadas por clínica, CRUD com validação de pertencimento.
- Filtros por procedimento, campanha, publicação, atendente, etapa, prioridade e etiqueta.
- Busca rápida e ações em lote com autorização e confirmação.
- Implementação atual de etiquetas é **apenas demonstração em memória**.

## 6. Agenda comercial
- Agendamento por procedimento e profissional; confirmação, comparecimento, falta, reagendamento e conclusão.
- Histórico do ciclo e receita confirmada vs. valor estimado.
- Respeitar disponibilidade e integrações existentes; evitar agendamentos duplicados.

## 7. Inteligência de campanhas
- Cadastro de campanhas, vínculo de publicação de origem e IDs de anúncios quando fornecidos pela Meta.
- Atribuição explícita e rastreável; caso indisponível, mostrar origem desconhecida, nunca inventar.
- Relatórios por campanha, canal, publicação, clínica, atendente, agendamento, conversão e receita.

## Sequência de implementação
1. Projeto Supabase independente e testes de segurança.
2. Integração Meta e canais reais.
3. Atendimento operacional via Kanban.
4. Etiquetas e filtros persistidos.
5. Agenda/follow-ups e eventos de resultado.
6. IA contextual e painel de eficácia com dados reais.
7. Relatórios e automações assistidas.

## Não concluído
- Supabase exclusivo ainda não criado.
- Nenhum WhatsApp/Instagram/Messenger foi conectado.
- IA e envio de mídia reais ainda dependem de backend e aprovações.
- Não liberar pacientes reais até auditoria e testes.
