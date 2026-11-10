/* ATENDE. Conexões empresariais: números no formulário, autorização oficial exigida. */
(function(){
 const style=document.createElement("style");
 style.textContent=[
 ".cx-root{display:grid;gap:17px;padding:2px 0 30px}",
 ".cx-hero{background:#22213c;color:white;border-radius:17px;padding:23px 27px}",
 ".cx-hero h3{font-size:20px;margin:6px 0 8px}.cx-hero p{font-size:12px;color:#cbc5df;margin:0;line-height:1.6;max-width:680px}",
 ".cx-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}",
 ".cx-card{background:white;border:1px solid #e8e5ef;border-radius:16px;padding:21px}",
 ".cx-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.cx-head h4{font-size:15px;margin:0}",
 ".cx-status{font-size:10px;border-radius:30px;padding:6px 9px;background:#fff3df;color:#795522;white-space:nowrap}",
 ".cx-card p,.cx-bottom p{font-size:12px;color:#7d778f;line-height:1.6}",
 ".cx-card label{font-size:11px;font-weight:650;color:#5e5670;display:block;margin:18px 0 5px}",
 ".cx-number{display:flex;align-items:center;border:1px solid #e2ddeb;border-radius:10px;overflow:hidden;background:#faf9fc}",
 ".cx-number span{padding:11px;background:#f0edf6;color:#605573;font-size:12px}",
 ".cx-number input{padding:11px;border:0;background:transparent;font:inherit;font-size:14px;flex:1;min-width:0;outline:0}",
 ".cx-connect{margin-top:14px;background:#6d4ce4;border:0;border-radius:10px;color:white;padding:12px 15px;font:inherit;font-size:12px;font-weight:750;cursor:pointer;width:100%}",
 ".cx-error{color:#a92b45!important;font-size:11px!important}",
 ".cx-section-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:7px}.cx-section-heading h3{font-size:17px;margin:0}.cx-section-heading span{font-size:11px;color:#868095}",
 ".cx-profile{border:1px solid #e2ddeb;background:#faf9fc;border-radius:10px;padding:12px;display:flex;align-items:center;gap:9px;font-size:12px;color:#615779}.cx-profile svg{flex:none}.cx-instagram-status{margin-top:12px;padding:11px;border-radius:10px;background:#f7f4fc;border:1px solid #ede7f6;font-size:11px;color:#7d748d}",
 ".cx-bottom{background:#fff;border:1px solid #e8e5ef;border-radius:15px;padding:20px}",
 ".cx-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:13px}",
 ".cx-step{background:#f8f6fc;border-radius:12px;padding:13px}.cx-step b{display:block;font-size:12px;color:#3e3457}.cx-step span{display:block;font-size:11px;color:#888195;margin-top:6px;line-height:1.5}",
 "@media(max-width:820px){.cx-cards,.cx-steps{grid-template-columns:1fr}}"
 ].join("");
 document.head.append(style);
 const view=document.createElement("section");view.id="atende-connections";view.className="cx-root hidden";
 document.getElementById("leads").after(view);
 const nav=document.createElement("button");nav.dataset.tab="connections";nav.textContent="⚙ Conexões";document.querySelector("aside nav").append(nav);
 const clinic=[
  {key:"Aloe",title:"Aloe Medicina Estética",phone:"61982120035"},
  {key:"Nagel",title:"Nagel Anatomia dos Pés",phone:"61981728901"}
 ];
 const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const formatDigits=s=>String(s||"").replace(/\D/g,"");
 const config=()=>window.ATENDE_CONFIG||{};
 let adapter=null;
 function paint(){
  const selected=document.getElementById("company").value;
  const visible=clinic.filter(c=>selected==="all"||selected===c.key);
  view.innerHTML='<div class="cx-hero"><div style="font-size:10px;letter-spacing:2px;color:#af9bf4;font-weight:750">INTEGRAÇÕES OFICIAIS</div><h3>Conecte os canais da recepção.</h3><p>Informe o número e autorize a conexão na Meta, sem precisar copiar tokens. O WhatsApp Business permanece no celular quando a coexistência estiver disponível e for aprovada pela Meta.</p></div>'+
   '<div class="cx-section-heading"><h3>WhatsApp Business</h3><span>Um número por clínica</span></div><div class="cx-cards">'+visible.map(c=>
    '<article class="cx-card" data-clinic="'+escape(c.key)+'"><div class="cx-head"><h4>'+escape(c.title)+'</h4><span class="cx-status" id="cx-status-'+c.key+'">Não conectado</span></div>'+
    '<p>WhatsApp Business · número atual da clínica</p>'+
    '<label for="cx-phone-'+c.key+'">Número do WhatsApp</label><div class="cx-number"><span>+55</span><input id="cx-phone-'+c.key+'" aria-label="WhatsApp '+escape(c.key)+'" type="tel" inputmode="numeric" maxlength="17" value="'+escape(c.phone)+'" autocomplete="off"></div>'+
    '<button type="button" class="cx-connect" data-connect="'+escape(c.key)+'">Conectar WhatsApp</button>'+
    '<p id="cx-feedback-'+c.key+'" role="status" aria-live="polite">A conexão só será considerada ativa após confirmação da Meta e recebimento de uma mensagem de teste.</p></article>').join("")+
    '</div><div class="cx-section-heading"><h3>Instagram Direct</h3><span>Contas profissionais · Login oficial</span></div><div class="cx-cards">'+visible.map(c=>
    '<article class="cx-card" data-instagram-clinic="'+escape(c.key)+'"><div class="cx-head"><h4>'+escape(c.title)+'</h4><span class="cx-status" id="cx-ig-status-'+c.key+'">Não conectado</span></div>'+
    '<p>Conecte a conta profissional do Instagram que recebe as mensagens desta clínica.</p>'+
    '<div class="cx-profile">◎ <span><b>Instagram Business / Creator</b><br>Autorização no próprio Instagram, sem senha no ATENDE.</span></div>'+
    '<button type="button" class="cx-connect" data-instagram-connect="'+escape(c.key)+'">◎ Conectar Instagram</button>'+
    '<p class="cx-instagram-status" id="cx-ig-feedback-'+c.key+'" role="status" aria-live="polite">Aguardando autorização. A conta será identificada depois do login oficial da Meta.</p></article>').join("")+
    '</div><section class="cx-bottom"><h3 style="font-size:15px;margin:0">Como será a conexão</h3><div class="cx-steps"><div class="cx-step"><b>1. Informe o número</b><span>Use o WhatsApp Business que já funciona na clínica.</span></div><div class="cx-step"><b>2. Autorize pela Meta</b><span>Confirme a empresa e o número no cadastro oficial, pelo celular quando solicitado.</span></div><div class="cx-step"><b>3. Teste a conversa</b><span>O ATENDE. somente marcará conectado após receber o webhook e validar o atendimento.</span></div></div><p>Para o Instagram, clique em <b>Conectar Instagram</b>, faça login na conta profissional autorizada e permita o acesso às mensagens. A aprovação da Meta e o teste do webhook serão necessários antes de marcar a conexão como ativa. O Facebook Messenger será conectado separadamente.</p></section>';
  for(const button of view.querySelectorAll("[data-instagram-connect]")){
    button.onclick=async()=>{
      const clinic=button.dataset.instagramConnect;
      const feedback=document.getElementById("cx-ig-feedback-"+clinic);
      if(!adapter?.startInstagram){
        feedback.className="cx-instagram-status cx-error";
        feedback.textContent="Integração ainda em preparação: falta configurar o login oficial do Instagram no aplicativo Meta e o backend exclusivo do ATENDE. Nenhuma conta foi conectada.";
        return;
      }
      button.disabled=true;button.textContent="Preparando autorização...";
      try{
        const result=await adapter.startInstagram({clinic});
        if(!result||result.status!=="authorization_required"||typeof result.url!=="string")throw Error("O servidor não retornou uma autorização válida.");
        const destination=new URL(result.url);
        if(destination.protocol!=="https:"||!["www.instagram.com","instagram.com","www.facebook.com","facebook.com"].includes(destination.hostname))throw Error("Destino de autorização não reconhecido.");
        const popup=window.open(destination.href,"atende-instagram-oauth","width=640,height=740,noopener,noreferrer");
        feedback.className="cx-instagram-status";
        feedback.textContent=popup?"Conclua a autorização na janela oficial. A conexão só aparecerá ativa após validação do backend e um teste de mensagens.":"Seu navegador pode ter bloqueado a janela. Permita pop-ups para iniciar a autorização.";
      }catch(error){
        feedback.className="cx-instagram-status cx-error";
        feedback.textContent=error.message||String(error);
      }finally{button.disabled=false;button.textContent="◎ Conectar Instagram"}
    };
  }
  for(const button of view.querySelectorAll("[data-connect]")){
   button.onclick=async()=>{
    const key=button.dataset.connect,clinicItem=clinic.find(c=>c.key===key);
    if(!clinicItem)return;
    const phone=formatDigits(document.getElementById("cx-phone-"+key).value);
    const feedback=document.getElementById("cx-feedback-"+key);
    if(phone.length!==11){feedback.className="cx-error";feedback.textContent="Informe o DDD e os 9 dígitos do celular. Não incluímos +55 no campo.";return}
    if(!adapter){
     feedback.className="cx-error";
     feedback.textContent="Conexão ainda em preparação. Falta configurar o aplicativo Meta e o banco exclusivo do ATENDE. O WhatsApp Business da clínica permanece intacto.";
     return;
    }
    button.disabled=true;button.textContent="Iniciando autorização...";
    try{
     const result=await adapter.startWhatsApp({clinic:key,phone:"+55"+phone});
     if(result?.status==="connected")feedback.textContent="Autorização recebida. Validando webhook e mensagens de teste...";
     else feedback.textContent="Autorização iniciada. Conclua a confirmação na janela oficial da Meta.";
    }catch(error){feedback.className="cx-error";feedback.textContent=error.message||String(error)}
    finally{button.disabled=false;button.textContent="Conectar WhatsApp"}
   };
  }
 }
 const oldRender=render;
 render=function(){oldRender();view.classList.toggle("hidden",tab!=="connections");if(tab==="connections")paint()};
 nav.onclick=()=>{
  tab="connections";
  document.querySelectorAll("aside nav [data-tab]").forEach(b=>b.classList.toggle("active",b===nav));
  document.getElementById("title").textContent="Conexões";
  render();
 };
 window.ATENDE_CONNECTIONS={setAdapter(value){adapter=value}};
})();