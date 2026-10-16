/* Bounded, save-local field records. Uses existing encounters, world clock and NPC memory. */
(() => {
  const W=window.ZoneRPGWorld,I=window.ZoneRPGItems;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const number=(x,max=999999)=>Number.isFinite(x)?Math.max(0,Math.min(max,x)):0;
  const ids=(a,valid,max=100)=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&valid(x)))].slice(-max):[];
  const rarity={common:0,uncommon:1,rare:2,very_rare:3,special:3,unique:4,anomalous:4,legendary:5};
  const archive={
    survey:{title:'Последняя смена',text:'В журнале замеров одна строка обведена дважды: «Если стрелка неподвижна, проверь, идёт ли время». Ниже — три разных подписи.'},
    shelter:{title:'Четыре минуты тишины',text:'Укрытие не глушит звук. Оно возвращает его позже. Не оставляйте внутри работающий передатчик.'},
    glass:{title:'Протокол остывания',text:'Образец сохраняет тепло без источника питания. Полевой техник приписал: «Руки греет. Ночью носить отдельно от дозиметра».'},
    letter:{title:'Письмо без адреса',text:'«Дома считают, что я чиню линии связи. Я и правда их чиню. Только здесь иногда отвечают те, кого уже нет».'},
    marker:{title:'Собственная отметка',text:'Твой прошлый маршрут кто-то обвёл зелёным карандашом. Следующая группа использовала его, чтобы выйти до темноты.'},
    return:{title:'Квитанция полевой группы',text:'«Перевязку получили. Человек дошёл. Лишнюю маску оставили тому, кто не прошёл мимо». Подпись размыта дождём.'}
  };
  const named={
    field_needle:{...I.items.echoDetector,name:'Дозиметр «Ласточка»',rarity:'rare',price:2300,effect:{artifactFindChance:.14,radResist:.01},description:'На корпусе выгравирована птица. Полевой мастер заменил экран на тихую стрелку; чувствительность немного выше обычной.'},
    field_ember:{...I.items.spark,name:'Остывшее сердце',rarity:'rare',price:2400,effect:{maxStamina:6,accuracy:.008,radPerTrip:1},description:'Тёплая крупица в стеклянной корке. Помогает держать руку ровнее, но понемногу облучает владельца.'},
    field_filter:{...I.items.gasmask,name:'ПМК «Вторая смена»',rarity:'rare',price:1850,effect:{radResist:.09,protection:.005,maxStamina:-1},description:'На ремне семь аккуратных насечек. Чуть лучший фильтр оплачен тяжёлым самодельным клапаном.'},
    field_letter:{name:'Письмо связиста',type:'quest',rarity:'rare',price:40,weight:.02,stackable:false,icon:'quest-document',description:'Тонкий конверт без адреса. Текст сохранён в архиве КПК; письмо можно оставить на память или продать.'}
  };
  for(const [id,d]of Object.entries(named))I.items[id]={...d,id,icon:d.icon||I.iconFallback(d),named:true,unique:d.type!=='quest'};
  const rumorDefinitions=[
    {id:'rumor_field_artifacts',title:'Свежий след у Янтаря',text:'Полевой дозор заметил новые отклики у Янтаря. В ближайшие часы поиск артефакта там может быть удачнее.',target:'yantar',kind:'artifact',duration:8},
    {id:'rumor_field_pack',title:'Стая у насыпей',text:'Охотник сообщает о стае на Свалке. До смены дозора встречи с мутантами там вероятнее.',target:'garbage',kind:'mutants',duration:7},
    {id:'rumor_field_patrol',title:'Смена паролей',text:'На Агропроме усиливают военный дозор. Свежая сводка обещает больше встреч с патрулями.',target:'agro',kind:'military',duration:6}
  ];
  W.fieldRumors=rumorDefinitions;
  Object.assign(window.ZoneRPGLivingData.states,{
    field_static:{name:'Помехи приборов · повышенный фон',modifiers:{radiation:.5,anomaly:1.2}},
    field_calm:{name:'Аномальная тишина · следов меньше',modifiers:{danger:-.5,mutants:.75,anomaly:.8}}
  });
  // One existing person, one position: the ongoing clash displaces the radio operator.
  W.people.radio.relocation={incident:'v9_factionClash',destination:'cordon'};
  const choice=(label,effects,resultText)=>({label,effects,finish:true,resultText});
  const events=[
    {id:'field_lost_survey',category:'Забытая смена',locations:['railway','agro'],minDepth:4,rarity:'rare',text:'У перевёрнутого штатива сидит раненый замерщик. На рукаве — знак полевой группы Веры. Прибор ещё работает, но одному ему не дойти.',choices:[
      {...choice('Перевязать и обозначить выход · бинт, 2 выносливости',{itemCost:{bandage:1},stamina:-2,field:{archive:'survey'},oneTimeFlag:'fieldHelpedSurveyor',living:{npc:'vera',help:true},rep:{ecologists:2}},'Ты оставляешь перевязку и отмечаешь путь к дозору. Замерщик запоминает твой позывной; группе понадобится время, чтобы дойти.'),when:{items:{bandage:1}}},
      choice('Взять прибор · +6 радиации, доверие группы снизится',{add:{field_needle:1},radiation:6,field:{archive:'survey'},oneTimeFlag:'fieldAbandonedSurveyor',living:{npc:'vera',help:false},rep:{ecologists:-2}},'Ты забираешь прибор и оставляешь на карте отметку раненого. Полевой группе это решение не понравится.'),
      choice('Не трогать вещи и передать координаты',{field:{archive:'survey'},oneTimeFlag:'fieldReportedSurveyor'},'Координаты ушли в эфир. Ты не знаешь, успеет ли помощь, но место больше не потеряно.')
    ]},
    {id:'field_echo_shelter',category:'Укрытие с задержкой',locations:['wild','darkvalley','redforest'],minDepth:6,rarity:'very_rare',text:'За бетонной дверью твои шаги слышны на секунду позже. На стене схема приёмника: «Не запускать при открытой антенне».',choices:[
      choice('Считать схему · фон усилится на 4 часа',{radiation:3,add:{electronics:1},field:{archive:'shelter',condition:'field_static'}},'Ты снимаешь схему. Приборы ловят остаточную помеху: фон и аномальные отклики здесь усилены на четыре игровых часа.'),
      choice('Обесточить контур · тихие тропы на 4 часа',{stamina:-5,field:{archive:'shelter',condition:'field_calm'}},'Контур гаснет. На четыре игровых часа следов мутантов и откликов аномалий станет меньше. Тишина помогает вернуться, но искать находки сложнее.')
    ]},
    {id:'field_survey_wreck',category:'Остывшая проба',locations:['yantar','anomalyRidge'],minDepth:5,rarity:'very_rare',text:'В разбитом контейнере сохранился один тёплый образец. Рядом лежит протокол: открыть капсулу можно, но фон резко вырастет.',choices:[
      choice('Открыть капсулу · +8 радиации',{add:{field_ember:1},radiation:8,field:{archive:'glass'},oneTimeFlag:'fieldGlassTaken'},'Тёплая крупица покидает защитный стакан. Ценный образец получен ценой облучения.'),
      choice('Снять только протокол · +2 радиации',{radiation:2,rep:{ecologists:1},field:{archive:'glass'}},'Ты оставляешь капсулу закрытой. Наблюдения сохранены, и учёным будет что проверить.')
    ]},
    {id:'field_old_mail',category:'Конверт между рельсами',locations:['garbage','rookie','railway'],minDepth:3,rarity:'rare',text:'В сухой нише лежит конверт связиста. На обороте просьба: передать весть о последней смене, даже если письмо придётся оставить себе.',choices:[
      choice('Забрать письмо и переписать частоту',{add:{field_letter:1},field:{archive:'letter'}},'Письмо у тебя. Копия сохранена в архиве; даже продажа конверта не сотрёт запись.'),
      choice('Передать весть и оставить конверт',{stamina:-2,rep:{loners:2},field:{archive:'letter'},oneTimeFlag:'fieldMailSent'},'Ты тратишь время на передачу. В ответ приходит короткое: «Поняли. Спасибо, что не выбросил».')
    ]},
    {id:'field_return_marker',category:'Твой старый ориентир',locations:Object.keys(W.locations),minDepth:3,rarity:'rare',fieldTrace:true,text:'На развилке сохранилась отметка с твоего трудного выхода. Кто-то поправил стрелку и оставил маленький перевязочный пакет.',choices:[
      choice('Проверить оставленную отметку',{add:{bandage:1,ammo918:6},field:{archive:'marker',clearTrace:true},oneTimeFlag:'fieldTraceRecovered'},'Кто-то воспользовался твоим маршрутом и оставил припасы следующему путнику. Отметка записана в хронику.'),
      choice('Оставить припасы следующему',{rep:{loners:1},field:{archive:'marker',clearTrace:true}},'Ты уточняешь стрелку и оставляешь припасы на месте. Здесь теперь есть ориентир, которому можно доверять.')
    ]},
    {id:'field_followup_survey',category:'Квитанция второй смены',locations:['yantar','researchCamp'],minDepth:2,rarity:'rare',requiredFlag:'fieldHelpedSurveyor',text:'Связной полевой группы узнаёт позывной: «{playerName}, твой замерщик дошёл. Просил передать запасную маску и запись».',choices:[
      choice('Принять передачу',{add:{field_filter:1},field:{archive:'return'},living:{npc:'vera',help:true},oneTimeFlag:'fieldSurveyThanks'},'Маска потёртая, но фильтр свежий. Вера помнит, кто вернулся за человеком, а не за прибором.'),
      choice('Оставить маску группе',{rep:{ecologists:3},field:{archive:'return'},living:{npc:'vera',help:true}},'Маска остаётся у дозора. Полевики запоминают, что ты не требовал платы за помощь.')
    ]}
  ];
  for(const e of events){e.kind='explore';e.unique=true;e.stages=[{id:'contact',text:e.text,choices:e.choices}];delete e.choices;W.events.push(e);}
  const fresh=s=>({history:[],nextNumber:1,pinned:[],seenItems:[...new Set(s.inventory.map(x=>x.id))],unread:{quests:[],items:[],rumors:[],entries:[]},chronicle:[],archive:[],traces:[]});
  function normalizeDetails(raw,s){
    if(!raw||typeof raw!=='object')return null;
    const out={};for(const k of ['number','events','battles','damage','radiation','startMoney','startClock'])out[k]=number(raw[k]);
    out.partial=raw.partial===true;out.moneyDelta=Number.isFinite(raw.moneyDelta)?Math.max(-999999,Math.min(999999,raw.moneyDelta)):0;
    out.rarest=I.items[raw.rarest]?raw.rarest:null;out.notable=W.events.some(e=>e.id===raw.notable)?raw.notable:null;
    out.enemies=ids(raw.enemies,id=>Boolean(W.enemyTypes[id]),12);
    out.questStart=Array.isArray(raw.questStart)?raw.questStart.filter(q=>q&&W.quests.some(d=>d.id===q.id)).slice(0,128).map(q=>({id:q.id,value:number(q.value)})):[];
    out.questProgress=Array.isArray(raw.questProgress)?raw.questProgress.filter(q=>q&&W.quests.some(d=>d.id===q.id)).slice(-10).map(q=>({id:q.id,before:number(q.before),after:number(q.after),completed:q.completed===true})):[];
    return out;
  }
  function normalize(raw,s){
    const out=fresh(s),validQuest=id=>s.quests.active.some(q=>q.id===id),validItem=id=>Boolean(I.items[id]);
    out.nextNumber=Math.floor(number(raw?.nextNumber))||1;out.pinned=ids(raw?.pinned,validQuest,3);
    out.seenItems=ids([...(Array.isArray(raw?.seenItems)?raw.seenItems:[]),...s.inventory.map(x=>x.id)],validItem,512);
    for(const kind of Object.keys(out.unread))out.unread[kind]=ids(raw?.unread?.[kind],id=>kind==='quests'?validQuest(id):kind==='items'?validItem(id):true,64);
    out.archive=ids(raw?.archive,id=>Boolean(archive[id]),Object.keys(archive).length);
    out.chronicle=Array.isArray(raw?.chronicle)?raw.chronicle.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string').slice(-40).map(x=>({id:x.id.slice(0,160),text:x.text.slice(0,500),time:number(x.time),location:W.locations[x.location]?x.location:s.player.location})):[];
    out.traces=Array.isArray(raw?.traces)?raw.traces.filter(x=>x&&W.locations[x.location]&&Number.isFinite(x.depth)).slice(-3).map(x=>({location:x.location,depth:number(x.depth),time:number(x.time),claimed:x.claimed===true})):[];
    out.history=Array.isArray(raw?.history)?raw.history.filter(x=>x&&W.locations[x.originLocationId]).slice(-10).map(x=>{const e=window.ZoneRPGExpedition.normalize({...x,active:true},{...s,travelTo:null},W);e.active=false;return e;}):[];
    out.nextNumber=Math.max(out.nextNumber,1,...out.history.map(e=>(e.details?.number||0)+1));
    for(const r of s.rumors)if(r.dynamic){const d=r.dynamic;r.dynamic=rumorDefinitions.some(x=>x.id===r.id)&&W.locations[d.target]?{target:d.target,kind:['artifact','mutants','military'].includes(d.kind)?d.kind:'artifact',expiresAt:number(d.expiresAt),strength:number(d.strength,1),source:typeof d.source==='string'?d.source.slice(0,90):'Неподтверждённая передача'}:null;}
    return out;
  }
  const progress=s=>s.quests.active.map(q=>{const d=W.quests.find(x=>x.id===q.id);const value=d.type==='deliver'?Math.min(d.count||1,s.inventory.filter(x=>x.id===d.item).reduce((n,x)=>n+x.qty,0)):d.type==='deliverType'?Math.min(d.count||1,s.inventory.filter(x=>I.items[x.id]?.type===d.itemType).reduce((n,x)=>n+x.qty,0)):d.type==='route'?q.step:q.progress;return{id:q.id,value:value||0};});
  function record(s,id,text){const j=s.fieldJournal;if(j.chronicle.some(x=>x.id===id))return;j.chronicle.push({id,text,time:s.worldClock,location:s.player.location});j.chronicle=j.chronicle.slice(-40);j.unread.entries=ids([...j.unread.entries,id],()=>true,40);}
  function begin(s){s.expedition.details={number:s.fieldJournal.nextNumber,partial:Boolean(s.event||s.expedition.depth),events:s.expedition.history.length||(s.event?1:0),battles:0,damage:0,radiation:0,startMoney:s.player.money,startClock:s.worldClock,moneyDelta:0,rarest:null,notable:null,enemies:[],questStart:progress(s),questProgress:[]};}
  function loot(s,id){const j=s.fieldJournal,it=I.items[id];if(!j.seenItems.includes(id)){if(it.named)feedback('rare');j.seenItems.push(id);j.unread.items=ids([...j.unread.items,id],()=>true,64);}
    const d=s.expedition.active&&s.expedition.details;if(d&&(!d.rarest||(rarity[it.rarity]||0)>(rarity[I.items[d.rarest]?.rarity]||0)||(rarity[it.rarity]||0)===(rarity[I.items[d.rarest]?.rarity]||0)&&it.price>I.items[d.rarest].price))d.rarest=id;
    if((rarity[it.rarity]||0)>=2&&(it.type==='artifact'||it.named))record(s,'find:'+id,'Найдена редкая вещь: '+it.name+'.');
    if(id==='field_letter')unlock(s,'letter');
  }
  function unlock(s,id){if(!archive[id]||s.fieldJournal.archive.includes(id))return;s.fieldJournal.archive.push(id);record(s,'archive:'+id,'Архив: '+archive[id].title+'.');}
  function encounter(s,e,origin,continuation){const d=s.expedition.active&&s.expedition.details;if(!d||origin!=='explore')return;if(!continuation)d.events++;if((rarity[e.rarity]||0)>=2)d.notable=e.id;}
  function battle(s,id){const d=s.expedition.active&&s.expedition.details;if(d){d.battles++;d.enemies=ids([...d.enemies,id],()=>true,12);}}
  function snapshot(s){return {health:s.player.health,radiation:s.player.radiation,expedition:s.expedition,completed:[...s.quests.completed],active:s.quests.active.map(q=>q.id),visited:[...s.visited],faction:s.factionMembership,chapter:s.personalStory.currentChapter,stage:s.zoneStory.stage,npcs:Object.fromEntries(Object.keys(s.npcMemory).map(id=>[id,window.ZoneRPGLiving.npcLocation(s,id)]))};}
  function after(s,b,name){
    if(['load','startGame','newGame'].includes(name))return;
    const j=s.fieldJournal,d=s.expedition.active&&s.expedition.details;
    if(d){d.damage+=Math.max(0,b.health-s.player.health);d.radiation+=Math.max(0,s.player.radiation-b.radiation);d.moneyDelta=s.player.money-d.startMoney;}
    j.pinned=j.pinned.filter(id=>s.quests.active.some(q=>q.id===id));
    for(const q of s.quests.active)if(!b.active.includes(q.id)){j.unread.quests=ids([...j.unread.quests,q.id],()=>true,64);}
    for(const id of s.quests.completed)if(!b.completed.includes(id)){const q=W.quests.find(q=>q.id===id);record(s,'quest:'+id,'Выполнено: '+q.title+'.');}
    for(const id of s.visited)if(!b.visited.includes(id)&&W.locations[id].danger>=5)record(s,'visit:'+id,(s.playerName||'Сталкер')+' впервые достиг сектора «'+W.locations[id].name+'».');
    if(s.factionMembership&&s.factionMembership!==b.faction)record(s,'faction:'+s.factionMembership,(s.playerName||'Сталкер')+' принят в группировку «'+W.factions[s.factionMembership].name+'».');
    if(b.chapter!==s.personalStory.currentChapter)record(s,'chapter:'+s.backgroundId+':'+s.personalStory.currentChapter,'Личная история: завершена глава '+s.personalStory.currentChapter+'.');
    if(b.stage!==s.zoneStory.stage)record(s,'main:'+s.zoneStory.stage,'Расследование: принят следующий важный выбор ('+s.zoneStory.stage+'/20).');
    for(const [id,loc]of Object.entries(b.npcs)){const now=window.ZoneRPGLiving.npcLocation(s,id);if(loc!==now)record(s,'contact:'+id+':'+now,W.people[id].name+(now?' теперь в секторе «'+W.locations[now].name+'».':' временно не выходит на связь.'));}
    if(b.radiation<65&&s.player.radiation>=65)feedback('radiation');
    const seen={quests:['quests'],inventory:['items'],notebook:['rumors'],chronicle:['entries'],archive:['archive']};for(const kind of seen[s.mode]||[])markRead(s,kind);
  }
  function finish(s){const e=s.expedition;if(!e.details)begin(s);const d=e.details;d.moneyDelta=s.player.money-d.startMoney;
    const end=progress(s);d.questProgress=d.questStart.map(q=>{const completed=s.quests.completed.includes(q.id),value=end.find(x=>x.id===q.id)?.value??q.value;return{id:q.id,before:q.value,after:value,completed};}).filter(q=>q.completed||q.after>q.before).slice(-10);
    const saved=copy(e);saved.active=false;s.lastExpedition=saved;s.fieldJournal.history.push(saved);s.fieldJournal.history=s.fieldJournal.history.slice(-10);s.fieldJournal.nextNumber=d.number+1;
    if(e.depth>=8){record(s,'expedition:'+d.number,'Трудный выход: '+W.locations[e.originLocationId].name+', глубина '+e.depth+'. Вернулся живым.');if(!s.fieldJournal.traces.some(t=>t.location===e.originLocationId&&!t.claimed))s.fieldJournal.traces.push({location:e.originLocationId,depth:e.depth,time:s.worldClock,claimed:false});s.fieldJournal.traces=s.fieldJournal.traces.slice(-3);}
    feedback('return');
  }
  function pin(s,id){const j=s.fieldJournal;if(!s.quests.active.some(q=>q.id===id))return false;if(j.pinned.includes(id)){j.pinned=j.pinned.filter(x=>x!==id);return true;}if(j.pinned.length>=3)return false;j.pinned.push(id);return true;}
  function markRead(s,kind){if(kind==='archive'){s.fieldJournal.unread.entries=s.fieldJournal.unread.entries.filter(id=>!id.startsWith('archive:'));return;}if(s.fieldJournal.unread[kind])s.fieldJournal.unread[kind]=[];}
  function rumor(s,definition,roll){
    const d=rumorDefinitions.find(x=>x.id===definition.id);if(!d)return null;if(roll==null)roll=Math.random();
    return {target:d.target,kind:d.kind,expiresAt:s.worldClock+d.duration,strength:roll<.16?0:1,source:roll<.16?'Через третьи руки · подтверждения нет':'Свежая передача полевого дозора'};
  }
  function rumorBonus(s,kind,loc){return Math.min(1,s.rumors.reduce((n,r)=>n+(r.dynamic?.kind===kind&&r.dynamic.target===loc&&r.dynamic.expiresAt>s.worldClock?r.dynamic.strength:0),0));}
  function apply(s,fx){if(fx.archive)unlock(s,fx.archive);if(fx.condition){const loc=s.expedition.originLocationId||s.player.location;s.worldState.locations[loc]={...(s.worldState.locations[loc]||{visits:1}),temporaryState:fx.condition,endsAt:s.worldClock+4};}if(fx.clearTrace){const trace=s.fieldJournal.traces.find(t=>t.location===s.player.location&&!t.claimed);if(trace)trace.claimed=true;}}
  function eligible(s,e,loc){return !e.fieldTrace||s.fieldJournal.traces.some(t=>t.location===loc&&!t.claimed);}
  function status(s,loc){const L=window.ZoneRPGLiving,state=L.stateAt(s,loc),weather=L.weather(s);return state!=='calm'?window.ZoneRPGLivingData.states[state].name:weather==='Туман'?'Туман · следы мутантов ближе':weather==='Дождь'?'Дождь · дозиметр держать сухим':W.locations[loc].rad>=25?'Высокий природный фон':weather;}
  function relationship(s,id){const m=W.people[id]?.personalStory?s.personalStory.relationships[id]:s.worldState.npcMemory[id];return m?.trust<=-1?'Недоверие':m?.ally||m?.trust>=2?'Доверяет':m?.trust>=1?'Знакомый':'Нейтрально';}
  function ambient(s,loc){const L=window.ZoneRPGLiving;if(s.worldState.visitSerial%3||!W.locations[loc].npcs.length)return null;const id=L.peopleAt(s,loc).find(id=>L.npcAvailable(s,id,loc)&&!W.people[id].personalStory);if(!id)return null;const trusted=(s.worldState.npcMemory[id]?.trust||0)>0;const line=trusted?(s.playerName||'Сталкер')+', твои отметки помнят. Сверь частоту перед выходом.':L.modifier(s,'radiation',loc)>0?'Фон сегодня выше обычного. Не затягивай с возвращением.':L.weather(s)==='Туман'?'В тумане зверя слышно раньше, чем видно.':(s.reputation[W.people[id].faction]||0)<0?'Разговор короткий. Тут ещё помнят старые долги.':'После дороги проверь магазин. На тропе времени не будет.';return W.people[id].name+': «'+line+'»';}
  function feedback(kind){window.ZoneRPGAudio?.play(({return:'save',rumor:'quest',radiation:'alert',rare:'rare'})[kind]||'quest');}
  function bestFind(e){return e?.details?.rarest||Object.keys(e?.summary?.items||{}).filter(id=>I.items[id]).sort((a,b)=>(rarity[I.items[b].rarity]||0)-(rarity[I.items[a].rarity]||0)||I.items[b].price-I.items[a].price)[0]||null;}
  function summaryText(s,e=s.lastExpedition){if(!e)return 'Вылазок пока нет.';const d=e.details||{},t=e.summary;return [window.ZoneRPGConfig.gameName,'Вылазка: '+W.locations[e.originLocationId].name,'Глубина: '+e.depth,'Встречи: '+(d.events??e.history.length),'Время: '+t.hours+' ч','Побед: '+t.kills,'Радиация: '+(d.radiation==null?'нет данных':'+'+Math.round(d.radiation*10)/10+'%'),'Деньги: '+Math.round(d.moneyDelta??t.money)+' ₽','Лучшая находка: '+(I.items[bestFind(e)]?.name||'нет'),'Результат: вернулся живым'].join('\n');}
  window.ZoneRPGFieldJournal={fresh,normalize,normalizeDetails,begin,loot,encounter,battle,snapshot,after,finish,pin,markRead,record,rumor,rumorBonus,apply,eligible,status,relationship,ambient,feedback,bestFind,summaryText,archive,named,events,rumorDefinitions,flags:events.flatMap(e=>e.stages.flatMap(stage=>stage.choices.map(c=>c.effects?.oneTimeFlag).filter(Boolean)))};
})();
