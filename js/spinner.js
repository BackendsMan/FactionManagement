function allowed(t,item){
  if(item.type==='gun')return WEAPON_POOLS[t].has(item.name);
  return TIERS[t].rarities.includes(item.rarity);
}
function matchesPoolSearch(item){
  const query=(state.poolSearch||'').trim().toLowerCase();
  if(!query)return true;
  return item.name.toLowerCase().includes(query)
    || item.category.toLowerCase().includes(query)
    || String(item.code||'').toLowerCase().includes(query);
}
function getVisiblePool(ignoreFilter=false,ignoreSearch=false){
  // ignoreSearch exists so the ACTUAL roll pool used by startSpin() is never
  // narrowed by the reward-pool search box — search is a browsing aid for
  // the Reward Pool / Possible Drops panels only and must never change spin
  // odds.
  return ITEMS.filter(item=>allowed(state.tier,item)&&item.type===state.spinType&&(ignoreFilter||state.filter==='all'||item.rarity===state.filter)&&(ignoreSearch||matchesPoolSearch(item)));
}
function pool(ignoreFilter=false){return getVisiblePool(ignoreFilter)}
function normalizeAssetUrl(url){
  if(!url)return '';
  const cleaned=String(url).trim().replace(/\\/g,'/');
  try{
    const resolved=new URL(cleaned,window.location.href);
    resolved.pathname=resolved.pathname.split('/').map(segment=>encodeURIComponent(decodeURIComponent(segment))).join('/').replace(/%2F/g,'/');
    return resolved.href;
  }catch(error){
    return cleaned;
  }
}
const imageLoadState=new Map();
const imageProbeCache=new Map();
function trashIconMarkup(label='Delete item'){
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4"/><path d="M5 5h14"/><path d="M8 8v9"/><path d="M12 8v9"/><path d="M16 8v9"/><path d="M7 5l1 14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-14"/></svg><span class="srOnly">${escapeHtml(label)}</span>`;
}
function syncVolumeUI(value){
  const slider=document.getElementById('volumeSlider');
  const valueEl=document.getElementById('volumeValue');
  const normalized=Math.max(0,Math.min(100,Number(value)||0));
  if(slider){
    slider.value=String(normalized);
    slider.style.setProperty('--volumeProgress',`${normalized}%`);
  }
  if(valueEl)valueEl.textContent=`${normalized}%`;
}
function imageMarkup(item,{className='itemImg',sizeClass='',style=''}={}){
  if(!item?.image)return `<div class="emoji">${item?.emoji||''}</div>`;
  const src=normalizeAssetUrl(item.image);
  return `<span class="imgShell ${sizeClass}"><img class="${className}" style="${style}" src="${src}" data-src="${src}" alt="${escapeHtml(item.name)}" loading="eager" decoding="async" fetchpriority="high" draggable="false"><span class="imgFallback" hidden>${item.emoji||''}</span></span>`;
}
function visual(i){return imageMarkup(i)}
function scheduleImageRetry(img){
  if(!img)return;
  const src=img.dataset.src||img.getAttribute('src');
  if(!src)return;
  const retries=Number(img.dataset.retries||0);
  if(retries>=2){
    img.hidden=true;
    const fallback=img.parentElement?.querySelector('.imgFallback');
    if(fallback)fallback.hidden=false;
    return;
  }
  img.dataset.retries=String(retries+1);
  window.setTimeout(()=>{
    const busted=`${src}${src.includes('?')?'&':'?'}retry=${Date.now()}`;
    img.src=busted;
  },140*(retries+1));
}
function attachImageGuards(root=document){
  root.querySelectorAll('img[data-src]').forEach(img=>{
    if(img.dataset.bound==='1')return;
    img.dataset.bound='1';
    const reveal=()=>{
      img.hidden=false;
      img.classList.add('imgReady');
      const fallback=img.parentElement?.querySelector('.imgFallback');
      if(fallback)fallback.hidden=true;
      imageLoadState.set(img.dataset.src||img.currentSrc||img.src,'loaded');
    };
    img.addEventListener('load',reveal,{passive:true});
    img.addEventListener('error',()=>{
      imageLoadState.set(img.dataset.src||img.currentSrc||img.src,'error');
      scheduleImageRetry(img);
    });
    if(img.complete && img.naturalWidth>0){
      reveal();
    }else if(img.complete&&img.naturalWidth===0){
      scheduleImageRetry(img);
    }
  });
}
function preloadImages(items){
  [...new Set(items.map(item=>normalizeAssetUrl(item.image)).filter(Boolean))].forEach(src=>{
    if(!src || imageLoadState.get(src)==='loaded' || imageProbeCache.has(src))return;
    imageLoadState.set(src,'loading');
    const probe=new Image();
    imageProbeCache.set(src,probe);
    probe.decoding='async';
    probe.loading='eager';
    probe.onload=()=>{
      imageLoadState.set(src,'loaded');
      imageProbeCache.delete(src);
    };
    probe.onerror=()=>{
      imageLoadState.set(src,'error');
      imageProbeCache.delete(src);
    };
    probe.src=src;
  });
}
function renderRarityPeek(){
  const peekPool=getVisiblePool(true).filter(item=>state.rarityPeekFilter==='all'||item.rarity===state.rarityPeekFilter);
  elements.rarityPeekTitle.textContent=state.rarityPeekFilter==='all'?'All Visible Items':`${state.rarityPeekFilter} Items`;
  elements.rarityPeekCount.textContent=`${peekPool.length} match${peekPool.length===1?'':'es'}`;
  elements.rarityPeekList.innerHTML=peekPool.map(item=>`<div class="rarityPeekCard">${visual(item)}<div class="rarityPeekText"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category)}</span></div></div>`).join('')||'<div class="tiny">No matching items for this rarity.</div>';
  attachImageGuards(elements.rarityPeekList);
  elements.rarityPeek.classList.add('open');
}
let renderTimer=null;
let renderSeq=0;
const SPIN_TYPE_TITLE={gun:'Gun Spins',bullet:'Bullet Spins',accessory:'Accessory Spins'};
function buildPoolHTML(p){
  return p.map((i,idx)=>{
    const floatDelay=`-${((idx*0.47)%2.8).toFixed(2)}s`;
    const floatDuration=`${(4.8+((idx*0.63)%1.9)).toFixed(2)}s`;
    return `<div class="card" style="animation-delay:${Math.min(idx,10)*42}ms"><div class="thumb">${imageMarkup(i,{className:'weaponFloat',style:`--floatDelay:${floatDelay};--floatDuration:${floatDuration};`})}</div><div class="cardInfo"><div class="itemName">${escapeHtml(i.name)}</div><div class="itemCat">${escapeHtml(i.category)}${i.code?` <span class="itemCode">${escapeHtml(i.code)}</span>`:''}</div><div class="badges"><span class="badge ${i.rarity}">${i.rarity}</span><span class="badge">${state.spinType}</span></div></div></div>`;
  }).join('')||`<div class="tiny poolEmpty" style="animation:dropCascade .28s ease both">No ${state.spinType} drops available for this tier/filter.</div>`;
}
function buildPoolListHTML(p){
  if(!p.length)return `<div class="tiny poolListEmpty">No ${state.spinType} drops available for this tier/filter.</div>`;
  return p.map(i=>`<div class="poolRow"><span class="poolRowThumb">${imageMarkup(i,{className:'itemImg'})}</span><span class="poolRowInfo"><span class="poolRowName">${escapeHtml(i.name)}</span><span class="poolRowMeta">${escapeHtml(i.category)}${i.code?` &middot; <span class="poolRowCode">${escapeHtml(i.code)}</span>`:''}</span></span><span class="badge ${i.rarity}">${i.rarity}</span></div>`).join('');
}
function syncPoolSearchInputs(){
  [elements.poolSearch,elements.tiersSearch].forEach(input=>{
    if(input&&input.value!==state.poolSearch)input.value=state.poolSearch;
  });
}
function render(){
  const seq=++renderSeq;
  const p=pool();
  if(poolCount)poolCount.textContent=`${p.length} items`;
  const ruleTierEl=document.getElementById('ruleTier');
  if(ruleTierEl)ruleTierEl.textContent=TIERS[state.tier].label;
  const spinPreviewEl=document.getElementById('spinPreviewCount');
  if(spinPreviewEl)spinPreviewEl.textContent=`${p.length} ${state.spinType} drops available in ${TIERS[state.tier].label}`;
  clearTimeout(renderTimer);

  // Fast render: no delayed loading state, so switching Tier 2 -> Test does not stutter.
  itemsEl.classList.remove('poolReveal','tierSwitchIn','tierSwitchOut','loading');
  itemsEl.innerHTML=buildPoolHTML(p);
  preloadImages(p);
  attachImageGuards(itemsEl);
  requestAnimationFrame(()=>{
    if(seq!==renderSeq)return;
    itemsEl.classList.add('poolReveal');
  });
  renderRarityPeek();
  syncPoolSearchInputs();
  updateSpinCenterUI(p);

  // Only rebuild the history table while the history view is visible.
  if(document.getElementById('historyView')?.classList.contains('active')) renderHistory();
}
function updateSpinCenterUI(p){
  const poolCountSpinEl=document.getElementById('poolCountSpin');
  if(poolCountSpinEl)poolCountSpinEl.textContent=`${p.length} items`;

  ['gun','bullet','accessory'].forEach(type=>{
    const el=document.getElementById('avail'+type.charAt(0).toUpperCase()+type.slice(1));
    if(!el)return;
    const count=ITEMS.filter(item=>allowed(state.tier,item)&&item.type===type&&(state.filter==='all'||item.rarity===state.filter)&&matchesPoolSearch(item)).length;
    el.textContent=`${count} items`;
  });

  const dropsGrid=document.getElementById('spinPossibleDrops');
  if(dropsGrid){
    dropsGrid.innerHTML=buildPoolHTML(p);
    preloadImages(p);
    attachImageGuards(dropsGrid);
  }
  if(elements.poolList){
    elements.poolList.innerHTML=buildPoolListHTML(p);
    attachImageGuards(elements.poolList);
    // Tier/reward-type/filter/search all rebuild this list — always land
    // back at the top instead of leaving a stale scroll offset from the
    // previous pool.
    elements.poolList.scrollTop=0;
  }
  const tierEl=document.getElementById('poolPanelTier');
  const typeEl=document.getElementById('poolPanelType');
  const countEl=document.getElementById('poolPanelCount');
  if(tierEl)tierEl.textContent=TIERS[state.tier].label;
  if(typeEl)typeEl.textContent=SPIN_TYPE_TITLE[state.spinType]||state.spinType;
  if(countEl)countEl.textContent=`${p.length} item${p.length===1?'':'s'}`;

  updateConfigSummary();
  updateSpinStageStatus(p);
}
function updateConfigSummary(){
  if(!elements.configSummary)return;
  const group=elements.groupInput?.value.trim();
  const set=(id,val)=>{const el=document.getElementById(id); if(el)el.textContent=val;};
  set('summaryFaction',group||'Not selected');
  set('summaryTier',TIERS[state.tier].label);
  set('summaryType',SPIN_TYPE_TITLE[state.spinType]||state.spinType);
  set('summaryAmount',String(state.spinAmount));
}
// Drives the Spin Center's live selection pills + Start Spin disabled state.
// No placeholder sentences and no generic status text — the pills themselves
// (tier / spin type / group) ARE the interface, and only render for values
// that are actually meaningful right now.
const SPIN_TYPE_LABELS={gun:'GUN SPINS',bullet:'BULLET SPINS',accessory:'ACCESSORY SPINS'};
function renderSpinStagePills(){
  const wrap=document.getElementById('spinStagePills');
  if(!wrap)return;
  const group=document.getElementById('groupInput')?.value.trim();
  const desired=[
    {key:'tier',text:TIERS[state.tier].label},
    {key:'type',text:SPIN_TYPE_LABELS[state.spinType]||state.spinType.toUpperCase()+' SPINS'},
  ];
  if(group)desired.push({key:'group',text:group.toUpperCase()});

  const existing=new Map([...wrap.children].map(el=>[el.dataset.key,el]));
  const desiredKeys=new Set(desired.map(d=>d.key));

  // Remove pills that no longer apply, with a fade/scale-out first.
  existing.forEach((el,key)=>{
    if(desiredKeys.has(key))return;
    el.classList.add('pillExit');
    setTimeout(()=>el.remove(),motionReducedSafe()?0:280);
  });

  // Add/update pills in order.
  desired.forEach((d,i)=>{
    let el=existing.get(d.key);
    if(el&&!el.classList.contains('pillExit')){
      if(el.textContent!==d.text)el.textContent=d.text;
      wrap.appendChild(el); // keep declared order
      return;
    }
    el=document.createElement('span');
    el.className='spinStagePill pillEnter';
    el.dataset.key=d.key;
    el.textContent=d.text;
    wrap.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('pillEnter')));
  });
}
function motionReducedSafe(){
  return (window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)||document.body.classList.contains('lowMotion');
}
function updateSpinStageStatus(p){
  const btn=elements.dropBtn||document.getElementById('dropBtn');
  const group=document.getElementById('groupInput')?.value.trim();
  const hasPool=Array.isArray(p)?p.length>0:pool().length>0;
  const ready=!!group&&hasPool;
  if(btn)btn.disabled=!ready||state.spinning;
  renderSpinStagePills();
  updateStartButtonLabel();
}
function updateStartButtonLabel(){
  const label=elements.dropBtnLabel||document.getElementById('dropBtnLabel');
  if(!label)return;
  const n=state.spinAmount;
  label.textContent=state.spinning?'Spinning…':`Start ${n} Spin${n===1?'':'s'}`;
}
function getConsecutiveCount(name){
  let count=0;
  for(let i=state.pending.length-1;i>=0;i--){
    if(state.pending[i]?.name===name) count++;
    else break;
  }
  return count;
}

