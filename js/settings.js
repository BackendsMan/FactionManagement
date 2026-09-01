/* === FULL SETTINGS LOGIC === */
const savedSettings=JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)||localStorage.getItem(STORAGE_KEYS.legacySettings)||"{}");
const defaultSettings={
  musicVolume:60,bgOpacity:82,videoBrightness:22,videoBlur:4,videoVisibility:10,floatStrength:12,panelOpacity:100,
  showBgVideo:true,highQualityVideo:true,showFloating:true,showParticles:true,showRgbTrail:true,spinSfx:true,typingSfx:true,
  hideHeroPanel:false,heroPanelUserSet:false,
  autoCollect:false,winnerPopups:true,confetti:true,legendaryAlert:true,soundAlerts:true,
  spinSpeed:"normal",managerName:"Faction Management",madeByText:"Made By Nas",
  logoUrl:"",bgVideoUrl:"",musicUrl:""
};
let appSettings={...defaultSettings,...savedSettings};
// Fix old saved data that made the hero panel hide automatically.
// It now stays visible by default, and only hides after the user toggles the setting.
if(!appSettings.heroPanelUserSet){
  appSettings.hideHeroPanel=false;
}
window.appSettings=appSettings; state.settings=appSettings;
function saveSettings(){localStorage.setItem(STORAGE_KEYS.settings,JSON.stringify(appSettings))}
function applyVisualSettings(){
  const bg=document.getElementById("bgVideo");
  const ambient=document.querySelector(".ambient");
  const music=document.getElementById("music");
  if(music){music.volume=(appSettings.musicVolume||60)/100;syncVolumeUI(appSettings.musicVolume||60)}
  if(bg){
    const hq=!!appSettings.highQualityVideo;
    const brightness=(appSettings.videoBrightness||34)/100;
    const blur=hq?3:Math.max(3,appSettings.videoBlur||0);
    bg.style.filter=hq
      ? `brightness(${Math.max(brightness,.26)}) contrast(.96) saturate(.62) blur(${blur}px)`
      : `brightness(${brightness}) contrast(1.0) saturate(.6) blur(${blur}px)`;
    bg.preload='auto';
    bg.volume=(appSettings.musicVolume||60)/100;
  }
  document.documentElement.style.setProperty("--videoVisibility",String(Math.max(6,Math.min(30,appSettings.videoVisibility??10))/100));
  if(ambient){
    const o=(appSettings.bgOpacity||48)/100;
    if(document.body.classList.contains('light')){
      ambient.style.background=`radial-gradient(circle at 38% 0,rgba(228,19,42,.06),transparent 34%),linear-gradient(180deg,rgba(255,255,255,${Math.min(.72,o*.92)}),rgba(238,242,248,${Math.min(.92,o+0.12)}))`;
    }else if(document.body.classList.contains('dim')){
      ambient.style.background=`radial-gradient(circle at 40% 0,rgba(228,19,42,.09),transparent 34%),radial-gradient(circle at 100% 45%,rgba(228,19,42,.055),transparent 28%),linear-gradient(180deg,rgba(12,14,21,${o*.68}),rgba(8,10,16,${o*.94}))`;
    }else{
      ambient.style.background=`radial-gradient(circle at 40% 0,rgba(228,19,42,.10),transparent 34%),radial-gradient(circle at 100% 45%,rgba(228,19,42,.07),transparent 28%),linear-gradient(180deg,rgba(5,6,10,${o*.72}),rgba(2,3,7,${o}))`;
    }
  }
  document.body.classList.toggle("hideBgVideo",!appSettings.showBgVideo);
  document.body.classList.toggle("hqBgVideo",!!appSettings.highQualityVideo);
  document.body.classList.toggle("hideFloating",!appSettings.showFloating);
  document.body.classList.toggle("hideParticles",!appSettings.showParticles);
  document.body.classList.toggle("hideRgbTrail",!appSettings.showRgbTrail);
  document.body.classList.toggle("hideHeroPanel",!!appSettings.hideHeroPanel);
  document.body.classList.toggle("noConfetti",!appSettings.confetti);
  document.documentElement.style.setProperty("--floatAmt",(appSettings.floatStrength||12)+"px");
  const panelRatio=Math.min(1,Math.max(0,(appSettings.panelOpacity??100)/100));
  document.documentElement.style.setProperty("--panelOpacity",String(panelRatio));
  document.querySelectorAll(".manager").forEach(el=>{
    const status=el.querySelector(".status");
    el.childNodes[0].nodeValue=(appSettings.managerName||"Faction Management")+" ";
    if(status && !el.contains(status)) el.appendChild(status);
  });
  document.querySelectorAll(".welcome b").forEach(el=>el.textContent=appSettings.managerName||"Faction Management");
  document.querySelectorAll(".madeByNas").forEach(el=>el.textContent=appSettings.madeByText||"Made By Nas");
  const prev=document.getElementById("previewMadeBy"); if(prev)prev.textContent=appSettings.madeByText||"Made By Nas";
  const brand=document.querySelector(".brand img");
  if(brand && appSettings.logoUrl) brand.src=appSettings.logoUrl;
  if(appSettings.musicUrl){
    state.usingCustomMusic=true;
    const source=document.querySelector("#music source");
    const audio=document.getElementById("music");
    if(source && audio && source.getAttribute("src")!==appSettings.musicUrl){
      const resumeTime=Math.max(audio.currentTime||0,bg.currentTime||0);
      const shouldResume=!audio.paused;
      source.src=appSettings.musicUrl;
      audio.load();
      audio.addEventListener('loadedmetadata',()=>{
        safeSetCurrentTime(audio,resumeTime);
        if(shouldResume)resumeMediaPair().catch(()=>{});
      },{once:true});
    }
  }else if(state.usingCustomMusic){
    state.usingCustomMusic=false;
    setTrack(state.trackIndex,{autoplay:!music.paused,resetTime:false,keepTime:true});
  }
  if(!appSettings.bgVideoUrl && !state.usingCustomVideo)setMediaStatus('');
  state.settings=appSettings;
  updateTrackButton();
  setMuteButton();
}
function initSettingsPanel(){
  if(state.settingsInitialized)return;
  state.settingsInitialized=true;
  const byId=id=>document.getElementById(id);
  [["setBgOpacity","bgOpacity"],["setVideoBrightness","videoBrightness"],["setVideoBlur","videoBlur"],["setFloatStrength","floatStrength"],["setPanelOpacity","panelOpacity"]].forEach(([id,key])=>{
    const el=byId(id); if(!el)return;
    el.value=appSettings[key];
    el.oninput=()=>{appSettings[key]=Number(el.value);saveSettings();applyVisualSettings()};
  });
  [["setShowBgVideo","showBgVideo"],["setHighQualityVideo","highQualityVideo"],["setShowFloating","showFloating"],["setShowParticles","showParticles"],["setShowRgbTrail","showRgbTrail"],["setHideHeroPanel","hideHeroPanel"],["setSpinSfx","spinSfx"],["setTypingSfx","typingSfx"],["setAutoCollect","autoCollect"],["setWinnerPopups","winnerPopups"],["setConfetti","confetti"],["setLegendaryAlert","legendaryAlert"],["setSoundAlerts","soundAlerts"]].forEach(([id,key])=>{
    const el=byId(id); if(!el)return;
    el.checked=!!appSettings[key];
    el.onchange=()=>{
      appSettings[key]=el.checked;
      if(key==="hideHeroPanel") appSettings.heroPanelUserSet=true;
      saveSettings();
      applyVisualSettings();
    };
  });
  const manager=byId("setManagerName"); if(manager){manager.value=appSettings.managerName; manager.oninput=()=>{appSettings.managerName=manager.value||"Faction Management";saveSettings();applyVisualSettings()}}
  const made=byId("setMadeByText"); if(made){made.value=appSettings.madeByText; made.oninput=()=>{appSettings.madeByText=made.value||"Made By Nas";saveSettings();applyVisualSettings()}}
  const logo=byId("setLogoUrl"); if(logo){logo.value=appSettings.logoUrl||""}
  const bgurl=byId("setBgVideoUrl"); if(bgurl){bgurl.value=appSettings.bgVideoUrl||""}
  const applyAdmin=byId("applyAdminSettings");
  const exitCustomVideoBtn=byId("exitCustomVideoBtn");
  if(applyAdmin)applyAdmin.onclick=async()=>{
    appSettings.logoUrl=logo?.value.trim()||"";
    const nextCustomVideoUrl=bgurl?.value.trim()||"";
    saveSettings();applyVisualSettings();
    if(nextCustomVideoUrl){
      const applied=await activateCustomVideo(nextCustomVideoUrl);
      if(applied){
        appSettings.bgVideoUrl=nextCustomVideoUrl;
        saveSettings();
      }else{
        appSettings.bgVideoUrl="";
        if(bgurl)bgurl.value=appSettings.bgVideoUrl;
        saveSettings();
      }
    }else{
      appSettings.bgVideoUrl="";
      await clearCustomVideoMode();
      saveSettings();
    }
  };
  if(exitCustomVideoBtn)exitCustomVideoBtn.onclick=async()=>{
    if(!state.usingCustomVideo){setMediaStatus('Custom video is not active.','error');return}
    appSettings.bgVideoUrl="";
    if(bgurl)bgurl.value="";
    await clearCustomVideoMode();
    saveSettings();
  };
  const volumeSlider=byId("volumeSlider");
  if(volumeSlider){
    syncVolumeUI(appSettings.musicVolume??60);
    volumeSlider.oninput=()=>{
      const value=Number(volumeSlider.value)||0;
      appSettings.musicVolume=value;
      saveSettings();
      syncVolumeUI(value);
      const musicEl=document.getElementById("music");
      const bgEl=document.getElementById("bgVideo");
      if(musicEl)musicEl.volume=value/100;
      if(bgEl)bgEl.volume=value/100;
    };
  }
  document.querySelectorAll(".spinSpeed").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.speed===appSettings.spinSpeed);
    btn.onclick=()=>{
      document.querySelectorAll(".spinSpeed").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      appSettings.spinSpeed=btn.dataset.speed;saveSettings();applyVisualSettings();
    };
  });
  const skip=byId("setSkipAnimations");
  if(skip)skip.onclick=()=>{document.body.classList.toggle("lowMotion");skip.classList.toggle("active")};
  const sExport=byId("settingsExportHistory"); if(sExport)sExport.onclick=exportCSV;
  const sClear=byId("settingsClearHistory"); if(sClear)sClear.onclick=async()=>{const ok=await openConfirmDialog({eyebrow:'Clear History',title:'Clear all saved spin history?',message:'Selecting Delete All will permanently remove every saved spin from local history on this device.',details:`${history.length} saved ${history.length===1?'entry':'entries'} will be removed. This cannot be undone.`,confirmText:'Delete All',cancelText:'Cancel',danger:true});if(!ok)return;history=[];localStorage.setItem(STORAGE_KEYS.history,"[]");selectedGroup="all";renderHistory()};
  const sLocal=byId("settingsClearLocal"); if(sLocal)sLocal.onclick=async()=>{const ok=await openConfirmDialog({eyebrow:'Local Storage',title:'Clear all locally saved app data?',message:'Selecting Clear Data will remove saved history, settings, theme preferences, and media choices stored in this browser.',details:'This affects only the current browser on the current device.',confirmText:'Clear Data',cancelText:'Keep Data',danger:true});if(!ok)return;localStorage.clear();location.reload()};
  const sReset=byId("settingsReset"); if(sReset)sReset.onclick=async()=>{const ok=await openConfirmDialog({eyebrow:'Reset Settings',title:'Reset the app back to defaults?',message:'Selecting Reset will restore the current app settings to their original defaults.',details:'Saved spin history will stay intact.',confirmText:'Reset',cancelText:'Cancel',danger:false});if(!ok)return;appSettings={...defaultSettings};window.appSettings=appSettings;saveSettings();location.reload()};
  applyVisualSettings();
  if(appSettings.bgVideoUrl){activateCustomVideo(appSettings.bgVideoUrl).then(applied=>{if(!applied){appSettings.bgVideoUrl="";saveSettings();if(bgurl)bgurl.value="";}else if(bgurl){bgurl.value=appSettings.bgVideoUrl;}})}
}

