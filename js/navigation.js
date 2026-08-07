let themeSwitching=false;
function applyTheme(t,animate=true,clickedBtn=null){
  const app=document.querySelector('.app');
  if(animate && app && !themeSwitching){
    themeSwitching=true;
    app.classList.remove('themeSwitch');
    void app.offsetWidth;
    app.classList.add('themeSwitch');
    setTimeout(()=>{app.classList.remove('themeSwitch');themeSwitching=false},430);
  }
  document.body.className=t;
  localStorage.setItem(STORAGE_KEYS.theme,t);
  document.getElementById('themeLabel').textContent=t.toUpperCase();
  document.querySelectorAll('.themeBtn').forEach(b=>{
    b.classList.toggle('active',b.dataset.theme===t);
    b.classList.remove('themeBlink');
  });
  if(clickedBtn){
    void clickedBtn.offsetWidth;
    clickedBtn.classList.add('themeBlink');
    setTimeout(()=>clickedBtn.classList.remove('themeBlink'),360);
  }
  if(typeof applyVisualSettings === 'function') requestAnimationFrame(applyVisualSettings);
}
document.querySelectorAll('.themeBtn').forEach(b=>b.onclick=()=>applyTheme(b.dataset.theme,true,b));applyTheme(localStorage.getItem(STORAGE_KEYS.theme)||localStorage.getItem(STORAGE_KEYS.legacyTheme)||'dark',false);

// No passcode gate: the app is live immediately. Audio autoplay is still
// blocked by browsers without a user gesture, so we try to start playback
// right away and, if that's rejected, fall back to starting on the first
// interaction anywhere on the page (no visible prompt required).
let appReady=false;
function enterSpins(){
  appReady=true;
  waitForMediaReady(music).then(()=>{
    keepVideoPlaying();
    syncMusicToBgVideo();
    if(music)return resumeMediaPair();
  }).catch(()=>{});
}
enterSpins();
function armFirstGestureAudioStart(){
  if(music && !music.paused)return;
  const start=()=>{resumeMediaPair().catch(()=>{});};
  ['pointerdown','keydown'].forEach(evt=>document.addEventListener(evt,start,{once:true,passive:true}));
}
window.setTimeout(armFirstGestureAudioStart,300);