/* =============================================================================
   UNIVERSAL SPIN AMOUNT — one control for however many spins the user wants.
   -----------------------------------------------------------------------------
   Always starts at 1, never goes below 1, and has no tier-based (or any
   other) maximum — the tier only ever selects which reward pool is used.
   SPIN_AMOUNT_SANITY_CEILING exists purely so a mistyped/pasted number with
   many extra digits can't try to allocate an absurd array and lock up the
   tab; it is never shown to the user and is far above any real spin count.
   ============================================================================= */
const SPIN_AMOUNT_SANITY_CEILING=100000;
function clampSpinAmount(value){
  const n=Math.floor(Number(value));
  if(!Number.isFinite(n)||n<1)return 1;
  return Math.min(n,SPIN_AMOUNT_SANITY_CEILING);
}
function setSpinAmount(value,{fromInput=false}={}){
  const clamped=clampSpinAmount(value);
  const changed=clamped!==state.spinAmount;
  state.spinAmount=clamped;
  if(elements.spinAmountInput&&(!fromInput||Number(elements.spinAmountInput.value)!==clamped)){
    elements.spinAmountInput.value=String(clamped);
  }
  updateStartButtonLabel();
  updateConfigSummary();
  if(changed&&elements.spinAmountQuick){
    elements.spinAmountQuick.querySelectorAll('button[data-amount]').forEach(btn=>{
      btn.classList.toggle('active',Number(btn.dataset.amount)===clamped);
    });
  }
}
(function initSpinAmountControl(){
  const minus=elements.spinAmountMinus, plus=elements.spinAmountPlus, input=elements.spinAmountInput, quick=elements.spinAmountQuick;
  if(minus)minus.addEventListener('click',()=>{if(typeof clickFX==='function')clickFX(minus);setSpinAmount((state.spinAmount||1)-1)});
  if(plus)plus.addEventListener('click',()=>{if(typeof clickFX==='function')clickFX(plus);setSpinAmount((state.spinAmount||1)+1)});
  if(input){
    input.addEventListener('input',()=>{
      const digitsOnly=input.value.replace(/[^0-9]/g,'');
      if(digitsOnly!==input.value)input.value=digitsOnly;
    });
    input.addEventListener('change',()=>setSpinAmount(input.value,{fromInput:true}));
    input.addEventListener('blur',()=>setSpinAmount(input.value||1,{fromInput:true}));
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setSpinAmount(input.value,{fromInput:true});input.blur()}});
  }
  if(quick)quick.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-amount]');
    if(!btn)return;
    if(typeof clickFX==='function')clickFX(btn);
    setSpinAmount(btn.dataset.amount);
  });
})();