(function(){
  const AUDIO_EXT='audio/mpeg';
  const VIDEO_EXT='video/mp4';
  const normalAudioSources=id=>[
    `mp3/Music${id}.mp3`, `./mp3/Music${id}.mp3`,
    `mp3/music${id}.mp3`, `./mp3/music${id}.mp3`,
    `mp3/Music ${id}.mp3`, `./mp3/Music ${id}.mp3`
  ];
  const normalVideoSources=id=>[
    `Music${id}.mp4`, `./Music${id}.mp4`,
    `mp4/Music${id}.mp4`, `./mp4/Music${id}.mp4`,
    `music${id}.mp4`, `./music${id}.mp4`,
    `mp4/music${id}.mp4`, `./mp4/music${id}.mp4`,
    `Music ${id}.mp4`, `./Music ${id}.mp4`,
    `mp4/Music ${id}.mp4`, `./mp4/Music ${id}.mp4`
  ];
  function addSources(media, urls, type){
    if(!media)return;
    media.pause();
    media.innerHTML='';
    media.removeAttribute('src');
    [...new Set(urls)].forEach(url=>{
      const source=document.createElement('source');
      source.src=url;
      source.type=type;
      media.appendChild(source);
    });
    media.dataset.fallbackSources=JSON.stringify([...new Set(urls)]);
    media.dataset.fallbackIndex='0';
    try{media.load()}catch(e){}
  }
  function chosenTrack(){
    return MUSIC_TRACKS[((state.trackIndex%MUSIC_TRACKS.length)+MUSIC_TRACKS.length)%MUSIC_TRACKS.length];
  }
  // Stale custom URLs saved in the browser were stopping the normal playlist from loading.
  if(window.appSettings){
    appSettings.musicUrl='';
    appSettings.bgVideoUrl='';
    saveSettings();
  }
  state.usingCustomMusic=false;
  state.usingCustomVideo=false;
  window.trackAudioSources = trackInfo => normalAudioSources(trackInfo.id);
  window.trackVideoSources = trackInfo => normalVideoSources(trackInfo.id);
  trackAudioSources = window.trackAudioSources;
  trackVideoSources = window.trackVideoSources;
  setTrack = function(index,{autoplay=false,resetTime=true,keepTime=false}={}){
    state.usingCustomMusic=false;
    state.usingCustomVideo=false;
    state.trackLoadToken=(state.trackLoadToken||0)+1;
    const loadToken=state.trackLoadToken;
    state.trackIndex=((index%MUSIC_TRACKS.length)+MUSIC_TRACKS.length)%MUSIC_TRACKS.length;
    localStorage.setItem(STORAGE_KEYS.track,String(state.trackIndex));
    const t=chosenTrack();
    const keep=keepTime?Math.max(music.currentTime||0,bgVideo.currentTime||0):0;
    addSources(music,normalAudioSources(t.id),AUDIO_EXT);
    addSources(bgVideo,normalVideoSources(t.id),VIDEO_EXT);
    bgVideo.muted=true;
    if(resetTime){safeSetCurrentTime(music,0);safeSetCurrentTime(bgVideo,0)}
    else if(keepTime){safeSetCurrentTime(music,keep);safeSetCurrentTime(bgVideo,keep)}
    if(elements.trackName){elements.trackName.textContent=t.name;elements.trackName.title=t.name}
    updateTrackButton();
    setMuteButton();
    if(autoplay){
      setTimeout(()=>{
        if(loadToken!==state.trackLoadToken)return;
        resumeMediaPair().catch(()=>setMediaStatus('Audio was blocked by the browser. Click Play once.','error'));
      },80);
    }
  };
  previousTrack=function(autoplay=true){setTrack(state.trackIndex-1,{autoplay,resetTime:true})};
  nextTrack=function(autoplay=true){setTrack(state.trackIndex+1,{autoplay,resetTime:true})};
  resumeMediaPair=function(){
    bgVideo.muted=true;
    return Promise.resolve()
      .then(()=>music.play())
      .then(()=>{syncMediaTimes(music,bgVideo);return bgVideo.play().catch(()=>{})})
      .then(()=>{syncMediaTimes(music,bgVideo);updateTrackButton();setMuteButton();setMediaStatus('')});
  };
  pauseMediaPair=function(){music.pause();bgVideo.pause();updateTrackButton();};
  if(playBtn){
    playBtn.onclick=()=>{music.paused?resumeMediaPair().catch(()=>setMediaStatus('Browser blocked audio. Click Play again after entering the site.','error')):pauseMediaPair()};
  }
  if(elements.nextBtn)elements.nextBtn.onclick=()=>nextTrack(!music.paused);
  if(elements.prevBtn)elements.prevBtn.onclick=()=>previousTrack(!music.paused);
  if(muteBtn)muteBtn.onclick=()=>{music.muted=!music.muted;setMuteButton()};
})();
