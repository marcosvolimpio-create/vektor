/* Visão Geral do ATENDE. Mantém a interface Kanban original e reflete os dados carregados. */
(function () {
  const css = document.createElement("style");
  css.textContent = `
  .overview{display:grid;gap:20px;padding:2px 0 32px}
  .overview-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:15px;background:#22213c;color:white;padding:23px 26px;border-radius:17px;overflow:hidden;position:relative}
  .overview-hero:after{content:"";position:absolute;right:-45px;top:-90px;width:230px;height:230px;background:radial-gradient(circle,#7c60eb70,transparent 70%);pointer-events:none}
  .overview-hero h3{font-size:20px;letter-spacing:-.5px;margin:6px 0 8px}.overview-hero p{font-size:13px;color:#cbc9e8;margin:0;max-width:460px}
  .overview-hero button{position:relative;z-index:1;background:#ad94ff;color:#211a42;border:0;border-radius:10px;padding:12px 16px;font-size:12px;font-weight:750}
  .overview-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .overview-metric,.overview-panel{background:white;border:1px solid #e9e8f0;border-radius:16px;padding:20px;min-width:0;box-shadow:0 5px 18px #25204206}
  .overview-metric .kicker{color:#74748b;font-size:12px}.overview-metric strong{display:block;margin-top:10px;font-size:27px;letter-spacing:-1px}.overview-metric .foot{display:block;color:#858396;font-size:11px;margin-top:5px}
  .overview-split{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.95fr);gap:15px}
  .overview-panel h3{font-size:15px;margin:0}.overview-panel .sub{font-size:11px;margin:6px 0 18px}
  .overview-bar{display:grid;grid-template-columns:105px 1fr 28px;gap:12px;align-items:center;margin:14px 0;font-size:12px;color:#626077}
  .overview-track{height:9px;border-radius:50px;background:#eeebf6;overflow:hidden}.overview-fill{height:100%;border-radius:50px;background:linear-gradient(90deg,#7055d9,#ac90fa)}
  .overview-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-top:1px solid #f0eef5}.overview-item:first-of-type{border-top:0}
  .overview-item b{font-size:12px}.overview-item small{display:block;color:#8a879b;margin-top:4px;font-size:11px}.overview-item .pill{white-space:nowrap;font-size:10px;background:#f3efff;color:#694cbd;border-radius:20px;padding:6px 9px}
  .overview-activity{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .overview-action{border-radius:13px;background:#f8f7fd;padding:14px;cursor:pointer;border:1px solid #eeecf7;text-align:left}
  .overview-action b{display:block;color:#2c2847;font-size:13px}.overview-action small{display:block;margin-top:6px;color:#807f93;font-size:11px}
  @media(max-width:920px){.overview-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.overview-split{grid-template-columns:1fr}}
  @media(max-width:530px){.overview-activity{grid-template-columns:1fr}.overview-bar{grid-template-columns:80px 1fr 25px;gap:8px}.overview-hero{padding:20px}}
  `;
  document.head.appendChild(css);
  const nav = document.querySelector("aside nav");
  const overviewBtn = document.createElement("button");
  overviewBtn.dataset.tab="overview";
  overviewBtn.textContent="◈ Visão geral";
  nav.prepend(overviewBtn);
  const section = document.createElement("section");
  section.id="overview";
  section.className="overview";
  document.getElementById("stats").after(section);

  const safe = s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const brl = n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
  const parseDate = value=>{
    if(!value)return null;
    const str=String(value);
    const match=str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    const d=match?new Date(Number(match[3]),Number(match[2])-1,Number(match[1]),Number(match[4]||0),Number(match[5]||0)):new Date(str);
    return Number.isFinite(d.getTime())?d:null;
  };
  const renderBase=render;
  function renderOverview(){
    const items=data();
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const active=items.filter(x=>!["Convertido","Perdido"].includes(x.stage));
    const scheduled=items.filter(x=>x.appointment);
    const todayScheduled=scheduled.filter(x=>{const d=parseDate(x.appointment);return d&&d.toDateString()===now.toDateString()});
    const pending=items.filter(x=>x.follow&&parseDate(x.follow)&&parseDate(x.follow)<=now&& !["Convertido","Perdido"].includes(x.stage));
    const converted=items.filter(x=>x.stage==="Convertido");
    const potential=active.reduce((total,x)=>total+(Number(x.value)||0),0);
    const stagesUsed=stages.filter(x=>x!=="Perdido");
    const channels=Array.from(items.reduce((acc,x)=>{
      let name=String(x.source||"Outro");
      if(/instagram/i.test(name))name="Instagram";
      else if(/whatsapp/i.test(name))name="WhatsApp";
      else if(/facebook|messenger/i.test(name))name="Facebook";
      else if(/google/i.test(name))name="Google";
      else name="Outros";
      acc.set(name,(acc.get(name)||0)+1);
      return acc;
    },new Map())).sort((a,b)=>b[1]-a[1]);
    const max=Math.max(1,...stagesUsed.map(x=>items.filter(item=>item.stage===x).length));
    const metrics=[
      ["Leads ativos",active.length,"Em acompanhamento"],
      ["Retornos vencidos",pending.length,"Follow-ups que precisam de atenção"],
      ["Agendamentos hoje",todayScheduled.length,"De "+scheduled.length+" agendamentos registrados"],
      ["Potencial comercial",brl(potential),"Soma estimada dos leads em aberto"]
    ];
    const title=document.getElementById("company").value==="all"?"Aloe e Nagel":document.getElementById("company").value==="Aloe"?"Aloe Medicina Estética":"Nagel Anatomia dos Pés";
    section.innerHTML=`
      <div class="overview-hero"><div><div style="font-size:10px;font-weight:750;letter-spacing:1.8px;color:#b4a4ff">CENTRAL DE OPERAÇÃO</div><h3>Seu atendimento, em perspectiva.</h3><p>Indicadores e prioridades de ${safe(title)}, em um único lugar.</p></div><button data-overview-action="kanban">Abrir Kanban →</button></div>
      <div class="overview-metrics">${metrics.map(m=>`<div class="overview-metric"><span class="kicker">${safe(m[0])}</span><strong>${safe(m[1])}</strong><span class="foot">${safe(m[2])}</span></div>`).join("")}</div>
      <div class="overview-split">
        <section class="overview-panel"><h3>Distribuição pelo funil</h3><p class="sub">Leads em cada etapa da operação</p>${stagesUsed.map(x=>{const n=items.filter(v=>v.stage===x).length;return`<div class="overview-bar"><span>${safe(x)}</span><div class="overview-track"><div class="overview-fill" style="width:${n*100/max}%"></div></div><b>${n}</b></div>`}).join("")}</section>
        <section class="overview-panel"><h3>Origem dos contatos</h3><p class="sub">De onde chegam os leads cadastrados</p>${channels.length?channels.map(([channel,n])=>`<div class="overview-item"><div><b>${safe(channel)}</b><small>${Math.round(n/items.length*100)}% dos contatos</small></div><span class="pill">${n} lead${n===1?"":"s"}</span></div>`).join(""):'<p>Nenhum lead cadastrado.</p>'}</section>
      </div>
      <div class="overview-split">
        <section class="overview-panel"><h3>Prioridades da recepção</h3><p class="sub">Próximas ações que merecem atenção</p>${pending.length?pending.slice(0,5).map(x=>`<div class="overview-item"><div><b>${safe(x.name)}</b><small>${safe(x.company)} · ${safe(x.procedure||x.source)}</small></div><span class="pill">Retorno vencido</span></div>`).join(""):'<div class="overview-item"><div><b>Sem retornos vencidos</b><small>Todos os follow-ups registrados estão em dia.</small></div></div>'}</section>
        <section class="overview-panel"><h3>Resumo comercial</h3><p class="sub">Visão inicial de desempenho</p>
          <div class="overview-item"><div><b>Vendas convertidas</b><small>Leads na etapa Convertido</small></div><span class="pill">${converted.length}</span></div>
          <div class="overview-item"><div><b>Taxa de conversão</b><small>Sobre os leads cadastrados</small></div><span class="pill">${items.length?Math.round(converted.length/items.length*100):0}%</span></div>
          <div class="overview-item"><div><b>Valor informado em leads convertidos</b><small>Estimativa, não faturamento recebido</small></div><span class="pill">${safe(brl(converted.reduce((t,x)=>t+(Number(x.value)||0),0)))}</span></div>
        </section>
      </div>
      <div class="overview-activity"><button class="overview-action" data-overview-action="kanban"><b>▦ Kanban</b><small>Movimentar e acompanhar leads</small></button><button class="overview-action" data-overview-action="followups"><b>◷ Follow-ups</b><small>Ver e organizar retornos</small></button><button class="overview-action" data-overview-action="agendamentos"><b>▤ Agendamentos</b><small>Consultar procedimentos marcados</small></button></div>`;
    section.querySelectorAll("[data-overview-action]").forEach(b=>b.onclick=()=>showTab(b.dataset.overviewAction));
  }
  function showTab(next){
    tab=next;
    document.querySelectorAll("aside nav [data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    document.getElementById("title").textContent=({overview:"Visão geral",kanban:"Funil de atendimento",followups:"Central de follow-ups",agendamentos:"Agendamentos",leads:"Todos os leads",inbox:"Conversas unificadas"})[tab]||"Visão geral";
    render();
  }
  render=function(){
    renderBase();
    section.classList.toggle("hidden",tab!=="overview");
    document.getElementById("stats").classList.toggle("hidden",tab==="overview");
    if(tab==="overview")renderOverview();
  };
  document.querySelectorAll("aside nav [data-tab]").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  showTab("overview");
})();