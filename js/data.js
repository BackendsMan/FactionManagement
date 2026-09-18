const ITEMS=[
{name:"Walter PPK",rarity:"epic",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_PPK.png",weight:10},
{name:"Walter P88",rarity:"rare",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_P88.png",weight:10},
{name:"Berreta M9",rarity:"rare",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_M9.png",weight:10},
{name:"S&W 357",rarity:"rare",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_R57.png",weight:10},
{name:"HK-45",rarity:"rare",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_HK45.png",weight:10},
{name:"GLOCK 26",rarity:"uncommon",category:"tier 1 pistols",type:"gun",image:"./Images/WEAPON_G26.png",weight:10},
{name:"1911",rarity:"epic",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_1911.png",weight:10},
{name:"Zoraki M9",rarity:"epic",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_M9.png",weight:10},
{name:"GLOCK 43X",rarity:"rare",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_G43X.png",weight:10},
{name:"GLOCK 19",rarity:"common",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_G19.png",weight:10},
{name:"GHOST GLOCK",rarity:"common",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_GHOST.png",weight:10},
{name:"RUGAR 57",rarity:"epic",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_R57.png",weight:10},
{name:"LEBEDEV PL14",rarity:"legendary",category:"tier 1.5 pistols",type:"gun",image:"./Images/WEAPON_PL14.png",weight:10},
{name:"GLOCK 17",rarity:"common",category:"tier 2 pistols",type:"gun",image:"./Images/WEAPON_G17.png",weight:10},
{name:"Mac 10",rarity:"legendary",category:"tier 2 pistols",type:"gun",image:"./Images/WEAPON_MAC11BV.png",weight:10},
{name:"Tec 9",rarity:"legendary",category:"tier 2 pistols",type:"gun",image:"./Images/WEAPON_TEQ.png",weight:10},
{name:"Sig P320",rarity:"uncommon",category:"tier 2 pistols",type:"gun",image:"./Images/WEAPON_P320.png",weight:10},
{name:"9mm Ammo",rarity:"common",category:"basic pistol ammo",type:"bullet",image:"./Images/ammo-9.png",weight:72},
{name:".22 Ammo",rarity:"common",category:"basic pistol ammo",type:"bullet",image:"./Images/ammo-22.png",weight:70},
{name:".40 Ammo",rarity:"uncommon",category:"better pistol ammo",type:"bullet",image:"./Images/ammo-40.png",weight:58},
{name:".45 Ammo",rarity:"uncommon",category:"better pistol ammo",type:"bullet",image:"./Images/ammo-45.png",weight:54},
{name:"10mm Ammo",rarity:"rare",category:"better pistol ammo",type:"bullet",image:"./Images/ammo-10.png",weight:42},
{name:".357 Sig Ammo",rarity:"rare",category:"better pistol ammo",type:"bullet",image:"./Images/ammo-357s.png",weight:38},
{name:"5.7x28 Ammo",rarity:"rare",category:"rifle ammo",type:"bullet",image:"./Images/ammo-57x28.png",weight:36},
{name:"Rifle Ammo",rarity:"epic",category:"rifle ammo",type:"bullet",image:"./Images/ammo-rifle.png",weight:22},
{name:"AR Ammo",rarity:"legendary",category:"strong rifle ammo",type:"bullet",image:"./Images/ammo-rifle2.png",weight:12},
{name:"Glock Extended Mag",rarity:"uncommon",category:"extended mags",type:"accessory",image:"./Images/glockextendedmag2.png",weight:46},
{name:"Glock Extended Mag Tan",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/glockextendedmagtan.png",weight:36},
{name:"Klane Extended Mag",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/klaneextendedmag.png",weight:34},
{name:"Klane Vector Mag",rarity:"rare",category:"high-capacity mags",type:"accessory",image:"./Images/klanevectormag.png",weight:30},
{name:"Klane Vector Mag Tan",rarity:"epic",category:"high-capacity mags",type:"accessory",image:"./Images/klanevectormagt.png",weight:20},
{name:"Klane Vector Mag White",rarity:"epic",category:"high-capacity mags",type:"accessory",image:"./Images/klanevectormagw.png",weight:18},
{name:"Tactical Drum Mag",rarity:"epic",category:"high-capacity mags",type:"accessory",image:"./Images/tacticaldrummag.png",weight:16},
{name:"Tactical Extended Mag",rarity:"uncommon",category:"extended mags",type:"accessory",image:"./Images/tacticalextendedmag.png",weight:44},
{name:"Tactical Extended Mag 2",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/tacticalextendedmag2.png",weight:34},
{name:"Tactical Extended Mag 3",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/tacticalextendedmag3.png",weight:32},
{name:"Tactical Extended Mag 4",rarity:"epic",category:"high-capacity mags",type:"accessory",image:"./Images/tacticalextendedmag4.png",weight:20},
{name:"Tactical Extended Mag Clear",rarity:"epic",category:"high-capacity mags",type:"accessory",image:"./Images/tacticalextendedmagclear.png",weight:18},
{name:"Tactical Extended Mag Tan",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/tacticalextendedmagtan.png",weight:28},
{name:"Tactical Extended Mag Alt",rarity:"rare",category:"extended mags",type:"accessory",image:"./Images/tactiaclextendedmag2.png",weight:26},
{name:"UTG Windowed Mag",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/utgwindowedmag.png",weight:10},
{name:"AR Shell Catcher",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/arshellcatcher.png",weight:16},
{name:"Black Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_blackpistolgrip.png",weight:56},
{name:"Blue Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_bluepistolgrip.png",weight:54},
{name:"Camo Pistol Grip",rarity:"uncommon",category:"basic attachments",type:"accessory",image:"./Images/at_camogrip.png",weight:48},
{name:"Camo Pistol Grip Pink",rarity:"rare",category:"rare weapon accessories",type:"accessory",image:"./Images/at_camogripp.png",weight:30},
{name:"Camo Pistol Grip Tan",rarity:"rare",category:"rare weapon accessories",type:"accessory",image:"./Images/at_camogript.png",weight:28},
{name:"Dark Green Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_darkgreenpistolgrip.png",weight:50},
{name:"Green Beam",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_gbeam.png",weight:18},
{name:"Goon Tape",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_goontape.png",weight:52},
{name:"Goon Tape Blue",rarity:"uncommon",category:"basic attachments",type:"accessory",image:"./Images/at_goontapeb.png",weight:44},
{name:"Goon Tape Tan",rarity:"uncommon",category:"basic attachments",type:"accessory",image:"./Images/at_goontapet.png",weight:42},
{name:"Gray Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_graypistolgrip.png",weight:50},
{name:"Green Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_greenpistolgrip.png",weight:48},
{name:"Hogue Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_hoguepistolgrip.png",weight:48},
{name:"Hogue Pistol Grip Green",rarity:"uncommon",category:"basic attachments",type:"accessory",image:"./Images/at_hoguepistolgripg.png",weight:42},
{name:"Hogue Pistol Grip Tan",rarity:"uncommon",category:"basic attachments",type:"accessory",image:"./Images/at_hoguepistolgript.png",weight:40},
{name:"OL Beam Blue",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeamb.png",weight:16},
{name:"OL Beam Green",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeamg.png",weight:16},
{name:"OL Beam Pink",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeamp.png",weight:16},
{name:"OL Beam Red",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeamr.png",weight:16},
{name:"OL Beam BG",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeambg.png",weight:8},
{name:"OL Beam BGB",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeambgb.png",weight:8},
{name:"OL Beam BGG",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeambgg.png",weight:8},
{name:"OL Beam BGP",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeambgp.png",weight:8},
{name:"OL Beam BGR",rarity:"legendary",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olbeambgr.png",weight:8},
{name:"OL Flashlight",rarity:"epic",category:"rare weapon accessories",type:"accessory",image:"./Images/at_olflashlight.png",weight:18},
{name:"Pink Pistol Grip",rarity:"rare",category:"rare weapon accessories",type:"accessory",image:"./Images/at_pinkpistolgrip.png",weight:24},
{name:"Purple Pistol Grip",rarity:"rare",category:"rare weapon accessories",type:"accessory",image:"./Images/at_purplepistolgrip.png",weight:24},
{name:"Red Pistol Grip",rarity:"rare",category:"rare weapon accessories",type:"accessory",image:"./Images/at_redpistolgrip.png",weight:24},
{name:"Rubber Bands",rarity:"common",category:"utility items",type:"accessory",image:"./Images/at_rubberbands.png",weight:60},
{name:"Tan Pistol Grip",rarity:"common",category:"basic attachments",type:"accessory",image:"./Images/at_tanpistolgrip.png",weight:50}
];
const TEST_GUNS=[];
const TIER1_GUNS=["Walter PPK","Walter P88","Berreta M9","S&W 357","HK-45","GLOCK 26"];
const TIER15_GUNS=["Berreta M9","1911","Zoraki M9","HK-45","GLOCK 43X","GLOCK 19","GHOST GLOCK","RUGAR 57","GLOCK 26","LEBEDEV PL14"];
const TIER2_GUNS=["1911","HK-45","GLOCK 17","GLOCK 43X","GLOCK 19","GLOCK 26","GHOST GLOCK","Mac 10","Tec 9","Sig P320","RUGAR 57","LEBEDEV PL14"];
const WEAPON_POOLS={
  test:new Set(TEST_GUNS),
  t1:new Set(TIER1_GUNS),
  "t1.5":new Set(TIER15_GUNS),
  t2:new Set(TIER2_GUNS)
};
const TIERS={test:{label:"Test",rewards:4,rarities:["common","uncommon"]},t1:{label:"Tier 1",rewards:8,rarities:["common","uncommon","rare"]},"t1.5":{label:"Tier 1.5",rewards:12,rarities:["common","uncommon","rare","epic"]},t2:{label:"Tier 2",rewards:15,rarities:["common","uncommon","rare","epic","legendary"]}};
/* =============================================================================
   CENTRALIZED ITEM REGISTRY — single source of truth for display name, image,
   tier, category and rarity across Spin Center, Weapon Tiers and History.
   -----------------------------------------------------------------------------
   `TIERS[x].rewards` above is kept ONLY as a historical calibration constant
   that the Tier 2 legendary-weight math in js/spinner.js references (see the
   comments around rebalanceTier2GunLegendaryBaseline there). It no longer
   controls how many rolls a spin performs — spin count is user-selected and
   unlimited (state.spinAmount in js/app.js). Nothing in the UI displays
   `.rewards` as an allowance/maximum.

   normalizeDisplayName() is a defensive fallback: every item in ITEMS above
   already ships with a clean, real display name (e.g. "P80", not
   "weapon_p80"), so this never runs against the shipped catalog. It exists so
   that any future item added with a raw code/filename as its `name` (or any
   malformed legacy history row — see sanitizeHistoryRows) still renders a
   readable label instead of a raw filename, underscore, or "undefined".
   ============================================================================= */
const WEAPON_CODE_OVERRIDES={
  p80:"P80",g17:"G17",g19:"G19",g20:"G20",g22:"G22",g23:"G23",g24:"G24",g31:"G31",g45:"G45",
  fn502t:"FN502 Tactical",fn57:"FN57",kg43x:"KG43X",sd40t:"SD40 Tactical",mp920:"M&P 9 2.0",
  mp20frt:"MP20FRT",t850:"T850",tg2c:"G2C",p226:"P226",p320sig:"P320 SIG",
  psadhalfnhalf:"PSAD Half N Half",psafn57:"PSA FN57",psap80g19switch:"PSA P80 G19 Switch",
  ar:"AR",utg:"UTG"
};
function normalizeDisplayName(rawCode){
  if(rawCode===null||rawCode===undefined)return "Unknown Item";
  let code=String(rawCode).trim();
  if(!code)return "Unknown Item";
  const stem=code.replace(/^\.?\/?(?:.*\/)?/,'').replace(/\.[a-z0-9]{2,4}$/i,'');
  const key=stem.toLowerCase().replace(/^weapon[_-]?/,'').replace(/[^a-z0-9]/g,'');
  if(WEAPON_CODE_OVERRIDES[key])return WEAPON_CODE_OVERRIDES[key];
  const cleaned=stem.replace(/^weapon[_-]?/i,'').replace(/[_-]+/g,' ').trim();
  if(!cleaned)return "Unknown Item";
  return cleaned.split(' ').map(word=>{
    if(/^[a-z0-9]+$/i.test(word)&&/[0-9]/.test(word))return word.toUpperCase();
    if(word.length<=3&&/^[a-z]+$/i.test(word))return word.toUpperCase();
    return word.charAt(0).toUpperCase()+word.slice(1).toLowerCase();
  }).join(' ');
}
/* Every catalog item's real internal identifier (its image filename, minus
   path/extension) — this project has no separate "spawn code" system, so the
   asset filename IS the internal code (e.g. WEAPON_P80, ammo-9,
   at_blackpistolgrip). Shown as small muted text in item cards/pool rows. */
ITEMS.forEach(item=>{
  if(!item.code){
    const match=String(item.image||'').match(/([^/]+)\.[a-z0-9]+$/i);
    item.code=match?match[1]:'';
  }
  if(!item.name||/^(undefined|null)$/i.test(item.name))item.name=normalizeDisplayName(item.code||item.image);
});
const WEAPON_REGISTRY=new Map(ITEMS.map(item=>[`${item.type}:${item.name}`,item]));
/* Dev-console diagnostic only — never shown in the UI. Confirms every item
   has a name/image, and flags duplicate type+name pairs or duplicate image
   files, which would otherwise silently shadow one item with another. */
function auditItemRegistry(){
  const issues=[];
  const imageOwners=new Map();
  ITEMS.forEach(item=>{
    if(!item.name||/^(undefined|null|)$/i.test(item.name))issues.push(`Missing/invalid display name for item with image ${item.image}`);
    if(!item.image)issues.push(`Missing image for item "${item.name}"`);
    const key=`${item.type}:${item.name}`;
    const owners=imageOwners.get(item.image)||[];
    owners.push(key);
    imageOwners.set(item.image,owners);
  });
  imageOwners.forEach((owners,image)=>{
    if(owners.length>1)issues.push(`Duplicate image "${image}" used by: ${owners.join(', ')}`);
  });
  if(issues.length)console.warn('[Item Registry Audit]',issues);
  return issues;
}
if(typeof window!=='undefined'){window.WEAPON_REGISTRY=WEAPON_REGISTRY;window.auditItemRegistry=auditItemRegistry;auditItemRegistry();}
const MUSIC_TRACKS=[
  {name:"Keke - Headtapp Gz",id:1},
  {name:"Strictly 4 The Fans - Rennytherapper",id:2},
  {name:"Forget You - Kdot B",id:3},
  {name:"Clock It - Dotty B",id:4},
  {name:"Peach Dream - TyBando x Yen34",id:5},
  {name:"Unfadeable - Kay30",id:6},
  {name:"Purge - RichNunu",id:7},
  {name:"Talking About Drillin - TGMAN",id:8},
  {name:"RTP - BT Spiig x QG74RT",id:9},
  {name:"Aiint On Shit - Double R x Ace B",id:10},
  {name:"Dumb Ways 2 Die - Jah Munna",id:11},
  {name:"Warning - Swoop G",id:12}
].map(track=>({
  ...track,
  mp3:`./mp3/Music${track.id}.mp3`,
  mp4:`Music${track.id}.mp4`,
  mp3Sources:[
    `./mp3/Music${track.id}.mp3`,
    `./mp3/Music ${track.id}.mp3`,
    `./mp3/music${track.id}.mp3`,
    `./mp3/music ${track.id}.mp3`,
    `mp3/Music${track.id}.mp3`,
    `mp3/Music ${track.id}.mp3`
  ],
  mp4Sources:[
    `Music${track.id}.mp4`,
    `./Music${track.id}.mp4`,
    `Music ${track.id}.mp4`,
    `./Music ${track.id}.mp4`,
    `music${track.id}.mp4`,
    `./music${track.id}.mp4`,
    `music ${track.id}.mp4`,
    `./music ${track.id}.mp4`,
    `./mp4/Music${track.id}.mp4`,
    `mp4/Music${track.id}.mp4`,
    `./mp4/Music ${track.id}.mp4`,
    `mp4/Music ${track.id}.mp4`
  ]
}));
const SPEEDS={fast:3000,normal:4650,cinematic:5800};
const STORAGE_KEYS={history:"illegalFactionSpinHistory",legacyHistory:"phillySpinHistory",settings:"illegalFactionSpinSettings",legacySettings:"phillySpinSettings",theme:"illegalFactionTheme",legacyTheme:"phillyTheme",track:"illegalFactionTrackIndex"};
const ITEM_H=120, WIN_IDX=62;
const ITEM_LOOKUP=new Map(ITEMS.map(item=>[`${item.type}:${item.name}`,item]));
function generateHistoryId(){
  return 'h_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
}
function sanitizeHistoryRows(rows){
  if(!Array.isArray(rows))return [];
  return rows.map((entry,index)=>{
    if(!entry||typeof entry!=='object') return null;
    const spinType=String(entry.spinType||entry.type||'unknown').toLowerCase();
    const itemName=String(entry.item||entry.name||'Unknown Item').trim()||'Unknown Item';
    const lookup=ITEM_LOOKUP.get(`${spinType}:${itemName}`);
    const ts=Number(entry.ts);
    // Spread the original entry first so any fields from an older or newer
    // version of the app (extra metadata, ids, etc.) survive untouched —
    // only the fields below are ever normalized/overwritten.
    return {
      ...entry,
      id:entry.id||generateHistoryId(),
      time:String(entry.time|| (Number.isFinite(ts)?new Date(ts).toLocaleString():'Saved spin')),
      ts:Number.isFinite(ts)?ts:Date.now()-index,
      group:String(entry.group||entry.faction||'Unknown Group'),
      tier:String(entry.tier||entry.tierLabel||'Legacy Drop'),
      spinType,
      item:itemName,
      category:String(entry.category||lookup?.category||'Legacy item'),
      rank:String(entry.rank||entry.rarity||lookup?.rarity||'legacy').toLowerCase(),
      image:String(entry.image||lookup?.image||''),
      emoji:String(entry.emoji||lookup?.emoji||'')
    };
  }).filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0));
}
// Defensive load: never let a malformed value in localStorage throw and never
// silently replace unreadable data with an empty array — log it and keep the
// raw stored value on disk untouched instead.
function loadSpinHistoryRaw(){
  let raw=null;
  try{
    raw=localStorage.getItem(STORAGE_KEYS.history)||localStorage.getItem(STORAGE_KEYS.legacyHistory)||null;
  }catch(error){
    console.error('Unable to access localStorage for spin history:',error);
    return {rows:[],raw:null,parsedOk:true};
  }
  if(!raw)return {rows:[],raw:null,parsedOk:true};
  try{
    const parsed=JSON.parse(raw);
    return {rows:Array.isArray(parsed)?parsed:[],raw,parsedOk:true};
  }catch(error){
    console.error('Unable to parse saved spin history, leaving the stored value untouched:',error);
    return {rows:[],raw,parsedOk:false};
  }
}
const historyLoad=loadSpinHistoryRaw();
// One-time backup of whatever was actually on disk, before anything below
// touches it. Never overwritten on later loads.
if(historyLoad.raw){
  try{
    const backupKey=STORAGE_KEYS.history+'_backup';
    if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,historyLoad.raw);
  }catch(error){
    console.error('Unable to write spin history backup:',error);
  }
}
let history=sanitizeHistoryRows(historyLoad.rows);
// Only re-save when the stored value actually parsed — if it didn't, the raw
// value (and its backup above) stays on disk exactly as it was.
if(historyLoad.parsedOk){
  localStorage.setItem(STORAGE_KEYS.history,JSON.stringify(history));
}
