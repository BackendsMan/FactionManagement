// Draws attention to the next step in the Spin Center's guided sequence
// (group -> tier -> spin type -> drops) without hiding or restructuring
// anything. Safe to call with a selector that currently matches nothing.
function pulseGuidedReveal(selector){
  if(document.body.classList.contains('lowMotion'))return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll(selector).forEach(el=>{
    el.classList.remove('guidedReveal');
    void el.offsetWidth;
    el.classList.add('guidedReveal');
    el.addEventListener('animationend',()=>el.classList.remove('guidedReveal'),{once:true});
  });
}
const itemsEl=document.getElementById('items'), poolCount=document.getElementById('poolCount'), track=document.getElementById('track');
const elements={
  groupInput:document.getElementById('groupInput'),
  dropBtn:document.getElementById('dropBtn'),
  playBtn:document.getElementById('playBtn'),
  prevBtn:document.getElementById('prevBtn'),
  nextBtn:document.getElementById('nextBtn'),
  muteBtn:document.getElementById('muteBtn'),
  trackName:document.getElementById('trackName'),
  closeSpin:document.getElementById('closeSpin'),
  closeResult:document.getElementById('closeResult'),
  collectBtn:document.getElementById('collectBtn'),
  spinModal:document.getElementById('spinModal'),
  resultModal:document.getElementById('resultModal'),
  track,
  rollText:document.getElementById('rollText'),
  results:document.getElementById('results'),
  rarityPeek:document.getElementById('rarityPeek'),
  rarityPeekTitle:document.getElementById('rarityPeekTitle'),
  rarityPeekCount:document.getElementById('rarityPeekCount'),
  rarityPeekList:document.getElementById('rarityPeekList')
};
const state={
  tier:'test',
  spinType:'gun',
  filter:'all',
  spinning:false,
  pending:[],
  pendingGroup:'',
  settings:{spinSpeed:'normal'},
  trackIndex:Number(localStorage.getItem(STORAGE_KEYS.track)||0)||0,
  usingCustomMusic:false,
  usingCustomVideo:false,
  rarityPeekFilter:'all',
  mediaSyncTimer:null,
  settingsInitialized:false,
  playlistSnapshot:null,
  customVideoUrl:'',
  customVideoToken:0,
  trackLoadToken:0
};
const confirmEls={
  modal:document.getElementById('confirmModal'),
  title:document.getElementById('confirmTitle'),
  message:document.getElementById('confirmMessage'),
  meta:document.getElementById('confirmMeta'),
  eyebrow:document.getElementById('confirmEyebrow'),
  accept:document.getElementById('confirmAccept'),
  cancel:document.getElementById('confirmCancel'),
  close:document.getElementById('confirmClose')
};
let activeConfirmResolver=null;
function closeConfirmDialog(result){
  confirmEls.modal.classList.remove('open');
  confirmEls.modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modalLocked');
  document.removeEventListener('keydown',handleConfirmEscape);
  if(activeConfirmResolver){
    const resolve=activeConfirmResolver;
    activeConfirmResolver=null;
    resolve(result);
  }
}
function handleConfirmEscape(event){
  if(event.key==='Escape') closeConfirmDialog(false);
}
function openConfirmDialog(options={}){
  return new Promise(resolve=>{
    if(activeConfirmResolver) activeConfirmResolver(false);
    activeConfirmResolver=resolve;
    const {
      eyebrow='Confirmation',
      title='Confirm action',
      message='This change will be applied immediately.',
      details='',
      confirmText='Confirm',
      cancelText='Cancel',
      danger=true
    }=options;
    confirmEls.eyebrow.textContent=eyebrow;
    confirmEls.title.textContent=title;
    confirmEls.message.textContent=message;
    confirmEls.meta.textContent=details;
    confirmEls.meta.style.display=details?'block':'none';
    confirmEls.accept.textContent=confirmText;
    confirmEls.cancel.textContent=cancelText;
    confirmEls.accept.classList.toggle('danger',!!danger);
    confirmEls.accept.classList.toggle('ghost',!danger);
    confirmEls.modal.classList.add('open');
    confirmEls.modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modalLocked');
    requestAnimationFrame(()=>confirmEls.accept.focus());
    document.addEventListener('keydown',handleConfirmEscape);
  });
}
confirmEls.accept.onclick=()=>closeConfirmDialog(true);
confirmEls.cancel.onclick=()=>closeConfirmDialog(false);
confirmEls.close.onclick=()=>closeConfirmDialog(false);
confirmEls.modal.addEventListener('mousedown',event=>{if(event.target===confirmEls.modal)closeConfirmDialog(false);});

function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}