// Reward-pool search: one shared query drives the Weapon Tiers pool, the
// Spin Center's Reward Pool panel and its Possible Drops grid. Never touches
// the real spin odds (see getVisiblePool's ignoreSearch flag in startSpin).
(function initPoolSearch(){
  [elements.poolSearch,elements.tiersSearch].forEach(input=>{
    if(!input)return;
    input.addEventListener('input',()=>{
      state.poolSearch=input.value;
      if(typeof render==='function')render();
    });
  });
})();
/* =============================================================================
   ADMIN CONFIGURATION — Tier 2 legendary probability modifier
   -----------------------------------------------------------------------------
   Internal, developer/admin-managed setting. There is no user-account system
   in this app, so "admin-only" here means: this section, not any in-app
   control. To change the behavior, edit the values below directly in this
   file and redeploy.

   What it does: when a spin is rolled on Tier 2 (and ONLY Tier 2 — Test,
   Tier 1, and Tier 1.5 always use their unmodified odds) for a group name
   that matches one of the keywords below, the legendary drop chance for
   that spin gets a small, fixed bump, capped at maximumLegendaryChance.

   Current Tier 2 legendary baseline: guns are held at a fixed 8% per roll
   by rebalanceGunPoolBalance() below (see that function for why);
   bullets/accessories are unrebalanced and computed from the live item
   weights in js/data.js (~2.97% and ~3.62% respectively).

   For GUNS specifically, this bonus works together with the boost-window
   logic further down (tier2GunBoostWindowConfig): while a spin's legendary
   count is still under the window's threshold, each roll uses this boosted
   chance (8% baseline + 8pp = 16% per roll, verified by simulation) instead
   of the baseline — a real lift while it's open, well short of guaranteed,
   and never near the 40% ceiling (that cap is only a safety bound, not the
   normal operating point).

   How it's applied: this does NOT run a second/separate roll and does NOT
   force, predetermine, or reroll an outcome. It scales the weight of the
   legendary-rarity items inside the SAME pool array that the normal
   weightedPick() roll already uses, so the eventual result is still one
   genuine weighted-random draw — just drawn from a pool where legendary
   items carry slightly more weight. Non-legendary items are left exactly
   as they are, so common/uncommon/rare/epic keep their existing relative
   proportions among themselves.
   ============================================================================= */
const tier2GroupModifierConfig = {
  enabled: true,
  eligibleKeywords: ["brower", "brower gang", "bg", "2605", "2605/brower"],
  legendaryBonus: 0.08,          // +8 percentage points while the boost window (below) is open
  maximumLegendaryChance: 0.40   // hard ceiling regardless of bonus or baseline
};

