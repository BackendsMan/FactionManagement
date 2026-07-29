const music=document.getElementById('music'),playBtn=document.getElementById('playBtn'),muteBtn=document.getElementById('muteBtn'),bgVideo=document.getElementById('bgVideo');
function currentTrack(){return MUSIC_TRACKS[((state.trackIndex%MUSIC_TRACKS.length)+MUSIC_TRACKS.length)%MUSIC_TRACKS.length]}
function mediaTrackLabel(){return state.usingCustomVideo?"Custom Video":(state.usingCustomMusic?"Custom Music":currentTrack().name)}
function updateTrackButton(){
  const trackInfo=mediaTrackLabel();
  const isPaused=state.usingCustomVideo?bgVideo.paused:music.paused;
  playBtn.textContent=isPaused?'▶':'⏸';
  playBtn.setAttribute('aria-pressed',isPaused?'false':'true');
  playBtn.title=`${isPaused?'Start':'Pause'} ${trackInfo}`;
  if(elements.trackName){
    elements.trackName.textContent=trackInfo;
    elements.trackName.title=trackInfo;
  }
  const homePlaylistSub=document.getElementById('homePlaylistSub');
  if(homePlaylistSub)homePlaylistSub.textContent=trackInfo;
  if(typeof updatePlaylistView==='function')updatePlaylistView();
}
function formatMediaTime(seconds){
  if(!isFinite(seconds)||seconds<0)return'0:00';
  const m=Math.floor(seconds/60),s=Math.floor(seconds%60);
  return`${m}:${String(s).padStart(2,'0')}`;
}
function updatePlaylistProgress(){
  const fill=document.getElementById('playlistProgressFill');
  const cur=document.getElementById('playlistTimeCurrent');
  const tot=document.getElementById('playlistTimeTotal');
  if(!fill&&!cur&&!tot)return;
  const duration=isFinite(music.duration)&&music.duration>0?music.duration:0;
  const pct=duration?Math.min(100,(music.currentTime/duration)*100):0;
  if(fill)fill.style.width=`${pct}%`;
  if(cur)cur.textContent=formatMediaTime(music.currentTime);
  if(tot)tot.textContent=formatMediaTime(duration);
}
music.addEventListener('timeupdate',updatePlaylistProgress,{passive:true});
music.addEventListener('loadedmetadata',updatePlaylistProgress,{passive:true});
function setMuteButton(){
  const muted=state.usingCustomVideo?bgVideo.muted:music.muted;
  muteBtn.textContent=muted?'🔇':'🔊';
  muteBtn.setAttribute('aria-pressed',muted?'true':'false');
  muteBtn.title=muted?'Unmute':'Mute';
}
function setMediaStatus(message,type=''){
  const node=document.getElementById('mediaStatus');
  if(!node)return;
  node.textContent=message||'';
  node.className=`mediaStatus${type?` ${type}`:''}`;
}
function safeSetCurrentTime(media,time){
  if(!media || !isFinite(time) || time<0)return;
  try{media.currentTime=time}catch(e){}
}
function waitForMediaReady(media,timeout=3200){
  if(!media)return Promise.resolve();
  if(media.readyState>=1)return Promise.resolve();
  return new Promise(resolve=>{
    let doneOnce=false;
    const done=()=>{
      if(doneOnce)return;
      doneOnce=true;
      clearTimeout(timer);
      media.removeEventListener('loadedmetadata',done);
      media.removeEventListener('canplay',done);
      media.removeEventListener('loadeddata',done);
      media.removeEventListener('error',done);
      resolve();
    };
    const timer=setTimeout(done,timeout);
    media.addEventListener('loadedmetadata',done,{once:true});
    media.addEventListener('canplay',done,{once:true});
    media.addEventListener('loadeddata',done,{once:true});
    media.addEventListener('error',done,{once:true});
  });
}
function syncMediaTimes(source,target){
  if(!source || !target || !isFinite(source.currentTime))return;
  const targetDuration=isFinite(target.duration)&&target.duration>0?target.duration:null;
  const desired=targetDuration?source.currentTime%targetDuration:source.currentTime;
  if(Math.abs((target.currentTime||0)-desired)>.25)safeSetCurrentTime(target,desired);
}
function forceVideoResync(attempts=8,delay=250){
  let remaining=attempts;
  const run=()=>{
    syncBgVideoToMusic();
    if(music && !music.paused)keepVideoPlaying();
    remaining-=1;
    if(remaining>0)window.setTimeout(run,delay);
  };
  run();
}
function pauseMediaPair(){
  music.pause();
  bgVideo.pause();
  updateTrackButton();
}
function snapshotPlaylistState(){
  return {
    trackIndex:state.trackIndex,
    audioSrc:music.currentSrc,
    videoSrc:bgVideo.currentSrc,
    audioTime:music.currentTime||0,
    videoTime:bgVideo.currentTime||0,
    musicMuted:music.muted,
    videoMuted:bgVideo.muted,
    wasPlaying:!music.paused
  };
}
function isSameOriginMediaUrl(url){
  try{
    const resolved=new URL(url,window.location.href);
    return resolved.origin===window.location.origin;
  }catch(e){
    return false;
  }
}
async function preflightCustomVideo(url){
  if(!isSameOriginMediaUrl(url))return {ok:true};
  return new Promise(resolve=>{
    try{
      const request=new XMLHttpRequest();
      request.open('HEAD',url,true);
      request.onreadystatechange=()=>{
        if(request.readyState!==4)return;
        resolve({ok:request.status>=200&&request.status<400,status:request.status});
      };
      request.onerror=()=>resolve({ok:false,status:request.status||0});
      request.send();
    }catch(error){
      resolve({ok:false,error});
    }
  });
}
function restorePlaylistSnapshot(){
  const snapshot=state.playlistSnapshot;
  state.usingCustomVideo=false;
  state.customVideoUrl='';
  state.customVideoToken+=1;
  bgVideo.muted=true;
  if(!snapshot){
    setTrack(state.trackIndex,{autoplay:false,resetTime:true});
    updateTrackButton();
    setMuteButton();
    return Promise.resolve();
  }
  music.muted=snapshot.musicMuted;
  bgVideo.muted=true;
  setTrack(snapshot.trackIndex,{autoplay:snapshot.wasPlaying,resetTime:true});
  if(!snapshot.wasPlaying){
    pauseMediaPair();
    setMuteButton();
  }
  state.playlistSnapshot=null;
  return Promise.resolve();
}
async function activateCustomVideo(url){
  const trimmed=url.trim();
  if(!trimmed)return Promise.resolve(false);
  const preflight=await preflightCustomVideo(trimmed);
  if(!preflight.ok){
    setMediaStatus('Custom video failed to load. The playlist is still playing.','error');
    return false;
  }
  const previousSnapshot=state.playlistSnapshot||snapshotPlaylistState();
  const previousUrl=state.customVideoUrl;
  const shouldResume=state.usingCustomVideo?!bgVideo.paused:!music.paused;
  const resumeTime=state.usingCustomVideo?(bgVideo.currentTime||0):Math.max(music.currentTime||0,bgVideo.currentTime||0);
  const source=bgVideo.querySelector('source');
  if(!source)return Promise.resolve(false);
  const activationToken=state.customVideoToken+1;
  state.customVideoToken=activationToken;
  state.playlistSnapshot=previousSnapshot;
  state.usingCustomVideo=true;
  state.customVideoUrl=trimmed;
  pauseMediaPair();
  safeSetCurrentTime(music,previousSnapshot.audioTime);
  source.src=trimmed;
  bgVideo.muted=false;
  bgVideo.load();
  setMediaStatus('Loading custom video...');
  return new Promise(resolve=>{
    let settled=false;
    let failTimer=0;
    const cleanup=()=>{
      if(failTimer)clearTimeout(failTimer);
      bgVideo.removeEventListener('loadedmetadata',onLoaded);
      bgVideo.removeEventListener('error',onError);
    };
    const isStale=()=>activationToken!==state.customVideoToken;
    const succeed=()=>{
      if(settled||isStale())return;
      settled=true;
      cleanup();
      safeSetCurrentTime(bgVideo,resumeTime);
      const playAttempt=shouldResume?bgVideo.play():Promise.resolve();
      Promise.resolve(playAttempt).then(()=>{
        if(!shouldResume)bgVideo.pause();
        updateTrackButton();
        setMuteButton();
        setMediaStatus('Custom video active. Clear the URL to return to the playlist.','success');
        resolve(true);
      }).catch(()=>{
        if(shouldResume){
          setMediaStatus('Custom video loaded, but autoplay was blocked. Press Start Music to play it.','error');
        }
        updateTrackButton();
        setMuteButton();
        resolve(true);
      });
    };
    const onLoaded=()=>{
      if(isStale())return;
      const hasVideo=bgVideo.videoWidth>0 || bgVideo.readyState>=1;
      if(!hasVideo){onError();return}
      succeed();
    };
    const onError=()=>{
      if(settled||isStale())return;
      settled=true;
      cleanup();
      source.src=previousUrl || (previousSnapshot.videoSrc || currentTrack().mp4);
      bgVideo.load();
      state.usingCustomVideo=false;
      state.customVideoUrl=previousUrl;
      state.customVideoToken+=1;
      restorePlaylistSnapshot().finally(()=>{
        setMediaStatus('Custom video failed to load. The playlist is still playing.','error');
        resolve(false);
      });
    };
    bgVideo.addEventListener('loadedmetadata',onLoaded,{once:true});
    bgVideo.addEventListener('error',onError,{once:true});
    failTimer=window.setTimeout(onError,4500);
  });
}
function clearCustomVideoMode(){
  if(!state.usingCustomVideo){
    state.customVideoUrl='';
    setMediaStatus('');
    return Promise.resolve();
  }
  return restorePlaylistSnapshot().finally(()=>{
    setMediaStatus('Returned to the playlist video.','success');
  });
}
function keepVideoPlaying(){
  if(bgVideo && bgVideo.paused) bgVideo.play().catch(()=>{});
}
function startMediaSyncLoop(){
  if(state.mediaSyncTimer)return;
  state.mediaSyncTimer=setInterval(()=>{
    if(music.paused)return;
    keepVideoPlaying();
    syncMediaTimes(music,bgVideo);
  },500);
}
function resumeMediaPair(){
  if(state.usingCustomVideo){
    return bgVideo.play().then(()=>{
      updateTrackButton();
    });
  }
  // Do not let a missing/broken MP4 block the MP3. Audio is the master.
  return waitForMediaReady(music).then(()=>{
    syncMediaTimes(music,bgVideo);
    keepVideoPlaying();
    return music.play().then(()=>{
      keepVideoPlaying();
      syncMediaTimes(music,bgVideo);
      updateTrackButton();
    });
  });
}
function normalizeMediaUrl(url){
  if(!url)return '';
  return String(url).replace(/^\.\//,'');
}
function setDirectMediaSource(media,url,type){
  media.innerHTML='';
  media.removeAttribute('src');
  const source=document.createElement('source');
  source.src=normalizeMediaUrl(url);
  source.type=type;
  media.appendChild(source);
  media.dataset.activeSrc=source.src;
}
function replaceMediaSources(media,urls,type){
  if(!media || !Array.isArray(urls) || !urls.length)return;
  const clean=[...new Set(urls.map(normalizeMediaUrl).filter(Boolean))];
  media.dataset.fallbackSources=JSON.stringify(clean);
  media.dataset.fallbackIndex='0';
  setDirectMediaSource(media,clean[0],type);
}
function tryNextMediaSource(media,type,label){
  if(!media || !media.dataset.fallbackSources)return false;
  let sources=[];
  try{sources=JSON.parse(media.dataset.fallbackSources||'[]')}catch(e){sources=[]}
  let idx=Number(media.dataset.fallbackIndex||0)+1;
  if(!sources.length || idx>=sources.length)return false;
  media.dataset.fallbackIndex=String(idx);
  setDirectMediaSource(media,sources[idx],type);
  media.load();
  setMediaStatus(`Trying ${label} source ${idx+1}/${sources.length}...`,'error');
  return true;
}
function trackAudioSources(trackInfo){return trackInfo.mp3Sources || [trackInfo.mp3]}
function trackVideoSources(trackInfo){return trackInfo.mp4Sources || [trackInfo.mp4]}
function setTrack(index,{autoplay=false,resetTime=true,keepTime=false}={}){
  if(state.usingCustomMusic || state.usingCustomVideo)return;
  const loadToken=state.trackLoadToken+1;
  state.trackLoadToken=loadToken;
  state.trackIndex=((index%MUSIC_TRACKS.length)+MUSIC_TRACKS.length)%MUSIC_TRACKS.length;
  localStorage.setItem(STORAGE_KEYS.track,String(state.trackIndex));
  const trackInfo=currentTrack();
  const preservedTime=keepTime?Math.max(music.currentTime||0,bgVideo.currentTime||0):0;
  replaceMediaSources(music,trackAudioSources(trackInfo),'audio/mpeg');
  replaceMediaSources(bgVideo,trackVideoSources(trackInfo),'video/mp4');
  music.load();
  bgVideo.load();
  if(resetTime){safeSetCurrentTime(music,0);safeSetCurrentTime(bgVideo,0)}
  else if(keepTime){safeSetCurrentTime(music,preservedTime);safeSetCurrentTime(bgVideo,preservedTime)}
  updateTrackButton();
  if(autoplay){
    waitForMediaReady(music).then(()=>{
      if(loadToken!==state.trackLoadToken)return;
      return resumeMediaPair();
    }).catch(()=>{})
  }
}
function previousTrack(autoplay=true){setTrack(state.trackIndex-1,{autoplay,resetTime:true})}
function nextTrack(autoplay=true){setTrack(state.trackIndex+1,{autoplay,resetTime:true})}
function safeVideoTime(){
  return (bgVideo && isFinite(bgVideo.currentTime)) ? bgVideo.currentTime : 0;
}
function syncMusicToBgVideo(){
  if(!bgVideo || !music || !isFinite(safeVideoTime())) return;
  syncMediaTimes(bgVideo,music);
}
function syncBgVideoToMusic(){
  if(!bgVideo || !music || !isFinite(music.currentTime)) return;
  syncMediaTimes(music,bgVideo);
}
music.addEventListener('play',()=>{keepVideoPlaying();syncBgVideoToMusic();updateTrackButton()});
music.addEventListener('pause',()=>{if(!bgVideo.paused)bgVideo.pause();updateTrackButton()});
music.addEventListener('seeking',syncBgVideoToMusic);
music.addEventListener('seeked',syncBgVideoToMusic);
music.addEventListener('timeupdate',()=>{if(!music.paused)syncBgVideoToMusic()});
bgVideo.addEventListener('play',()=>{if(state.usingCustomVideo){updateTrackButton();return}if(music.paused&&typeof appReady!=='undefined'&&appReady)syncBgVideoToMusic()});
bgVideo.addEventListener('seeking',()=>{if(music.paused)syncMusicToBgVideo()});
bgVideo.addEventListener('pause',()=>{if(state.usingCustomVideo)updateTrackButton()});
bgVideo.addEventListener('ended',()=>{if(state.usingCustomVideo){safeSetCurrentTime(bgVideo,0);bgVideo.play().catch(()=>{});return}if(state.usingCustomMusic){safeSetCurrentTime(bgVideo,0);if(!music.paused)keepVideoPlaying();return}syncBgVideoToMusic();keepVideoPlaying()});
music.addEventListener('error',()=>{if(state.usingCustomMusic||state.usingCustomVideo)return;if(tryNextMediaSource(music,'audio/mpeg','MP3'))return;setMediaStatus('Could not load this MP3 on GitHub. Check mp3 filename/case and that the file is real audio: '+currentTrack().name+'.','error')});
bgVideo.addEventListener('error',()=>{if(state.usingCustomVideo)return;if(tryNextMediaSource(bgVideo,'video/mp4','MP4'))return;setMediaStatus('MP4 background missing/broken for '+currentTrack().name+'. MP3 audio will keep playing. Check root Music#.mp4 filename/case.','error');if(!music.paused)updateTrackButton()});
music.addEventListener('ended',()=>{if(state.usingCustomMusic){safeSetCurrentTime(music,0);resumeMediaPair().catch(()=>{});return}nextTrack(true)});
startMediaSyncLoop();
playBtn.onclick=()=>{
  if(state.usingCustomVideo){
    if(bgVideo.paused)bgVideo.play().then(()=>updateTrackButton()).catch(()=>alert('Click the intro screen or allow video audio, then press Start Music.'));
    else{bgVideo.pause();updateTrackButton();}
  }else if(music.paused){
    resumeMediaPair().catch(()=>alert('Click the intro screen or allow audio, then press Start Music.'))
  }else{
    pauseMediaPair();
  }
};
elements.nextBtn.onclick=()=>{
  if(state.usingCustomVideo){setMediaStatus('Custom video is active. Clear the URL to return to the playlist.','error');return}
  nextTrack(!music.paused)
};
elements.prevBtn.onclick=()=>{
  if(state.usingCustomVideo){setMediaStatus('Custom video is active. Exit custom video before changing playlist tracks.','error');return}
  previousTrack(!music.paused)
};
muteBtn.onclick=()=>{
  if(state.usingCustomVideo){
    bgVideo.muted=!bgVideo.muted;
  }else{
    music.muted=!music.muted;
    if(!music.muted)syncMusicToBgVideo();
  }
  setMuteButton();
};
