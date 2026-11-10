/* ATENDE. camada operacional independente. A interface HTML original é preservada. */
(async function () {
  const config = window.ATENDE_CONFIG || {};
  const url = String(config.supabaseUrl || "").trim();
  const key = String(config.supabasePublishableKey || "").trim();
  if (!url || !key) return; // sem configuração permanece como demonstração fictícia

  const styles = document.createElement("style");
  styles.textContent = ".atende-auth{position:fixed;z-index:200;inset:0;display:grid;place-items:center;background:#f5f5fa;padding:16px}.atende-auth .card{max-width:400px;width:100%;background:#fff;padding:30px;border:1px solid #e4e3ee;border-radius:18px;box-shadow:0 25px 70px #17153318}.atende-auth input,.atende-field{width:100%;padding:10px;border:1px solid #dedee8;border-radius:8px;margin:6px 0 14px;font:inherit}.atende-auth button,.atende-save{padding:11px 15px;border:0;border-radius:9px;background:#6d4ce4;color:#fff;cursor:pointer}.atende-modal{border:0;border-radius:15px;max-width:480px;width:calc(100% - 28px);padding:25px;box-shadow:0 30px 100px #17153360}.atende-modal::backdrop{background:#17153375}.atende-error{color:#b91c1c;font-size:12px;white-space:pre-wrap}.atende-thread{background:#fff;border:1px solid #e4e4eb;border-radius:12px;padding:15px;margin-top:10px}.atende-msg{padding:9px 12px;background:#eeeefa;border-radius:10px;margin:6px 0;font-size:13px;white-space:pre-wrap}.atende-msg.outbound{background:#ebe5ff;margin-left:15%}.atende-help{font-size:12px;color:#737187}";
  document.head.appendChild(styles);
  const $ = id => document.getElementById(id);
  const alertError = error => window.alert(error?.message || String(error));
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const auth = document.createElement("div"); auth.className = "atende-auth";
  auth.innerHTML = '<div class="card"><h2>atende.</h2><p>CRM exclusivo da Aloe e Nagel</p><form id="atende-login"><label>E-mail<input type="email" name="email" autocomplete="username" required></label><label>Senha<input type="password" name="password" autocomplete="current-password" required></label><p class="atende-error" id="login-error"></p><button type="submit">Entrar no CRM</button></form><p class="atende-help">Apenas contas autorizadas pela administração.</p></div>';
  document.body.append(auth);
  let db;
  try {
    const module = await import("https://esm.sh/@supabase/supabase-js@2.75.0");
    db = module.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});
  } catch(e) { $('login-error').textContent = "Não foi possível carregar a conexão segura. " + e.message; return; }
  let companies = [], companyById = {}, appointments = [], activities = [], conversations = [], messages = [], activeConversation = null;
  const stageMap = {new:"Novo lead",first_contact:"Primeiro contato",attending:"Em atendimento",follow_up:"Follow-up",scheduled:"Agendado",converted:"Convertido",lost:"Perdido"};
  const stageReverse = Object.fromEntries(Object.entries(stageMap).map(([id,label]) => [label,id]));
  const originalRender = render, originalOpenCard = openCard;
  const sep = document.createElement("div");
  sep.id="atende-inbox"; sep.className="hidden";
  $('leads').after(sep);
  const inboxButton = document.createElement("button");
  inboxButton.textContent = "◉ Conversas";
  inboxButton.dataset.tab = "inbox";
  document.querySelector("aside nav").append(inboxButton);
  const headerButton = document.createElement("button");
  headerButton.className="primary"; headerButton.textContent="+ Novo lead";
  document.querySelector("main header").append(headerButton);
  const logout = document.createElement("button");logout.textContent="Sair";logout.className="primary";logout.style.background="#404059";
  document.querySelector("main header").append(logout);
  logout.onclick=()=>db.auth.signOut();
  const formDialog=document.createElement("dialog");formDialog.className="atende-modal";document.body.append(formDialog);
  function modalForm(title, fields, onSubmit) {
    formDialog.innerHTML = '<h2>'+escape(title)+'</h2><form id="atende-editor">'+fields.map(f=>'<label style="display:block;font-size:13px">'+escape(f.label)+(f.type==='select'
      ? '<select class="atende-field" name="'+f.name+'"><option value="">Nenhuma</option>'+(f.options||[]).map(o=>'<option value="'+escape(o.value)+'">'+escape(o.label)+'</option>').join('')+'</select>'
      : '<input class="atende-field" name="'+f.name+'" type="'+(f.type||'text')+'" '+(f.required?'required':'')+' '+(f.type==='number'?'min="0" step="0.01"':'')+' value="'+escape(f.value||'')+'">')+'</label>').join('')+'<p id="atende-editor-error" class="atende-error"></p><button class="atende-save">Salvar</button> <button type="button" id="atende-cancel" class="close">Cancelar</button></form>';
    $('atende-cancel').onclick=()=>formDialog.close();
    $('atende-editor').onsubmit=async event => {
      event.preventDefault();
      const submit=event.currentTarget.querySelector('button[type=submit],button.atende-save');submit.disabled=true;
      const values=Object.fromEntries(new FormData(event.currentTarget).entries());
      try {await onSubmit(values);formDialog.close();await loadData()}catch(e){$('atende-editor-error').textContent=e.message||String(e)}finally{submit.disabled=false}
    };
    formDialog.showModal();
  }
  function chosenCompany() {return companies.find(c=>c.name===$('company').value)?.id || null}
  headerButton.onclick=()=>modalForm("Novo lead",[
    {name:"name",label:"Nome do lead",required:true},{name:"phone",label:"Telefone"},
    {name:"source",label:"Origem do contato",value:"Manual"},{name:"procedure_name",label:"Procedimento de interesse"},
    {name:"owner_name",label:"Responsável"},{name:"estimated_value",label:"Valor estimado",type:"number"},
    ...(window.ATENDE_ATTRIBUTION?.newLeadFields()||[])
  ],async v=>{
    const company_id=chosenCompany();if(!company_id)throw Error("Selecione uma clínica.");
    const attribution=window.ATENDE_ATTRIBUTION?.leadPayload(v)||{};
    const {error}=await db.from("leads").insert({company_id,name:v.name,phone:v.phone||null,source:v.source||"Manual",procedure_name:v.procedure_name||null,owner_name:v.owner_name||null,estimated_value:v.estimated_value?Number(v.estimated_value):null,...attribution});if(error)throw error;
  });
  function leadActions(id) {
    const lead=rows.find(r=>r.id===id);const company_id=chosenCompany();
    if(!lead||!company_id)return;
    const element=document.createElement("div");element.style="display:flex;gap:7px;flex-wrap:wrap;margin:15px 0";
    element.innerHTML='<button class="primary" data-action="follow">+ Follow-up</button><button class="primary" data-action="appointment">+ Agendar</button><button class="primary" data-action="note">+ Interação</button>';
    $('detail').prepend(element);
    element.onclick=e=>{
      const action=e.target.dataset.action;if(!action)return;
      $('dlg').close();
      if(action==="appointment")modalForm("Agendar procedimento",[
        {name:"procedure_name",label:"Procedimento",value:lead.procedure,required:true},
        {name:"scheduled_at",label:"Data e horário",type:"datetime-local",required:true},
        {name:"professional",label:"Profissional"},{name:"amount",label:"Valor combinado (R$)",type:"number",value:lead.value}
      ],async v=>{
        const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sessão encerrada.");
        const {error}=await db.from("appointments").insert({company_id,lead_id:id,procedure_name:v.procedure_name,scheduled_at:new Date(v.scheduled_at).toISOString(),professional:v.professional||null,amount:v.amount?Number(v.amount):null,created_by:user.id});if(error)throw error;
        const up=await db.from('leads').update({stage:'scheduled'}).eq('company_id',company_id).eq('id',id);if(up.error)throw up.error;
      });
      if(action==="follow")modalForm("Programar follow-up",[{name:"content",label:"Próxima ação",required:true},{name:"occurred_at",label:"Data e horário",type:"datetime-local",required:true},{name:"channel",label:"Canal (whatsapp / instagram / messenger / phone)",value:"whatsapp"}],async v=>{
        const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sessão encerrada.");
        const when=new Date(v.occurred_at).toISOString();
        const {error}=await db.from("activities").insert({company_id,lead_id:id,kind:"followup",content:v.content,channel:v.channel||'whatsapp',occurred_at:when,author_id:user.id});if(error)throw error;
        const up=await db.from("leads").update({next_followup_at:when,stage:"follow_up"}).eq("company_id",company_id).eq("id",id);if(up.error)throw up.error;
      });
      if(action==="note")modalForm("Registrar interação",[{name:"content",label:"Resumo da interação",required:true},{name:"channel",label:"Canal",value:"whatsapp"}],async v=>{
        const {data:{user}}=await db.auth.getUser();if(!user)throw Error("Sessão encerrada.");
        const {error}=await db.from("activities").insert({company_id,lead_id:id,kind:"note",content:v.content,channel:v.channel||'other',author_id:user.id});if(error)throw error;
      });
    };
  }
  openCard=function(id){originalOpenCard(id);leadActions(id);};
  render=function(){
    originalRender();
    $('atende-inbox').classList.toggle('hidden',tab!=='inbox');
    if(tab==='inbox')renderInbox();
    document.querySelectorAll('#kanban .column').forEach(col=>{
      col.ondrop=async event=>{
        event.preventDefault();const id=event.dataTransfer.getData("text/plain");const stage=stageReverse[col.dataset.stage];
        const company_id=chosenCompany();if(!id||!stage||!company_id)return;
        const {error}=await db.from("leads").update({stage}).eq("id",id).eq("company_id",company_id);
        if(error)alertError(error);await loadData();
      };
    });
    // Substitui o clique que estava vinculado à função da demonstração.
    document.querySelectorAll('#kanban .lead').forEach(el=>el.onclick=()=>openCard(el.dataset.id));
  };
  inboxButton.onclick=()=>{tab="inbox";document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el===inboxButton));$('title').textContent="Conversas unificadas";render()};
  function renderInbox(){
    const company_id=chosenCompany(), list=conversations.filter(c=>c.company_id===company_id);
    sep.innerHTML='<div style="display:grid;grid-template-columns:minmax(160px,33%) 1fr;gap:12px"><div class="atende-thread"><b>Conversas</b>'+list.map(c=>'<button type="button" data-thread="'+escape(c.id)+'" style="display:block;width:100%;padding:12px;text-align:left;margin:8px 0;border:1px solid #dddde5;border-radius:9px;background:white">'+escape(c.contact_label||"Contato")+'<br><small>'+escape(c.channel)+'</small></button>').join('')+'</div><div class="atende-thread" id="atende-thread"><p>Selecione uma conversa.</p></div></div>';
    sep.querySelectorAll('[data-thread]').forEach(el=>el.onclick=()=>showThread(el.dataset.thread));
    if(activeConversation&&list.some(c=>c.id===activeConversation))void showThread(activeConversation);
  }
  async function showThread(id){
    activeConversation=id;
    const {data,error}=await db.from("messages").select("*").eq("conversation_id",id).eq("company_id",chosenCompany()).order("sent_at",{ascending:true});
    if(error){alertError(error);return}
    messages=data||[];
    const thread=$('atende-thread');if(!thread)return;
    thread.innerHTML='<h3>Atendimento</h3><div style="max-height:330px;overflow:auto">'+messages.map(m=>'<div class="atende-msg '+escape(m.direction)+'">'+escape(m.body||"[Mídia]")+'<br><small>'+escape(m.sent_at)+'</small></div>').join('')+'</div><form id="atende-reply"><textarea class="atende-field" name="text" placeholder="Responder pelo canal conectado..." required></textarea><button class="atende-save">Enviar</button><p class="atende-help">Envio exige integração Meta ativa e Edge Function configurada.</p><p class="atende-error" id="atende-send-error"></p></form>';
    $('atende-reply').onsubmit=async event=>{event.preventDefault();const text=new FormData(event.currentTarget).get('text')?.toString().trim();if(!text)return;
      const {data,error}=await db.functions.invoke("send-message",{body:{conversation_id:id,text}});if(error||data?.error){$('atende-send-error').textContent=error?.message||data.error;return}await showThread(id);
    };
  }
  async function loadData(){
    const company_id=chosenCompany();if(!company_id)return;
    if(window.ATENDE_ATTRIBUTION)await window.ATENDE_ATTRIBUTION.reload();
    const [l,a,p,c]=await Promise.all([
      db.from("leads").select("*").eq("company_id",company_id).order("created_at",{ascending:false}),
      db.from("activities").select("*").eq("company_id",company_id).order("occurred_at",{ascending:false}),
      db.from("appointments").select("*").eq("company_id",company_id),
      db.from("conversations").select("*").eq("company_id",company_id)
    ]);
    for(const res of [l,a,p,c])if(res.error)throw res.error;
    activities=a.data||[];appointments=p.data||[];conversations=c.data||[];
    rows=(l.data||[]).map(x=>{const appointment=appointments.find(p=>p.lead_id===x.id);return{id:x.id,company:companyById[x.company_id]||"Clínica",name:x.name,procedure:x.procedure_name||"Não informado",source:x.source||"Manual",owner:x.owner_name||"Recepção",stage:stageMap[x.stage]||"Novo lead",value:Number(x.estimated_value)||0,first:x.first_contact_at||"",follow:x.next_followup_at||"",appointment:appointment?.scheduled_at||"",bookedAt:appointment?.booked_at||"",paid:Number(appointment?.amount_paid)||0,history:activities.filter(a=>a.lead_id===x.id).map(a=>a.content+" • "+a.occurred_at),...(window.ATENDE_ATTRIBUTION?.annotate(x)||{})}});
    render();
  }
  async function onLogin(){
    const {data:{user}}=await db.auth.getUser();
    if(!user){auth.style.display="grid";return}
    const {data,error}=await db.from("companies").select("id,name").order("name");if(error){$('login-error').textContent=error.message;return}
    companies=data||[];companyById=Object.fromEntries(companies.map(x=>[x.id,/aloe/i.test(x.name)?"Aloe":/nagel/i.test(x.name)?"Nagel":x.name]));
    if(!companies.length){$('login-error').textContent="Esta conta não tem acesso a nenhuma clínica.";return}
    $('company').innerHTML=companies.map(c=>'<option value="'+escape(c.name)+'">'+escape(c.name)+'</option>').join('');
    window.ATENDE_ATTRIBUTION?.connect(db,chosenCompany,companies);
    window.ATENDE_ATTRIBUTION?.setRefresher(loadData);
    $('company').onchange=()=>{activeConversation=null;loadData().catch(alertError)};
    await loadData();auth.style.display="none";
  }
  $('atende-login').onsubmit=async event=>{
    event.preventDefault();$('login-error').textContent="";
    const data=new FormData(event.currentTarget);
    const {error}=await db.auth.signInWithPassword({email:String(data.get("email")),password:String(data.get("password"))});
    if(error){$('login-error').textContent=error.message;return}
    try{await onLogin()}catch(e){$('login-error').textContent=e.message}
  };
  db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){auth.style.display="grid";rows=[];render()}});
  await onLogin().catch(e=>{$('login-error').textContent=e.message});
})();