function initReactiveDots(){
  const canvas=document.getElementById('dotCanvas');
  const hero=document.querySelector('.hero');
  if(!canvas||!hero) return;
  const ctx=canvas.getContext('2d',{alpha:true});
  let w=0,h=0,dpr=1,pts=[],mx=-9999,my=-9999,raf=0;
  function resize(){
    const r=canvas.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    w=Math.max(1,Math.floor(r.width)); h=Math.max(1,Math.floor(r.height));
    canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    pts=[];
    const gap=28;
    for(let y=18;y<h;y+=gap){for(let x=18;x<w;x+=gap){pts.push({x,y,p:Math.random()*Math.PI*2});}}
    draw();
  }
  // This canvas only lives inside the Home hero, but requestAnimationFrame
  // doesn't know that — left unchecked it draws every frame forever, even
  // while the user is on Tiers/History/Playlist/Settings and the canvas is
  // invisible. Stop rescheduling as soon as Home isn't the active view, and
  // let resumeReactiveDots() (called from setView) restart it on return.
  function draw(t=0){
    if(!hero.closest('.view')?.classList.contains('active')){
      raf=0;
      return;
    }
    ctx.clearRect(0,0,w,h);
    for(const pt of pts){
      const dx=pt.x-mx,dy=pt.y-my,dist=Math.sqrt(dx*dx+dy*dy);
      const heat=Math.max(0,1-dist/120);
      const pulse=(Math.sin((t*.002)+pt.p)+1)*.5;
      const size=0.95+heat*1.15+pulse*.12;
      const whiteAlpha=.075+heat*.10;
      const redAlpha=heat*.10;
      ctx.beginPath();
      ctx.fillStyle=heat>.05?`rgba(255,255,255,${whiteAlpha})`:`rgba(255,255,255,.13)`;
      ctx.shadowColor=`rgba(155,92,255,${redAlpha})`;
      ctx.shadowBlur=heat*4;
      ctx.arc(pt.x,pt.y,size,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur=0;
    }
    raf=requestAnimationFrame(draw);
  }
  window.resumeReactiveDots=()=>{ if(!raf) raf=requestAnimationFrame(draw); };
  hero.addEventListener('pointermove',e=>{
    const r=hero.getBoundingClientRect();
    mx=e.clientX-r.left; my=e.clientY-r.top;
    hero.style.setProperty('--mx',`${(mx/w)*100}%`); hero.style.setProperty('--my',`${(my/h)*100}%`);
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{mx=-9999;my=-9999;hero.style.setProperty('--mx','50%');hero.style.setProperty('--my','50%')},{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  resize(); cancelAnimationFrame(raf); raf=requestAnimationFrame(draw);
}
initReactiveDots();

/* === Home hub: floating cards, stat bar, playlist page sync (new, additive) === */
function updateHomeStats(){
  const latestName=document.getElementById('statLatestName');
  const latestMeta=document.getElementById('statLatestMeta');
  if(latestName&&latestMeta){
    if(history.length){
      const last=history[0];
      latestName.textContent=last.item;
      latestMeta.textContent=`${last.tier} • ${last.group} • ${last.time}`;
    }else{
      latestName.textContent='No spins yet';
      latestMeta.textContent='Start a spin to see it here';
    }
  }
  const spinsEl=document.getElementById('statSpins'); if(spinsEl)spinsEl.textContent=history.length;
  const groupsEl=document.getElementById('statGroups'); if(groupsEl)groupsEl.textContent=new Set(history.map(h=>h.group)).size;
  const epicEl=document.getElementById('statEpic'); if(epicEl)epicEl.textContent=history.filter(h=>h.rank==='epic').length;
  const legendEl=document.getElementById('statLegendary'); if(legendEl)legendEl.textContent=history.filter(h=>h.rank==='legendary').length;
  const tierLabelEl=document.getElementById('statTierLabel');
  const tierCountEl=document.getElementById('statTierCount');
  const progressFill=document.getElementById('statProgressFill');
  if(tierLabelEl||tierCountEl||progressFill){
    const tierInfo=TIERS[state.tier];
    const tierPoolSize=getVisiblePool(true).length;
    if(tierLabelEl)tierLabelEl.textContent=`${tierInfo.label} • ${tierInfo.rewards} rewards per spin`;
    if(tierCountEl)tierCountEl.textContent=`${tierPoolSize} ${state.spinType} weapons available`;
    if(progressFill){
      const maxTierIndex=Object.keys(TIERS).length;
      const tierIndex=Object.keys(TIERS).indexOf(state.tier)+1;
      progressFill.style.width=`${Math.round((tierIndex/maxTierIndex)*100)}%`;
    }
  }
  const tiersSub=document.getElementById('homeTiersSub');
  if(tiersSub){
    const gunCount=ITEMS.filter(i=>i.type==='gun').length;
    tiersSub.textContent=`${Object.keys(TIERS).length} tiers • ${gunCount} weapons`;
  }
  const spinSub=document.getElementById('homeSpinSub');
  if(spinSub)spinSub.textContent=`${TIERS[state.tier].label} • ${TIERS[state.tier].rewards} rewards per spin`;
  const historySub=document.getElementById('homeHistorySub');
  if(historySub)historySub.textContent=history.length?`${history.length} drops saved`:'Review previous results';
  const playlistSub=document.getElementById('homePlaylistSub');
  if(playlistSub)playlistSub.textContent=typeof mediaTrackLabel==='function'?mediaTrackLabel():'Manage soundtrack';

  const heroTierBadge=document.getElementById('heroBadgeTier');
  const heroFactionBadge=document.getElementById('heroBadgeFaction');
  const heroRarityBadge=document.getElementById('heroBadgeRarity');
  const heroWeaponImg=document.getElementById('heroWeaponImg');
  if(heroTierBadge)heroTierBadge.textContent=TIERS[state.tier].label;
  if(heroFactionBadge){
    const groupVal=document.getElementById('groupInput')?.value.trim();
    heroFactionBadge.textContent=groupVal||'No Group Selected';
  }
  const featuredPool=getVisiblePool(true);
  const rarityOrder=['legendary','epic','rare','uncommon','common'];
  const featured=featuredPool.slice().sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))[0];
  if(heroRarityBadge){
    heroRarityBadge.textContent=featured?featured.rarity:'—';
    heroRarityBadge.className='heroBadge heroBadgeRarity'+(featured?` ${featured.rarity}`:'');
  }
  if(heroWeaponImg&&featured?.image){
    const src=normalizeAssetUrl(featured.image);
    if(heroWeaponImg.src!==src)heroWeaponImg.src=src;
  }
}

function updatePlaylistView(){
  const list=document.getElementById('trackList');
  if(list && typeof MUSIC_TRACKS!=='undefined'){
    list.innerHTML=MUSIC_TRACKS.map((t,i)=>`<button class="trackRow${i===state.trackIndex?' active':''}" type="button" data-index="${i}"><span class="trackRowNum">${String(i+1).padStart(2,'0')}</span><span class="trackRowName">${escapeHtml(t.name)}</span></button>`).join('');
    list.querySelectorAll('.trackRow').forEach(btn=>{
      btn.onclick=()=>{clickFX(btn);setTrack(Number(btn.dataset.index),{autoplay:true})};
    });
  }
  const nowTitle=document.getElementById('playlistNowTitle');
  const nowMeta=document.getElementById('playlistNowMeta');
  if(nowTitle&&typeof currentTrack==='function'){
    nowTitle.textContent=typeof mediaTrackLabel==='function'?mediaTrackLabel():currentTrack().name;
  }
  if(nowMeta)nowMeta.textContent=`Track ${(state.trackIndex%MUSIC_TRACKS.length)+1} of ${MUSIC_TRACKS.length}`;
  const playBtnBig=document.getElementById('playlistPlayBtn');
  if(playBtnBig)playBtnBig.textContent=music.paused?'Play':'Pause';
}

const homeSpinBtn=document.getElementById('homeSpinBtn');
if(homeSpinBtn)homeSpinBtn.onclick=()=>setView('spin');
const homeTiersBtn=document.getElementById('homeTiersBtn');
if(homeTiersBtn)homeTiersBtn.onclick=()=>setView('tiers');
document.querySelectorAll('.backBtn[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
const playlistPlayBtn=document.getElementById('playlistPlayBtn');
if(playlistPlayBtn)playlistPlayBtn.onclick=()=>playBtn.click();
const playlistPrevBtn=document.getElementById('playlistPrevBtn');
if(playlistPrevBtn)playlistPrevBtn.onclick=()=>elements.prevBtn.click();
const playlistNextBtn=document.getElementById('playlistNextBtn');
if(playlistNextBtn)playlistNextBtn.onclick=()=>elements.nextBtn.click();
const playlistMuteBtn=document.getElementById('playlistMuteBtn');
if(playlistMuteBtn)playlistMuteBtn.onclick=()=>muteBtn.click();

/* Floating-card 3D parallax tilt, disabled under reduced-motion / lowMotion */
(function initHomeCardCarousel(){
  const grid=document.getElementById('cardGrid');
  if(!grid)return;
  const reducedCheck=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOk=()=>!(reducedCheck && reducedCheck.matches) && !document.body.classList.contains('lowMotion');

  grid.querySelectorAll('.homeCard').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      if(!motionOk())return;
      const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-0.5;
      const py=(e.clientY-r.top)/r.height-0.5;
      card.style.setProperty('--tiltX',`${(-py*10).toFixed(2)}deg`);
      card.style.setProperty('--tiltY',`${(px*12).toFixed(2)}deg`);
      card.style.setProperty('--glowX',`${((px+0.5)*100).toFixed(0)}%`);
      card.style.setProperty('--glowY',`${((py+0.5)*100).toFixed(0)}%`);
    },{passive:true});
    card.addEventListener('pointerleave',()=>{
      card.style.setProperty('--tiltX','0deg');
      card.style.setProperty('--tiltY','0deg');
    },{passive:true});
  });

  // Horizontal mouse-wheel scroll (vertical wheel deltas pan the carousel sideways)
  grid.addEventListener('wheel',e=>{
    if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
    e.preventDefault();
    grid.scrollBy({left:e.deltaY,behavior:motionOk()?'smooth':'auto'});
  },{passive:false});

  // Drag-to-scroll (mouse + touch) with light momentum
  let dragging=false,startX=0,startScroll=0,lastX=0,lastT=0,velocity=0,momentumRaf=0,lastGlideT=0;
  const endDrag=()=>{
    if(!dragging)return;
    dragging=false;
    grid.classList.remove('dragging');
    if(motionOk()&&Math.abs(velocity)>0.15){
      // Time-based, not frame-count-based: the 0.94 decay and *16 move were
      // tuned assuming every rAF tick is ~16ms apart (60Hz). Scaling both by
      // real elapsed time (dt/16) makes the glide feel identical at any
      // display refresh rate instead of decaying/scrolling faster the more
      // often rAF fires; at a steady 16ms/tick this is exactly the original
      // math.
      const glide=(now)=>{
        const dt=Math.min(now-lastGlideT,48);
        lastGlideT=now;
        velocity*=Math.pow(0.94,dt/16);
        grid.scrollLeft-=velocity*dt;
        if(Math.abs(velocity)>0.15)momentumRaf=requestAnimationFrame(glide);
      };
      cancelAnimationFrame(momentumRaf);
      lastGlideT=performance.now();
      momentumRaf=requestAnimationFrame(glide);
    }
  };
  grid.addEventListener('pointerdown',e=>{
    if(e.target.closest('button.homeCard'))return; // let plain clicks/taps through as navigation
    dragging=true;startX=e.clientX;startScroll=grid.scrollLeft;lastX=e.clientX;lastT=performance.now();velocity=0;
    grid.classList.add('dragging');
    cancelAnimationFrame(momentumRaf);
  });
  window.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-startX;
    grid.scrollLeft=startScroll-dx;
    const now=performance.now();
    const dt=Math.max(1,now-lastT);
    velocity=(e.clientX-lastX)/dt*16;
    lastX=e.clientX;lastT=now;
  });
  window.addEventListener('pointerup',endDrag);
  window.addEventListener('pointercancel',endDrag);
})();

