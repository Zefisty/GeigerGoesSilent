(() => {
  const C=window.ZoneRPGMusicConfig,failed=new Set();let current=null,outgoing=null,key='',volume=.35,on=true,unlocked=false,frame=null;
  const state=(mode,c)=>c.combat?'combat':mode==='menu'||mode==='background'?'menu':c.climax?'climax':c.legendary?'legendary':c.danger>=7?'danger':c.night?'night':c.expedition?'exploration':'safe';
  const valid=path=>typeof path==='string'&&/^assets\/music\/[a-zA-Z0-9_./ -]+\.(ogg|mp3|wav|m4a)$/i.test(path)&&!path.includes('..');
  function stop(audio){if(audio){audio.pause();audio.removeAttribute?.('src');audio.load?.();}}
  function cancel(){if(frame!=null&&window.cancelAnimationFrame)window.cancelAnimationFrame(frame);frame=null;}
  function fade(next,old){cancel();const duration=Math.max(0,Math.min(1000,C.fadeMs||0));if(!window.requestAnimationFrame||!duration){next.volume=volume;stop(old);outgoing=null;return;}let start=null;const oldVolume=old?.volume||0;
    const step=t=>{if(start==null)start=t;const p=Math.min(1,(t-start)/duration);next.volume=volume*p;if(old)old.volume=oldVolume*(1-p);if(p<1)frame=window.requestAnimationFrame(step);else{stop(old);outgoing=null;frame=null;}};frame=window.requestAnimationFrame(step);
  }
  function fallback(){cancel();stop(current);stop(outgoing);current=outgoing=null;window.ZoneRPGAudio?.refresh();}
  function play(){if(!unlocked||!on||!window.Audio)return;const paths=(C.tracks[key]||[]).filter(p=>valid(p)&&!failed.has(p));if(!paths.length){fallback();return;}const path=paths[0];if(current?.getAttribute?.('src')===path){current.volume=volume;return;}cancel();stop(outgoing);outgoing=current;const audio=new window.Audio(path);audio.loop=true;audio.volume=0;current=audio;window.ZoneRPGAudio?.refresh();audio.onerror=()=>{if(current!==audio)return;failed.add(path);fallback();};const result=audio.play();if(result?.then)result.then(()=>{if(current===audio)fade(audio,outgoing);}).catch(()=>{if(current===audio)fallback();});else fade(audio,outgoing);}
  function sync(mode,settings,c={}){const next=state(mode,c),nextVolume=Math.max(0,Math.min(1,Number(settings?.volume??.35))),nextOn=settings?.music!==false,changed=next!==key||on!==nextOn||nextVolume!==volume;key=next;on=nextOn;volume=nextVolume;if(!on){fallback();return;}if(changed)play();}
  window.ZoneRPGMusic={sync,unlock(){unlocked=true;play();},usesLocal:()=>Boolean(current&&on),state,valid};
  window.addEventListener('pagehide',()=>{cancel();stop(current);stop(outgoing);current=outgoing=null;});
})();
