let selectedGroup='all';function escJS(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}function persistHistory(){localStorage.setItem(STORAGE_KEYS.history,JSON.stringify(history))}
async function deleteHistoryEntry(index){
  const row=history[index];
  if(!row)return;
  const ok=await openConfirmDialog({
    eyebrow:'Delete Saved Drop',
    title:'Remove this history entry?',
    message:'Selecting Delete will permanently remove this saved drop from local history on this device.',
    details:`${row.item} • ${row.spinType.toUpperCase()} • ${row.group} • ${row.time}`,
    confirmText:'Delete',
    cancelText:'Keep Item',
    danger:true
  });
  if(!ok)return;
  history.splice(index,1);
  if(selectedGroup!=='all'&&!history.some(entry=>entry.group===selectedGroup))selectedGroup='all';
  persistHistory();
  renderHistory();
}
function renderHistory(){const groups=[...new Set(history.map(h=>h.group))];document.getElementById('groupList').innerHTML=`<button class="groupRow ${selectedGroup==='all'?'active':''}" type="button" onclick="selectGroup('all')"><b>All Groups</b><span>${history.length} total drops</span></button>`+groups.map(g=>{let c=history.filter(h=>h.group===g).length;return `<button class="groupRow ${selectedGroup===g?'active':''}" type="button" onclick="selectGroup('${escJS(g)}')"><b>${g}</b><span>${c} drops spun</span></button>`}).join('');let rows=selectedGroup==='all'?history.map((entry,index)=>({...entry,__index:index})):history.map((entry,index)=>({...entry,__index:index})).filter(h=>h.group===selectedGroup);document.getElementById('historyHeading').textContent=selectedGroup==='all'?'All Groups':selectedGroup;document.getElementById('historySub').textContent=`${rows.length} saved drops`;preloadImages(rows);document.getElementById('historyRows').innerHTML=rows.map(h=>`<tr><td>${h.time}</td><td><b>${h.group}</b></td><td>${h.tier}</td><td>${h.spinType}</td><td>${imageMarkup(h,{className:'miniImg'})} <b>${h.item}</b>${!h.image&&!ITEM_LOOKUP.has(`${h.spinType}:${h.item}`)?'<span class="legacyBadge">Legacy Save</span>':''}</td><td>${h.category}</td><td><span class="badge ${h.rank}">${h.rank}</span></td><td><div class="historyActions"><button class="iconBtn" type="button" title="Delete this item" aria-label="Delete ${escapeHtml(h.item)} from history" onclick="deleteHistoryEntry(${h.__index})">${trashIconMarkup(`Delete ${h.item} from history`)}</button></div></td></tr>`).join('')||`<tr><td colspan="8" class="tiny">No history saved yet.</td></tr>`;attachImageGuards(document.getElementById('historyRows'))}
window.selectGroup=(g)=>{selectedGroup=g;renderHistory()};
window.deleteHistoryEntry=deleteHistoryEntry;
let viewSwitching=false;
let viewTransitionToken=0;
function setView(v){
  const targetView=v==='spins'?'spin':v;
  const next=document.getElementById(targetView+'View');
  if(!next)return;
  const current=document.querySelector('.view.active');
  if(current===next)return;
  // A new call always wins: bump the token so any in-flight transition's
  // callbacks become stale and no-op instead of silently dropping this click.
  const myToken=++viewTransitionToken;
  viewSwitching=true;
  document.querySelectorAll('.navBtn[data-view],.homeCard[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===targetView));
  if(typeof updateNavIndicator==='function')requestAnimationFrame(updateNavIndicator);
  if(typeof syncActiveCardIndex==='function')syncActiveCardIndex(targetView);
  function afterSwitch(){
    renderHistory();
    if((targetView==='tiers'||targetView==='spin')&&typeof render==='function')render();
    if(targetView==='home'){
      if(typeof updateHomeStats==='function')updateHomeStats();
      // Landing on home doesn't itself pick a card (there's no 'home' entry in
      // SECTION_ORDER) — restore whichever card was last selected instead of
      // leaving every card unhighlighted.
      if(typeof syncActiveCardIndex==='function'&&typeof SECTION_ORDER!=='undefined'&&typeof activeCardIndex==='number'){
        syncActiveCardIndex(SECTION_ORDER[activeCardIndex]);
      }
      if(typeof resumeReactiveDots==='function')resumeReactiveDots();
    }
    if(targetView==='playlist'&&typeof updatePlaylistView==='function')updatePlaylistView();
  }
  if(current){
    current.classList.add('fadeOut');
    setTimeout(()=>{
      if(myToken!==viewTransitionToken)return;
      current.classList.remove('active','fadeOut');
      next.classList.add('active');
      afterSwitch();
      setTimeout(()=>{if(myToken===viewTransitionToken)viewSwitching=false},260);
    },210);
  }else{
    next.classList.add('active');
    afterSwitch();
    viewSwitching=false;
  }
}
function exportCSV(){let rows=[['Time','Group','Tier','Spin Type','Item Won','Category','Rarity'],...history.map(h=>[h.time,h.group,h.tier,h.spinType,h.item,h.category,h.rank])];let csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='illegal-faction-spin-history.csv';a.click()}

function clickAnimate(el){if(!el)return;el.classList.remove('clicked','choiceOpen');void el.offsetWidth;el.classList.add('clicked','choiceOpen');setTimeout(()=>el.classList.remove('clicked','choiceOpen'),360)}
function spawnRipple(el,x,y){
  if(!el||document.body.classList.contains('lowMotion'))return;
  const r=el.getBoundingClientRect();
  const span=document.createElement('span');
  span.className='rippleFX';
  const size=Math.max(r.width,r.height)*1.4;
  span.style.width=span.style.height=`${size}px`;
  span.style.left=`${x-r.left-size/2}px`;
  span.style.top=`${y-r.top-size/2}px`;
  el.appendChild(span);
  span.addEventListener('animationend',()=>span.remove());
}
document.addEventListener('click',e=>{
  const t=e.target.closest('button,.card,.groupRow');
  if(!t)return;
  clickAnimate(t);
  spawnRipple(t,e.clientX,e.clientY);
},{passive:true});
document.getElementById('dropBtn').onclick=startSpin;
document.getElementById('closeSpin').onclick=()=>{if(!state.spinning)document.getElementById('spinModal').classList.remove('open')};
document.getElementById('closeResult').onclick=()=>{if(!resultsSaving)document.getElementById('resultModal').classList.remove('open')};
document.getElementById('collectBtn').onclick=saveResults;
document.getElementById('clearHistoryBtn').onclick=async()=>{const ok=await openConfirmDialog({eyebrow:'Clear History',title:'Clear all saved spin history?',message:'Selecting Delete All will permanently remove every saved spin from local history on this device.',details:`${history.length} saved ${history.length===1?'entry':'entries'} will be removed. This cannot be undone.`,confirmText:'Delete All',cancelText:'Cancel',danger:true});if(!ok)return;history=[];persistHistory();selectedGroup='all';renderHistory()};
document.getElementById('exportBtn').onclick=exportCSV;
// While a spin is in progress (or its result is actively being saved), the
// spin/result modals must not be dismissible by any means other than the
// guarded close buttons above — no backdrop click, no Escape.
document.getElementById('spinModal').addEventListener('mousedown',e=>{
  if(e.target.id==='spinModal'&&!state.spinning)document.getElementById('spinModal').classList.remove('open');
});
document.getElementById('resultModal').addEventListener('mousedown',e=>{
  if(e.target.id==='resultModal'&&!resultsSaving)document.getElementById('resultModal').classList.remove('open');
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const spinModal=document.getElementById('spinModal');
  const resultModal=document.getElementById('resultModal');
  if(spinModal.classList.contains('open')){if(!state.spinning)spinModal.classList.remove('open');return}
  if(resultModal.classList.contains('open')){if(!resultsSaving)resultModal.classList.remove('open')}
});
document.querySelectorAll('.navBtn[data-view],.homeCard[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function clickFX(b){b.classList.remove('clicked');void b.offsetWidth;b.classList.add('clicked');setTimeout(()=>b.classList.remove('clicked'),650)}
let tierSwitching=false;
function tierSwitchAnimation(nextTier,btn){
  clickFX(btn);
  if(nextTier===state.tier || tierSwitching)return;
  tierSwitching=true;
  const box=document.getElementById('items');
  document.querySelectorAll('.tierTab[data-tier]').forEach(x=>x.classList.toggle('active',x.dataset.tier===nextTier));
  if(typeof pulseGuidedReveal==='function')pulseGuidedReveal('#spinView .spinTypes');

  // Same smooth active-button animation, but instant data swap for no lag.
  box.classList.remove('tierSwitchIn','tierSwitchOut','poolReveal');
  box.classList.add('tierSwitchOut');
  requestAnimationFrame(()=>{
    state.tier=nextTier;
    render();
    box.classList.remove('tierSwitchOut');
    void box.offsetWidth;
    box.classList.add('tierSwitchIn');
    setTimeout(()=>{
      box.classList.remove('tierSwitchIn');
      tierSwitching=false;
    },260);
  });
}
document.querySelectorAll('.tierTab[data-tier]').forEach(b=>b.onclick=()=>tierSwitchAnimation(b.dataset.tier,b));
document.querySelectorAll('.spinType[data-type]').forEach(b=>b.onclick=()=>{state.spinType=b.dataset.type;state.rarityPeekFilter=state.filter;clickFX(b);document.querySelectorAll('.spinType[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===b.dataset.type));render();if(typeof pulseGuidedReveal==='function')pulseGuidedReveal('#spinDropsCarousel')});
document.querySelectorAll('.chip[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.rarityPeekFilter=b.dataset.filter;clickFX(b);document.querySelectorAll('.chip[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===b.dataset.filter));render()});