/* === Single source of truth for card/page navigation ===
   navigationOrder is the ONLY place page order is defined. Every input method
   (arrow keys, Home/End, click, Enter, setView() itself) reads/writes through
   NavState + navigateToPage()/selectCard() below — nothing else is allowed to
   independently decide "which card is next." */
const navigationOrder=['spin','tiers','history','playlist','settings'];
const SECTION_ORDER=navigationOrder; // kept as an alias for existing call sites
const NavState={
  activePage:navigationOrder[0],
  activeNavigationIndex:0,
  navigationDirection:null, // 'left' | 'right' | null
  isNavigating:false,
  previousPage:null,
  // Group/tier/spin-type/spinning already live in `state` (spinner.js) — these
  // are read-through accessors, not a second copy, so there is only ever one
  // real source of truth for spin configuration.
  get selectedGroup(){return document.getElementById('groupInput')?.value.trim()||''},
  get selectedTier(){return typeof state!=='undefined'?state.tier:null},
  get selectedSpinType(){return typeof state!=='undefined'?state.spinType:null},
  get isSpinning(){return typeof state!=='undefined'?!!state.spinning:false},
};
window.NavState=NavState;
let activeCardIndex=NavState.activeNavigationIndex; // legacy alias, stays in sync below
function motionReduced(){
  return (window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)||document.body.classList.contains('lowMotion');
}
// Pure visual selection: highlights/centers a card without opening its section.
// direction is optional ('left'|'right') and only affects the entrance nudge.
function syncActiveCardIndex(section,direction){
  const idx=navigationOrder.indexOf(section);
  if(idx<0)return;
  const changed=idx!==NavState.activeNavigationIndex;
  NavState.activeNavigationIndex=idx;
  NavState.activePage=section;
  NavState.navigationDirection=direction||null;
  activeCardIndex=idx;
  const grid=document.getElementById('cardGrid');
  document.querySelectorAll('.homeCard[data-view]').forEach(card=>{
    const isActive=card.dataset.view===section;
    card.classList.toggle('active',isActive);
    card.setAttribute('aria-selected',isActive?'true':'false');
    card.setAttribute('aria-current',isActive?'true':'false');
  });
  const activeCard=grid?.querySelector(`.homeCard[data-view="${section}"]`);
  if(activeCard&&grid){
    activeCard.scrollIntoView({behavior:motionReduced()?'auto':'smooth',inline:'center',block:'nearest'});
    if(changed&&!motionReduced()){
      // Direction-aware entrance: nudge in from the side the user is moving toward,
      // then let the existing transform transition ease it back to rest.
      if(direction){
        const nudge=direction==='right'?'16px':'-16px';
        activeCard.style.setProperty('--dirX',nudge);
        requestAnimationFrame(()=>requestAnimationFrame(()=>activeCard.style.setProperty('--dirX','0px')));
      }
      activeCard.classList.remove('justSelected');
      void activeCard.offsetWidth;
      activeCard.classList.add('justSelected');
      setTimeout(()=>activeCard.classList.remove('justSelected'),800);
    }
  }
}
window.syncActiveCardIndex=syncActiveCardIndex;
// Move the highlighted card only — does not open the section (browsing mode).
function selectCard(newIndex,direction){
  const wrapped=((newIndex%navigationOrder.length)+navigationOrder.length)%navigationOrder.length;
  syncActiveCardIndex(navigationOrder[wrapped],direction);
}
// Open whichever card is currently highlighted.
function openSelectedCard(){
  navigateToPage(navigationOrder[NavState.activeNavigationIndex]);
}
window.selectCard=selectCard;
window.openSelectedCard=openSelectedCard;
// The single entry point for actually leaving the home carousel and opening a
// section. Every navigation trigger (card click, Enter, top-nav pill, back
// button, profile menu) ends up calling this, directly or via setView().
function navigateToPage(targetPageId,direction){
  // setView() itself already guards against overlapping transitions via a
  // transition token (a new call always wins instead of being dropped), so
  // this flag is informational rather than a second competing lock.
  NavState.isNavigating=true;
  NavState.previousPage=NavState.activePage;
  if(navigationOrder.includes(targetPageId))syncActiveCardIndex(targetPageId,direction);
  if(typeof setView==='function')setView(targetPageId);
  setTimeout(()=>{NavState.isNavigating=false},480);
}
window.navigateToPage=navigateToPage;
// Kept for backward compatibility: selects and opens in one step.
function updateActiveCard(newIndex,direction){
  const wrapped=((newIndex%navigationOrder.length)+navigationOrder.length)%navigationOrder.length;
  navigateToPage(navigationOrder[wrapped],direction);
}
window.updateActiveCard=updateActiveCard;
function handleNavigationKeys(event){
  const target=event.target;
  const isTyping=
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable;
  if(isTyping)return;
  // The big cards (and their arrow/Enter/Home/End controls) only exist on the home screen.
  const onHome=document.getElementById('homeView')?.classList.contains('active');
  if(!onHome)return;
  if(event.key==='ArrowRight'){
    event.preventDefault();
    selectCard(NavState.activeNavigationIndex+1,'right');
  }else if(event.key==='ArrowLeft'){
    event.preventDefault();
    selectCard(NavState.activeNavigationIndex-1,'left');
  }else if(event.key==='Home'){
    event.preventDefault();
    selectCard(0,'left');
  }else if(event.key==='End'){
    event.preventDefault();
    selectCard(navigationOrder.length-1,'right');
  }else if(event.key==='Enter'){
    event.preventDefault();
    openSelectedCard();
  }else if(event.key===' '&&document.activeElement&&document.activeElement.classList.contains('homeCard')){
    event.preventDefault();
    openSelectedCard();
  }
}
document.addEventListener('keydown',handleNavigationKeys);

