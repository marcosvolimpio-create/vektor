/* ATENDE. Painel de atendimento aberto diretamente pelo Kanban.
   Os resumos reais são gerados apenas no backend autenticado. */
(function(){
  const css=document.createElement("style");
  css.textContent=".lead-workspace{position:fixed;inset:0;background:#f4f3f9;z-index:160;display:none;flex-direction:column;overflow:hidden}.lead-workspace.active{display:flex}.lw-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 22px;background:white;border-bottom:1px solid #e9e6f0}.lw-header h2{font-size:17px;margin:3px 0}.lw-header small{font-size:11px;color:#847c98}.lw-header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.lw-button{border:1px solid #e7e3f0;background:#fff;border-radius:9px;padding:10px 12px;color:#4c445c;font:inherit;font-size:12px;cursor:pointer}.lw-button.primary{background:#6d4ce4;color:white;border-color:#6d4ce4}.lw-main{display:grid;grid-template-columns:minmax(0,1fr) 332px;flex:1;min-height:0;gap:13px;padding:13px}.lw-chat{min-width:0;min-height:0}.lw-chat .msg-shell{height:100%;max-height:none;min-height:0;grid-template-columns:1fr}.lw-chat .msg-sidebar{display:none}.lw-chat .msg-view{display:flex}.lw-side{background:white;border:1px solid #eae7f1;border-radius:16px;padding:18px;overflow-y:auto;min-width:0}.lw-side h3{font-size:14px;margin:0 0 12px}.lw-label{font-size:10px;letter-spacing:.8px;color:#928b9c;font-weight:750;text-transform:uppercase;margin:16px 0 4px}.lw-value{font-size:12px;color:#353047;margin:0;overflow-wrap:anywhere}.lw-small{font-size:11px;color:#87808f;line-height:1.5}.lw-divider{border:0;border-top:1px solid #eeebf3;margin:17px 0}.lw-summary{background:#f7f4fd;border:1px solid #e7ddf8;border-radius:11px;padding:13px;margin-top:10px;font-size:12px;color:#423751;line-height:1.6;white-space:pre-wrap}.lw-summary h4{font-size:12px;margin:0 0 8px}.lw-summary strong{font-weight:750}.lw-summary-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.lw-summary-status{font-size:11px;min-height:15px;color:#6d627c;margin-top:7px}.lw-side a{font-size:12px;color:#6d4ce4}.lw-row{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.lw-pill{font-size:10px;border-radius:20px;background:#ede7fb;color:#6c53b9;padding:5px 8px}.lw-tab{display:none}@media(max-width:820px){.lw-main{grid-template-columns:1fr;padding:7px;gap:0}.lw-main.details .lw-chat{display:none}.lw-main:not(.details) .lw-side{display:none}.lw-main.details .lw-side{display:block}.lw-tab{display:inline-block}.lw-header{padding:10px 12px}.lw-header h2{font-size:15px}.lw-side{border-radius:12px}.lw-chat .msg-shell{height:100%;min-height:0}}";
  css.textContent += ".lw-main{grid-template-columns:minmax(0,1fr) clamp(330px,32vw,470px);gap:8px;padding:9px}.lw-side{padding:20px 22px}.lw-value{font-size:13px;line-height:1.45}.lw-header-actions{gap:6px}.lw-edit{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.lw-edit label{display:grid;gap:5px;font-size:11px;font-weight:650;color:#6c657b}.lw-edit select,.lw-edit input,.lw-edit textarea{width:100%;min-width:0;border:1px solid #dfdce9;border-radius:8px;padding:9px;background:white;font:inherit;font-size:12px;color:#302c42}.lw-edit .span{grid-column:1/-1}.lw-inline-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.lw-error{color:#b42342;font-size:11px;min-height:14px}.lw-activity-item{padding:8px 0;border-bottom:1px solid #eeebf3;font-size:12px;line-height:1.45;color:#5e566d}.lw-side section{margin-bottom:14px}@media(max-width:820px){.lw-main{grid-template-columns:1fr;padding:7px}.lw-side{padding:14px}}";
  document.head.append(css);
  const div=document.createElement("div");div.className="lead-workspace";div.id="atende-lead-workspace";
  div.innerHTML='<header class="lw-header"><div><small>ATENDE. / ATENDIMENTO</small><h2 id="lw-title">Conversa</h2><small id="lw-subtitle"></small></div><div class="lw-header-actions"><button type="button" id="lw-tab-chat" class="lw-button lw-tab">Conversa</button><button type="button" id="lw-tab-detail" class="lw-button lw-tab">Ficha do lead</button><button type="button" id="lw-close" class="lw-button">← Voltar</button></div></header><div class="lw-main" id="lw-main"><div class="lw-chat" id="lw-chat"></div><aside class="lw-side" id="lw-detail"></aside></div>';
  document.body.append(div);
  const $=id=>document.getElementById(id);
  const safe=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  let current=null,chat=null,backend=null,lastSummary=null,previousFocus=null;
  const stages=["Novo lead","Primeiro contato","Em atendimento","Follow-up","Agendado","Convertido","Perdido"];
  const escapeAttr=safe;
  function demoOnly(){return !window.ATENDE_CONFIG?.supabaseUrl;}
  function drawActions(lead){
    return '<section><h3>Gestão do atendimento</h3>'+
    '<div class="lw-edit"><label>Etapa do funil<select id="lw-edit-stage">'+stages.map(st=>'<option value="'+safe(st)+'" '+(lead.stage===st?'selected':'')+'>'+safe(st)+'</option>').join("")+'</select></label>'+
    '<label>Responsável<input id="lw-edit-owner" maxlength="100" value="'+escapeAttr(lead.owner||"")+'" placeholder="Responsável"></label>'+
    '<label class="span">Próximo follow-up<input id="lw-edit-follow" type="datetime-local"></label></div>'+
    '<div class="lw-inline-actions"><button type="button" class="lw-button primary" id="lw-save-lead">Salvar alterações</button></div>'+
    '<p class="lw-small">'+(demoOnly()?'Prévia: alterações só nesta sessão.':'Dados salvos no CRM, quando autorizado.')+'</p>'+
    '<p id="lw-edit-status" class="lw-error" role="status"></p></section>'+
    '<section><h3>Nota interna</h3><div class="lw-edit"><label class="span">Registro da equipe<textarea id="lw-note-text" rows="3" maxlength="2500" placeholder="Adicione um resumo interno da conversa."></textarea></label></div>'+
    '<button type="button" id="lw-save-note" class="lw-button">Registrar nota</button><p id="lw-note-status" class="lw-error" role="status"></p></section>';
  }
  function toDatetimeLocal(value){
    if(!value)return "";
    const d=new Date(value);
    if(Number.isNaN(d.valueOf()))return "";
    const x=n=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+x(d.getMonth()+1)+"-"+x(d.getDate())+"T"+x(d.getHours())+":"+x(d.getMinutes());
  }
  async function persistLead(){
    const lead=current;if(!lead)return;
    const button=$("lw-save-lead"),status=$("lw-edit-status");
    button.disabled=true;status.textContent="Salvando...";
    try{
      const stage=$("lw-edit-stage").value;
      const owner=$("lw-edit-owner").value.trim();
      const followInput=$("lw-edit-follow").value;
      const follow=followInput?new Date(followInput).toISOString():null;
      if(!stages.includes(stage))throw Error("Etapa inválida.");
      if(backend?.updateLead)await backend.updateLead(lead,{stage,owner,follow});
      else if(!demoOnly())throw Error("Atualização não configurada para esta conta.");
      if(current!==lead)return;
      lead.stage=stage;lead.owner=owner||"Não atribuído";lead.follow=follow||"";
      if(typeof render==="function")render();
      renderDetail();
      $("lw-edit-status").style.color="#387c61";
      $("lw-edit-status").textContent=demoOnly()?"Prévia atualizada nesta sessão.":"Lead atualizado com sucesso.";
    }catch(e){status.style.color="#b42342";status.textContent=e.message||String(e)}
    finally{button.disabled=false}
  }
  async function addNote(){
    const lead=current;if(!lead)return;
    const text=$("lw-note-text").value.trim(),status=$("lw-note-status"),button=$("lw-save-note");
    if(!text){status.textContent="Escreva a nota antes de salvar.";return}
    button.disabled=true;status.textContent="Registrando...";
    try{
      if(backend?.addNote)await backend.addNote(lead,text);
      else if(!demoOnly())throw Error("Registro de notas não configurado.");
      if(current!==lead)return;
      lead.history=lead.history||[];
      lead.history.push((new Date()).toLocaleString("pt-BR")+" · Nota interna: "+text);
      renderDetail();
      $("lw-note-status").style.color="#387c61";
      $("lw-note-status").textContent=demoOnly()?"Nota temporária na demonstração.":"Nota registrada no histórico.";
    }catch(e){status.style.color="#b42342";status.textContent=e.message||String(e)}
    finally{button.disabled=false}
  }
  const channelFrom=source=>/whatsapp/i.test(source)?"WhatsApp":/instagram/i.test(source)?"Instagram":/facebook|messenger/i.test(source)?"Messenger":null;
  function demoConversation(lead){
    const all=window.ATENDE_CHAT?.demo?.conversations||[];
    const conv=all.find(c=>c.company===lead.company&&c.contact_label.split(" (")[0]===lead.name.split(" (")[0]);
    return conv||null;
  }
  function localSummary(lead,history){
    // Exemplo explicável por regras: não apresentar como resultado de IA.
    const last=history.length?history[history.length-1]:"Sem interações registradas";
    const topic=lead.procedure||"serviço ainda não informado";
    const pending=lead.follow?"Há um retorno registrado para "+lead.follow+".":"Ainda não há data de retorno cadastrada.";
    const statuses={ "Novo lead":"Primeiro acolhimento e entendimento do interesse.", "Primeiro contato":"Continuar a conversa iniciada.", "Em atendimento":"Esclarecer dúvidas abertas antes de propor próxima etapa.", "Follow-up":"Retomar a conversa a partir do último contato.", "Agendado":"Confirmar detalhes do horário e eventuais dúvidas.", "Convertido":"Acompanhar satisfação, sem pressionar por nova compra.", "Perdido":"Não retomar sem motivo ou autorização pertinente."};
    return {
      origin:"Resumo ilustrativo feito por regras, não por IA",
      interest:topic,
      context:"Etapa atual: "+(lead.stage||"Não informada")+". Último registro: "+last,
      objection:"Não foi possível identificar objeções com segurança apenas pelos registros disponíveis.",
      pending,
      suggestion:statuses[lead.stage]||"Verificar o histórico antes de definir a abordagem.",
      draft:lead.stage==="Perdido"?"": "Olá! Tudo bem? Estou retomando nosso contato sobre "+topic+". Ficou alguma dúvida que eu possa esclarecer?"
    };
  }
  function renderDetail(){
    const lead=current;if(!lead)return;
    const publicationLink=lead.publicationUrl;
    let link="";
    try{if(publicationLink&&new URL(publicationLink).protocol==="https:")link='<a href="'+safe(publicationLink)+'" target="_blank" rel="noopener noreferrer">Abrir publicação ↗</a>'}catch{}
    const history=Array.isArray(lead.history)?lead.history:[];
    $("lw-detail").innerHTML='<div class="lw-row"><h3>Ficha do lead</h3><span class="lw-pill">'+safe(lead.stage||"Sem etapa")+'</span></div>'+
      '<div class="lw-label">Clínica</div><p class="lw-value">'+safe(lead.company)+'</p>'+
      '<div class="lw-label">Procedimento de interesse</div><p class="lw-value">'+safe(lead.procedure||"Não informado")+'</p>'+
      '<div class="lw-label">Origem e campanha</div><p class="lw-value">'+safe(lead.source||"Não informada")+'</p>'+
      '<div class="lw-label">Publicação de origem</div><p class="lw-value">'+safe(lead.publicationTitle||"Não identificada")+'</p>'+link+
      '<div class="lw-label">Próximo follow-up</div><p class="lw-value">'+safe(lead.follow||"Não programado")+'</p>'+
      '<div class="lw-label">Valor estimado</div><p class="lw-value">'+safe(money(lead.value))+'</p>'+
      '<hr class="lw-divider">'+drawActions(lead)+'<hr class="lw-divider"><h3>Histórico registrado</h3>'+ (history.length?history.map(x=>'<div class="lw-activity-item">'+safe(x)+'</div>').join(""):'<p class="lw-small">Nenhum registro disponível.</p>')+
      '<hr class="lw-divider"><h3>✦ Inteligência de follow-up</h3><p class="lw-small">Analise a conversa inteira e os registros do CRM. Veja contexto, objeções, pendências e a próxima abordagem antes de responder.</p>'+
      '<button class="lw-button primary" id="lw-summarize">Resumir histórico</button><p id="lw-sum-status" class="lw-summary-status"></p><div id="lw-summary-result"></div>'+
      '<div class="lw-summary-actions"><button class="lw-button" id="lw-full-record">Editar dados comerciais</button></div>';
    $("lw-edit-follow").value=toDatetimeLocal(lead.follow);
    $("lw-save-lead").onclick=()=>void persistLead();
    $("lw-save-note").onclick=()=>void addNote();
    $("lw-summarize").onclick=()=>void summarize();
    $("lw-full-record").onclick=()=>{ 
      $("lw-edit-stage").focus();
      $("lw-edit-stage").scrollIntoView({behavior:"smooth",block:"center"});
    };
    if(lastSummary)renderSummary(lastSummary);
  }
  function renderSummary(summary){
    const node=$("lw-summary-result");if(!node)return;
    const fields=[
      ["Interesse principal",summary.interest],
      ["Contexto da conversa",summary.context],
      ["Dúvidas e objeções",summary.objection],
      ["Pendências",summary.pending],
      ["Próximo follow-up sugerido",summary.suggestion],
      ["Rascunho para a recepção",summary.draft]
    ];
    node.innerHTML='<div class="lw-summary">'+
      '<div style="font-size:10px;color:#7868a2;margin-bottom:10px">'+safe(summary.origin||"Análise de histórico")+'</div>'+
      fields.map(([label,value])=>'<div style="margin:0 0 10px"><strong>'+safe(label)+'</strong><div>'+safe(value||"Não identificado")+'</div></div>').join("")+
      '</div><div class="lw-summary-actions"><button type="button" class="lw-button" id="lw-copy-summary">Copiar resumo</button>'+(summary.draft?'<button type="button" class="lw-button" id="lw-copy-draft">Copiar sugestão</button>':'')+'</div>';
    $("lw-copy-summary").onclick=()=>{const value=fields.map(([label,text])=>label+": "+(text||"Não identificado")).join("\n\n");navigator.clipboard?.writeText(value).then(()=>{$("lw-sum-status").textContent="Resumo copiado."}).catch(()=>{$("lw-sum-status").textContent="Não foi possível copiar automaticamente."})};
    if($("lw-copy-draft"))$("lw-copy-draft").onclick=()=>navigator.clipboard?.writeText(summary.draft).then(()=>{$("lw-sum-status").textContent="Rascunho copiado. Revise antes de enviar."}).catch(()=>{$("lw-sum-status").textContent="Não foi possível copiar."});
  }
  async function summarize(){
    if(!current)return;
    const lead=current,button=$("lw-summarize");button.disabled=true;
    $("lw-sum-status").textContent="Analisando histórico...";
    try{
      let sum;
      if(backend?.summarize)sum=await backend.summarize(lead);
      else sum=localSummary(lead,Array.isArray(lead.history)?lead.history:[]);
      if(lead!==current)return;
      if(!sum||typeof sum!=="object")throw Error("O serviço não retornou um resumo válido.");
      lastSummary=sum;renderSummary(sum);
      $("lw-sum-status").textContent=backend?"Resumo preparado para revisão da equipe.":"Prévia demonstrativa: análise por regras, sem IA conectada.";
    }catch(e){$("lw-sum-status").textContent="Não foi possível gerar o resumo: "+(e.message||String(e))}
    finally{button.disabled=false}
  }
  async function openLead(lead){
    if(!lead)return;
    previousFocus=document.activeElement;
    current=lead;lastSummary=null;
    $("lw-title").textContent=lead.name;
    $("lw-subtitle").textContent=lead.company+" · "+(channelFrom(lead.source)||"Canal não identificado");
    $("lw-main").classList.remove("details");
    div.classList.add("active");
    document.body.style.overflow="hidden";
    chat?.close?.();$("lw-chat").replaceChildren();
    const conversation=backend?.getConversation?await backend.getConversation(lead):demoConversation(lead);
    if(lead!==current)return;
    const fallback={id:"unlinked-"+lead.id,contact_label:lead.name,company:lead.company,channel:channelFrom(lead.source)||"Não vinculado"};
    const active=conversation||fallback;
    chat=window.ATENDE_CHAT.mount($("lw-chat"),{
      conversations:[active],
      loadMessages:async id=>conversation?(backend?.loadMessages?backend.loadMessages(id):window.ATENDE_CHAT.demo?.messages?.[id]||[]):[],
      sendText:conversation&&backend?.sendText?backend.sendText:undefined,
      rewrite:conversation&&backend?.rewrite?backend.rewrite:undefined,
      sendAudio:conversation&&backend?.sendAudio?backend.sendAudio:undefined,
      sendFiles:conversation&&backend?.sendFiles?backend.sendFiles:undefined
    });
    await chat.open(active.id);
    if(!conversation)$("lw-subtitle").textContent=lead.company+" · Nenhuma conversa vinculada. A ficha e o histórico continuam disponíveis.";
    renderDetail();
  }
  function close(){
    div.classList.remove("active");document.body.style.overflow="";
    chat?.close?.();chat=null;current=null;lastSummary=null;
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    previousFocus=null;
  }
  $("lw-close").onclick=close;
  $("lw-tab-detail").onclick=()=>$("lw-main").classList.add("details");
  $("lw-tab-chat").onclick=()=>$("lw-main").classList.remove("details");
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&div.classList.contains("active"))close()});
  let dragRecent=0;
  document.addEventListener("dragstart",e=>{if(e.target.closest?.("#kanban article.lead"))dragRecent=Date.now()+1200},true);
  document.addEventListener("dragend",e=>{if(e.target.closest?.("#kanban article.lead"))dragRecent=Date.now()+350},true);
  document.addEventListener("click",e=>{
    const card=e.target.closest?.("#kanban article.lead");
    if(!card||Date.now()<dragRecent||e.target.closest("a"))return;
    const lead=rows.find(r=>String(r.id)===card.dataset.id);
    if(!lead)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    void openLead(lead).catch(err=>{console.error("Não foi possível abrir o atendimento.",err);$("lw-subtitle").textContent="Erro ao abrir conversa: "+String(err.message||err);renderDetail()});
  },true);
  window.ATENDE_LEAD_WORKSPACE={open:openLead,setBackend:api=>{backend=api}};
})();