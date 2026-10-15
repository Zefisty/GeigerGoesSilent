(() => {
  window.ZoneRPGFormat={percent(value){const n=Number(value);return (Number.isFinite(n)?Math.round(n*10)/10:0)+'%';}};
  window.ZoneRPGLog={write(s,text){s.log.push(text);s.log=s.log.slice(-10);}};
  window.ZoneRPGConfig={version:'11.0',credits:{developer:'Zefisty',betaTester:'DOCLIK',music:'Sajen'}};
})();

// UI dictionary only. Narrative content remains in its existing definitions.
(() => {
  const ui={inventory:'Инвентарь',map:'Карта',quests:'Задания',character:'Персонаж',more:'Ещё',explore:'Исследовать',fire:'ОГОНЬ',melee:'АТАКОВАТЬ НОЖОМ',aim:'ПРИЦЕЛИТЬСЯ',defend:'УКРЫТЬСЯ',retreat:'ОТСТУПИТЬ'};
  window.ZoneRPGI18n={locale:'ru',ui,t:key=>ui[key]||''};
  const hints={
    location:['Первый шаг','Послушай слухи или поговори с людьми рядом. Затем начни исследование: карта и инвентарь доступны в нижнем меню.'],
    expedition:['Твоя вылазка','Продолжить — искать дальше в том же секторе. Вернуться — закончить вылазку у места старта. Карта доступна, но путешествие во время вылазки закрыто.'],
    stamina:['Береги силы','Каждый поиск расходует выносливость; глубже — дороже и опаснее. Вернись до того, как закончатся силы.'],
    combat:['Подготовь атаку','Огонь расходует патроны. Прицеливание стоит 8 сил и даёт врагу ход; укрытие снижает урон этого хода. Нож не требует патронов, но опаснее вблизи.'],
    loot:['Проверь находку','Полученные вещи — в Инвентаре. Снаряжение можно надеть в Персонаже, оружие — перезарядить до боя.'],
    radiation:['Радиационный фон','Радиация накапливается в опасных секторах. Высокий фон отнимает здоровье. Противогаз снижает дозу, антирад помогает убрать накопленную радиацию.'],
    factions:['Отношения в Зоне','Помощь и конфликты меняют репутацию группировок. От неё зависят услуги и разговоры. Подробности: Ещё → Энциклопедия Зоны → Группировки.'],
    artifact:['Артефакт найден','Артефакты дают бонусы и штрафы только в надетом слоте. Проверь эффекты в Инвентаре: сильный бонус может стоить здоровья или защиты.'],
    return:['После вылазки','Проверь добычу и задания. Готовые поручения нужно сдать заказчику вручную. Перед следующей вылазкой пополни магазин, еду и воду.']
  };
  const fresh=()=>({seen:[],queue:[],battles:0});
  function normalize(raw,legacyBattles=0){const v=fresh();for(const k of ['seen','queue'])v[k]=[...new Set((Array.isArray(raw?.[k])?raw[k]:[]).filter(id=>hints[id]))];v.queue=v.queue.filter(id=>!v.seen.includes(id));v.battles=Math.max(0,Math.min(99999,Number(raw?.battles??legacyBattles)||0));return v;}
  function offer(s,id){if(!s.settings.tutorialHints||s.tutorial.seen.includes(id)||s.tutorial.queue.includes(id))return;s.tutorial.queue.push(id);}
  function observe(s){if(s.mode==='play'&&!s.event&&!s.combat){offer(s,'location');if(s.lastExpedition)offer(s,'return');}if(s.expedition.active){offer(s,'expedition');offer(s,'stamina');}if(s.combat)offer(s,'combat');if(s.event?.flow?.rewards?.items?.length)offer(s,'loot');if(s.player.radiation>=15)offer(s,'radiation');if(s.discoveredArtifacts.length)offer(s,'artifact');}
  window.ZoneRPGOnboarding={hints,fresh,normalize,offer,observe};
})();

(() => {
 const tiers=[['Новичок',0],['Ученик',20],['Сталкер',50],['Бывалый',90],['Ветеран',140],['Мастер',200],['Легенда',280]];
 function calculate(s){const bounded=(n,max)=>Math.max(0,Math.min(max,Number(n)||0));const level=bounded(s.player.rank-1,30)*6,attributes=['strength','agility','endurance','perception','intelligence'].reduce((n,k)=>n+bounded(s.attributes[k]-2,10)*2,0),mastery=['pistols','smg','rifles','shotguns','melee'].reduce((n,k)=>n+bounded(s.weaponMastery[k],100),0)/5*.8;const score=Math.floor(level+attributes+mastery);let index=0;tiers.forEach((t,i)=>{if(score>=t[1])index=i;});return {index,name:tiers[index][0],score,next:tiers[index+1]?.[0]||null,nextScore:tiers[index+1]?.[1]||null,components:{level,attributes,mastery}};}
 window.ZoneRPGRank={tiers,calculate};
})();