/* === Premium group picker: recent groups, searchable, additive-only storage === */
const RECENT_GROUPS_KEY='illegalFactionRecentGroups';
function getRecentGroups(){
  try{return JSON.parse(localStorage.getItem(RECENT_GROUPS_KEY)||'[]')}catch(e){return []}
}
function rememberGroup(name){
  if(!name)return;
  const list=getRecentGroups().filter(g=>g.toLowerCase()!==name.toLowerCase());
  list.unshift(name);
  localStorage.setItem(RECENT_GROUPS_KEY,JSON.stringify(list.slice(0,8)));
}
window.rememberGroup=rememberGroup;
(function initGroupPicker(){
  const picker=document.getElementById('groupPicker');
  const input=document.getElementById('groupInput');
  const list=document.getElementById('groupPickerList');
  if(!picker||!input||!list)return;
  function renderList(){
    const query=input.value.trim().toLowerCase();
    const groups=getRecentGroups().filter(g=>!query||g.toLowerCase().includes(query));
    list.innerHTML=groups.length
      ? groups.map(g=>`<button type="button" class="groupPickerItem">${escapeHtml(g)}</button>`).join('')
      : `<div class="groupPickerEmpty">${query?'No matching groups yet.':'No recent groups yet — spins you save will appear here.'}</div>`;
    list.querySelectorAll('.groupPickerItem').forEach(btn=>{
      btn.onclick=()=>{
        input.value=btn.textContent;
        picker.classList.remove('open');
        input.dispatchEvent(new Event('input'));
        input.focus();
      };
    });
  }
  let wasEmpty=!input.value.trim();
  input.addEventListener('focus',()=>{picker.classList.add('open');renderList()});
  input.addEventListener('input',()=>{
    renderList();
    const isEmpty=!input.value.trim();
    if(wasEmpty&&!isEmpty)pulseGuidedReveal('.tierPills, .spinControlBlock:nth-child(2)');
    wasEmpty=isEmpty;
    if(typeof render==='function')render();
  });
  document.addEventListener('click',e=>{if(!picker.contains(e.target))picker.classList.remove('open')});
  input.addEventListener('keydown',e=>{if(e.key==='Escape')picker.classList.remove('open')});
})();

