/* Pure presentation mapping. No state, item definitions, event IDs or mechanics are changed. */
(() => {
  'use strict';
  const root='assets/art/';
  const names={
    locations:'village cordon scrapyard dark-valley agro checkpoint railway red-forest tunnel laboratory camp anomaly ruins industrial swamp reactor',
    events:'campfire stash medical-crate anomaly tracks ambush passage abandoned-camp battlefield wounded radio documents artifact trader workshop night-signal',
    portraits:'rookie soldier technician hunter scavenger medic trader mechanic veteran researcher radio stranger defender scout biologist pig-bandit gromova orlov motyl rada zhdan serov dron veres',
    enemies:'feral-dog blind-hound boar alpha-boar bloodsucker snork controller giant anomalous-dog leech lurker electro-snork bandit soldier merc sentinel rat-swarm reed-crawler quarry-dog ash-walker mirror-stalker elite-boar armored-bandit snork-veteran',
    items:'pistol pistol-heavy rifle smg sniper shotgun sawedoff knife armor-light armor-vest armor-suit armor-exo helmet gas-mask backpack detector medkit bandage antirad pills canned ration water energy-drink ammo-pistol ammo-rifle ammo-shells mutant-parts tools parts electronics wires artifact-medusa artifact-stoneflower artifact-spark artifact-shell artifact-nightstar artifact-needle artifact-moonlight artifact-meatchunk artifact-gravi artifact-goldfish artifact-flash artifact-fireball artifact-bubble artifact-beads artifact-battery artifact-soul quest-document map journal rare-box sample valuables detector-pro military-pack food medical artifact-rare artifact-dark radio key fuse salvage',
    factions:'loners bandits duty freedom military ecologists mercs mutants monolith'
  };
  const catalog=Object.fromEntries(Object.entries(names).map(([kind,list])=>[kind,new Set(list.split(' '))]));
  const path=(kind,name,fallback)=>root+kind+'/'+(catalog[kind].has(name)?name:fallback)+(kind==='factions'?'.svg':'.png');
  const locations={cordon:'cordon',rookie:'village',checkpoint:'checkpoint',garbage:'scrapyard',agro:'agro',darkvalley:'dark-valley',swamp:'swamp',yantar:'laboratory',wild:'railway',warehouses:'industrial',redforest:'red-forest',pripyat:'ruins',chNpp:'reactor',railway:'railway',deadVillage:'ruins',machineYard:'industrial',underground:'tunnel',militaryDepot:'checkpoint',anomalyRidge:'anomaly',southTunnel:'tunnel',northOutpost:'checkpoint',floodplain:'swamp',quarry:'scrapyard',radioHill:'cordon',greenhouse:'agro',researchCamp:'laboratory',dutyFort:'checkpoint',freeCamp:'camp',mirrorLake:'anomaly'};
  const scenes={village:'village',house:'ruins',road:'cordon',forest:'red-forest',swamp:'swamp',checkpoint:'checkpoint',industrial:'industrial',warehouse:'industrial',laboratory:'laboratory',bunker:'tunnel',tunnel:'tunnel',underground:'tunnel',cnpp:'reactor',sarcophagus:'reactor','anomaly-field':'anomaly',anomaly:'anomaly',camp:'camp',fire:'camp',tower:'cordon','abandoned-car':'scrapyard',container:'industrial',body:'ruins'};
  const enemyAliases={dog:'blind-hound',boar:'boar',bloodsucker:'bloodsucker',controller:'controller',pseudogiant:'giant',snork:'snork',bandit:'bandit',stalker:'bandit',rookie:'bandit',military:'soldier',merc:'merc',monolith:'sentinel',duty:'soldier',alphaBoar:'alpha-boar',ironBoar:'alpha-boar',storyScarBoar:'elite-boar',zone_elite_boar:'elite-boar',damagedBloodsucker:'bloodsucker',anomalousDog:'anomalous-dog',psydog:'anomalous-dog',snorkVeteran:'snork-veteran',armoredBandit:'armored-bandit',ratSwarm:'rat-swarm',marshLeech:'leech',nightLurker:'lurker',ashWalker:'ash-walker',quarryDog:'quarry-dog',reedCrawler:'reed-crawler',mirrorStalker:'mirror-stalker',banditScout:'bandit',mercMarksman:'merc',dutyDeserter:'soldier',electroSnork:'electro-snork',zone_elite_guard:'sentinel'};
  const npcIds={sidorovich:'trader',bar:'trader',npc_threeLeggedPigBandit:'pig-bandit',zone_npc_gromova:'gromova',zone_npc_orlov:'orlov',zone_npc_motyl:'motyl',zone_npc_rada:'rada',zone_npc_zhdan:'zhdan',zone_npc_serov:'serov',zone_npc_dron:'dron',zone_npc_veres:'veres',zone_npc_levin:'veteran',zone_npc_grach:'hunter',zone_npc_reed:'scout',zone_npc_rivet:'mechanic'};
  const npcSprites={'pig-bandit':'pig-bandit','v10-gromova':'gromova','v10-orlov':'orlov','v10-motyl':'motyl','v10-rada':'rada','v10-zhdan':'zhdan','v10-serov':'serov','v10-dron':'dron','v10-veres':'veres'};
  function origin(id){return path('portraits',id,'rookie');}
  function npc(p={},id=''){
    let chosen=npcIds[id]||npcSprites[p.sprite];
    const role=String(p.role||'').toLocaleLowerCase('ru-RU');
    if(!chosen){
      if(/торгов|посредник|долг/.test(role))chosen='trader';
      else if(/медик|фельдшер|ранен/.test(role))chosen='medic';
      else if(/техник|механик|мастер|прибор/.test(role))chosen='mechanic';
      else if(/ради|связ/.test(role))chosen='radio';
      else if(/мутантолог|биолог/.test(role))chosen='biologist';
      else if(/исслед|учёный|эколог|руководител/.test(role))chosen='researcher';
      else if(/охот|следопыт/.test(role))chosen='hunter';
      else if(/военн|офицер|командир|сослуживец|патрул/.test(role))chosen='soldier';
      else if(/развед|курьер|картограф/.test(role))chosen='scout';
      else if(/ветеран|наставник/.test(role))chosen='veteran';
      else if(/контракт|наёмник|вражд|старший/.test(role))chosen='scavenger';
      else chosen=p.faction==='freedom'?'scout':p.faction==='duty'?'defender':p.faction==='bandits'?'scavenger':p.faction==='monolith'?'stranger':'rookie';
    }
    return path('portraits',chosen,'rookie');
  }
  function location(id){return path('locations',locations[id],'cordon');}
  function scene(key){return path('locations',scenes[key]||key,'cordon');}
  function enemy(id){return path('enemies',enemyAliases[id]||id,'bandit');}
  const itemIds=new Map(Object.entries(window.ZoneRPGItems?.items||{}).map(([id,item])=>[item,id]));
  const itemOverrides={sawedoff:'sawedoff',milPack:'military-pack',zone_pack:'military-pack',sealedSample:'sample',radioBattery:'battery',v9_fieldJournal:'journal',v9_routeLedger:'map',zone_ledger:'journal'};
  function item(it={}){
    let icon=itemOverrides[itemIds.get(it)]||it.icon||window.ZoneRPGItems?.iconFallback(it);
    if(icon==='battery')icon='artifact-battery';
    const fallback=({food:'food',drink:'water',medicine:'medical',artifact:'artifact-rare',armor:'armor-suit',headgear:'gas-mask',backpack:'backpack',detector:'detector',quest:'quest-document',loot:'salvage'})[it.type]||(it.type==='weapon'?(it.slot==='melee'?'knife':it.slot==='sidearm'?'pistol':'rifle'):'salvage');
    return path('items',icon,fallback);
  }
  function event(e={},s={},hint=''){
    const def=window.ZoneRPGWorld?.events.find(d=>d.id===e.id),npcId=def?.npcId||e.npcId||(/^npc_(?:scene|story)_/.test(e.id||'')?e.id.slice(10):null);
    if(npcId&&s.people?.[npcId]&&/^npc_(?:scene|story)_/.test(e.id||''))return npc(s.people[npcId],npcId);
    const text=[e.category,e.text,def?.kind,def?.category].filter(Boolean).join(' ').toLocaleLowerCase('ru-RU');
    // Specific subjects win over generic "crate", "road" or location hints.
    const rules=[
      [/артефакт.*(?:найд|наш|наход|свет)|(?:найд|наш).*артефакт/,'artifact'],
      [/ранен|перевяз|помочь.*сталкер|голос.*помощ/,'wounded'],
      [/медицин|аптечн|санитар|медикамент.*ящик/,'medical-crate'],
      [/тайник|заначк|схрон|клад/,'stash'],
      [/засад|перекрыли|перестрел|стрел.*укрыт/,'ambush'],
      [/разбит.*лагер|покинут.*лагер|разрушен.*лагер/,'abandoned-camp'],
      [/поле боя|гильз|после боя|погибш|труп/,'battlefield'],
      [/костёр|костер|послушать новости|послушать слух/,'campfire'],
      [/аномал|радиац|дозим|выброс/,'anomaly'],
      [/записк|документ|архив|досье|журнал/,'documents'],
      [/отпечат|следы|след лап|след копыт/,'tracks'],
      [/проход|обход|сухой путь/,'passage'],
      [/позывн|раци|радио|частот/,'radio'],
      [/ночн|ночь|неизвест.*сигнал|вышк/,'night-signal'],
      [/торгов|бартер|прилав|сидорович/,'trader'],
      [/мастер|техник|ремонт/,'workshop']
    ];
    const match=rules.find(([pattern])=>pattern.test(text));
    if(match)return path('events',match[1],'passage');
    if(npcId){const role=s.people?.[npcId]?.role||'';return path('events',/торгов/.test(role)?'trader':/техник|механик|мастер/.test(role)?'workshop':/медик|фельдшер/.test(role)?'medical-crate':'campfire','campfire');}
    const explicit=e.art||def?.art||hint;
    if(explicit)return scene(explicit);
    return location(s.player?.location);
  }
  function faction(id){return path('factions',id,'loners');}
  const allPaths=Object.entries(catalog).flatMap(([kind,set])=>Array.from(set,name=>path(kind,name,name)));
  window.ZoneRPGArt=Object.freeze({location,scene,event,npc,origin,enemy,item,faction,allPaths:Object.freeze(allPaths)});
})();
