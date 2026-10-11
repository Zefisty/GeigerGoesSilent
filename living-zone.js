/* Small, synchronous world model. Time advances only through existing game actions. */
(() => {
  const W=window.ZoneRPGWorld,D=window.ZoneRPGLivingData;
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
  const ids=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&x.length<180))]:[];
  const site=loc=>D.sites.find(x=>x.loc===loc);
  const event=id=>W.events.find(e=>e.id===id);
  const incident=id=>W.worldEvents.find(e=>e.id===id);
  const fresh=loc=>({seed:Math.floor(Math.random()*1000000),locations:{[loc]:{visits:1}},npcMemory:{},claims:[],cooldowns:{},legendaryEvents:{},chains:{},observations:{},news:[],renown:0,visitSerial:1,visitActions:[],statistics:{expeditions:0,encounters:0,battles:0,maxDepth:0}});
  function normalize(raw,s){
    const out=fresh(s.player.location);
    out.seed=Math.floor(clamp(raw?.seed,0,1000000));out.renown=Math.floor(clamp(raw?.renown));out.visitSerial=Math.floor(clamp(raw?.visitSerial,1,999999))||1;
    out.claims=ids(raw?.claims).slice(-4096);out.visitActions=ids(raw?.visitActions).slice(-50);
    for(const loc of s.visited)out.locations[loc]={visits:1};
    for(const [loc,r] of Object.entries(raw?.locations||{}))if(W.locations[loc]&&r&&typeof r==='object'){
      out.locations[loc]={visits:Math.floor(clamp(r.visits,0,999999)),...(site(loc)&&['help','betray'].includes(r.decision)?{decision:r.decision,decidedAt:clamp(r.decidedAt,0,999999),decisionVisit:clamp(r.decisionVisit,0,999999),state:D.states[r.state]?r.state:'calm',callbackDone:r.callbackDone===true}:{}),...(D.states[r.temporaryState]&&Number.isFinite(r.endsAt)?{temporaryState:r.temporaryState,endsAt:clamp(r.endsAt,0,999999)}:{})};
    }
    for(const [id,m] of Object.entries(raw?.npcMemory||{}))if(W.people[id]&&m&&typeof m==='object')out.npcMemory[id]={trust:clamp(m.trust??0,-3,3),helped:m.helped===true,betrayed:m.betrayed===true,requestCompleted:m.requestCompleted===true,lastSeen:clamp(m.lastSeen,0,999999)};
    for(const [id,t] of Object.entries(raw?.cooldowns||{}))if(event(id)&&Number.isFinite(t))out.cooldowns[id]=clamp(t,0,999999);
    for(const [id,r] of Object.entries(raw?.legendaryEvents||{}))if(event(id)?.legendary&&r&&typeof r==='object')out.legendaryEvents[id]={completed:r.completed===true,time:clamp(r.time,0,999999),text:typeof r.text==='string'?r.text.slice(0,700):'Место отмечено в КПК.'};
    for(const chain of D.chains){const r=raw?.chains?.[chain.id];if(r)out.chains[chain.id]={step:Math.floor(clamp(r.step,0,3)),changedAt:clamp(r.changedAt,0,999999)};}
    for(const [loc,o] of Object.entries(raw?.observations||{}))if(W.locations[loc]&&o&&typeof o==='object')out.observations[loc]={state:D.states[o.state]?o.state:'calm',time:clamp(o.time,0,999999),source:['visit','radio','rumor'].includes(o.source)?o.source:'visit'};
    out.news=Array.isArray(raw?.news)?raw.news.filter(x=>x&&typeof x.text==='string'&&typeof x.title==='string').slice(-24).map(x=>({title:x.title.slice(0,150),text:x.text.slice(0,700),time:clamp(x.time,0,999999)})):[];
    for(const k of Object.keys(out.statistics))out.statistics[k]=Math.floor(clamp(raw?.statistics?.[k],0,999999));
    return out;
  }
  function active(s,loc){return s.worldEvents.filter(a=>a.endsAt>s.worldClock&&incident(a.id)?.locations.includes(loc));}
  function stateAt(s,loc){const r=s.worldState.locations[loc];return active(s,loc).map(a=>incident(a.id)).find(d=>d.state)?.state||(r?.endsAt>s.worldClock?r.temporaryState:null)||r?.state||'calm';}
  function modifier(s,key,loc=s.player.location){
    const r=s.worldState.locations[loc],own=D.states[(r?.endsAt>s.worldClock?r.temporaryState:null)||r?.state||'calm'].modifiers;
    const factors=['mutants','bandits','military','npc','anomaly'].includes(key);
    let value=factors?(own[key]??1):(own[key]||0);
    for(const a of active(s,loc)){const d=incident(a.id),n=d.modifiers?.[key]??d[key];if(n!=null)value=factors?value*n:value+n;}
    if(key==='danger'&&stateAt(s,loc)==='military')value+=(s.reputation.military||0)<0?.5:-.25;
    return factors?clamp(value,.3,3):clamp(value,key==='discount'?-0.2:key==='danger'?-2:0,key==='discount'?.2:key==='danger'?3:key==='medicalPrice'?.25:3);
  }
  function remember(s,id,help){if(!W.people[id])return;const m=s.worldState.npcMemory[id]||{trust:0};s.worldState.npcMemory[id]={...m,trust:clamp(m.trust+(help?1:-1),-3,3),helped:m.helped||help,betrayed:m.betrayed||!help,lastSeen:s.worldClock};}
  function renown(s,n,key){if(!key||s.worldState.claims.includes('renown:'+key))return;s.worldState.claims.push('renown:'+key);s.worldState.renown=clamp(s.worldState.renown+n);}
  function onQuest(s,q){renown(s,q.personalStory?3:2,'quest:'+q.id);if(W.people[q.giver]&&!W.people[q.giver].personalStory){remember(s,q.giver,true);s.worldState.npcMemory[q.giver].requestCompleted=true;}}
  function renownName(n){return n<10?'Незнакомец':n<25?'Местный':n<45?'Бывалый':n<70?'Известный сталкер':n<90?'Ветеран Зоны':'Легенда';}
  function note(s,title,text){s.worldState.news.push({title,text,time:s.worldClock});s.worldState.news=s.worldState.news.slice(-24);}
  function observe(s,loc,source='visit'){if(!W.locations[loc])return;s.worldState.observations[loc]={state:stateAt(s,loc),time:s.worldClock,source};}
  function arrive(s,loc){const w=s.worldState;w.visitSerial++;w.visitActions=[];const r=w.locations[loc]||{visits:0};r.visits++;w.locations[loc]=r;observe(s,loc);}
  function beginIncident(s,d){
    s.worldEvents=s.worldEvents.filter(a=>a.id!==d.id);s.worldEvents.push({id:d.id,endsAt:s.worldClock+d.duration});s.worldEvents=s.worldEvents.slice(-5);
    const heard=d.locations.filter(loc=>s.known.includes(loc));
    if(heard.length){heard.forEach(loc=>observe(s,loc,'radio'));note(s,d.name,d.startMessage||d.description);s.log.push('[РАДИО] '+d.name+': '+d.description);s.log=s.log.slice(-10);}
  }
  function tick(s,before){
    const expired=s.worldEvents.filter(a=>a.endsAt<=s.worldClock);s.worldEvents=s.worldEvents.filter(a=>a.endsAt>s.worldClock);
    for(const a of expired){const d=incident(a.id);if(d&&d.locations.some(loc=>s.worldState.observations[loc])){note(s,d.name+' · завершено',d.endResult||'Временная сводка снята с канала.');for(const loc of d.locations)if(s.worldState.observations[loc])observe(s,loc,'radio');}}
    for(const r of Object.values(s.worldState.locations))if(r.endsAt<=s.worldClock){delete r.temporaryState;delete r.endsAt;}
    if(Math.floor(before/12)!==Math.floor(s.worldClock/12))beginIncident(s,W.worldEvents[Math.floor(Math.random()*W.worldEvents.length)]);
  }
  const depth=d=>({tier:d<3?0:d<5?1:d<8?2:d<11?3:4,name:d<3?'Ближние тропы':d<5?'Дальний обход':d<8?'Редкие следы':d<11?'Опасная глубина':'За привычными ориентирами',pressure:Math.min(1.2,Math.max(0,d-4)*.12),rareFactor:1+Math.min(12,Math.max(0,d-2))*.1});
  function weather(s){return ['Тихо','Ветер','Туман','Дождь','Гроза'][(Math.floor(s.worldClock/8)+s.worldState.seed)%5];}
  function eligible(e,s,loc){
    const w=s.worldState;
    if(e.livingSite&&w.locations[e.livingSite]?.decision)return false;
    if(e.callback){const r=w.locations[e.callback.location];if(!r||r.decision!==e.callback.decision||r.callbackDone||s.worldClock<r.decidedAt+3||r.visits<=r.decisionVisit)return false;}
    if(e.requiresIncident&&!active(s,loc).some(a=>a.id===e.requiresIncident))return false;
    if(e.requiresRenown&&w.renown<e.requiresRenown)return false;
    if(e.secret){const c=w.chains[e.secret.id];if((c?.step||0)!==e.secret.stage||c&&s.worldClock<c.changedAt+2)return false;}
    if(e.legendary&&w.legendaryEvents[e.id]?.completed)return false;
    if(e.cooldownHours&&w.cooldowns[e.id]!=null&&s.worldClock<w.cooldowns[e.id]+e.cooldownHours)return false;
    return true;
  }
  function weight(e,s,loc,d){
    const choices=(e.stages||[{choices:e.choices}]).flatMap(x=>x.choices||[]),enemies=choices.filter(x=>x.combat).map(x=>W.enemyTypes[x.enemyId||x.combat]),mutant=enemies.some(x=>x?.faction==='mutants')||choices.some(x=>x.combat==='autoMutant'),human=enemies.some(x=>x?.faction==='bandits'||x?.faction==='mercs'),military=enemies.some(x=>x?.faction==='military');
    let n=mutant?modifier(s,'mutants',loc):human?modifier(s,'bandits',loc):military?modifier(s,'military',loc):e.kind==='npc'||/Встреча|Костёр|Сталкер/.test(e.category)?modifier(s,'npc',loc):1;
    if(choices.some(x=>x.effects?.artifactRoll))n*=modifier(s,'anomaly',loc);
    if(e.rarity==='rare'||e.rarity==='very_rare'||e.rarity==='legendary')n*=depth(d).rareFactor;
    if(mutant&&s.player.time>=21||mutant&&s.player.time<5)n*=1.1;
    if(mutant&&weather(s)==='Туман')n*=1.1;
    if(enemies.length&&s.expedition.flags.loudBattle)n*=1.1;
    return clamp(n,.25,3.5);
  }
  function priority(s,loc){return W.events.find(e=>e.callback&&e.locations.includes(loc)&&eligible(e,s,loc))||W.events.find(e=>e.secret?.stage>0&&e.locations.includes(loc)&&eligible(e,s,loc));}
  function available(s,loc){return priority(s,loc)||W.events.find(e=>e.livingSite===loc&&eligible(e,s,loc));}
  function canApply(s,fx){return (!fx?.claim||!s.worldState.claims.includes(fx.claim))&&(!fx?.visit||!s.worldState.visitActions.includes(fx.visit));}
  function apply(s,fx){
    if(!fx)return;
    const w=s.worldState;if(fx.claim)w.claims.push(fx.claim);
    if(fx.decision){const {location,value,npc,state}=fx.decision,r=w.locations[location]||{visits:1};Object.assign(r,{decision:value,decidedAt:s.worldClock,decisionVisit:r.visits,state,callbackDone:false});w.locations[location]=r;remember(s,npc,value==='help');note(s,site(location).title,value==='help'?'Ты помог тем, кто остаётся в секторе. Ответ придёт после нового посещения.':'Ты выбрал личную выгоду или отказался помогать. В секторе остались последствия.');observe(s,location);}
    if(fx.callback)w.locations[fx.callback].callbackDone=true;
    if(fx.legend){w.legendaryEvents[fx.legend.id]={completed:true,time:s.worldClock,text:fx.legend.text};note(s,event(fx.legend.id).category,fx.legend.text);}
    if(fx.chain){const c=D.chains.find(c=>c.id===fx.chain.id);w.chains[c.id]={step:fx.chain.stage+1,changedAt:s.worldClock};note(s,c.name,c.texts[fx.chain.stage]);if(c.locations[fx.chain.stage+1]&&!s.known.includes(c.locations[fx.chain.stage+1]))s.known.push(c.locations[fx.chain.stage+1]);}
    if(fx.observe)observe(s,s.expedition.active?s.expedition.originLocationId:s.player.location,'rumor');
    if(fx.npc)remember(s,fx.npc,fx.help!==false);
    if(fx.visit)w.visitActions.push(fx.visit);
    if(fx.renown)renown(s,fx.renown,fx.claim);
  }
  function onEncounter(s,e,origin,continuation){if(e.cooldownHours)s.worldState.cooldowns[e.id]=s.worldClock;if(origin==='explore'&&!continuation)s.worldState.statistics.encounters++;}
  function onExplore(s){s.worldState.statistics.maxDepth=Math.max(s.worldState.statistics.maxDepth,s.expedition.depth);observe(s,s.expedition.originLocationId);}
  function onReturn(s){s.worldState.statistics.expeditions++;for(const [d,n] of [[5,2],[10,3],[15,4],[25,5]])if(s.expedition.depth>=d)renown(s,n,'depth:'+d);}
  function memoryText(s,id){const m=s.worldState.npcMemory[id];return m?.betrayed?'Собеседник помнит твой отказ или чужой потерянный груз.':m?.requestCompleted?'Собеседник помнит выполненное тобой поручение.':m?.helped?'Собеседник помнит твою помощь.':s.worldState.renown>=25?'Твой позывной знаком собеседнику по общей частоте.':'';}
  function npcChoices(s,id){
    if(!D.npcContacts.includes(id))return [];
    const m=s.worldState.npcMemory[id],used=s.worldState.visitActions.includes(id),known=m?.helped&&m.trust>0;
    if(used)return [{label:'Вспомнить текущий разговор',finish:true,resultText:'Вы уже обсудили обстановку в этом посещении. Вернись после дороги в другой сектор.'}];
    return [{label:'Обсудить перемены в секторе',finish:true,effects:{living:{visit:id,observe:true}},resultText:'Собеседник сверил местную частоту. Информация в КПК обновлена.'},...(known?[{label:'Попросить совет старого знакомого',finish:true,effects:{living:{visit:id,observe:true},stamina:2},resultText:'Собеседник помнит помощь и показывает короткий обход. Это совет, а не бесконечная награда.'}]:[{label:'Предложить помощь с ближайшим дозором',when:{items:{bandage:1}},finish:true,effects:{itemCost:{bandage:1},living:{visit:id,npc:id,help:true}},resultText:'Твою помощь запомнили. Она пригодится в следующих разговорах.'}]),{label:s.worldState.renown>=25?'Спросить, что говорят о твоём позывном':'Назвать свой позывной',finish:true,effects:{living:{visit:id,observe:true}},resultText:s.worldState.renown>=45?'Позывной уже узнают. Это помогает разговорам, но за твоими выходами могут следить чужие группы.':s.worldState.renown>=25?'Твой позывной знают по прошлым делам. Отношение группировки всё равно зависит от её собственной репутации.':'Здесь тебя ещё узнают по конкретным делам. Новая известность не выдаётся за представление.'}];
  }
  function caravanAt(s){const e=s.worldEvents.find(a=>a.endsAt>s.worldClock&&incident(a.id)?.state==='caravan');if(!e)return null;const locations=incident(e.id).locations.filter(l=>W.people.v9_caravan.possibleLocations.includes(l));return locations.length?locations[(Math.floor(s.worldClock/2)+s.worldState.seed)%locations.length]:null;}
  function peopleAt(s,loc){const list=[...W.locations[loc].npcs];if(caravanAt(s)===loc)list.push('v9_caravan');return list.filter(id=>W.people[id]?.personalStory||id==='npc_threeLeggedPigBandit'||s.quests.active.some(q=>W.quests.find(d=>d.id===q.id)?.giver===id)||!W.people[id]?.mobileOrdinary||modifier(s,'npc',loc)>=1);}
  function decorate(s,e){
    const loc=s.expedition.active?s.expedition.originLocationId:s.travelTo||s.player.location;
    if(!e.legendary&&!e.secret){const status=stateAt(s,loc);if(status!=='calm')e.text+=' Обстановка: '+D.states[status].name.toLocaleLowerCase('ru-RU')+'.';if(s.player.time>=21||s.player.time<5)e.text+=' На тропе ночь; ориентиры приходится сверять ближе.';if(weather(s)!=='Тихо')e.text+=' '+weather(s)+': звук и видимость меняются.';}
    const id=e.id.startsWith('npc_story_')?e.id.slice(10):null;
    if(id){e.text+=' '+memoryText(s,id);e.choices.push(...npcChoices(s,id));}
    if(e.personalStory&&active(s,loc).length){const bg=s.backgroundId;e.text+=' '+({hunter:'Свежие следы нужно сверять с текущей миграцией.',medic:'Сначала проверь местные запасы перевязок.',soldier:'Старые позывные не заменяют сегодняшних приказов.',technician:'Нестабильные датчики требуют повторного замера.',scavenger:'После чужих выходов старые тайники могут опустеть.',rookie:'Спроси знакомых, что изменилось с прошлого выхода.'}[bg]);}
  }
  function rumor(s,loc){observe(s,loc,'rumor');const st=stateAt(s,loc),r=s.worldState.locations[loc];return st==='calm'&&!r?.decision?'':' Текущая сводка: '+W.locations[loc].name+' — '+D.states[st].name.toLocaleLowerCase('ru-RU')+(r?.decision?' Здесь помнят твоё прошлое участие.':'.');}
  function view(s){
    const w=s.worldState,loc=s.player.location,locations=Object.fromEntries(Object.entries(W.locations).map(([id,d])=>[id,{...d,npcs:peopleAt(s,id),...(w.locations[id]?.decision?{description:d.description+' '+(w.locations[id].callbackDone?(w.locations[id].decision==='help'?site(id).returnGood:site(id).returnBad):w.locations[id].decision==='help'?site(id).helpText:'В секторе помнят твой выбор. Ответ ещё придёт после следующего возвращения.')}:{}),danger:clamp(d.danger+modifier(s,'danger',id),0,10),mutants:clamp(d.mutants*modifier(s,'mutants',id)),bandits:clamp(d.bandits*modifier(s,'bandits',id))}]));
    return {locations,renown:w.renown,renownName:renownName(w.renown),weather:weather(s),depth:depth(s.expedition.depth),state:D.states[stateAt(s,loc)].name,action:available(s,loc)?.category||null,information:Object.entries(w.observations).map(([id,o])=>({id,name:W.locations[id].name,state:D.states[o.state].name,time:o.time,source:o.source})),activeEvents:s.worldEvents.filter(a=>incident(a.id)?.locations.some(id=>w.observations[id])).map(a=>({...a,title:incident(a.id).name,description:incident(a.id).description})),legends:Object.entries(w.legendaryEvents).map(([id,r])=>({title:event(id).category,...r})),chains:D.chains.filter(c=>w.chains[c.id]?.step>0).map(c=>({name:c.name,step:w.chains[c.id].step,clue:c.texts[w.chains[c.id].step-1]})),statistics:{...w.statistics,days:Math.floor(s.worldClock/24),visits:Object.values(w.locations).reduce((n,r)=>n+r.visits,0)},news:w.news};
  }
  function validate(){
    const errors=[],keys=new Set();
    for(const d of D.incidents){if(keys.has(d.id))errors.push('duplicate '+d.id);keys.add(d.id);if(!D.states[d.state]||d.duration<=0||!d.endResult)errors.push('incident '+d.id);for(const loc of d.locations)if(!W.locations[loc])errors.push('location '+loc);for(const [k,n] of Object.entries(d.modifiers))if(!Number.isFinite(n))errors.push('modifier '+k);}
    for(const x of D.sites)if(!W.locations[x.loc]||!W.people[x.npc]||!event('v9_callback_'+x.loc+'_help')||!event('v9_callback_'+x.loc+'_betray'))errors.push('site '+x.loc);
    for(const c of D.chains)for(let stage=0;stage<3;stage++)if(!W.locations[c.locations[stage]]||!event('v9_secret_'+c.id+'_'+stage))errors.push('chain '+c.id);
    for(const id of D.npcContacts)if(!W.people[id]||W.people[id].personalStory)errors.push('npc '+id);
    for(const e of W.events.filter(e=>e.id.startsWith('v9_')))if(e.requiresIncident&&!incident(e.requiresIncident)||e.callback&&!site(e.callback.location))errors.push('ref '+e.id);
    const allIds=new Set();for(const e of W.events){if(allIds.has(e.id))errors.push('event duplicate '+e.id);allIds.add(e.id);if(e.legendary&&(!e.unique||e.rarity!=='legendary'||!e.stages.some(s=>s.id==='record')))errors.push('legend '+e.id);
      for(const stage of e.stages||[])for(const choice of stage.choices||[]){const fx=choice.effects?.living;if(!fx)continue;
        if(fx.legend&&!event(fx.legend.id)?.legendary)errors.push('legend ref '+e.id);
        if(fx.decision&&(!site(fx.decision.location)||!W.people[fx.decision.npc]||!D.states[fx.decision.state]||!['help','betray'].includes(fx.decision.value)))errors.push('decision ref '+e.id);
        if(fx.callback&&!site(fx.callback))errors.push('callback ref '+e.id);
        if(fx.chain&&(!D.chains.some(c=>c.id===fx.chain.id)||![0,1,2].includes(fx.chain.stage)))errors.push('chain ref '+e.id);
        if(fx.npc&&!W.people[fx.npc])errors.push('memory ref '+e.id);
      }
    }
    return errors;
  }
  window.ZoneRPGLiving={fresh,normalize,modifier,stateAt,observe,arrive,tick,eligible,weight,available,priority,canApply,apply,onEncounter,onExplore,onReturn,renown,onQuest,renownName,memoryText,npcChoices,peopleAt,caravanAt,decorate,rumor,view,depth,weather,validate};
})();
