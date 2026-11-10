(function(){
const style=document.createElement('style');
style.textContent=".msg-shell{display:grid;grid-template-columns:270px 1fr;min-height:540px;height:72vh;max-height:760px;border:1px solid #e7e5ee;border-radius:17px;overflow:hidden;background:white}.msg-sidebar{border-right:1px solid #eee;overflow:auto}.msg-sidebar h3{padding:16px;margin:0;font-size:15px}.msg-conv{display:block;width:100%;border:0;border-top:1px solid #f1eff5;text-align:left;background:white;padding:14px;cursor:pointer}.msg-conv.sel,.msg-conv:hover{background:#f4effe}.msg-conv b,.msg-conv small{display:block}.msg-conv b{font-size:13px}.msg-conv small{margin-top:5px;color:#888;font-size:11px}.msg-view{display:flex;flex-direction:column;min-width:0;background:#f5f2f8}.msg-top{padding:16px;background:white;border-bottom:1px solid #eae6ef;font-size:14px;font-weight:700}.msg-top small{display:block;font-weight:400;font-size:11px;color:#8a829b;margin-top:4px}.msg-bubbles{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:10px}.msg-bubble{background:white;align-self:flex-start;padding:11px 13px;border-radius:13px;max-width:80%;box-shadow:0 1px 4px #1412250a;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}.msg-bubble.mine{align-self:flex-end;background:#e9e1fb}.msg-bubble small{display:block;font-size:9px;color:#817d8e;text-align:right;margin-top:6px}.msg-composer{padding:12px;background:white;border-top:1px solid #ece9ef}.msg-tools{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}.msg-tools button,.msg-options button,.msg-clip button{font:inherit;font-size:11px;background:#f7f5fb;border:1px solid #e7e2ef;border-radius:8px;padding:7px 9px;cursor:pointer}.msg-tools .ai{background:#eee7ff;color:#6547b7;font-weight:700}.msg-form{display:flex;gap:9px}.msg-form textarea{font:inherit;font-size:12px;line-height:1.5;flex:1;resize:vertical;min-width:0;max-height:150px;border:1px solid #e5e0ee;background:#f9f8fc;border-radius:11px;padding:11px}.msg-form button{border:0;border-radius:10px;background:#6d4ce4;color:white;padding:10px 15px;cursor:pointer}.msg-options{display:flex;flex-wrap:wrap;gap:5px;padding:8px 0}.msg-hint{font-size:11px;color:#837b92;margin:7px 0 0}.msg-clip{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 0}.msg-clip audio{max-width:230px}.msg-attachments{display:flex;gap:8px;flex-wrap:wrap;padding:8px 0}.msg-file{font-size:11px;border:1px solid #e2deeb;border-radius:10px;padding:9px 10px;background:#f7f5fc;display:flex;align-items:center;gap:7px;max-width:100%;overflow-wrap:anywhere}.msg-file button{border:0;background:#e6dfef;color:#5d4c77;border-radius:7px;padding:5px 8px;cursor:pointer}.msg-file-preview{display:block;max-height:95px;max-width:150px;border-radius:7px;margin:5px 0}.msg-attach-note{font-size:10px;color:#827b93}.msg-options[hidden],.msg-clip[hidden],.msg-attachments[hidden],.msg-composer[hidden]{display:none!important}.msg-back{display:none;background:#eee9fa;border:0;border-radius:7px;padding:5px;margin-right:8px}@media(max-width:700px){.msg-shell{grid-template-columns:1fr;height:69vh}.msg-shell .msg-view{display:none}.msg-shell.open .msg-sidebar{display:none}.msg-shell.open .msg-view{display:flex}.msg-back{display:inline-block}}";
style.textContent += ".msg-shell{grid-template-columns:minmax(285px,320px) minmax(0,1fr)}.msg-sidebar{width:auto!important;min-width:0!important;flex-shrink:1!important;display:flex;flex-direction:column}.msg-sidebar h3{margin:0;padding:15px 16px 8px}.msg-search-panel{padding:8px 12px 12px;border-bottom:1px solid #eee;display:grid;gap:9px}.msg-search-panel input,.msg-search-panel select{width:100%;box-sizing:border-box;padding:9px;border:1px solid #e2deeb;border-radius:9px;background:#fff;font:inherit;font-size:12px}.msg-filters{display:grid;grid-template-columns:1fr 1fr;gap:6px}.msg-queue-summary{font-size:11px;color:#716b82}.msg-list{overflow:auto;flex:1;min-height:0}.msg-conv{border-left:3px solid transparent}.msg-conv.sel{border-left-color:#7654d9}.msg-conv .msg-meta{display:flex;justify-content:space-between;gap:5px;align-items:center;margin-top:7px}.msg-conv .msg-state{font-size:10px;border-radius:20px;padding:3px 6px;background:#f1eef8;color:#6b597d}.msg-conv .msg-state.pending{background:#fff1d9;color:#8d5e25}.msg-conv .msg-state.open{background:#e9f5ee;color:#367052}.msg-claim{padding:6px 8px;border-radius:7px;border:1px solid #ddd6ed;background:#fff;color:#554a76;font-size:11px;cursor:pointer;margin-top:8px}.msg-claim[disabled]{opacity:.6;cursor:not-allowed}.msg-top .msg-channel{margin-top:5px}.msg-claim-status{font-size:11px;color:#6d677a;margin:7px 0 0}.msg-empty{padding:18px;color:#807a8e;font-size:12px;line-height:1.5}@media(max-width:700px){.msg-shell{grid-template-columns:1fr}.msg-sidebar{width:100%!important}}";
document.head.append(style);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function mount(container,options){
let selected=null,recording=null,stream=null,recorder=null,chunks=[],convs=options.conversations||[],pendingFiles=[];const MAX_FILE_BYTES=500*1024*1024;
let query="",channelFilter="all",statusFilter="all";
container.innerHTML='<div class="msg-shell"><aside class="msg-sidebar"><h3>Caixa de Entrada <small style="font-size:10px;color:#777">WhatsApp · Instagram · Messenger</small></h3><div class="msg-search-panel"><input class="msg-search" type="search" placeholder="Buscar contato ou mensagem..." aria-label="Pesquisar conversas"><div class="msg-filters"><select class="msg-channel-filter" aria-label="Filtrar por canal"><option value="all">Todos os canais</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="messenger">Messenger</option></select><select class="msg-status-filter" aria-label="Filtrar por situação"><option value="all">Todas as situações</option><option value="open">Em aberto</option><option value="pending">Pendentes</option><option value="resolved">Resolvidas</option><option value="free">Sem responsável</option></select></div><div class="msg-queue-summary" role="status"></div></div><div class="msg-list"></div></aside><section class="msg-view"><header class="msg-top"><button class="msg-back" type="button">←</button><span class="msg-name">Escolha uma conversa</span><small class="msg-channel"></small><div class="msg-assignment"></div><p class="msg-claim-status" aria-live="polite"></p></header><div class="msg-bubbles"></div><footer class="msg-composer" hidden><div class="msg-tools"><button type="button" class="msg-emoji">☺ Emojis</button><button type="button" class="msg-attach">📎 Anexar arquivos</button><button type="button" class="msg-audio">🎙 Gravar áudio</button><button type="button" class="ai msg-ai">✦ Ajustar com IA</button></div><div class="msg-options" hidden></div><input class="msg-files-input" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" hidden><div class="msg-attachments" hidden></div><div class="msg-clip" hidden></div><form class="msg-form"><textarea rows="2" spellcheck="true" placeholder="Digite sua mensagem..."></textarea><button type="submit">Enviar ➤</button></form><p class="msg-hint"></p></footer></section></div>';
const $=s=>container.querySelector(s);const note=(t,bad)=>{$('.msg-hint').textContent=t;$('.msg-hint').style.color=bad?'#b42342':'#817a90'};
function normalizedChannel(c){const raw=String(c.channel||"").toLowerCase();return raw==="facebook"?"messenger":raw}
function searchable(c){return [c.contact_label,c.preview,c.channel,c.company].join(" ").toLocaleLowerCase("pt-BR")}
function visibleConversations(){return convs.filter(c=>(channelFilter==="all"||normalizedChannel(c)===channelFilter)&&(statusFilter==="all"||(statusFilter==="free"?!c.assigned_to:String(c.status||"open")===statusFilter))&&(!query||searchable(c).includes(query)))}
function assignmentText(c){return c.assigned_to?"Atendimento atribuído":"Disponível para assumir"}
function list(){
 const items=visibleConversations();
 const pending=convs.filter(c=>c.status==="pending").length,free=convs.filter(c=>!c.assigned_to).length;
 $(".msg-queue-summary").textContent=items.length+" de "+convs.length+" conversas · "+pending+" pendente(s) · "+free+" disponível(is)";
 $(".msg-list").innerHTML=items.map(c=>'<button class="msg-conv '+(selected===c.id?'sel':'')+'" data-id="'+esc(c.id)+'"><b>'+esc(c.contact_label||"Contato")+'</b><small>'+esc(c.channel||"Canal não identificado")+' · '+esc(c.preview||"Abrir atendimento")+'</small><span class="msg-meta"><span class="msg-state '+esc(c.status||"open")+'">'+esc(c.status==="pending"?"Pendente":c.status==="resolved"?"Resolvida":"Em aberto")+'</span><small>'+esc(assignmentText(c))+'</small></span></button>').join("")||'<div class="msg-empty">Nenhuma conversa encontrada para estes filtros.</div>';
 $(".msg-list").querySelectorAll(".msg-conv").forEach(b=>b.onclick=()=>void open(b.dataset.id));
}
$(".msg-search").oninput=e=>{query=String(e.target.value||"").trim().toLocaleLowerCase("pt-BR");list()};
$(".msg-channel-filter").onchange=e=>{channelFilter=e.target.value;list()};
$(".msg-status-filter").onchange=e=>{statusFilter=e.target.value;list()};
function renderAssignment(c){
 const slot=$(".msg-assignment"),label=$(".msg-claim-status");slot.replaceChildren();label.textContent="";
 if(!c)return;
 if(c.assigned_to){label.textContent="Esta conversa possui responsável atribuído.";return}
 if(typeof options.claimConversation!=="function"){label.textContent="Atribuição indisponível nesta versão.";return}
 const btn=document.createElement("button");btn.type="button";btn.className="msg-claim";btn.textContent="Assumir atendimento";slot.append(btn);
 btn.onclick=async()=>{
   btn.disabled=true;label.textContent="Atribuindo atendimento...";
   try{
     const updated=await options.claimConversation(c.id);
     const index=convs.findIndex(x=>x.id===c.id);
     if(index>=0)convs[index]={...convs[index],...(updated||{}),assigned_to:updated?.assigned_to||"atribuído"};
     label.textContent="Atendimento assumido com sucesso.";renderAssignment(convs[index]||c);list();
   }catch(err){label.textContent=err?.message||String(err);btn.disabled=false}
 };
}
async function open(id){if(id!==selected)clearFiles();selected=id;list();$('.msg-shell').classList.add('open');const c=convs.find(x=>x.id===id);if(!c)return;$('.msg-name').textContent=c.contact_label;$('.msg-channel').textContent=c.channel+' · '+(c.company||'');$('.msg-composer').hidden=!options.sendText&&!options.sendFiles&&!options.sendAudio;renderAssignment(c);await refresh()}
async function refresh(){let ms=[];try{ms=await options.loadMessages(selected)}catch(e){note(e.message||String(e),true)}$('.msg-bubbles').innerHTML=(ms||[]).map(m=>'<div class="msg-bubble '+(m.direction==='outbound'?'mine':'')+'">'+esc(m.body||'[Mídia]')+'<small>'+esc(m.sent_at?new Date(m.sent_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'')+'</small></div>').join('')||'<p style="margin:auto;color:#888;font-size:12px">Nenhuma mensagem nesta conversa.</p>';$('.msg-bubbles').scrollTop=$('.msg-bubbles').scrollHeight}
const editor=$('.msg-form textarea');$('.msg-back').onclick=()=>$('.msg-shell').classList.remove('open');
function clearFiles(){pendingFiles.forEach(f=>{if(f.preview)URL.revokeObjectURL(f.preview)});pendingFiles=[];drawFiles()}
function drawFiles(){
  const box=$('.msg-attachments');box.hidden=pendingFiles.length===0;
  box.replaceChildren();
  pendingFiles.forEach((item,i)=>{
    const entry=document.createElement('div');entry.className='msg-file';
    const descriptor=document.createElement('span');descriptor.textContent=item.file.name+' · '+(item.file.size/1048576).toFixed(1)+' MB';entry.append(descriptor);
    if(item.file.type.startsWith('image/')){const img=document.createElement('img');img.src=item.preview;img.alt='Prévia do arquivo';img.className='msg-file-preview';entry.append(img)}
    else if(item.file.type.startsWith('video/')){const video=document.createElement('video');video.src=item.preview;video.controls=true;video.preload='metadata';video.className='msg-file-preview';entry.append(video)}
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remover '+item.file.name);
    remove.onclick=()=>{URL.revokeObjectURL(item.preview);pendingFiles.splice(i,1);drawFiles()};entry.append(remove);box.append(entry);
  });
}
$('.msg-attach').onclick=()=>$('.msg-files-input').click();
$('.msg-files-input').onchange=e=>{
  const files=Array.from(e.target.files||[]);
  const tooBig=files.filter(f=>f.size>MAX_FILE_BYTES);
  const allowed=files.filter(f=>f.size<=MAX_FILE_BYTES);
  const count=allowed.length;
  for(const file of allowed)pendingFiles.push({file,preview:URL.createObjectURL(file)});
  e.target.value='';drawFiles();
  if(tooBig.length)note('Arquivos acima de 500 MB não foram adicionados: '+tooBig.map(f=>f.name).join(', '),true);
  else if(count)note(count+' arquivo(s) selecionado(s). Limite de 500 MB por arquivo no CRM; o canal de envio pode aceitar menos.');
};
$('.msg-form').onsubmit=async e=>{
  e.preventDefault();const value=editor.value.trim();
  if(!value&&!pendingFiles.length)return;
  if(pendingFiles.length&&!options.sendFiles){note('Arquivos selecionados para prévia. O envio real exige armazenamento privado e integração Meta; arquivos de até 500 MB podem exceder o limite do canal.',true);return}
  if(value&&!options.sendText){note('Demonstração: conecte a Meta para enviar mensagens reais.',true);return}
  const button=$('.msg-form button[type="submit"]');button.disabled=true;
  try{
    if(pendingFiles.length){await options.sendFiles(selected,pendingFiles.map(x=>x.file),value);clearFiles()}
    else if(value)await options.sendText(selected,value);
    editor.value='';await refresh();note('Envio solicitado ao serviço de integração.');
  }catch(error){note(error.message||String(error),true)}
  finally{button.disabled=false}
};
$('.msg-emoji').onclick=()=>{const box=$('.msg-options');box.hidden=!box.hidden;box.innerHTML=['😊','🙂','💜','❤️','🙏','✨','👋','👍','🌷','📅','✅','🌿'].map(v=>'<button type="button" data-emoji="'+v+'">'+v+'</button>').join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=editor.selectionStart,z=editor.selectionEnd;editor.setRangeText(b.dataset.emoji,a,z,'end');editor.focus()})};
$('.msg-ai').onclick=()=>{const box=$('.msg-options');box.hidden=!box.hidden;box.innerHTML=[['corrigir','Corrigir'],['refinar','Refinar'],['acolhedor','Mais acolhedor'],['comercial','Mais comercial'],['curto','Resumir']].map(([id,v])=>'<button type="button" data-style="'+id+'">'+v+'</button>').join('');box.querySelectorAll('button').forEach(b=>b.onclick=async()=>{if(!editor.value.trim()){note('Digite um texto antes de usar a IA.',true);return}if(!options.rewrite){note('Assistente de IA ainda não configurado. O corretor ortográfico do navegador já funciona.',true);return}b.disabled=true;try{const result=await options.rewrite(editor.value,b.dataset.style);if(typeof result!=='string'||!result.trim())throw Error('Resposta inválida da IA');editor.value=result;editor.focus();box.hidden=true;note('Sugestão aplicada ao rascunho. Revise antes de enviar.')}catch(e){note(e.message||String(e),true)}finally{b.disabled=false}})};
$('.msg-audio').onclick=async()=>{if(recording){recorder.stop();return}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){note('Microfone indisponível. Use HTTPS e um navegador compatível.',true);return}try{stream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(stream);chunks=[];recording=true;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());recording=false;$('.msg-audio').textContent='🎙 Gravar áudio';const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'}),url=URL.createObjectURL(blob);const wrap=$('.msg-clip');wrap.hidden=false;wrap.innerHTML='';const audio=document.createElement('audio');audio.controls=true;audio.src=url;const discard=document.createElement('button');discard.textContent='Descartar';discard.onclick=()=>{URL.revokeObjectURL(url);wrap.hidden=true;wrap.innerHTML=''};const send=document.createElement('button');send.textContent='Enviar áudio';send.onclick=async()=>{if(!options.sendAudio){note('Envio de áudio ainda não habilitado. A gravação funciona apenas como prévia.',true);return}try{await options.sendAudio(selected,blob);wrap.hidden=true;wrap.innerHTML='';URL.revokeObjectURL(url);await refresh()}catch(e){note(e.message||String(e),true)}};wrap.append(audio,discard,send)};recorder.start();$('.msg-audio').textContent='■ Parar gravação';note('Gravando. Clique em parar para ouvir antes de enviar.')}catch(e){recording=false;note('Não foi possível acessar o microfone: '+e.message,true)}};
list();return {update(next,more){convs=next||[];if(more&&typeof more==="object")options={...options,...more};if(selected&&!convs.some(c=>c.id===selected)){selected=null;$(".msg-shell").classList.remove("open");$(".msg-composer").hidden=true;$(".msg-name").textContent="Escolha uma conversa";$(".msg-bubbles").replaceChildren();$(".msg-assignment").replaceChildren()}else if(selected){const c=convs.find(c=>c.id===selected);if(c)renderAssignment(c)}list()},open,refresh,close(){clearFiles();if(stream)stream.getTracks().forEach(t=>t.stop())}};
}
window.ATENDE_CHAT={mount};
if(!window.ATENDE_CONFIG?.supabaseUrl){
const chats=[{id:'a',contact_label:'Mariana Costa (fictício)',channel:'Instagram',company:'Aloe',preview:'Queria saber sobre Botox'},{id:'b',contact_label:'Carlos Almeida (fictício)',channel:'WhatsApp',company:'Nagel',preview:'Vocês atendem hoje?'},{id:'c',contact_label:'Fernanda Oliveira (fictício)',channel:'Messenger',company:'Aloe',preview:'Como funciona a avaliação?'}];
const demo={a:[{body:'Olá! Gostaria de informações sobre Botox Full Face.',direction:'inbound',sent_at:'2026-11-10T10:10:00-03:00'},{body:'Olá! Que bom receber sua mensagem. Já realizou esse procedimento antes?',direction:'outbound',sent_at:'2026-11-10T10:12:00-03:00'}],b:[{body:'Bom dia, vocês atendem hoje à tarde?',direction:'inbound',sent_at:'2026-11-10T09:55:00-03:00'}],c:[{body:'Oi, como funciona a avaliação?',direction:'inbound',sent_at:'2026-11-10T09:20:00-03:00'}]};
const section=document.createElement('section');section.id='atende-demo-chat';section.className='hidden';document.getElementById('leads').after(section);
const nav=document.createElement('button');nav.textContent='◉ Conversas';nav.dataset.tab='inbox';document.querySelector('aside nav').append(nav);
mount(section,{conversations:chats,loadMessages:async id=>demo[id]||[]});window.ATENDE_CHAT.demo={conversations:chats,messages:demo};
const old=render;render=function(){old();section.classList.toggle('hidden',tab!=='inbox')};
nav.onclick=()=>{tab='inbox';document.querySelectorAll('aside nav [data-tab]').forEach(b=>b.classList.toggle('active',b===nav));document.getElementById('title').textContent='Conversas unificadas';render()};
}
})();