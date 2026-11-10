/* ATENDE. Campanhas e atribuição da publicação de origem. */
(function () {
  const demoCampaigns = [
    {id:"demo-aloe-black",company:"Aloe",name:"Black November • Resgate a si mesmo",channel:"instagram",status:"active",start_date:"2026-11-01"},
    {id:"demo-aloe-co2",company:"Aloe",name:"Laser CO₂ • Conversas",channel:"instagram",status:"active",start_date:"2026-11-05"},
    {id:"demo-nagel-pes",company:"Nagel",name:"Cuidados com os pés • Novembro",channel:"facebook",status:"active",start_date:"2026-11-06"}
  ];
  const demoAttributions = {
    1:{campaignId:"demo-aloe-black",publicationTitle:"Botox Full Face • Black November",publicationPlatform:"instagram"},
    3:{campaignId:"demo-aloe-co2",publicationTitle:"Laser CO₂ • Avaliação gratuita",publicationPlatform:"instagram"},
    6:{campaignId:"demo-nagel-pes",publicationTitle:"Seus pés merecem cuidado profissional",publicationPlatform:"facebook"}
  };
  let db=null, getCompanyId=null, reloadLeads=null;
  let campaigns=demoCampaigns.map(c=>({...c}));
  let editing=null;
  const el=id=>document.getElementById(id);
  const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const currentCompany=()=>el("company").value;
  function relevant(){
    const name=currentCompany();
    return campaigns.filter(c=>name==="all"||c.company===name);
  }
  function campaignLabel(row){
    return campaigns.find(c=>c.id===row.campaignId && c.company===row.company)?.name || (row.campaignId?"Campanha não disponível":"Não vinculada");
  }
  function validUrl(value){
    if(!value)return null;
    try {const url=new URL(value);return url.protocol==="https:" ? url.href : null} catch {return null}
  }
  function decorateCards(){
    document.querySelectorAll("#kanban article.lead").forEach(card=>{
      const item=rows.find(x=>String(x.id)===card.dataset.id);
      if(!item||card.querySelector(".attribution-info"))return;
      const block=document.createElement("div");
      block.className="attribution-info";
      const link=validUrl(item.publicationUrl);
      block.innerHTML='<div class="attr-kicker">CAMPANHA</div><div class="attr-name">'+safe(campaignLabel(item))+'</div>'+
        '<div class="attr-kicker" style="margin-top:8px">PUBLICAÇÃO DE ORIGEM</div>'+
        '<div class="attr-name">'+safe(item.publicationTitle||"Ainda não identificada")+'</div>'+
        (link?'<a class="attr-link" href="'+safe(link)+'" target="_blank" rel="noopener noreferrer">Abrir publicação ↗</a>':'');
      const first=card.querySelector(".price");
      if(first)first.before(block);else card.append(block);
    });
  }
  const styles=document.createElement("style");
  styles.textContent=".attribution-info{padding:10px;margin:10px 0;background:#f8f7fc;border:1px solid #eeedf5;border-radius:9px}.attr-kicker{font-size:9px;font-weight:750;letter-spacing:1px;color:#9490a7}.attr-name{font-size:11px;line-height:1.4;margin-top:3px;color:#414056;overflow-wrap:anywhere}.attr-link{display:inline-block;font-size:10px;margin-top:6px;color:#6748c5;text-decoration:none}.campaign-heading{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:8px 0 16px}.campaign-heading h3{margin:0;font-size:19px}.campaign-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:13px}.campaign-card{background:white;border:1px solid #e9e8f0;border-radius:14px;padding:19px}.campaign-card h4{margin:7px 0;font-size:15px;color:#292640}.campaign-card small{font-size:11px;color:#77758a}.campaign-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:12px}.campaign-pill{border-radius:8px;padding:5px 8px;background:#f4f0ff;color:#664bbb;font-size:10px;font-weight:700}.campaign-empty{padding:30px;background:white;border-radius:14px;border:1px dashed #d7d1e4;color:#747187}.campaign-modal{border:0;border-radius:17px;max-width:510px;width:calc(100% - 24px);padding:24px;box-shadow:0 25px 75px #17153355}.campaign-modal::backdrop{background:#16132977}.campaign-modal label{display:block;font-size:12px;color:#4a475e;margin-top:12px}.campaign-modal input,.campaign-modal select,.campaign-modal textarea{font:inherit;width:100%;padding:10px;border:1px solid #deddE8;border-radius:8px;margin-top:5px;background:white}.campaign-modal footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.campaign-modal .secondary{border:1px solid #dddce7;border-radius:9px;padding:10px 13px;background:#fff}.campaign-modal .error{font-size:12px;color:#bd263e}.campaign-detail{background:#f8f7fc;border:1px solid #eeecf7;border-radius:10px;padding:13px;margin-bottom:13px}.campaign-detail p{margin:4px 0 0;font-size:12px}.campaign-detail a{display:inline-block;margin-top:8px;font-size:12px;color:#6748c5}.campaign-form-note{font-size:11px;color:#8b8798}.campaign-actions button{border:0;border-radius:9px;padding:10px 13px;background:#6d4ce4;color:#fff;cursor:pointer}@media(max-width:600px){.campaign-grid{grid-template-columns:1fr}}";
  document.head.append(styles);
  const section=document.createElement("section");section.id="campaigns";section.className="hidden";el("leads").after(section);
  const nav=document.createElement("button");nav.textContent="▣ Campanhas";nav.dataset.tab="campaigns";document.querySelector("aside nav").append(nav);
  const modal=document.createElement("dialog");modal.className="campaign-modal";document.body.append(modal);
  function fields(form){
    const data=new FormData(form);
    return Object.fromEntries(data.entries());
  }
  function modalWindow(title,html,submit){
    modal.innerHTML='<h2 style="margin:0">'+safe(title)+'</h2><form id="atende-campaign-form">'+html+'<p class="error" id="atende-campaign-error"></p><footer><button type="button" class="secondary" id="atende-campaign-close">Cancelar</button><button type="submit" class="primary">Salvar</button></footer></form>';
    el("atende-campaign-close").onclick=()=>modal.close();
    el("atende-campaign-form").onsubmit=async ev=>{
      ev.preventDefault();
      const form=ev.currentTarget,button=form.querySelector('button[type="submit"]');
      button.disabled=true;
      try{await submit(fields(form));modal.close();if(db&&reloadLeads)await reloadLeads();else render()}
      catch(error){el("atende-campaign-error").textContent=error?.message||String(error)}
      finally{button.disabled=false}
    };
    modal.showModal();
  }
  function optionsFor(company,selected){
    return '<option value="">Sem campanha vinculada</option>'+campaigns.filter(c=>c.company===company).map(c=>
      '<option value="'+safe(c.id)+'" '+(c.id===selected?'selected':'')+'>'+safe(c.name)+'</option>').join("");
  }
  function editLead(item){
    if(!item)return;
    modalWindow("Origem do lead",
      '<p class="campaign-form-note">Informe a campanha e a publicação específica que originou o contato. Sem atribuição automática enquanto as APIs Meta não estiverem conectadas.</p>'+
      '<label>Campanha<select name="campaign_id">'+optionsFor(item.company,item.campaignId)+'</select></label>'+
      '<label>Publicação / criativo<input name="publication_title" maxlength="240" placeholder="Ex.: Story Black November • Botox" value="'+safe(item.publicationTitle||"")+'"></label>'+
      '<label>Link da publicação (HTTPS)<input type="url" name="publication_url" placeholder="https://www.instagram.com/p/..." value="'+safe(item.publicationUrl||"")+'"></label>'+
      '<label>Canal<select name="publication_platform">'+["","instagram","facebook","whatsapp","google","outro"].map(c=>'<option value="'+c+'" '+(c===(item.publicationPlatform||"")?"selected":"")+'>'+safe(c||"Não definido")+'</option>').join("")+'</select></label>',
      async values=>{
        const belongs=campaigns.some(c=>c.id===values.campaign_id&&c.company===item.company);
        if(values.campaign_id&&!belongs)throw Error("A campanha selecionada não pertence a esta clínica.");
        const link=values.publication_url?validUrl(values.publication_url):null;
        if(values.publication_url&&!link)throw Error("A publicação precisa ter um link HTTPS válido.");
        const patch={campaign_id:values.campaign_id||null,publication_title:values.publication_title.trim()||null,publication_url:link,publication_platform:values.publication_platform||null};
        if(db){
          const company_id=getCompanyId?.();
          if(!company_id)throw Error("Selecione uma clínica.");
          const {error}=await db.from("leads").update(patch).eq("id",item.id).eq("company_id",company_id);
          if(error)throw error;
        }else{
          Object.assign(item,{campaignId:patch.campaign_id,publicationTitle:patch.publication_title,publicationUrl:patch.publication_url,publicationPlatform:patch.publication_platform});
        }
      }
    );
  }
  function newCampaign(){
    const chosen=currentCompany();
    modalWindow("Cadastrar campanha",
      '<p class="campaign-form-note">A campanha será vinculada somente à clínica selecionada.</p>'+
      '<label>Clínica<select name="company" required>'+["Aloe","Nagel"].filter(c=>!db||chosen==="all"||chosen===c).filter(c=>!db||Object.values(tenantMap).includes(c)).map(c=>'<option value="'+safe(c)+'" '+(chosen===c?'selected':'')+'>'+safe(c==="Aloe"?"Aloe Medicina Estética":"Nagel Anatomia dos Pés")+'</option>').join("")+'</select></label>'+
      '<label>Nome da campanha<input name="name" maxlength="180" placeholder="Ex.: Black November" required></label>'+
      '<label>Canal<select name="channel"><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option><option value="google">Google</option><option value="other">Outros</option></select></label>'+
      '<label>Status<select name="status"><option value="active">Ativa</option><option value="planned">Planejada</option><option value="paused">Pausada</option><option value="completed">Encerrada</option></select></label>'+
      '<label>Início<input name="start_date" type="date"></label><label>Término<input name="end_date" type="date"></label>'+
      '<label>Observações<textarea name="notes" rows="2" maxlength="1500"></textarea></label>',
      async values=>{
        const name=values.name.trim();if(!name)throw Error("Informe o nome da campanha.");
        if(values.end_date&&values.start_date&&values.end_date<values.start_date)throw Error("A data final não pode anteceder o início.");
        if(db){
          const company_id=Object.entries(tenantMap).find(([,label])=>label===values.company)?.[0];
          if(!company_id)throw Error("Sem acesso a esta clínica.");
          const {error}=await db.from("campaigns").insert({
            company_id,name,channel:values.channel,status:values.status,
            start_date:values.start_date||null,end_date:values.end_date||null,notes:values.notes.trim()||null
          });if(error)throw error;
          await reload();
        }else{
          campaigns.push({id:"demo-"+crypto.randomUUID(),company:values.company,name,channel:values.channel,status:values.status,start_date:values.start_date||null,end_date:values.end_date||null,notes:values.notes});
        }
      }
    );
  }
  let tenantMap={};
  function renderCampaigns(){
    const list=relevant(),active=(currentCompany()==="all"?rows:rows.filter(x=>x.company===currentCompany()));
    const status={active:"Ativa",planned:"Planejada",paused:"Pausada",completed:"Encerrada"};
    section.innerHTML='<div class="campaign-heading"><div><h3>Campanhas</h3><p style="font-size:12px;margin:6px 0">Organize ações de marketing e relacione cada lead à publicação que gerou o contato.</p></div><div class="campaign-actions"><button id="atende-new-campaign">+ Nova campanha</button></div></div>'+
      (list.length?'<div class="campaign-grid">'+list.map(c=>{
        const linked=active.filter(x=>x.campaignId===c.id);
        const amount=linked.reduce((sum,x)=>sum+(Number(x.value)||0),0);
        return '<article class="campaign-card"><small>'+safe(c.company==="Aloe"?"Aloe Medicina Estética":"Nagel Anatomia dos Pés")+' · '+safe(c.channel)+'</small><h4>'+safe(c.name)+'</h4><div class="campaign-meta"><span class="campaign-pill">'+safe(status[c.status]||c.status)+'</span><span class="campaign-pill">'+linked.length+' leads vinculados</span></div><p style="font-size:13px;margin:14px 0 0">Potencial: <b>'+amount.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+'</b></p><small>'+safe(c.start_date?"Início: "+c.start_date:"Sem data de início")+'</small></article>';
      }).join("")+'</div>':'<div class="campaign-empty">Nenhuma campanha cadastrada nesta clínica.</div>');
    el("atende-new-campaign").onclick=newCampaign;
  }
  const originalRender=render;
  render=function(){
    originalRender();
    section.classList.toggle("hidden",tab!=="campaigns");
    if(tab==="campaigns")renderCampaigns();
    decorateCards();
  };
  const oldOpen=openCard;
  openCard=function(id){
    oldOpen(id);
    const item=rows.find(x=>String(x.id)===String(id));
    if(!item)return;
    const link=validUrl(item.publicationUrl);
    const info=document.createElement("div");info.className="campaign-detail";
    info.innerHTML='<div class="label">CAMPANHA DE ORIGEM</div><p>'+safe(campaignLabel(item))+'</p>'+
      '<div class="label" style="margin-top:12px">PUBLICAÇÃO DE ORIGEM</div><p>'+safe(item.publicationTitle||"Não identificada")+'</p>'+
      '<p>Canal: '+safe(item.publicationPlatform||item.source||"Não informado")+'</p>'+
      (link?'<a target="_blank" rel="noopener noreferrer" href="'+safe(link)+'">Abrir publicação ↗</a>':'')+
      '<div style="margin-top:11px"><button type="button" class="primary" id="atende-attribution-edit">Editar origem</button></div>';
    el("detail").prepend(info);
    el("atende-attribution-edit").onclick=()=>{el("dlg").close();editLead(item)};
  };
  function goCampaigns(){
    tab="campaigns";
    document.querySelectorAll("aside nav [data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab==="campaigns"));
    el("title").textContent="Campanhas e origens";
    render();
  }
  nav.onclick=goCampaigns;
  async function reload(){
    if(!db)return;
    const id=getCompanyId?.();
    if(!id){campaigns=[];render();return}
    const {data,error}=await db.from("campaigns").select("*").eq("company_id",id).order("created_at",{ascending:false});
    if(error)throw error;
    campaigns=(data||[]).map(c=>({...c,company:tenantMap[c.company_id]}));
  }
  function linkDemo(){
    if(db)return;
    rows.forEach(r=>{if(demoAttributions[r.id])Object.assign(r,demoAttributions[r.id])});
    render();
  }
  window.ATENDE_ATTRIBUTION={
    connect(supabase,fn,companies){
      db=supabase;getCompanyId=fn;tenantMap=Object.fromEntries(companies.map(c=>[c.id,c.name]));campaigns=[];
    },
    setRefresher(fn){reloadLeads=fn},
    reload,
    newLeadFields(){
      const company=currentCompany();
      return [
        {name:"campaign_id",label:"Campanha (opcional)",type:"select",options:campaigns.filter(c=>c.company===company).map(c=>({value:c.id,label:c.name}))},
        {name:"publication_title",label:"Publicação de origem"},
        {name:"publication_url",label:"Link HTTPS do post/anúncio"},
        {name:"publication_platform",label:"Canal da publicação"}
      ];
    },
    leadPayload(values){
      const id=values.campaign_id||null;
      if(id&&!campaigns.some(c=>c.id===id&&c.company===currentCompany()))throw Error("A campanha não pertence à clínica.");
      const link=values.publication_url?validUrl(values.publication_url):null;
      if(values.publication_url&&!link)throw Error("O link da publicação precisa usar HTTPS.");
      return {campaign_id:id,publication_title:values.publication_title?.trim()||null,publication_url:link,publication_platform:values.publication_platform?.trim()||null};
    },
    annotate(row){
      return {campaignId:row.campaign_id||null,publicationTitle:row.publication_title||null,publicationUrl:row.publication_url||null,publicationPlatform:row.publication_platform||null};
    }
  };
  linkDemo();
})();
