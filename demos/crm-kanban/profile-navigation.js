/* ATENDE. Navegação por perfil: somente apresentação; RLS continua sendo a autoridade. */
(function(){
  "use strict";
  const nav=document.querySelector("aside nav");
  const company=document.getElementById("company");
  const header=document.querySelector("main header");
  if(!nav||!company||!header)return;
  const roleLabels={admin:"Administração Geral",manager:"Gestão",supervisor:"Supervisão",reception:"Recepção",viewer:"Consulta"};
  const profile=document.createElement("div");
  profile.id="atende-profile-context";
  profile.setAttribute("aria-live","polite");
  profile.style="display:none;flex-basis:100%;font-size:12px;color:#6f677f;padding-top:3px";
  header.append(profile);
  const rights={
    admin:["overview","inbox","kanban","agendamentos","followups","leads","campaigns","approvals","connections"],
    manager:["overview","inbox","kanban","agendamentos","followups","leads","campaigns"],
    supervisor:["inbox","kanban","agendamentos","followups","leads"],
    reception:["inbox","kanban","agendamentos","followups","leads"],
    viewer:["overview","inbox","kanban","agendamentos","followups","leads"]
  };
  const order={
    admin:["overview","inbox","kanban","followups","agendamentos","leads","campaigns","approvals","connections"],
    manager:["overview","inbox","kanban","followups","agendamentos","leads","campaigns"],
    supervisor:["inbox","kanban","followups","agendamentos","leads"],
    reception:["inbox","kanban","followups","agendamentos","leads"],
    viewer:["overview","inbox","kanban","followups","agendamentos","leads"]
  };
  let session=null,initialized=false,selectionTimer=null;
  function currentRole(){
    if(!session||!session.roles)return null;
    const selected=company.value;
    const matching=(session.companies||[]).find(c=>
      c.name===selected||
      (/aloe/i.test(c.name)&&selected==="Aloe")||
      (/nagel/i.test(c.name)&&selected==="Nagel"));
    return matching?session.roles[matching.id]||null:null;
  }
  function apply(initial){
    const role=currentRole();
    if(!role)return;
    const visible=new Set(rights[role]||[]);
    const all=Array.from(nav.querySelectorAll("[data-tab]"));
    all.forEach(b=>{
      b.hidden=!visible.has(b.dataset.tab);
      b.setAttribute("aria-hidden",String(b.hidden));
    });
    for(const id of order[role]||[]){
      const btn=all.find(b=>b.dataset.tab===id);
      if(btn)nav.append(btn);
    }
    const currentTab=typeof tab==="string"?tab:null;
    const next=initial||!visible.has(currentTab)?(role==="reception"||role==="supervisor"?"inbox":"overview"):null;
    if(next){
      const btn=all.find(b=>b.dataset.tab===next&&!b.hidden);
      if(btn&&typeof btn.onclick==="function")btn.click();
    }
    const selected=(session.companies||[]).find(c=>
      c.name===company.value||
      (/aloe/i.test(c.name)&&company.value==="Aloe")||
      (/nagel/i.test(c.name)&&company.value==="Nagel"));
    profile.style.display="block";
    profile.textContent=(roleLabels[role]||role)+" · "+(selected?.name||"Clínica autorizada")+
      (selected?.primary?" · Unidade principal":"");
  }
  window.addEventListener("atende:session-ready",event=>{
    session=event.detail;
    initialized=true;
    apply(true);
  });
  window.addEventListener("atende:session-ended",()=>{
    session=null;initialized=false;profile.style.display="none";
    nav.querySelectorAll("[data-tab]").forEach(b=>{b.hidden=false;b.removeAttribute("aria-hidden")});
  });
  company.addEventListener("change",()=>{
    if(!initialized)return;
    if(selectionTimer)clearTimeout(selectionTimer);
    selectionTimer=setTimeout(()=>apply(false),0);
  });
  if(window.ATENDE_SESSION){
    session=window.ATENDE_SESSION;initialized=true;apply(true);
  }
})();