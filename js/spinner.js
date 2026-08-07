function allowed(t,item){
  if(item.type==='gun')return WEAPON_POOLS[t].has(item.name);
  return TIERS[t].rarities.includes(item.rarity);
}
function getVisiblePool(ignoreFilter=false){
  return ITEMS.filter(item=>allowed(state.tier,item)&&item.type===state.spinType&&(ignoreFilter||state.filter==='all'||item.rarity===state.filter));
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
function buildPoolHTML(p){
  return p.map((i,idx)=>{
    const floatDelay=`-${((idx*0.47)%2.8).toFixed(2)}s`;
    const floatDuration=`${(4.8+((idx*0.63)%1.9)).toFixed(2)}s`;
    return `<div class="card" style="animation-delay:${Math.min(idx,10)*42}ms"><div class="thumb">${imageMarkup(i,{className:'weaponFloat',style:`--floatDelay:${floatDelay};--floatDuration:${floatDuration};`})}</div><div class="cardInfo"><div class="itemName">${i.name}</div><div class="itemCat">${i.category}</div><div class="badges"><span class="badge ${i.rarity}">${i.rarity}</span><span class="badge">${state.spinType}</span></div></div></div>`;
  }).join('')||`<div class="tiny" style="animation:dropCascade .28s ease both">No ${state.spinType} drops available for this tier/filter.</div>`;
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
    const count=ITEMS.filter(item=>allowed(state.tier,item)&&item.type===type&&(state.filter==='all'||item.rarity===state.filter)).length;
    el.textContent=`${count} items`;
  });

  updateSpinStageStatus(p);
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
  const carousel=document.getElementById('spinDropsCarousel');
  if(carousel){
    carousel.innerHTML=buildPoolHTML(p);
    preloadImages(p);
    attachImageGuards(carousel);
  }
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

   Current Tier 2 legendary baselines (computed from the live item weights,
   see js/data.js): guns ~26.16%, bullets ~2.97%, accessories ~3.62%.

   For GUNS specifically, this bonus works together with the boost-window
   logic further down (tier2GunBoostWindowConfig): while a spin's legendary
   count is still under the window's threshold, each roll uses this boosted
   chance instead of the baseline. Simulated over 200k trials, a gun spin at
   the boosted chance below reaches 2+ legendary results about 82% of the
   time, versus about 66% of the time at the unmodified baseline — a real
   lift, but still well short of certain (roughly 1 in 5 boosted spins still
   fall short of 2). The 40% ceiling only matters as a safety bound; the
   configured bonus keeps the actual boosted chance around 34%.

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
   - maxLegendaryPerSpin is a separate, neutral hard ceiling that applies to
     EVERY group regardless of eligibility: once a spin has produced this
     many legendary results, legendary items are excluded from the pool for
     its remaining rolls, so no spin — boosted or not — can ever exceed it.

   Every roll is still a genuine weighted random draw. There is no floor or
   guaranteed-minimum anywhere in this file — a guaranteed legendary would
   no longer be a probability, it would be a scripted result.
   ------------------------------------------------------------------------- */
const tier2GunBoostWindowConfig = {
  boostUntilLegendaryCount: 2,   // boost applies until the spin has this many legendary guns, then turns off
  maxLegendaryPerSpin: 4         // hard ceiling, applies to every group
};

/* -----------------------------------------------------------------------
   ADMIN CONFIGURATION — Tier 2 gun legendary reward-count rebalance
   -------------------------------------------------------------------------
   The per-roll legendary baseline built into the ITEMS weights (~26% for
   guns, see computeLegendaryChance) — and everything tuned against it above
   (tier2GroupModifierConfig, tier2GunBoostWindowConfig) — was calibrated
   back when Tier 2 generated tier2GunRewardsBaselineRef rolls per spin.
   Tier 2 now generates TIERS.t2.rewards rolls per spin; at the old per-roll
   odds, more rolls means a legendary switch — let alone stacking multiple
   in one spin — becomes silently much easier just from the extra rolls,
   with no design decision behind that shift.
   This scales the legendary weight of the pool DOWN by the same ratio the
   roll count grew, so pulling a switch stays roughly as hard as it was
   before the reward-count increase (never used to inflate odds — if a tier
   ever has fewer rolls than the reference, this is a no-op). It runs first,
   before the Brower Gang group bonus is computed, so that bonus still
   applies on top of this rebalanced baseline exactly as before — the boost
   itself is untouched, only the baseline it's added to is corrected.
   Applies to Tier 2 GUN spins only; bullets/accessories are unaffected.
   ------------------------------------------------------------------------- */
