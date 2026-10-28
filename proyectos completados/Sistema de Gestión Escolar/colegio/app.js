const $d=document,$=s=>$d.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let M,T,rows=[],sk=null,sd=1,eid=0;

async function api(a,t,body){
  const r=await fetch(`?api=${a}&t=${t||''}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
  if(r.status===401){location.reload();return}
  const j=await r.json(); if(!r.ok) throw new Error(j.error||'Algo salió mal'); return j;
}
const opt=(f,v)=>(M.opts[f].find(o=>o[0]==v)||[0,'—'])[1];
const val=(c,v)=>c.t==='fk'?opt(c.fk,v):c.t==='date'?(/^\d{4}-/.test(v)?v.split('-').reverse().join('/'):'—'):(v===''||v==null?'—':v);

function toast(m,bad){const e=$d.createElement('div');e.className='toast'+(bad?' bad':'');e.textContent=m;$('#toasts').append(e);
  setTimeout(()=>{e.classList.add('bye');setTimeout(()=>e.remove(),400)},3200)}
function countUp(el,n){const t0=performance.now();(function f(t){const p=Math.min((t-t0)/700,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)}

function nav(){
  $('#nav').innerHTML='<b class="pill"></b>'+M.order.map(k=>`<button data-t="${k}"><em>${M.tables[k].i}</em>${esc(M.tables[k].l)}<small data-n="${M.counts[k]}">0</small></button>`).join('');
  $('#nav').onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.t)};
  $d.querySelectorAll('#nav small').forEach(s=>countUp(s,+s.dataset.n));
}
function mark(){const b=$(`#nav [data-t="${T}"]`);$d.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  const p=$('.pill');p.style.transform=`translateY(${b.offsetTop}px)`;p.style.height=b.offsetHeight+'px'}

async function go(t){
  T=t;sk=null;$('#q').value='';const m=M.tables[t],h=$('#ttl');
  h.textContent=m.l;h.classList.remove('sw');void h.offsetWidth;h.classList.add('sw');
  $('#new').textContent='+ Agregar '+m.s;mark();
  try{rows=(await api('list',t)).rows}catch(e){toast(e.message,1);rows=[]}
  draw(true);
}
function draw(anim,flashId){
  const m=M.tables[T],q=$('#q').value.trim().toLowerCase(),vis=m.cols.filter(c=>c.s);
  let r=rows.filter(x=>!q||m.cols.some(c=>String(val(c,x[c.n])).toLowerCase().includes(q)));
  if(sk){const c=m.cols.find(c=>c.n===sk),g=x=>c.t==='fk'?opt(c.fk,x[sk]):x[sk];
    r=[...r].sort((a,b)=>String(g(a)).localeCompare(String(g(b)),'es',{numeric:true})*sd)}
  $('#sub').textContent=(r.length===rows.length?r.length:`${r.length} de ${rows.length}`)+(rows.length===1?' registro':' registros');
  $('#tb').innerHTML=`<thead><tr>${vis.map(c=>`<th data-c="${c.n}" class="${sk===c.n?(sd>0?'asc':'desc'):''}">${esc(c.l)}</th>`).join('')}<th></th></tr></thead><tbody>`+
  (r.length?r.map((x,i)=>`<tr data-id="${x[m.pk]}" class="${anim?'in':''}${x[m.pk]==flashId?' flash':''}" style="--i:${Math.min(i,14)}">`+
    vis.map((c,j)=>{const v=esc(val(c,x[c.n]));
      return '<td>'+(j?(c.t==='fk'?`<span class="chip">${v}</span>`:v):`<div class="nm"><span class="av" style="--h:${(x[m.pk]*47)%360}">${esc(String(x[c.n]||'?')[0].toUpperCase())}</span>${v}</div>`)+'</td>'}).join('')+
    `<td class="act"><button class="ib" data-e title="Editar">✎</button><button class="ib del" data-d title="Eliminar">✕</button></td></tr>`).join(''):
    `<tr><td class="empty" colspan="${vis.length+1}">${q?`No hay resultados para “${esc(q)}”. Probá con otra búsqueda.`:`Todavía no hay ${esc(m.l.toLowerCase())}. Agregá el primero con el botón de arriba.`}</td></tr>`)+'</tbody>';
}
$('#tb').onclick=e=>{
  const th=e.target.closest('th[data-c]');
  if(th){sd=sk===th.dataset.c?-sd:1;sk=th.dataset.c;return draw(false)}
  const tr=e.target.closest('tr[data-id]');if(!tr)return;
  e.target.closest('[data-d]')?ask(tr.dataset.id):form(tr.dataset.id);
};
$('#q').oninput=()=>draw(false);
$('#new').onclick=()=>form(0);
$d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$d.querySelectorAll('dialog').forEach(d=>d.onclick=e=>{if(e.target===d)d.close()});

function form(id){
  const m=M.tables[T],r=id?rows.find(x=>x[m.pk]==id):{};eid=+id;
  $('#ft').textContent=(id?'Editar ':'Agregar ')+m.s;
  $('#fields').innerHTML=m.cols.map((c,i)=>{const v=r[c.n]??'',a=`name="${c.n}"`;
    return `<label>${esc(c.l)}`+(c.t==='fk'
      ?`<select ${a}><option value="0">Sin dato</option>${M.opts[c.fk].map(o=>`<option value="${o[0]}"${o[0]==v?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`
      :`<input ${a} type="${{number:'number',date:'date',tel:'tel'}[c.t]||'text'}" value="${esc(v)}"${c.max?` maxlength="${c.max}"`:''}${i==0||c.t==='date'?' required':''}>`)+'</label>'}).join('');
  $('#dlg').showModal();
}
$('#form').onsubmit=async e=>{
  e.preventDefault();const b=$('#sv');b.disabled=true;
  try{const j=await api('save',T,{id:eid,data:Object.fromEntries(new FormData(e.target))});
    $('#dlg').close();await refresh(j.id);toast(eid?'Cambios guardados':'Agregado');
  }catch(x){toast(x.message,1)}finally{b.disabled=false}
};
async function refresh(flashId){
  rows=(await api('list',T)).rows;M.counts[T]=rows.length;
  const s=$(`#nav [data-t="${T}"] small`);countUp(s,rows.length);
  draw(false,flashId);
}
function ask(id){
  const m=M.tables[T],r=rows.find(x=>x[m.pk]==id);
  $('#cn').textContent=m.cols.slice(0,2).filter(c=>c.t==='text').map(c=>r[c.n]).join(' ');
  $('#cfm').showModal();
  $('#yes').onclick=async()=>{
    $('#cfm').close();$(`tr[data-id="${id}"]`)?.classList.add('out');
    try{await api('delete',T,{id});await new Promise(r=>setTimeout(r,330));await refresh();toast('Eliminado')}
    catch(x){toast(x.message,1);draw(false)}
  };
}
(async()=>{
  try{M=await api('meta');nav();go(M.order[0])}
  catch(e){$('#ttl').textContent='Sin conexión';$('#sub').textContent=e.message}
})();