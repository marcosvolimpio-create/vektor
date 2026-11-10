/* ATENDE etiquetas personalizadas: demonstração em memória, sem dados clínicos persistidos. */
(function(){
 const styles=document.createElement('style');
 styles.textContent='.et-row{display:flex;flex-wrap:wrap;gap:4px;margin:7px 0}.et-chip{border-radius:6px;padding:4px 7px;font-size:10px;font-weight:700}.et-wrap{padding:12px;border-radius:12px;border:1px solid #e5e2ef;background:#faf9fd;margin:12px 0}.et-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.et-item{display:flex;align-items:center;gap:7px;background:white;border:1px solid #e9e5f1;padding:7px;border-radius:9px;font-size:11px}.et-item button{border:0;background:#eee9f9;color:#5d5076;padding:4px 6px;border-radius:5px;cursor:pointer}.et-manage{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}.et-manage input,.et-manage select{padding:8px;border:1px solid #e3dfec;border-radius:8px;font:inherit;font-size:12px}.et-manage button{padding:9px 12px;border:0;border-radius:9px;background:#6d4ce4;color:white;cursor:pointer;font:inherit;font-size:12px}.et-lead{background:#fff;border-radius:13px;padding:13px}.et-checks{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.et-check{border:1px solid #e4deee;border-radius:9px;padding:7px;display:flex;align-items:center;gap:5px;font-size:11px}.et-note{font-size:11px;color:#868098}';
 document.head.append(styles);
 const palette=['#6d4ce4','#d95474','#db9043','#418e75','#3389bd','#b56fba','#6e748d','#af553b'];
 let tags=[
  {id:'a1',company:'Aloe',name:'Alta prioridade',color:'#d95474'},
  {id:'a2',company:'Aloe',name:'Botox',color:'#6d4ce4'},
  {id:'a3',company:'Aloe',name:'Aguardando resposta',color:'#db9043'},
  {id:'n1',company:'Nagel',name:'Alta prioridade',color:'#d95474'},
  {id:'n2',company:'Nagel',name:'Avaliação',color:'#418e75'}
 ];
 const assignments=new Map([[1,['a1','a2']],[2,['n2']],[3,['a3']],[6,['n1']]]);
 const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const safeColor=v=>palette.includes(v)?v:'#6e748d';
 const present=lead=>(assignments.get(lead.id)||[]).map(id=>tags.find(t=>t.id===id&&t.company===lead.company)).filter(Boolean);
 const section=document.createElement('section');section.id='etiquetas';section.className='hidden';document.getElementById('leads').after(section);
 const button=document.createElement('button');button.dataset.tab='etiquetas';button.textContent='◈ Etiquetas';document.querySelector('aside nav').append(button);
 function clinicOptions(){const selected=document.getElementById('company').value;return ['Aloe','Nagel'].filter(c=>selected==='all'||c===selected)}
 function paint(){
  const clinics=clinicOptions();
  section.innerHTML='<div class="et-wrap"><h3 style="margin:0;font-size:16px">Etiquetas coloridas</h3><p class="et-note">Personalize as etiquetas de cada clínica. Na demonstração, as alterações são temporárias.</p>'+
    '<form class="et-manage" id="et-new"><select name="company">'+clinics.map(c=>'<option value="'+c+'">'+(c==='Aloe'?'Aloe Medicina Estética':'Nagel Anatomia dos Pés')+'</option>').join('')+'</select><input required maxlength="36" name="label" placeholder="Nome da etiqueta"><select name="color">'+palette.map(color=>'<option value="'+color+'" style="color:'+color+'">'+color+'</option>').join('')+'</select><button>Criar etiqueta</button></form></div>'+
    clinics.map(clinic=>'<div class="et-wrap"><h3 style="margin:0;font-size:13px">'+(clinic==='Aloe'?'Aloe Medicina Estética':'Nagel Anatomia dos Pés')+'</h3><div class="et-list">'+tags.filter(t=>t.company===clinic).map(t=>'<div class="et-item"><span class="et-chip" style="background:'+safeColor(t.color)+'22;color:'+safeColor(t.color)+'">'+safe(t.name)+'</span><button type="button" data-rename="'+safe(t.id)+'" aria-label="Renomear">Editar</button><button type="button" data-remove="'+safe(t.id)+'" aria-label="Excluir">×</button></div>').join('')+'</div></div>').join('')+
    '<h3 style="font-size:15px">Aplicar etiquetas aos leads</h3><div class="et-list">'+(typeof data==='function'?data():[]).map(lead=>'<button class="et-item" type="button" data-lead="'+safe(lead.id)+'">'+safe(lead.name)+' · '+safe(present(lead).map(x=>x.name).join(', ')||'Sem etiquetas')+'</button>').join('')+'</div>';
  section.querySelector('#et-new').onsubmit=e=>{e.preventDefault();const v=new FormData(e.currentTarget);const name=String(v.get('label')||'').trim();const company=v.get('company');if(!name||!clinics.includes(company))return;if(tags.some(t=>t.company===company&&t.name.toLowerCase()===name.toLowerCase())){alert('Esta etiqueta já existe na clínica.');return}tags.push({id:'et'+Math.random().toString(36).slice(2),company,name,color:safeColor(v.get('color'))});render()};
  section.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const t=tags.find(t=>t.id===b.dataset.remove);if(!t)return;if(!confirm('Excluir etiqueta '+t.name+'?'))return;tags=tags.filter(x=>x!==t);assignments.forEach((ids,id)=>assignments.set(id,ids.filter(x=>x!==t.id)));render()});
  section.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>{const t=tags.find(t=>t.id===b.dataset.rename);if(!t)return;const name=prompt('Novo nome da etiqueta:',t.name)?.trim();if(name&&name.length<=36)t.name=name;render()});
  section.querySelectorAll('[data-lead]').forEach(b=>b.onclick=()=>{const lead=rows.find(x=>String(x.id)===b.dataset.lead);if(lead)openEditor(lead)});
 }
 function openEditor(lead){
  const available=tags.filter(x=>x.company===lead.company);
  const modal=document.createElement('dialog');modal.className='et-lead';modal.style.maxWidth='440px';modal.style.width='calc(100% - 25px)';modal.innerHTML='<h3>Etiquetas · '+safe(lead.name)+'</h3><p class="et-note">Escolha várias etiquetas para o mesmo lead.</p><form><div class="et-checks">'+available.map(t=>'<label class="et-check"><input type="checkbox" name="tag" value="'+safe(t.id)+'" '+((assignments.get(lead.id)||[]).includes(t.id)?'checked':'')+'><span class="et-chip" style="color:'+safeColor(t.color)+';background:'+safeColor(t.color)+'22">'+safe(t.name)+'</span></label>').join('')+'</div><button type="submit" class="primary">Salvar etiquetas</button> <button type="button" class="close" id="et-cancel">Cancelar</button></form>';document.body.append(modal);modal.showModal();modal.querySelector('#et-cancel').onclick=()=>modal.close();modal.querySelector('form').onsubmit=e=>{e.preventDefault();assignments.set(lead.id,Array.from(new FormData(e.currentTarget).getAll('tag')));modal.close();render()};modal.addEventListener('close',()=>modal.remove(),{once:true});
 }
 function decorate(){
  document.querySelectorAll('#kanban article.lead').forEach(card=>{const lead=rows.find(x=>String(x.id)===card.dataset.id);if(!lead||card.querySelector('.et-row'))return;const div=document.createElement('div');div.className='et-row';div.innerHTML=present(lead).map(t=>'<span class="et-chip" style="background:'+safeColor(t.color)+'22;color:'+safeColor(t.color)+'">'+safe(t.name)+'</span>').join('');const target=card.querySelector('.attribution-info');if(target)target.before(div);else card.append(div)});
 }
 const orig=render;
 render=function(){orig();decorate();section.classList.toggle('hidden',tab!=='etiquetas');if(tab==='etiquetas')paint()};
 button.onclick=()=>{tab='etiquetas';document.querySelectorAll('aside nav [data-tab]').forEach(x=>x.classList.toggle('active',x===button));document.getElementById('title').textContent='Etiquetas personalizadas';render()};
 window.ATENDE_TAGS={openEditor};
})();