// Lowercases and strips everything but letters/digits. Used both to
// normalize the configured keywords and to normalize each token pulled out
// of a typed group name, so "B.G.", "bg", and "B G" all reduce to the same
// comparable string.
function normalizeGroupText(value) {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Returns true only if the group name contains a WHOLE token that exactly
// matches one of the configured keywords (after normalization). Tokens are
// split on real word/identifier separators — whitespace, hyphens, slashes,
// underscores, commas, and bracket/paren-style punctuation — so however a
// group name combines multiple identifiers ("2605/Brower", "BG_2605",
// "Brower, Gang") each one still separates out into its own comparable
// piece. Dots are deliberately NOT a separator (only stripped afterward by
// normalizeGroupText), so a dotted acronym like "B.G." still survives as
// one token that reduces to "bg" instead of splitting into "b" + "g".
// Matching whole tokens only (never "does this string merely contain that
// substring") is what stops a short keyword like "bg" from firing on some
// unrelated group that happens to contain those two letters in sequence —
// this boost is exclusive to the configured identifiers, no one else's.
function matchesEligibleGroupKeyword(groupName) {
  if (!groupName) return false;
  const configuredKeywords = (tier2GroupModifierConfig.eligibleKeywords || [])
    .map(normalizeGroupText)
    .filter(Boolean);
  if (!configuredKeywords.length) return false;
  const tokens = String(groupName)
    .split(/[\s\-/_,;:|&+()[\]{}]+/)
    .map(normalizeGroupText)
    .filter(Boolean);
  return tokens.some(token => configuredKeywords.includes(token));
}

function computeLegendaryChance(pool) {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  if (!total) return 0;
  const legendaryWeight = pool.filter(item => item.rarity === 'legendary').reduce((sum, item) => sum + item.weight, 0);
  return legendaryWeight / total;
}

// Applies the Tier 2 group modifier to a copy of the pool (never mutates the
// shared ITEMS objects). Called once per spin — the resulting pool is then
// reused for every roll within that spin, so the bonus is computed once
// even if the group name contains more than one eligible keyword.
function applyTier2GroupModifier(pool, groupName, selectedTier) {
  const baseLegendaryChance = computeLegendaryChance(pool);
  const isTier2 = selectedTier === 't2';
  const isEligibleGroup = matchesEligibleGroupKeyword(groupName);

  const bonusApplies =
    tier2GroupModifierConfig.enabled &&
    isTier2 &&
    isEligibleGroup;

  if (!bonusApplies) {
    return { pool, bonusApplies: false, baseLegendaryChance, finalLegendaryChance: baseLegendaryChance };
  }

  const finalLegendaryChance = Math.min(
    baseLegendaryChance + tier2GroupModifierConfig.legendaryBonus,
    tier2GroupModifierConfig.maximumLegendaryChance
  );

  const legendaryWeight = pool.filter(item => item.rarity === 'legendary').reduce((sum, item) => sum + item.weight, 0);
  const otherWeight = pool.reduce((sum, item) => sum + item.weight, 0) - legendaryWeight;

  let adjustedPool = pool;
  if (legendaryWeight > 0 && finalLegendaryChance < 1 && finalLegendaryChance > baseLegendaryChance) {
    // Solve for the legendary weight that makes
    // newLegendaryWeight / (newLegendaryWeight + otherWeight) === finalLegendaryChance,
    // then scale every legendary item's weight by the same factor. This
    // keeps the odds *within* the legendary rarity unchanged relative to
    // each other — only the overall legendary-vs-everything-else split moves.
    const targetLegendaryWeight = (finalLegendaryChance * otherWeight) / (1 - finalLegendaryChance);
    const scale = targetLegendaryWeight / legendaryWeight;
    adjustedPool = pool.map(item => item.rarity === 'legendary' ? { ...item, weight: item.weight * scale } : item);
  }

  return { pool: adjustedPool, bonusApplies: true, baseLegendaryChance, finalLegendaryChance };
}

/* -----------------------------------------------------------------------
   ADMIN CONFIGURATION — Tier 2 gun legendary boost window
   -------------------------------------------------------------------------
   Applies only to Tier 2 GUN spins (state.tier === 't2', state.spinType ===
   'gun') for groups eligible under tier2GroupModifierConfig above. Folded
   into the same per-roll weighted pick — no second roll, no forced or
   predetermined items:

   - While a spin's legendary count is still BELOW boostUntilLegendaryCount,
     each roll uses the boosted pool from tier2GroupModifierConfig (see the
     comment above it for the actual boosted-vs-baseline numbers).
   - The moment that count reaches boostUntilLegendaryCount, the boost turns
     off for the REST of that spin — remaining rolls use the plain,
     unmodified pool, identical to what a non-eligible group would get.
   There is no separate total ceiling on legendary count per spin — spin
   amounts are unlimited and user-chosen, so a flat "stop after N
   legendary" rule would silently zero legendary out for the rest of any
   large session. The 8% per-roll target (rebalanceGunPoolBalance) and the
   same-gun cap (MAX_SAME_GUN_PER_SPIN) are what keep it hard without ever
   fully shutting it off.

   Every roll is still a genuine weighted random draw. There is no floor or
   guaranteed-minimum anywhere in this file — a guaranteed legendary would
   no longer be a probability, it would be a scripted result.
   ------------------------------------------------------------------------- */
const tier2GunBoostWindowConfig = {
  boostUntilLegendaryCount: 2   // boost applies until the spin has this many legendary guns, then turns off
};

/* -----------------------------------------------------------------------
   ADMIN CONFIGURATION — Tier 2 gun rarity balance
   -------------------------------------------------------------------------
   Spin count is now unlimited and user-chosen (no fixed "rolls per spin"
   per tier any more), so odds are tuned per INDIVIDUAL ROLL, not against
   some assumed session length. Tier 1.5 and Tier 2's raw catalog weights
   (see ITEMS in data.js) skew toward "uncommon"/lower pistols just from how
   many of them exist in the pool, which made both tiers land a merely-
   uncommon result far too often for gun pools that are supposed to feel
   like a real step up. This resets every rarity in each tier's GUN pool to
   a fixed target share of the total so every roll is honestly balanced,
   on purpose, with a clear progression between the two tiers. Weights
   WITHIN a rarity keep their existing relative proportions (e.g.
   MP20FRT stays a little more likely than the plain Gen 4 switches) — only
   each rarity's total share of the pool is reset. Runs before the Brower
   Gang group bonus, so that bonus (and the boost-window/same-gun-cap
   logic below) still layers on top of this balanced baseline exactly as
   before. Applies to Tier 1.5 and Tier 2 GUN spins only; bullets/
   accessories, and Test/Tier 1 odds, are untouched.

   Rare is the backbone of both tiers on purpose — a "good gun" (Tier 1
   caliber) is the normal, expected result. Epic and legendary are real
   but deliberately uncommon highlights on top of that, not the default:
     - Tier 2: rare 55% (the reliable baseline), epic 22% (a genuine but
       harder-to-get bonus), legendary 8% (hard, but always possible),
       uncommon 15% (keeps some low-end variety, never dominant).
     - Tier 1.5: the same shape, dialed down a step — rare 55%, epic 15%
       (about a third softer than Tier 2's), uncommon 30% (no legendary
       exists at this tier).
   ------------------------------------------------------------------------- */
const GUN_RARITY_TARGETS_BY_TIER = {
  't1.5': { uncommon: 0.30, rare: 0.55, epic: 0.15 },
  t2: { uncommon: 0.15, rare: 0.55, epic: 0.22, legendary: 0.08 }
};
// nameCounts (optional) is the same per-spin name-count tracker the
// same-gun cap below uses. Passing it here means a maxed-out item's
// weight is redistributed to the OTHER still-available items of its OWN
// rarity, not silently leaked into other rarities — without this, a
// rarity with many distinct items (e.g. the 9 different legendary
// switches) would keep contributing weight long after a rarity with
// fewer items (e.g. the 4 epic guns) had all of its items capped out and
// excluded, which skewed the actual session-long rarity mix far from the
// targets above. Every rarity's total share of the pool stays locked at
// its target for as long as at least one item of that rarity is still
// available.
//
// Different rarities need very different numbers of rolls to exhaust
// (legendary's 9 items × the cap take far longer to all hit the cap, at
// legendary's low per-roll odds, than rare's 6 items do at rare's much
// higher odds) — a single "reset everything once the WHOLE pool is
// maxed" rule (as used for tiers with no rarity targets, below) would
// leave fast-exhausting rarities completely starved for a long stretch
// while waiting on the slowest one, which badly distorted results in
// testing. So each rarity gets its OWN independent reset the moment
// every one of ITS items is maxed, decoupled from every other rarity.
function rebalanceGunPoolBalance(pool, tierKey, spinType, nameCounts) {
  const targets = spinType === 'gun' ? GUN_RARITY_TARGETS_BY_TIER[tierKey] : null;
  if (!targets) return pool;

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return pool;

  const isMaxed = item => !!nameCounts && (nameCounts.get(item.name) || 0) >= MAX_SAME_GUN_PER_SPIN;

  if (nameCounts) {
    const namesByRarity = {};
    pool.forEach(item => { (namesByRarity[item.rarity] = namesByRarity[item.rarity] || []).push(item.name); });
    Object.entries(namesByRarity).forEach(([rarity, names]) => {
      if (!targets[rarity]) return;
      const allMaxed = names.every(name => (nameCounts.get(name) || 0) >= MAX_SAME_GUN_PER_SPIN);
      if (allMaxed) names.forEach(name => nameCounts.delete(name));
    });
  }

  const rarityAvailableTotals = {};
  pool.forEach(item => {
    if (isMaxed(item)) return;
    rarityAvailableTotals[item.rarity] = (rarityAvailableTotals[item.rarity] || 0) + item.weight;
  });

  return pool.map(item => {
    const targetShare = targets[item.rarity];
    if (!targetShare) return item;
    if (isMaxed(item)) return { ...item, weight: 0 };
    const availableTotal = rarityAvailableTotals[item.rarity];
    if (!availableTotal) return item;
    const desiredRarityWeight = targetShare * totalWeight;
    const scale = desiredRarityWeight / availableTotal;
    return { ...item, weight: item.weight * scale };
  });
}

// Returns the pool to use for one specific roll within a Tier 2 gun spin.
// boostedPool is the (possibly modifier-adjusted) pool from
// applyTier2GroupModifier; basePool is the same pool with no modifier
// applied at all. For any tier/spin type other than Tier 2 guns, this is a
// no-op and simply returns boostedPool unchanged (so bullets/accessories
// keep the flat modifier from applyTier2GroupModifier with no boost-window
// behavior, same as before).
function applyTier2GunLegendaryBounds(boostedPool, basePool, legendaryCountSoFar, bonusApplies, spinType, tierKey) {
  if (tierKey !== 't2' || spinType !== 'gun') return boostedPool;

  if (bonusApplies && legendaryCountSoFar < tier2GunBoostWindowConfig.boostUntilLegendaryCount) {
    return boostedPool;
  }

  // Not eligible, or the boost window has already closed for this spin —
  // regular, fully unmodified odds. Legendary itself is never excluded
  // here: the per-roll 8% target (rebalanceGunPoolBalance) plus the
  // same-gun cap already keep it honestly rare without a separate total
  // ceiling — a flat "stop after N legendary" ceiling doesn't make sense
  // once sessions can be arbitrarily long (it silently zeroed legendary
  // out for the rest of any session past ~50 rolls, which is exactly the
  // "switches should stay a real possibility" guarantee this app promises).
  return basePool;
}

/* -----------------------------------------------------------------------
   ADMIN CONFIGURATION — same-gun cap (variety guarantee)
   -------------------------------------------------------------------------
   Hard rule, applies to Tier 2 GUN spins ONLY — Test, Tier 1, and Tier 1.5
   are untouched (Tier 1.5 gets its own rebalanced rarity shares from
   rebalanceGunPoolBalance() above, but not this cap). The Brower Gang
   boost and the legendary boost-window above are also untouched and still
   run first — this only trims the pool afterward: once a specific named
   gun — any gun, any rarity, not just legendary — has landed
   MAX_SAME_GUN_PER_SPIN times without a fresh variety window opening (see
   below), that exact gun is removed from the pool, so its own chance
   drops to zero — no 3rd copy back-to-back. Every OTHER gun is completely
   untouched and keeps its normal relative odds, so the overall rarity
   distribution from rebalanceGunPoolBalance() above stays intact — only
   the maxed-out gun's own weight leaves the pool.

   Spin amounts are unlimited, so for any sufficiently large session EVERY
   gun in the pool will eventually hit the cap at the same time (pool size
   × 2 rolls in, guaranteed). When that happens this opens a fresh variety
   window — clearing every count back to zero — instead of silently
   dropping the cap for the rest of the session; the pigeonhole limit is
   what makes "no more than 2 of the same gun in a row" a real, ongoing
   guarantee rather than a one-time rule that stops mattering past ~2×
   the pool size.
   ------------------------------------------------------------------------- */
const MAX_SAME_GUN_PER_SPIN = 2;
function excludeMaxedOutGuns(pool, nameCounts, spinType, tierKey) {
  if (spinType !== 'gun' || tierKey !== 't2') return pool;
  if (!nameCounts || !nameCounts.size) return pool;
  const filtered = pool.filter(item => (nameCounts.get(item.name) || 0) < MAX_SAME_GUN_PER_SPIN);
  if (filtered.length) return filtered;
  nameCounts.clear();
  return pool;
}

function weightedPick(pool, previousName) {
  const adjusted = pool.map((item) => ({
    ...item,
    effectiveWeight:
      previousName && item.name === previousName
        ? Math.max(1, item.weight * 0.3)
        : item.weight,
  }));

  const total = adjusted.reduce((sum, item) => sum + item.effectiveWeight, 0);
  let roll = Math.random() * total;

  for (const item of adjusted) {
    roll -= item.effectiveWeight;
    if (roll <= 0) return item;
  }

  return adjusted[adjusted.length - 1];
}
function reelItems(pool, winner) {
  const output = [];

  for (let index = 0; index < WIN_IDX; index++) {
    output.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  output.push(winner);

  for (let index = 0; index < 10; index++) {
    output.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return output;
}
function fillReel(reelPool) {
  elements.track.classList.remove("spinMotion", "settled");
  elements.track.style.transform = "translate3d(0,0,0)";

  preloadImages(reelPool);
  elements.track.innerHTML = reelPool
    .map(
      (item, index) => `
      <div class="reelItem" data-name="${escapeHtml(item.name)}" data-index="${index}">
        ${visual(item)}
        <div class="reelText">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="tiny">${escapeHtml(item.category)}</div>
        </div>
      </div>
    `
    )
    .join("");
  attachImageGuards(elements.track);
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
  function openModal(node){node.classList.add('open')}
  function closeModal(node){node.classList.remove('open')}
  function playSpinChime(){if(appSettings.spinSfx===false)return}
let skipRequested=false;
// Reel motion restored to match backup-original/index.html exactly (same
// keyframes/offsets/easing/duration as the original app). The only addition
// on top of the original is the Skip button: if a skip is requested (or
// reduced-motion is on), the strip jumps straight to the landing position
// instead of playing the original travel curve.
async function animateReelToWinner(winnerIndex = WIN_IDX, winnerRarity = '') {
  const reelHeight = elements.reel?.clientHeight || 360;
  const targetY = (reelHeight / 2) - (winnerIndex * ITEM_H + ITEM_H / 2);

  elements.track.classList.add("spinMotion");

  const fastForward=skipRequested||document.body.classList.contains('lowMotion');

  const animation = elements.track.animate(fastForward ? [
      { transform: "translate3d(0,0,0)", offset: 0 },
      { transform: `translate3d(0, ${targetY}px, 0)`, offset: 1 },
    ] : [
      { transform: "translate3d(0,0,0)", offset: 0 },
      { transform: `translate3d(0, ${targetY * 0.22}px, 0)`, offset: 0.18 },
      { transform: `translate3d(0, ${targetY * 0.58}px, 0)`, offset: 0.55 },
      { transform: `translate3d(0, ${targetY - ITEM_H}px, 0)`, offset: 0.88 },
      { transform: `translate3d(0, ${targetY + 32}px, 0)`, offset: 0.96 },
      { transform: `translate3d(0, ${targetY}px, 0)`, offset: 1 },
    ],
    {
      duration: fastForward ? 260 : SPEEDS[state.settings.spinSpeed],
      easing: "cubic-bezier(.16,.84,.24,1)",
      fill: "forwards",
    }
  );

  try {
    await animation.finished;
  } catch {
    return;
  }

  elements.track.classList.remove("spinMotion");
  elements.track.classList.add("settled");
  elements.track.style.transform = `translate3d(0, ${targetY}px, 0)`;

  [...elements.track.querySelectorAll(".reelItem")].forEach((node) => {
    const isWinner = Number(node.dataset.index) === winnerIndex;
    node.classList.toggle("winner", isWinner);
    node.classList.remove('rarity-common','rarity-uncommon','rarity-rare','rarity-epic','rarity-legendary');
    if (isWinner && winnerRarity) node.classList.add(`rarity-${winnerRarity}`);
  });
}
/* Every result comes from the same genuine per-roll weighted draw as before
   (weightedPick + the Tier 2 admin config above) — this only pulls the loop
   out of startSpin() so it can be reused and, for very large spin amounts,
   yielded periodically (await a 0ms timeout) so computing thousands of
   results never blocks the tab, even though each individual roll is cheap.

   rebalanceGunPoolBalance() and applyTier2GroupModifier() are both
   recomputed fresh EVERY roll (not once up front) from basePool + the
   live nameCountsThisSpin — cheap (basePool is ~10-45 items) and
   necessary: the rarity targets have to be re-solved against whichever
   specific items are still under the same-gun cap right now, or the
   target shares would drift as items get excluded (see the comment on
   rebalanceGunPoolBalance). */
async function computeSpinResults(basePool, tierKey, spinType, group, count, onProgress) {
  const winningItems = [];
  let legendaryCountThisSpin = 0;
  let firstRollModifierResult = null;
  // The same-gun cap (and its nameCounts tracking) is Tier 2 only — Test,
  // Tier 1, and Tier 1.5 always draw from the plain, uncapped pool (Tier
  // 1.5 still gets its own rebalanced rarity shares from
  // rebalanceGunPoolBalance, just not this cap). Only passing nameCounts
  // through when it's actually t2 keeps rebalanceGunPoolBalance's maxed-
  // item handling inert everywhere else too.
  const capApplies = spinType === 'gun' && tierKey === 't2';
  const nameCountsThisSpin = capApplies ? new Map() : null;
  // Belt-and-suspenders on top of excludeMaxedOutGuns/rebalanceGunPoolBalance's
  // per-spin cap: those two can legitimately reset a name's count back to 0
  // once its whole rarity has cycled through (see the comment on
  // rebalanceGunPoolBalance), which — immediately after a reset — could let
  // the very same gun win again right away and stack up more than
  // MAX_SAME_GUN_PER_SPIN in an unbroken row. consecutiveStreak is tracked
  // completely independently of that reset logic and hard-blocks the
  // previous winner the moment it's already won this many times IN A ROW,
  // so "no more than 2 of the same gun back-to-back" holds absolutely,
  // regardless of any reset timing. Scoped to Tier 2 only, same as the cap.
  let consecutiveStreak = 0;
  const YIELD_EVERY = 2000;
  for (let roll = 1; roll <= count; roll++) {
    const previousWinner = winningItems[winningItems.length - 1]?.name;
    const rebalancedPool = rebalanceGunPoolBalance(basePool, tierKey, spinType, nameCountsThisSpin);
    const modifierResult = applyTier2GroupModifier(rebalancedPool, group, tierKey);
    if (roll === 1) firstRollModifierResult = modifierResult;
    const boundedPool = applyTier2GunLegendaryBounds(modifierResult.pool, rebalancedPool, legendaryCountThisSpin, modifierResult.bonusApplies, spinType, tierKey);
    let rollPool = excludeMaxedOutGuns(boundedPool, nameCountsThisSpin, spinType, tierKey);
    if (capApplies && previousWinner && consecutiveStreak >= MAX_SAME_GUN_PER_SPIN) {
      const withoutPreviousWinner = rollPool.filter(item => item.name !== previousWinner);
      if (withoutPreviousWinner.length) rollPool = withoutPreviousWinner;
    }
    const winner = weightedPick(rollPool, previousWinner);
    consecutiveStreak = winner.name === previousWinner ? consecutiveStreak + 1 : 1;
    if (winner.rarity === 'legendary') legendaryCountThisSpin++;
    if (nameCountsThisSpin) nameCountsThisSpin.set(winner.name, (nameCountsThisSpin.get(winner.name) || 0) + 1);
    winningItems.push(winner);
    if (roll % YIELD_EVERY === 0) {
      onProgress?.(roll, count);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  onProgress?.(count, count);
  return { winningItems, legendaryCountThisSpin, modifierResult: firstRollModifierResult };
}
function setSpinProgress(done, total, label) {
  if (elements.spinProgressLabel) elements.spinProgressLabel.textContent = label || `Spin ${done} of ${total}`;
  if (elements.spinProgressFill) elements.spinProgressFill.style.width = `${total ? Math.min(100, (done / total) * 100) : 0}%`;
  if (elements.spinProgressDone) elements.spinProgressDone.textContent = `${done} completed`;
  if (elements.spinProgressLeft) elements.spinProgressLeft.textContent = `${Math.max(0, total - done)} remaining`;
}
// After the first few rolls are shown individually, the rest have already
// been computed — fast-forward the visible counter/progress bar over a
// short, bounded duration instead of physically animating every remaining
// roll, so a 500-spin session finishes in seconds instead of minutes while
// still reading as a deliberate, polished sequence rather than a jump-cut.
function fastForwardProgress(from, to) {
  return new Promise(resolve => {
    if (motionReducedSafe() || skipRequested) {
      setSpinProgress(to, to, `Spin ${to} of ${to}`);
      resolve();
      return;
    }
    const duration = Math.min(2600, 500 + Math.log2(Math.max(1, to - from + 1)) * 260);
    const start = performance.now();
    function frame(t) {
      if (skipRequested) { setSpinProgress(to, to, `Spin ${to} of ${to}`); resolve(); return; }
      const ratio = Math.min(1, (t - start) / duration);
      const current = Math.round(from + (to - from) * ratio);
      setSpinProgress(current, to, `Spin ${current} of ${to}`);
      if (ratio < 1) requestAnimationFrame(frame); else resolve();
    }
    requestAnimationFrame(frame);
  });
}
async function startSpin() {
  if (state.spinning) return;

  const group = elements.groupInput.value.trim();
  if (!group) {
    showToast('Type a faction name before spinning.', 'error', { title: 'Faction required' });
    elements.groupInput.focus();
    return;
  }

  const spinCount = clampSpinAmount(state.spinAmount);

  // The real roll pool: tier + reward type + rarity filter only. Deliberately
  // NOT narrowed by the reward-pool search box (getVisiblePool's ignoreSearch
  // flag) — search only affects what's displayed for browsing.
  const basePool = getVisiblePool(true, true).filter((item) =>
    state.filter === "all" || item.rarity === state.filter
  );

  if (!basePool.length) {
    showToast(`No ${state.spinType} drops available for ${TIERS[state.tier].label}.`, 'error', { title: 'Empty reward pool' });
    return;
  }

  // A one-off preview pool purely for the reel's visual filler cards and
  // the pool-status display below — NOT what odds are computed from. The
  // real per-roll pool (rebalanced against the live same-gun cap) is
  // computed fresh inside computeSpinResults() for every individual roll.
  const previewPool = rebalanceGunPoolBalance(basePool, state.tier, state.spinType, null);

  state.spinning = true;
  state.pending = [];
  state.pendingGroup = group;
  state.pendingTierLabel = TIERS[state.tier].label;
  state.pendingSpinType = state.spinType;
  skipRequested = false;
  elements.dropBtn.disabled = true;
  updateSpinStageStatus(previewPool);
  if (elements.spinProgressWrap) elements.spinProgressWrap.hidden = false;
  setSpinProgress(0, spinCount, spinCount > 1 ? `Preparing ${spinCount} spins…` : 'Preparing spin…');

  try {
    const { winningItems, legendaryCountThisSpin, modifierResult } = await computeSpinResults(
      basePool, state.tier, state.spinType, group, spinCount,
      (done, total) => setSpinProgress(done, total, `Preparing ${total} spins…`)
    );

    state.pendingModifierAudit = {
      tier2GroupModifierApplied: modifierResult.bonusApplies,
      baseLegendaryChance: modifierResult.baseLegendaryChance,
      finalLegendaryChance: modifierResult.finalLegendaryChance,
      legendaryCountThisSpin
    };

    // Animate every roll individually up to a small cap so the user always
    // sees real reel motion; beyond that, fast-forward (see above) — every
    // result is still a genuine roll already computed above, none are faked.
    // Capped at 4 even for a huge session: at the slower spin-speed settings
    // a single reel animation already takes several seconds, so animating
    // more than a handful individually would itself become the "excessively
    // long animation" the large-session path exists to avoid.
    const ANIMATE_HEAD = Math.min(winningItems.length, 4);
    for (let i = 0; i < ANIMATE_HEAD; i++) {
      const winner = winningItems[i];
      setSpinProgress(i + 1, winningItems.length, `Spin ${i + 1} of ${winningItems.length}`);
      fillReel(reelItems(previewPool, winner));
      await animateReelToWinner(WIN_IDX, winner.rarity);

      playSpinChime(winner.rarity);
      const isHighRarity = winner.rarity === 'legendary' || winner.rarity === 'epic';
      if (isHighRarity) launchConfetti(isHighRarity ? 'big' : 'small');
      if (skipRequested) break;
      await wait(skipRequested ? 30 : 220);
    }

    if (winningItems.length > ANIMATE_HEAD) {
      await fastForwardProgress(ANIMATE_HEAD, winningItems.length);
      const last = winningItems[winningItems.length - 1];
      fillReel(reelItems(previewPool, last));
      await animateReelToWinner(WIN_IDX, last.rarity);
    }

    // state.pending is the single source of truth from here on: the exact
    // array saveResults() persists to history is the exact same array
    // renderResults() displays in the "Drops Won" modal — never
    // regenerated or re-rolled between the two, so what the player sees is
    // guaranteed to be what got saved.
    state.pending = winningItems;
    saveResults();
    renderResults();
    launchConfetti();
    if (elements.spinProgressWrap) elements.spinProgressWrap.hidden = true;
    openModal(elements.resultModal);
    // Deliberately no auto-close/backdrop/Escape dismissal — the results
    // modal stays open until the player explicitly clicks Done or View
    // History (see history.js), so a completed drop is never missed.
  } finally {
    state.spinning = false;
    skipRequested = false;
    if (elements.spinProgressWrap) elements.spinProgressWrap.hidden = true;
    updateSpinStageStatus(pool());
  }
}
/* =============================================================================
   RESULTS — grouped by default so even a huge session renders a bounded
   number of DOM nodes (at most one card per unique item in the pool);
   "Show Individually" reveals a flat, capped list for smaller sessions.
   ============================================================================= */
const RARITY_ORDER=['legendary','epic','rare','uncommon','common'];
const RESULT_FLAT_LIMIT=300;
let resultViewMode='grouped';
function groupResults(items){
  const map=new Map();
  items.forEach(item=>{
    const key=`${item.type||state.pendingSpinType||state.spinType}:${item.name}`;
    if(!map.has(key))map.set(key,{item,count:0});
    map.get(key).count++;
  });
  return [...map.values()].sort((a,b)=>
    (RARITY_ORDER.indexOf(a.item.rarity)-RARITY_ORDER.indexOf(b.item.rarity))
    || b.count-a.count
    || a.item.name.localeCompare(b.item.name)
  );
}
function resultCardMarkup(item,count){
  return `<div class="resultCard">${count>1?`<span class="resultCount">&times;${count}</span>`:''}${visual(item)}<div class="itemName" style="font-size:18px;margin-top:8px">${escapeHtml(item.name)}</div><div class="tiny">${escapeHtml(item.category)}</div><div class="badges" style="justify-content:center"><span class="badge ${item.rarity}">${item.rarity}</span></div></div>`;
}
function renderResultsView(){
  const box=document.getElementById('results');
  if(!box)return;
  const total=state.pending.length;
  const metaEl=elements.resultSummaryMeta||document.getElementById('resultSummaryMeta');
  const toggleBtn=elements.resultToggleView||document.getElementById('resultToggleView');
  if(metaEl)metaEl.textContent=`${total} item${total===1?'':'s'} for ${state.pendingGroup||'—'} — saved to history`;
  if(toggleBtn)toggleBtn.hidden=total<=1;
  if(toggleBtn)toggleBtn.textContent=resultViewMode==='grouped'?'Show Individually':'Show Grouped';
  if(resultViewMode==='grouped'){
    const groups=groupResults(state.pending);
    box.innerHTML=groups.map(({item,count})=>resultCardMarkup(item,count)).join('')||'<div class="tiny">No results.</div>';
    preloadImages(groups.map(g=>g.item));
  }else{
    const shown=state.pending.slice(0,RESULT_FLAT_LIMIT);
    box.innerHTML=shown.map(i=>resultCardMarkup(i,1)).join('');
    if(total>RESULT_FLAT_LIMIT)box.innerHTML+=`<div class="resultMoreNote tiny">+ ${total-RESULT_FLAT_LIMIT} more result${total-RESULT_FLAT_LIMIT===1?'':'s'} not shown individually — switch to grouped view for the full breakdown.</div>`;
    preloadImages(shown);
  }
  attachImageGuards(box);
}
function toggleResultView(){resultViewMode=resultViewMode==='grouped'?'flat':'grouped';renderResultsView()}
function resetResultView(){resultViewMode='grouped';state.pending=[]}
function renderResults(){
  resultViewMode='grouped';
  document.getElementById('resultModal').classList.remove('open');
  void document.getElementById('resultModal').offsetWidth;
  renderResultsView();
  document.getElementById('resultModal').classList.add('open');
}
function showResults(){renderResults()}
function launchConfetti(){
  if(window.appSettings && appSettings.confetti===false)return;
  const canvas=document.getElementById('confettiCanvas'); if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=innerWidth; canvas.height=innerHeight;
  const colors=['#E4132A','#FF9DA6','#ffffff','#0b0b0f','#7A0012','#d9d9df'];
  const parts=Array.from({length:190},()=>({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height*.38-canvas.height*.22,
    w:Math.random()*10+4,
    h:Math.random()*6+3,
    c:colors[Math.floor(Math.random()*colors.length)],
    s:Math.random()*3+1.6,
    d:(Math.random()-.5)*2.8,
    r:Math.random()*6,
    rs:(Math.random()-.5)*.2
  }));
  let start=null,lastT=null; const dur=3600, fade=2600;
  // p.s/p.d/p.rs were tuned as "how far to move on one ~16ms tick" (60Hz).
  // requestAnimationFrame fires at whatever the display's real refresh rate
  // is - on a 120/240Hz screen that's far more often than every 16ms, so
  // without scaling by actual elapsed time the confetti would fall and spin
  // proportionally faster the higher the refresh rate. Scaling every step by
  // dt/16 keeps the exact same real-world fall speed at any frame rate; at
  // a steady 16ms/tick (60Hz) this reduces to the original math exactly.
  function frame(t){
    if(!start){start=t;lastT=t;}
    const step=Math.min(t-lastT,48)/16;
    lastT=t;
    const e=t-start, a=e>fade?1-(e-fade)/(dur-fade):1;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.y+=p.s*step; p.x+=p.d*step; p.r+=p.rs*step;
      ctx.save(); ctx.globalAlpha=Math.max(0,a); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(e<dur)requestAnimationFrame(frame); else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  requestAnimationFrame(frame);
}
let resultsSaving=false;
// Called automatically once per completed spin sequence (see startSpin) —
// every result is saved exactly once, with no separate manual "collect"
// step required. Deliberately does NOT touch the results modal/confetti;
// those are orchestrated by startSpin so this stays a pure persistence step
// and stays safely callable exactly once per sequence via the guard below.
function saveResults(){
  if(resultsSaving||!state.pending.length)return;
  resultsSaving=true;
  try{
    const now=new Date();
    // Internal audit fields only — never rendered in the public history
    // table or CSV export (both use their own fixed column lists), kept
    // here purely so an admin inspecting the raw saved data can verify
    // whether the Tier 2 group modifier fired on a given spin.
    const modifierAudit=state.pendingModifierAudit||{tier2GroupModifierApplied:false,baseLegendaryChance:null,finalLegendaryChance:null,legendaryCountThisSpin:null};
    const tierLabel=state.pendingTierLabel||TIERS[state.tier].label;
    const spinType=state.pendingSpinType||state.spinType;
    const rows=state.pending.map(i=>({id:generateHistoryId(),time:now.toLocaleString(),ts:Date.now(),group:state.pendingGroup,tier:tierLabel,spinType,item:i.name,category:i.category,rank:i.rarity,image:i.image||'',emoji:i.emoji||'',tier2GroupModifierApplied:modifierAudit.tier2GroupModifierApplied,baseLegendaryChance:modifierAudit.baseLegendaryChance,finalLegendaryChance:modifierAudit.finalLegendaryChance,legendaryCountThisSpin:modifierAudit.legendaryCountThisSpin}));
    history.unshift(...rows);
    persistHistory();
    if(typeof rememberGroup==='function')rememberGroup(state.pendingGroup);
    if(typeof updateHomeStats==='function')updateHomeStats();
    if(document.getElementById('historyView')?.classList.contains('active'))renderHistory();
  }finally{
    resultsSaving=false;
  }
}
