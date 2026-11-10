/* ATENDE - Intelligence panel: evidence-based, no simulated performance claims. */
(function(){
 const style=document.createElement('style');
 style.textContent=[
 '.follow-ai{background:white;border:1px solid #e7e4f0;border-radius:16px;padding:22px;box-shadow:0 5px 18px #25204206}',
 '.follow-ai h3{font-size:15px;margin:0}.follow-ai p{color:#767087;font-size:12px;line-height:1.6}',
 '.follow-ai-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}',
 '.follow-ai-label{font-size:10px;background:#f0eaff;color:#6142b5;border-radius:30px;padding:7px 10px;font-weight:700}',
 '.follow-ai-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0}',
 '.follow-ai-stat{padding:14px;background:#f8f7fc;border:1px solid #efedf6;border-radius:12px}',
 '.follow-ai-stat strong{font-size:23px;display:block;color:#27213f}.follow-ai-stat span{font-size:11px;color:#78728e;display:block;margin-top:6px}',
 '.follow-ai-message{background:#f7f4fd;border:1px solid #e9e2f8;border-radius:12px;padding:16px}',
 '.follow-ai-message b{font-size:13px;color:#38304c}.follow-ai-message p{margin:8px 0 0}',
 '.follow-ai-tests{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}',
 '.follow-ai-test{padding:13px;border:1px solid #ebe8f2;border-radius:12px;font-size:11px;color:#6f687d}',
 '.follow-ai-test b{display:block;color:#393248;font-size:12px;margin-bottom:6px}',
 '.follow-ai-list{margin-top:12px}.follow-ai-list div{font-size:12px;padding:11px 0;border-top:1px solid #efedf4;color:#625b73}',
 '.follow-ai-button{margin-top:13px;background:#6d4ce4;color:white;border:0;padding:10px 13px;border-radius:10px;font-size:11px;cursor:pointer}',
 '@media(max-width:720px){.follow-ai-grid,.follow-ai-tests{grid-template-columns:1fr}}'
 ].join('');
 document.head.append(style);
 const host=document.getElementById('overview');if(!host)return;
 const panel=document.createElement('section');panel.id='followup-intelligence';
 const esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const percent=(n,total)=>total?Math.round(n*100/total)+'%':'—';
 function calculate(){
   const leads=typeof data==='function'?data():[];
   const rows=leads.flatMap(lead=>(lead.followupEvents||[]).filter(e=>e&&e.sentAt&&e.strategy));
   const by=new Map();
   for(const event of rows){
     const key=String(event.strategy||'').trim();if(!key)continue;
     if(!by.has(key))by.set(key,{name:key,total:0,measured:0,replied:0,booked:0});
     const item=by.get(key);item.total++;
     if(event.status&&event.status!=='pending'){
       item.measured++;
       if(['responded','appointment','converted'].includes(event.status))item.replied++;
       if(['appointment','converted'].includes(event.status))item.booked++;
     }
   }
   const values=[...by.values()],total=values.reduce((n,v)=>n+v.total,0),measured=values.reduce((n,v)=>n+v.measured,0),replied=values.reduce((n,v)=>n+v.replied,0),booked=values.reduce((n,v)=>n+v.booked,0);
   const contenders=values.filter(x=>x.measured>=10).sort((a,b)=>b.booked/b.measured-a.booked/a.measured);
   const box=contenders.length?
    '<div class="follow-ai-message"><b>Abordagem com melhor sinal observado: '+esc(contenders[0].name)+'</b><p>'+contenders[0].booked+' de '+contenders[0].measured+' retornos avaliados geraram agendamento ou conversão. Esta é uma associação observada, não prova de causalidade.</p></div>'+
    '<div class="follow-ai-list">'+contenders.slice(0,5).map(x=>'<div><b>'+esc(x.name)+'</b> · '+x.measured+' avaliados · '+percent(x.replied,x.measured)+' responderam · '+percent(x.booked,x.measured)+' agendaram</div>').join('')+'</div>':
    '<div class="follow-ai-message"><b>Ainda não há evidências para identificar um follow-up vencedor.</b><p>'+ (measured?'Temos '+measured+' retornos com resultado, mas precisamos de pelo menos 10 por abordagem para iniciar a comparação.':'Precisamos registrar cada follow-up efetivamente enviado e se ele gerou resposta, agendamento ou conversão. Datas de retorno e dados fictícios não comprovam desempenho.') +'</p></div>'+
    '<div class="follow-ai-tests"><div class="follow-ai-test"><b>Teste 1 · Resolver uma dúvida</b>Retomar a pergunta mais recente do cliente.</div><div class="follow-ai-test"><b>Teste 2 · Personalizar</b>Mencionar o procedimento ou publicação de interesse.</div><div class="follow-ai-test"><b>Teste 3 · Convite sem pressão</b>Oferecer esclarecimento antes de sugerir agendamento.</div></div><p style="font-size:11px">Essas são hipóteses para testar, não resultados comprovados.</p>';
   panel.innerHTML='<div class="follow-ai"><div class="follow-ai-top"><div><h3>✦ Inteligência de follow-ups</h3><p>O que está funcionando nas abordagens da recepção?</p></div><span class="follow-ai-label">'+(contenders.length?'Resultados observados':'Em aprendizado')+'</span></div>'+
    '<div class="follow-ai-grid"><div class="follow-ai-stat"><strong>'+total+'</strong><span>Follow-ups rastreados</span></div><div class="follow-ai-stat"><strong>'+percent(replied,measured)+'</strong><span>Taxa de resposta · '+measured+' avaliados</span></div><div class="follow-ai-stat"><strong>'+percent(booked,measured)+'</strong><span>Agendamentos/conversões</span></div></div>'+box+
    '<button type="button" class="follow-ai-button" id="follow-ai-open">Ver follow-ups</button></div>';
   document.getElementById('follow-ai-open').onclick=()=>document.querySelector('aside nav [data-tab="followups"]')?.click();
 }
 const previous=render;
 render=function(){
   previous();
   if(tab!=='overview')return;
   if(!panel.isConnected){
     const splits=host.querySelectorAll('.overview-split');
     if(splits.length)splits[splits.length-1].after(panel);else host.append(panel);
   }
   calculate();
 };
 render();
})();