const tier2GunRewardsBaselineRef = 8;
function rebalanceTier2GunLegendaryBaseline(pool, tierKey, spinType) {
  if (tierKey !== 't2' || spinType !== 'gun') return pool;
  const scale = tier2GunRewardsBaselineRef / TIERS.t2.rewards;
  if (!(scale < 1)) return pool;

  const baseLegendaryChance = computeLegendaryChance(pool);
  const legendaryWeight = pool.filter(item => item.rarity === 'legendary').reduce((sum, item) => sum + item.weight, 0);
  const otherWeight = pool.reduce((sum, item) => sum + item.weight, 0) - legendaryWeight;
  if (!baseLegendaryChance || legendaryWeight <= 0) return pool;

  const targetChance = baseLegendaryChance * scale;
  const targetLegendaryWeight = (targetChance * otherWeight) / (1 - targetChance);
  const rebalanceScale = targetLegendaryWeight / legendaryWeight;
  return pool.map(item => item.rarity === 'legendary' ? { ...item, weight: item.weight * rebalanceScale } : item);
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

  if (legendaryCountSoFar >= tier2GunBoostWindowConfig.maxLegendaryPerSpin) {
    return basePool.filter(item => item.rarity !== 'legendary');
  }

  if (bonusApplies && legendaryCountSoFar < tier2GunBoostWindowConfig.boostUntilLegendaryCount) {
    return boostedPool;
  }

  // Not eligible, or the boost window has already closed for this spin —
  // regular, fully unmodified odds.
  return basePool;
}

/* -----------------------------------------------------------------------
   ADMIN CONFIGURATION — same-legendary-gun cap
   -------------------------------------------------------------------------
   Hard rule, applies to every Tier 2 gun spin regardless of group (the
   Brower Gang boost above is untouched and still runs first — this only
   trims the pool afterward): once a specific named legendary gun has been
   won MAX_SAME_LEGENDARY_GUN_PER_SPIN times in one spin, that one gun is
   removed from the pool for the rest of the spin, so its own chance drops
   to zero — a third copy is never possible. Every OTHER legendary gun (and
   every other rarity) is untouched and keeps its normal relative odds, so
   the overall legendary/rarity distribution stays a valid weighted draw;
   only the maxed-out gun's own weight leaves the pool.
   ------------------------------------------------------------------------- */
