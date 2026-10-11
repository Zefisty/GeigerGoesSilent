/* Persistent v10 systems; synchronous, bounded, and separate from presentation. */
(() => {
  const D=window.ZoneRPGZoneData,W=window.ZoneRPGWorld,I=window.ZoneRPGItems;
  const list=(a,valid)=>Array.isArray(a)?[...new Set(a.filter(x=>valid(x)))]:[];
  const number=(n,max=999999)=>Math.max(0,Math.min(max,Number.isFinite(Number(n))?Math.floor(Number(n)):0));
  const fresh=()=>({stage:0,hooks:[],clues:[],choices:{},trust:{},routes:{},pois:[],secrets:{},claims:[],readyAt:0,ending:null,completedAt:null,achievements:[],knowledge:{mutants:{},artifacts:{},locations:{}}});
  function normalize(raw){const s=fresh();if(!raw||typeof raw!=='object')return s;
    s.stage=number(raw.stage,20);s.hooks=list(raw.hooks,x=>[0,1,2].includes(x));s.clues=list(raw.clues,x=>D.steps.some(d=>d.clue===x));
    s.claims=list(raw.claims,x=>typeof x==='string'&&x.length<140).slice(-512);s.pois=list(raw.pois,x=>D.pois.some(p=>p.id===x));s.achievements=list(raw.achievements,x=>D.achievements.some(a=>a.id===x));
    for(const d of D.routes){const r=raw.routes?.[d.id];if(r&&r!==false)s.routes[d.id]={at:number(r.at),expires:d.duration?number(r.expires):null};}
    for(const d of D.secrets)s.secrets[d.id]=number(raw.secrets?.[d.id],3);
    for(let n=0;n<20;n++)if(['a','b','c','d'].includes(raw.choices?.[n]))s.choices[n]=raw.choices[n];
    for(const p of D.npcs)s.trust[p.id]=Math.max(-3,Math.min(3,Number(raw.trust?.[p.id])||0));
    for(const [kind,defs]of Object.entries({mutants:W.enemyTypes,artifacts:I.items,locations:W.locations}))for(const [id,value]of Object.entries(raw.knowledge?.[kind]||{}))if(defs[id]&&(kind!=='artifacts'||defs[id].type==='artifact'))s.knowledge[kind][id]=number(value,3);
    s.readyAt=number(raw.readyAt);s.ending=s.stage===20&&D.endings[raw.ending]?raw.ending:null;s.completedAt=s.ending?number(raw.completedAt):null;
    if(s.stage===20&&!s.ending)s.stage=19;return s;
  }
  const log=(s,text)=>window.ZoneRPGLog.write(s,text);
  function unlock(s,id){const r=D.routes.find(r=>r.id===id);if(!r||s.zoneStory.routes[id])return;s.zoneStory.routes[id]={at:s.worldClock,expires:r.duration?s.worldClock+r.duration:null};for(const loc of [r.from,r.to])if(!s.known.includes(loc))s.known.push(loc);log(s,'Новый маршрут отмечен в КПК: '+r.name+'.');}
  const openRoutes=s=>D.routes.filter(r=>s.zoneStory.routes[r.id]&&(!r.duration||s.zoneStory.routes[r.id].expires>s.worldClock));
  function neighbors(s,id){return [...new Set([...(W.locations[id]?.neighbors||[]),...openRoutes(s).flatMap(r=>r.from===id?[r.to]:!r.oneWay&&r.to===id?[r.from]:[])])];}
  function edges(s){return [...W.mapEdges(),...openRoutes(s).map(r=>({...r,twoWay:!r.oneWay,secret:true}))];}
  function prepared(s){const row=slot=>s.inventory.find(x=>x.instanceId===s.equipment[slot]),effects=['armor','head','artifacts'].flatMap(slot=>slot==='artifacts'?s.equipment.artifacts.map(ref=>s.inventory.find(x=>x.instanceId===ref)):row(slot)).filter(Boolean).map(x=>I.items[x.id].effect||{}),qty=id=>s.inventory.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);
    const weapons=['primary','sidearm'].map(slot=>row(slot)).filter(Boolean),ammoTypes=new Set(weapons.map(x=>I.weapons[I.items[x.id].weaponId]?.ammoType).filter(Boolean));const readyAmmo=s.inventory.filter(x=>ammoTypes.has(x.id)).reduce((n,x)=>n+x.qty,0)+weapons.reduce((n,x)=>n+(s.magazines[x.id]||0),0);
    const requirements=[['Броня ≥15%',effects.reduce((n,x)=>n+(x.protection||0),0)>=.15],['Защита от радиации ≥20%',effects.reduce((n,x)=>n+(x.radResist||0),0)>=.2],['Еда',s.inventory.some(x=>I.items[x.id].type==='food')],['Вода',qty('water')>0],['Антирад',qty('antirad')>0],['Боеприпасы ≥10',readyAmmo>=10]];return requirements.map(([name,ok])=>({name,ok}));}
  const access=s=>s.zoneStory.stage>=17||s.visited.includes('chNpp');
  function gate(s){return s.explorationCount>=5&&s.visited.length>=3;}
  function objective(s){const z=s.zoneStory;if(z.ending)return 'Расследование завершено. Мир помнит передачу архива.';if(!gate(s))return 'Освойся: исследуй Зону и посети три сектора. В эфире иногда слышны чужие позывные.';if(z.hooks.length<3)return ['Проверить эфир на Свалке','Спросить у ремонтного вагона на железной дороге','Проверить закупочные ведомости на Кордоне'][z.hooks.length];return D.steps[z.stage].title+' · '+W.locations[D.steps[z.stage].location].name;}
  function ready(s,loc=s.player.location){const z=s.zoneStory;if(!gate(s)||s.worldClock<z.readyAt||z.ending)return false;if(z.hooks.length<3)return D.hooks[z.hooks.length][0]===loc;const d=D.steps[z.stage];return d.location===loc&&(z.stage!==16||prepared(s).every(x=>x.ok));}
  function priority(s,loc){if(s.zoneStory.ending){const p=D.after.find(p=>p.ending===s.zoneStory.ending);if(p.location===loc&&!s.zoneStory.claims.includes('post:'+p.ending))return W.events.find(e=>e.id===p.id);}if(ready(s,loc)){const id=s.zoneStory.hooks.length<3?'zone_hook_'+s.zoneStory.hooks.length:D.steps[s.zoneStory.stage].eventId;return W.events.find(e=>e.id===id);}return null;}
  function eligible(s,e,loc){const z=s.zoneStory;if(e.zoneHook!=null)return ready(s,loc)&&z.hooks.length===e.zoneHook;
    if(e.zoneStep!=null)return ready(s,loc)&&z.hooks.length===3&&e.zoneStep===z.stage;
    if(e.zoneSecret)return (z.secrets[e.zoneSecret]||0)===e.secretStage&&(s.explores[loc]||0)>=2;
    if(e.zonePost)return z.ending===e.zonePost&&!z.claims.includes('post:'+e.zonePost);
    if(e.zoneEndgame)return Boolean(z.ending);return true;
  }
  function endingAvailable(s,id){if(!D.endings[id])return false;if(id==='channel')return s.zoneStory.choices[15]==='a'&&s.zoneStory.clues.includes('splice')&&s.zoneStory.choices[18]==='a';return true;}
  function npcVisible(s,id){const p=W.people[id];if(id==='zone_npc_dron'&&s.zoneStory.choices[15]==='b')return false;return !p?.zoneNPC||s.zoneStory.stage>=p.visibleFrom;}
  function canApply(s,fx){const z=s.zoneStory;if(fx.claim&&z.claims.includes(fx.claim))return false;if(fx.hook!=null)return z.hooks.length===fx.hook;
    if(fx.step!=null)return z.hooks.length===3&&z.stage===fx.step&&ready(s,s.travelTo||s.player.location)&&(!fx.ending||endingAvailable(s,fx.ending));
    if(fx.secret)return (z.secrets[fx.secret]||0)===fx.secretStage;
    return true;
  }
  function quest(s){const z=s.zoneStory;if(z.hooks.length<3||z.ending)return;const d=D.steps[z.stage];if(!s.quests.active.some(q=>q.id===d.id))s.quests.active.push({id:d.id,step:0,progress:0,acceptedAtLocation:s.player.location});}
  function study(s,kind,id,amount=1){if(!s.zoneStory.knowledge[kind])return;const defs=kind==='mutants'?W.enemyTypes:kind==='artifacts'?I.items:W.locations;if(!defs[id])return;s.zoneStory.knowledge[kind][id]=Math.min(3,(s.zoneStory.knowledge[kind][id]||0)+amount);}
  function apply(s,fx){const z=s.zoneStory;if(fx.claim)z.claims.push(fx.claim);if(fx.hook!=null){z.hooks.push(fx.hook);log(s,'Сохранено свидетельство о группе «Рубеж-6».');quest(s);}
    if(fx.route)unlock(s,fx.route);if(fx.studyLocation)study(s,'locations',fx.studyLocation);
    if(fx.secret){z.secrets[fx.secret]=fx.secretStage+1;log(s,'Заметка: '+D.secrets.find(d=>d.id===fx.secret).title+' · ориентир '+(fx.secretStage+1)+'/3.');}
    if(fx.step!=null){const d=D.steps[fx.step];z.choices[fx.step]=fx.ending?['a','b','c','d'][Object.keys(D.endings).indexOf(fx.ending)]:fx.choice||'a';if(!z.clues.includes(d.clue))z.clues.push(d.clue);z.stage++;s.quests.active=s.quests.active.filter(q=>q.id!==d.id);if(!s.quests.completed.includes(d.id))s.quests.completed.push(d.id);s.statistics.quests++;log(s,'Улика сохранена: '+d.title+'.');
      const point=D.pois.find(p=>p.location===d.location);if(point&&!z.pois.includes(point.id))z.pois.push(point.id);
      if(fx.step===2)unlock(s,'rail_drain');if(fx.step===5)unlock(s,'antenna_path');if(fx.step===7)unlock(s,'forest_service');if(fx.step===12)unlock(s,'swamp_boardwalk');if(fx.step===13)unlock(s,'city_cable');if(fx.step===15&&fx.choice==='a')z.trust.zone_npc_dron=2;
      if(fx.step===4)z.trust[fx.choice==='a'?'zone_npc_gromova':'zone_npc_orlov']=1;
      if(fx.step===8){if(fx.choice==='a')unlock(s,'swamp_boardwalk');if(fx.choice==='b')unlock(s,'city_cable');if(fx.choice==='c')unlock(s,'quiet_tunnel');}if(fx.step===8)z.trust[{a:'zone_npc_gromova',b:'zone_npc_orlov',c:'zone_npc_motyl',d:'zone_npc_serov'}[fx.choice]]=2;
      if(D.chapterBreaks.includes(z.stage))z.readyAt=s.worldClock+3;
      if(fx.ending){z.ending=fx.ending;z.completedAt=s.worldClock;const e=D.endings[fx.ending];s.worldFlags.stationOpen=true;s.worldState.locations.chNpp={...(s.worldState.locations.chNpp||{}),temporaryState:e.state,endsAt:s.worldClock+96};const post=D.after.find(p=>p.ending===fx.ending);s.quests.active.push({id:post.id,step:0,progress:0,acceptedAtLocation:s.player.location});log(s,'История Зоны: '+e.name+'. Последствия доступны в расследовании.');}
      quest(s);
    }
    if(fx.post){const p=D.after.find(p=>p.ending===fx.post);s.quests.active=s.quests.active.filter(q=>q.id!==p.id);if(!s.quests.completed.includes(p.id))s.quests.completed.push(p.id);}
  }
  function onExplore(s){if(s.player.location==='deadVillage'&&(s.attributes.perception||0)>=7&&(s.explores.deadVillage||0)>=5)unlock(s,'village_cellar');const points=D.pois.filter(p=>p.location===s.player.location);if((s.explores[s.player.location]||0)>=3&&points[0]&&!s.zoneStory.pois.includes(points[0].id)){s.zoneStory.pois.push(points[0].id);log(s,'Известное место: '+points[0].name+'.');}
    const secret=D.secrets.find(c=>c.locations[s.zoneStory.secrets[c.id]||0]===s.player.location&&(s.explores[s.player.location]||0)>=4);if(secret&&!s.event)return W.events.find(e=>e.zoneSecret===secret.id&&e.secretStage===(s.zoneStory.secrets[secret.id]||0));return null;
  }
  function tick(s){const z=s.zoneStory;for(const id of s.discoveredEnemies)z.knowledge.mutants[id]=Math.max(1,z.knowledge.mutants[id]||0);for(const id of s.discoveredArtifacts)z.knowledge.artifacts[id]=Math.max(1,z.knowledge.artifacts[id]||0);for(const id of s.visited)z.knowledge.locations[id]=Math.max(1,z.knowledge.locations[id]||0);
    if(s.personalStory.endings.length)unlock(s,'quiet_tunnel');const tests={personal:s.personalStory.endings.length>0,route:Object.keys(z.routes).length>0,legend:Object.values(s.worldState.legendaryEvents).some(e=>e.completed),depth:s.worldState.statistics.maxDepth>=10,zone:Boolean(z.ending),secret:Object.values(z.secrets).some(n=>n===3),north:s.visited.includes('chNpp'),knowledge:Object.values(z.knowledge.mutants).some(n=>n===3),allClues:z.clues.length===20,survivors:z.clues.includes('survivor')&&z.clues.includes('rada')};for(const [id,ok]of Object.entries(tests))if(ok&&!z.achievements.includes(id)){z.achievements.push(id);log(s,'Достижение: '+D.achievements.find(a=>a.id===id).name+'.');}}
  function rumor(s){const z=s.zoneStory;if(z.ending)return {id:'zone_ending_'+z.ending,title:'После передачи архива',text:'У костра обсуждают новый порядок. '+D.endings[z.ending].text};return null;}
  function view(s){const z=s.zoneStory,d=D.steps[z.stage];return {...z,objective:objective(s),chapter:z.hooks.length===3?D.chapters[d?.chapter??6]:'Обрывки эфира',ready:ready(s),cooldown:Math.max(0,z.readyAt-s.worldClock),facts:z.clues.map(id=>{const x=D.steps.find(d=>d.clue===id);return {title:x.title,text:x.clueText};}),places:D.pois.filter(p=>z.pois.includes(p.id)),routes:D.routes.filter(r=>z.routes[r.id]).map(r=>({...r,expired:r.duration&&z.routes[r.id].expires<=s.worldClock})),prepared:prepared(s),endingInfo:z.ending?D.endings[z.ending]:null,achievements:D.achievements.filter(a=>z.achievements.includes(a.id))};}
  window.ZoneRPGZone={fresh,normalize,npcVisible,unlock,openRoutes,neighbors,edges,access,ready,priority,eligible,endingAvailable,canApply,apply,quest,study,onExplore,tick,rumor,view};
})();
