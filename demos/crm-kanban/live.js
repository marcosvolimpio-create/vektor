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
  const googleButton=document.createElement("button");
  googleButton.type="button";
  googleButton.textContent="Entrar com Google";
  googleButton.style="width:100%;margin-top:12px;background:white;color:#302b46;border:1px solid #dad5e7;font-weight:700";
  auth.querySelector(".card").append(googleButton);
  const requestPanel=document.createElement("div");
  requestPanel.hidden=true;
  requestPanel.innerHTML='<h3>Solicitar acesso</h3><p class="atende-help">Sua conta está autenticada, mas ainda precisa ser aprovada. Gestão e Recepção podem trabalhar nas duas clínicas, respeitando os papéis autorizados.</p><form id="atende-access-form"><label>Clínica principal<select class="atende-field" name="clinic"><option value="aloe">Aloe Medicina Estética</option><option value="nagel">Nagel Anatomia dos Pés</option></select></label><label>Perfil<select class="atende-field" name="role"><option value="reception">Recepção</option><option value="manager">Gestão</option><option value="supervisor">Supervisão</option></select></label><button type="submit">Solicitar acesso</button></form><p class="atende-help" id="atende-request-feedback"></p><button type="button" id="atende-request-logout" style="background:white;color:#554971">Sair</button>';
  auth.querySelector(".card").append(requestPanel);
  let db;
  try {
    const module = await import("https://esm.sh/@supabase/supabase-js@2.75.0");
    db = module.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});
  } catch(e) { $('login-error').textContent = "Não foi possível carregar a conexão segura. " + e.message; return; }
  googleButton.onclick=async()=>{
    googleButton.disabled=true;
    const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+window.location.pathname}});
    if(error){$("login-error").textContent="Não foi possível iniciar o Google: "+error.message;googleButton.disabled=false;}
  };
  $("atende-request-logout").onclick=()=>db.auth.signOut();
  $("atende-access-form").onsubmit=async event=>{
    event.preventDefault();
    const form=event.currentTarget, values=new FormData(form);
    const btn=form.querySelector("button[type=submit]");btn.disabled=true;
    const {data,error}=await db.rpc("request_clinic_access",{p_clinic_slug:String(values.get("clinic")),p_requested_role:String(values.get("role"))});
    $("atende-request-feedback").textContent=error?error.message:(data==="already_member"?"Acesso cadastrado. Atualize a página.":"Solicitação enviada. Aguarde a aprovação da administração.");
    btn.disabled=false;
  };
  const approvalsView=document.createElement("section");
  approvalsView.id="atende-approvals";approvalsView.className="hidden";
  $("leads").after(approvalsView);
  const approvalsButton=document.createElement("button");
  approvalsButton.dataset.tab="approvals";approvalsButton.textContent="Aprovar acessos";
  approvalsButton.hidden=true;
  document.querySelector("aside nav").append(approvalsButton);
  let memberRoles={};
  async function renderApprovals(){
    const clinicId=chosenCompany();
    if(!clinicId||memberRoles[clinicId]!=="admin"){
      approvalsView.innerHTML="<p>Somente o Administrador aprova novos acessos.</p>";return;
    }
    const {data:requests,error}=await db.from("access_requests")
      .select("id,requester_email,requested_role,requested_at")
      .eq("company_id",clinicId).eq("status","pending").order("requested_at",{ascending:true});
    if(error){approvalsView.textContent=error.message;return;}
    approvalsView.innerHTML="<h3>Aprovar acessos</h3><p>Os aprovados poderão trabalhar nas duas clínicas. Recepção terá uma clínica principal e poderá apoiar a outra.</p>"+
      ((requests||[]).length?(requests||[]).map(x=>
        '<div class="detail" data-request="'+escape(x.id)+'"><strong>'+escape(x.requester_email||"Usuário")+
        '</strong><p>Perfil solicitado: '+escape(x.requested_role)+'</p>'+
        '<select data-granted class="atende-field"><option value="reception" '+(x.requested_role==="reception"?"selected":"")+'>Recepção</option>'+
        '<option value="manager" '+(x.requested_role==="manager"?"selected":"")+'>Gestão</option>'+
        '<option value="supervisor" '+(x.requested_role==="supervisor"?"selected":"")+'>Supervisão</option></select>'+
        '<button type="button" class="atende-save" data-review="approve">Aprovar</button> '+
        '<button type="button" class="close" data-review="reject">Rejeitar</button></div>'
      ).join(""):'<p class="atende-help">Sem solicitações pendentes nesta clínica.</p>');
    approvalsView.querySelectorAll("[data-review]").forEach(button=>button.onclick=async()=>{
      const box=button.closest("[data-request]"),approve=button.dataset.review==="approve";
      if(!confirm(approve?"Autorizar este usuário a trabalhar nas duas clínicas?":"Rejeitar solicitação?"))return;
      button.disabled=true;
      const {error}=await db.rpc("review_clinic_access",{
        p_request_id:box.dataset.request,p_approve:approve,p_granted_role:box.querySelector("[data-granted]").value
      });
      if(error){alertError(error);button.disabled=false;return;}
      await renderApprovals();
    });
  }
  approvalsButton.onclick=()=>{
    tab="approvals";
    document.querySelectorAll("aside nav [data-tab]").forEach(x=>x.classList.toggle("active",x===approvalsButton));
    $("title").textContent="Aprovar acessos";render();
  };
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
  function chosenCompany() {return companies.find(c=>companyById[c.id]===$('company').value)?.id || null}
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
    approvalsView.classList.toggle("hidden",tab!=="approvals");
    if(tab==="approvals")void renderApprovals();
    $('atende-inbox').classList.toggle('hidden',tab!=='inbox');
    if(tab==='inbox')renderInbox();
    document.querySelectorAll('#kanban .column').forEach(col=>{
      col.ondrop=async event=>{
        event.preventDefault();const id=event.dataTransfer.getData("text/plain");const stage=stageReverse[col.dataset.stage];
        const company_id=chosenCompany();if(!id||!stage||!company_id)return;
        const {error}=await db.from("leads").update({stage}).eq("id",id).eq("company_id",company_id);
        if(error){alertError(error);return}
        await loadData();
      };
    });
    // Substitui o clique que estava vinculado à função da demonstração.
    document.querySelectorAll('#kanban .lead').forEach(el=>el.onclick=()=>openCard(el.dataset.id));
  };
  inboxButton.onclick=()=>{tab="inbox";document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el===inboxButton));$('title').textContent="Conversas unificadas";render()};
  let messengerView=null;
  function renderInbox(){
    const company_id=chosenCompany();
    const canSupervise=memberRoles[company_id]&&["admin","manager","supervisor"].includes(memberRoles[company_id]);
    const list=conversations.filter(c=>c.company_id===company_id).map(c=>({
      ...c,
      company: companyById[c.company_id]||"",
      channel: c.channel==="facebook" ? "Messenger" : c.channel,
      contact_label:c.contact_label||"Contato"
    }));
    const messaging={
      conversations:list,
      attendants:canSupervise?(window.ATENDE_ATTENDANTS?.[company_id]||[]):[],
      openLead:lead_id=>{
        const lead=rows.find(r=>String(r.id)===String(lead_id)&&r.company===(companyById[company_id]||""));
        if(!lead)throw Error("Lead não encontrado nesta clínica.");
        if(!window.ATENDE_LEAD_WORKSPACE)throw Error("Ficha 360° ainda indisponível.");
        return window.ATENDE_LEAD_WORKSPACE.open(lead);
      },
      transferConversation:canSupervise?async(conversation_id,assignedTo)=>{
        const record=conversations.find(x=>x.id===conversation_id&&x.company_id===company_id);
        if(!record)throw Error("Conversa fora da clínica selecionada.");
        const {data,error}=await db.rpc("assign_conversation",{
          p_conversation:conversation_id,p_new_assignee:assignedTo||null
        });
        if(error)throw error;
        if(!data?.id||data.company_id!==company_id)throw Error("A transferência não foi confirmada.");
        conversations=conversations.map(x=>x.id===conversation_id?{...x,...data}:x);
        return data;
      }:undefined,
      claimConversation:async conversation_id=>{
        const clinic_id=chosenCompany();
        if(!clinic_id)throw Error("Selecione uma clínica.");
        const entry=conversations.find(c=>c.id===conversation_id&&c.company_id===clinic_id);
        if(!entry)throw Error("Conversa fora da clínica selecionada.");
        const {data,error}=await db.rpc("claim_conversation",{p_conversation:conversation_id});
        if(error)throw error;
        if(!data?.id||data.company_id!==clinic_id)throw Error("O servidor não confirmou a atribuição.");
        conversations=conversations.map(c=>c.id===conversation_id?{...c,...data}:c);
        return data;
      },
      loadMessages:async id=>{
        const {data,error}=await db.from("messages").select("*")
          .eq("conversation_id",id).eq("company_id",chosenCompany())
          .order("sent_at",{ascending:true});
        if(error)throw error;
        return data||[];
      },
      // Read-only while channel messaging functions have not been deployed.
      sendText:undefined,
      rewrite:undefined
    };
    if(!window.ATENDE_CHAT){
      $('atende-inbox').textContent="Interface de conversas indisponível.";
      return;
    }
    if(!messengerView)messengerView=window.ATENDE_CHAT.mount($('atende-inbox'),messaging);
    else messengerView.update(list,messaging);
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
  let dataLoadVersion=0;
  async function loadData(){
    const requestVersion=++dataLoadVersion;
    const company_id=chosenCompany();if(!company_id)return;
    if(window.ATENDE_ATTRIBUTION)await window.ATENDE_ATTRIBUTION.reload();
    const [l,a,p,c]=await Promise.all([
      db.from("leads").select("*").eq("company_id",company_id).order("created_at",{ascending:false}),
      db.from("activities").select("*").eq("company_id",company_id).order("occurred_at",{ascending:false}),
      db.from("appointments").select("*").eq("company_id",company_id),
      db.from("conversations").select("*").eq("company_id",company_id)
    ]);
    for(const res of [l,a,p,c])if(res.error)throw res.error;
    if(requestVersion!==dataLoadVersion||company_id!==chosenCompany())return;
    activities=a.data||[];appointments=p.data||[];conversations=c.data||[];
    // Prioridade é baseada no último evento persistido, não em pontuação fictícia.
    if(conversations.length){
      const {data:recent,error:messageError}=await db.from("messages")
        .select("conversation_id,direction,sent_at,body")
        .eq("company_id",company_id).order("sent_at",{ascending:false}).limit(500);
      if(messageError)throw messageError;
      if(requestVersion!==dataLoadVersion||company_id!==chosenCompany())return;
      const newest=new Map();
      for(const msg of recent||[]){
        if(!newest.has(msg.conversation_id))newest.set(msg.conversation_id,msg);
      }
      conversations=conversations.map(conv=>{
        const last=newest.get(conv.id);
        return {...conv,last_direction:last?.direction||null,last_message_at:last?.sent_at||null,
          preview:last?.body?String(last.body).slice(0,115):null};
      });
    }
    window.ATENDE_ATTENDANTS=window.ATENDE_ATTENDANTS||{};
    if(["admin","manager","supervisor"].includes(memberRoles[company_id])){
      const {data:team,error:teamError}=await db.rpc("list_clinic_attendants",{p_company:company_id});
      if(teamError)throw teamError;
      window.ATENDE_ATTENDANTS[company_id]=team||[];
    }
    if(requestVersion!==dataLoadVersion||company_id!==chosenCompany())return;
    rows=(l.data||[]).map(x=>{const appointment=appointments.find(p=>p.lead_id===x.id);return{id:x.id,company:companyById[x.company_id]||"Clínica",name:x.name,procedure:x.procedure_name||"Não informado",source:x.source||"Manual",owner:x.owner_name||"Recepção",stage:stageMap[x.stage]||"Novo lead",value:Number(x.estimated_value)||0,first:x.first_contact_at||"",follow:x.next_followup_at||"",appointment:appointment?.scheduled_at||"",bookedAt:appointment?.booked_at||"",paid:Number(appointment?.amount_paid)||0,history:activities.filter(a=>a.lead_id===x.id).map(a=>a.content+" • "+a.occurred_at),...(window.ATENDE_ATTRIBUTION?.annotate(x)||{})}});
    render();
    window.dispatchEvent(new CustomEvent("atende:data-updated",{detail:{
      companyId:company_id,company:companyById[company_id],leadIds:rows.map(x=>x.id),updatedAt:Date.now()
    }}));
  }
  async function onLogin(){
    const {data:{user}}=await db.auth.getUser();
    if(!user){auth.style.display="grid";return}
    const {data,error}=await db.from("companies").select("id,name").order("name");if(error){$('login-error').textContent=error.message;return}
    companies=data||[];companyById=Object.fromEntries(companies.map(x=>[x.id,/aloe/i.test(x.name)?"Aloe":/nagel/i.test(x.name)?"Nagel":x.name]));
    if(!companies.length){
      $("atende-login").hidden=true;googleButton.hidden=true;requestPanel.hidden=false;
      auth.style.display="grid";$("login-error").textContent="";
      return;
    }
    $("atende-login").hidden=false;googleButton.hidden=false;requestPanel.hidden=true;
    const {data:members,error:memberError}=await db.from("company_members").select("company_id,role,is_primary");
    if(memberError)throw memberError;
    memberRoles=Object.fromEntries((members||[]).map(m=>[m.company_id,m.role]));
    const primary=new Set((members||[]).filter(m=>m.is_primary).map(m=>m.company_id));
    companies.sort((a,b)=>(primary.has(b.id)?1:0)-(primary.has(a.id)?1:0));
    approvalsButton.hidden=!Object.values(memberRoles).includes("admin");
    $('company').innerHTML=companies.map(c=>'<option value="'+escape(companyById[c.id])+'">'+escape(c.name)+'</option>').join('');
    window.ATENDE_LEAD_WORKSPACE?.setBackend({
      updateLead:async (lead,changes)=>{
        const company_id=chosenCompany();
        if(!company_id||companyById[company_id]!==lead.company)throw Error("Lead fora da clínica selecionada.");
        const payload={
          stage:stageReverse[changes.stage],
          owner_name:changes.owner||null,
          next_followup_at:changes.follow||null,
          updated_at:new Date().toISOString()
        };
        if(!payload.stage)throw Error("Etapa do funil inválida.");
        const {data,error}=await db.from("leads").update(payload)
          .eq("company_id",company_id).eq("id",lead.id).select("id").single();
        if(error)throw error;
        if(!data)throw Error("Não foi possível confirmar a alteração do lead.");
        await loadData();
        const refreshed=rows.find(x=>String(x.id)===String(lead.id));
        if(refreshed)Object.assign(lead,refreshed);
      },
      addNote:async (lead,content)=>{
        const company_id=chosenCompany();
        if(!company_id||companyById[company_id]!==lead.company)throw Error("Lead fora da clínica selecionada.");
        const {data:{user},error:authError}=await db.auth.getUser();
        if(authError||!user)throw Error("Sessão não autorizada.");
        const {data,error}=await db.from("activities").insert({
          company_id,lead_id:lead.id,kind:"note",
          content,channel:"internal",author_id:user.id
        }).select("id").single();
        if(error)throw error;
        if(!data)throw Error("Não foi possível confirmar o registro da nota.");
        await loadData();
        const refreshed=rows.find(x=>String(x.id)===String(lead.id));
        if(refreshed)Object.assign(lead,refreshed);
      },
      getConversation:async lead=>{
        const id=chosenCompany();
        if(!id||companyById[id]!==lead.company)return null;
        const {data,error}=await db.from("conversations").select("*")
          .eq("company_id",id).eq("lead_id",lead.id)
          .order("created_at",{ascending:false}).limit(1).maybeSingle();
        if(error)throw error;
        return data?{...data,company:lead.company,contact_label:data.contact_label||lead.name}:null;
      },
      loadMessages:async conversationId=>{
        const id=chosenCompany();if(!id)throw Error("Selecione uma clínica.");
        const {data,error}=await db.from("messages").select("*")
          .eq("company_id",id).eq("conversation_id",conversationId)
          .order("sent_at",{ascending:true});
        if(error)throw error;
        return data||[];
      },
      // Independent CRM is not yet connected to Meta. Do not show a composer
      // that attempts to call nonexistent send-message/rewrite-message functions.
      sendText:undefined,
      rewrite:undefined,
      summarize:async lead=>{
        const id=chosenCompany();if(!id||companyById[id]!==lead.company)throw Error("Lead fora da clínica selecionada.");
        // Enviar apenas IDs; a Edge Function autenticada deve consultar TODO o histórico
        // com RLS, limitar contexto, jamais enviar respostas automaticamente e auditar acesso.
        const {data,error}=await db.functions.invoke("summarize-lead-history",{
          body:{company_id:id,lead_id:lead.id}
        });
        if(error)throw error;
        if(data?.error)throw Error(data.error);
        if(!data||typeof data!=="object")throw Error("Resumo indisponível.");
        return data;
      }
      // sendAudio e sendFiles só serão habilitados quando o backend suportar
      // armazenamento privado, uploads retomáveis e limites de cada canal.
    });
    window.ATENDE_ATTRIBUTION?.connect(db,chosenCompany,companies);
    window.ATENDE_ATTRIBUTION?.setRefresher(loadData);
    $('company').onchange=()=>{activeConversation=null;loadData().catch(alertError)};
    await loadData();auth.style.display="none";
    window.ATENDE_SESSION=Object.freeze({
      roles:Object.freeze({...memberRoles}),
      companies:companies.map(c=>({id:c.id,name:c.name,primary:Boolean((members||[]).find(m=>m.company_id===c.id&&m.is_primary))})),
      authenticated:true
    });
    window.dispatchEvent(new CustomEvent("atende:session-ready",{detail:window.ATENDE_SESSION}));
  }
  $('atende-login').onsubmit=async event=>{
    event.preventDefault();$('login-error').textContent="";
    const data=new FormData(event.currentTarget);
    const {error}=await db.auth.signInWithPassword({email:String(data.get("email")),password:String(data.get("password"))});
    if(error){$('login-error').textContent=error.message;return}
    try{await onLogin()}catch(e){$('login-error').textContent=e.message}
  };
  db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT"){window.ATENDE_SESSION=null;window.dispatchEvent(new Event("atende:session-ended"));auth.style.display="grid";rows=[];companies=[];memberRoles={};$("atende-login").hidden=false;googleButton.hidden=false;requestPanel.hidden=true;approvalsButton.hidden=true;render()}});
  await onLogin().catch(e=>{$('login-error').textContent=e.message});
})();