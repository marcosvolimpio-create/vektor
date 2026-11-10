-- ATENDE. exclusivamente no Supabase independente, jamais no banco do VEKTOR.
-- Executar DEPOIS de 20261110000000_atende_initial.sql.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 180),
  channel text not null default 'instagram' check(channel in ('instagram','facebook','whatsapp','google','other')),
  status text not null default 'active' check(status in ('planned','active','paused','completed')),
  start_date date,
  end_date date,
  external_campaign_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, company_id),
  check(end_date is null or start_date is null or end_date >= start_date)
);
alter table public.campaigns enable row level security;
create policy campaigns_read on public.campaigns for select to authenticated using(private.member_of(company_id));
create policy campaigns_insert on public.campaigns for insert to authenticated with check(private.can_edit(company_id));
create policy campaigns_update on public.campaigns for update to authenticated using(private.can_edit(company_id)) with check(private.can_edit(company_id));
grant select,insert,update on public.campaigns to authenticated;
create index campaigns_company_created on public.campaigns(company_id,created_at desc);
alter table public.leads
  add column campaign_id uuid,
  add column publication_title text,
  add column publication_url text,
  add column publication_platform text,
  add column external_post_id text,
  add column external_ad_id text;
alter table public.leads
  add constraint leads_campaign_same_company foreign key (campaign_id,company_id)
  references public.campaigns(id,company_id) on delete set null (campaign_id);
alter table public.leads
  add constraint leads_publication_url_https check(publication_url is null or publication_url ~* '^https://');
create index leads_company_campaign on public.leads(company_id,campaign_id);
comment on column public.leads.publication_title is 'Título ou descrição do post/anúncio que originou o contato, cadastrado manualmente ou por webhook validado.';
comment on column public.leads.publication_url is 'URL HTTPS da publicação específica, quando disponível. Não inferir atribuição da Meta sem referência confiável.';
comment on column public.leads.external_post_id is 'ID da publicação reportado pela API Meta, quando disponível.';
comment on column public.leads.external_ad_id is 'ID do anúncio Meta quando referido no webhook.';
