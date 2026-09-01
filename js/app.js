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
  dropBtnLabel:document.getElementById('dropBtnLabel'),
  playBtn:document.getElementById('playBtn'),
  prevBtn:document.getElementById('prevBtn'),
  nextBtn:document.getElementById('nextBtn'),
  muteBtn:document.getElementById('muteBtn'),
  trackName:document.getElementById('trackName'),
  closeResult:document.getElementById('closeResult'),
  doneBtn:document.getElementById('doneBtn'),
  viewHistoryBtn:document.getElementById('viewHistoryBtn'),
  resultToggleView:document.getElementById('resultToggleView'),
  resultSummaryMeta:document.getElementById('resultSummaryMeta'),
  resultModal:document.getElementById('resultModal'),
  track,
  reel:document.getElementById('liveReel'),
  results:document.getElementById('results'),
  rarityPeek:document.getElementById('rarityPeek'),
  rarityPeekTitle:document.getElementById('rarityPeekTitle'),
  rarityPeekCount:document.getElementById('rarityPeekCount'),
  rarityPeekList:document.getElementById('rarityPeekList'),
  spinAmountInput:document.getElementById('spinAmountInput'),
  spinAmountMinus:document.getElementById('spinAmountMinus'),
  spinAmountPlus:document.getElementById('spinAmountPlus'),
  spinAmountQuick:document.getElementById('spinAmountQuick'),
  spinProgressWrap:document.getElementById('spinProgressWrap'),
  spinProgressLabel:document.getElementById('spinProgressLabel'),
  spinProgressFill:document.getElementById('spinProgressFill'),
  spinProgressDone:document.getElementById('spinProgressDone'),
  spinProgressLeft:document.getElementById('spinProgressLeft'),
  skipSpinBtn:document.getElementById('skipSpinBtn'),
  poolSearch:document.getElementById('poolSearch'),
  tiersSearch:document.getElementById('tiersSearch'),
  poolList:document.getElementById('poolList'),
  configSummary:document.getElementById('configSummary')
};
const state={
  tier:'test',
  spinType:'gun',
  filter:'all',
  spinAmount:1,
  spinning:false,
  pending:[],
  pendingGroup:'',
  pendingModifierAudit:null,
  poolSearch:'',
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

/* === Professional toast notifications — replaces every alert() in the app === */
const TOAST_ICONS={
  success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>'
};
function showToast(message,type='info',opts={}){
  const stack=document.getElementById('toastStack');
  if(!stack)return;
  const {title='',duration=4200}=opts;
  const toast=document.createElement('div');
  toast.className=`toast toast-${type}`;
  toast.setAttribute('role','status');
  toast.innerHTML=`<span class="toastIcon" aria-hidden="true">${TOAST_ICONS[type]||TOAST_ICONS.info}</span><span class="toastBody">${title?`<b>${escapeHtml(title)}</b>`:''}<span>${escapeHtml(message)}</span></span><button class="toastClose" type="button" aria-label="Dismiss notification">&times;</button>`;
  const remove=()=>{
    if(!toast.isConnected)return;
    toast.classList.add('toastExit');
    setTimeout(()=>toast.remove(),motionReducedSafe()?0:220);
  };
  toast.querySelector('.toastClose').onclick=remove;
  stack.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add('toastIn'));
  const timer=setTimeout(remove,duration);
  toast.addEventListener('mouseenter',()=>clearTimeout(timer));
  return remove;
}
window.showToast=showToast;

/* Pause the background video whenever the tab is hidden (saves battery/CPU
   and avoids the video fighting for resources with a background tab); resume
   automatically when the tab becomes visible again, unless the user has the
   background video turned off or the audio is paused. */
document.addEventListener('visibilitychange',()=>{
  const bg=document.getElementById('bgVideo');
  if(!bg)return;
  if(document.hidden){
    if(!bg.paused)bg.dataset.pausedByVisibility='1';
    bg.pause();
  }else if(bg.dataset.pausedByVisibility==='1'){
    delete bg.dataset.pausedByVisibility;
    if(window.appSettings?.showBgVideo!==false)bg.play().catch(()=>{});
  }
});