/* === Sliding active-tab indicator for the top nav === */
function updateNavIndicator(){
  const nav=document.querySelector('.topNav');
  const indicator=document.getElementById('navIndicator');
  const activeBtn=nav?.querySelector('.navBtn.active');
  if(!nav||!indicator||!activeBtn)return;
  indicator.style.width=`${activeBtn.offsetWidth}px`;
  indicator.style.transform=`translateX(${activeBtn.offsetLeft}px)`;
}
window.addEventListener('resize',()=>requestAnimationFrame(updateNavIndicator),{passive:true});
requestAnimationFrame(updateNavIndicator);
setTimeout(updateNavIndicator,300);

/* === Profile menu dropdown === */
(function initProfileMenu(){
  const menu=document.getElementById('profileMenu');
  const btn=document.getElementById('profileBtn');
  const aboutBtn=document.getElementById('aboutBtn');
  if(!menu||!btn)return;
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const willOpen=!menu.classList.contains('open');
    menu.classList.toggle('open',willOpen);
    btn.setAttribute('aria-expanded',String(willOpen));
  });
  document.addEventListener('click',e=>{
    if(!menu.contains(e.target)){menu.classList.remove('open');btn.setAttribute('aria-expanded','false')}
  });
  menu.querySelectorAll('.profilePanelItem[data-view]').forEach(item=>{
    item.addEventListener('click',()=>{menu.classList.remove('open');setView(item.dataset.view)});
  });
  if(aboutBtn)aboutBtn.addEventListener('click',()=>{
    menu.classList.remove('open');
    if(typeof openConfirmDialog==='function'){
      openConfirmDialog({
        eyebrow:'About',
        title:'Illegal Faction Management',
        message:'A premium spin, tier, and history tracker for faction weapon drops.',
        details:`Version 2.0 • ${(typeof MUSIC_TRACKS!=='undefined'?MUSIC_TRACKS.length:0)} tracks • ${(typeof ITEMS!=='undefined'?ITEMS.length:0)} catalog items`,
        confirmText:'Close',
        cancelText:'Close',
        danger:false
      });
    }
  });
})();

updateHomeStats();