const MAX_SAME_LEGENDARY_GUN_PER_SPIN = 2;
function excludeMaxedOutLegendaryGuns(pool, legendaryNameCounts, tierKey, spinType) {
  if (tierKey !== 't2' || spinType !== 'gun') return pool;
  if (!legendaryNameCounts || !legendaryNameCounts.size) return pool;
  const filtered = pool.filter(item =>
    !(item.rarity === 'legendary' && (legendaryNameCounts.get(item.name) || 0) >= MAX_SAME_LEGENDARY_GUN_PER_SPIN)
  );
  return filtered.length ? filtered : pool;
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
  function renderResults(){showResults()}
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
async function startSpin() {
  if (state.spinning) return;

  const group = elements.groupInput.value.trim();
  if (!group) {
    alert("Type the group name before spinning.");
    elements.groupInput.focus();
    return;
  }

  const basePool = getVisiblePool(true).filter((item) =>
    state.filter === "all" || item.rarity === state.filter
  );

  if (!basePool.length) {
    alert(`No ${state.spinType} drops available for ${TIERS[state.tier].label}.`);
    return;
  }

  // Rebalance the legendary baseline for the new reward count BEFORE the
  // group bonus is computed, so the Brower Gang boost still applies on top
  // of the corrected baseline exactly as before.
  const rebalancedBasePool = rebalanceTier2GunLegendaryBaseline(basePool, state.tier, state.spinType);

  // Computed once per spin (not per roll), so a group name with more than
  // one eligible keyword still only applies the bonus a single time.
  const modifierResult = applyTier2GroupModifier(rebalancedBasePool, group, state.tier);
  const pool = modifierResult.pool;

  state.spinning = true;
  state.pending = [];
  state.pendingGroup = group;
  skipRequested = false;

  const winningItems = [];
  let legendaryCountThisSpin = 0;
  const legendaryNameCountsThisSpin = new Map();
  for (let roll = 1; roll <= TIERS[state.tier].rewards; roll++) {
    const previousWinner = winningItems[winningItems.length - 1]?.name;
    // Re-checked every roll: for Tier 2 gun spins, this both enforces the
    // hard legendary ceiling and — for eligible groups only — decides
    // whether the boost window is still open (closes for the rest of the
    // spin once boostUntilLegendaryCount has been reached).
    const boundedPool = applyTier2GunLegendaryBounds(pool, rebalancedBasePool, legendaryCountThisSpin, modifierResult.bonusApplies, state.spinType, state.tier);
    // Then, regardless of group/boost, drop any single legendary gun that
    // has already hit its per-spin cap — keeps the boost intact while
    // guaranteeing no more than 2 of the same legendary gun ever land.
    const rollPool = excludeMaxedOutLegendaryGuns(boundedPool, legendaryNameCountsThisSpin, state.tier, state.spinType);
    const winner = weightedPick(rollPool, previousWinner);
    if (winner.rarity === 'legendary') {
      legendaryCountThisSpin++;
      legendaryNameCountsThisSpin.set(winner.name, (legendaryNameCountsThisSpin.get(winner.name) || 0) + 1);
    }
    winningItems.push(winner);
  }
  state.pending = [...winningItems];
  state.pendingModifierAudit = {
    tier2GroupModifierApplied: modifierResult.bonusApplies,
    baseLegendaryChance: modifierResult.baseLegendaryChance,
    finalLegendaryChance: modifierResult.finalLegendaryChance,
    legendaryCountThisSpin
  };

  elements.dropBtn.disabled = true;
  elements.closeSpin.disabled = true;
  openModal(elements.spinModal);

  try {
    for (let roll = 1; roll <= winningItems.length; roll++) {
      elements.rollText.textContent = `ROLL ${roll} OF ${winningItems.length}`;

      const winner = winningItems[roll - 1];
      fillReel(reelItems(pool, winner));
      await animateReelToWinner(WIN_IDX, winner.rarity);

      playSpinChime(winner.rarity);
      const isHighRarity = winner.rarity === 'legendary' || winner.rarity === 'epic';
      if (isHighRarity || roll === winningItems.length) launchConfetti(isHighRarity ? 'big' : 'small');
      await wait(skipRequested ? 40 : 240);
    }

    state.pending = [...winningItems];
    renderResults();
    closeModal(elements.spinModal);
    openModal(elements.resultModal);
  } finally {
    state.spinning = false;
    skipRequested = false;
    elements.closeSpin.disabled = false;
    updateSpinStageStatus(pool);
  }
}
document.getElementById('skipSpinBtn')?.addEventListener('click', () => { if (state.spinning) skipRequested = true; });
function showResults(){document.getElementById('resultModal').classList.remove('open');void document.getElementById('resultModal').offsetWidth;preloadImages(state.pending);document.getElementById('results').innerHTML=state.pending.map(i=>`<div class="resultCard">${visual(i)}<div class="itemName" style="font-size:18px;margin-top:8px">${i.name}</div><div class="tiny">${state.pendingGroup}</div><div class="badges" style="justify-content:center"><span class="badge ${i.rarity}">${i.rarity}</span></div></div>`).join('');attachImageGuards(document.getElementById('results'));document.getElementById('resultModal').classList.add('open')}
function launchConfetti(){
  if(window.appSettings && appSettings.confetti===false)return;
  const canvas=document.getElementById('confettiCanvas'); if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=innerWidth; canvas.height=innerHeight;
  const colors=['#9b5cff','#c4a3ff','#ffffff','#0b0b0f','#6d28d9','#d9d9df'];
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
function saveResults(){
  // Idempotency guard: nothing to save (already saved, or a stray duplicate
  // click/call) means this is a no-op instead of a duplicate history entry.
  if(resultsSaving||!state.pending.length)return;
  resultsSaving=true;
  try{
    const now=new Date();
    // Internal audit fields only — never rendered in the public history
    // table or CSV export (both use their own fixed column lists), kept
    // here purely so an admin inspecting the raw saved data can verify
    // whether the Tier 2 group modifier fired on a given spin.
    const modifierAudit=state.pendingModifierAudit||{tier2GroupModifierApplied:false,baseLegendaryChance:null,finalLegendaryChance:null,legendaryCountThisSpin:null};
    const rows=state.pending.map(i=>({id:generateHistoryId(),time:now.toLocaleString(),ts:Date.now(),group:state.pendingGroup,tier:TIERS[state.tier].label,spinType:state.spinType,item:i.name,category:i.category,rank:i.rarity,image:i.image||'',emoji:i.emoji||'',tier2GroupModifierApplied:modifierAudit.tier2GroupModifierApplied,baseLegendaryChance:modifierAudit.baseLegendaryChance,finalLegendaryChance:modifierAudit.finalLegendaryChance,legendaryCountThisSpin:modifierAudit.legendaryCountThisSpin}));
    history.unshift(...rows);
    persistHistory();
    if(typeof rememberGroup==='function')rememberGroup(state.pendingGroup);
    state.pending=[];
    document.getElementById('resultModal').classList.remove('open');
    launchConfetti();
    render();
    if(typeof updateHomeStats==='function')updateHomeStats();
  }finally{
    resultsSaving=false;
  }
}
