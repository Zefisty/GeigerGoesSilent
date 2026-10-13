// Daily inventories are deterministic; rendering never rolls or mutates stock.
(() => {
  const rules={
    common:{chance:.94,min:3,max:8},uncommon:{chance:.6,min:1,max:4},
    rare:{chance:.22,min:1,max:2},very_rare:{chance:.06,min:1,max:1},
    ammo:{chance:.82,min:18,max:60},equipment:{chance:.35,min:1,max:1}
  };
  const overrides={medkit:{chance:.82,min:1,max:3},water:{chance:.96,min:3,max:8},canned:{chance:.96,min:2,max:6}};
  const common=['water','canned','bandage','medkit','ammo918'];
  const general=['electrolyte','ration7','fieldSerum','probe7','radioBattery','antirad','energy','ammo919','ammo545','ammo762','ammo1270','ammo9x39'];
  const pools={
    sidorovich:['pm','pistol19','aps','huntingRifle','jacket','leather','knife','sawedoff','fieldPack','gasmask','echoDetector','jellyfish'],
    technician:['stalkerSuit','aksu','shotgun','electronics','tools','parts','milPack','sealedHelmet','spark','shell','svarog','fireball','moonlight','battery'],
    freedomTrader:['ak','armySuit','exoskeleton','vintar','vest','milPack','sealedHelmet','nightstar','gravi','ppVityaz'],
    labShop7:['carbine7','smg7','surveyPack','surveyMask','antirad','medkit'],
    quarter7:['carbine7','smg7','surveyPack','surveyMask','ammo545','ammo762'],
    dealer7:['carbine7','smg7','surveyPack','surveyMask'],
    v9_caravan:['tools','surveyMask','radioBattery']
  };
  function rule(id){
    const item=window.ZoneRPGItems.items[id];if(!item)return null;
    if(overrides[id])return overrides[id];const rarity=item.rarity;
    if(['very_rare','anomalous','unique'].includes(rarity)||item.price>=10000)return {...rules.very_rare,min:1,max:1};
    if(rarity==='rare'||item.price>=4000)return {...rules.rare,min:1,max:1};
    if(common.includes(id))return item.type==='ammo'?{...rules.ammo,chance:.94}:rules.common;
    if(item.type==='ammo')return rules.ammo;
    if(!item.stackable)return rules.equipment;
    return rules.uncommon;
  }
  function day(s){const startHour=((s.player.time-s.worldClock)%24+24)%24;return Math.floor((s.worldClock+startHour)/24);}
  function ids(){return [...new Set([...Object.values(window.ZoneRPGWorld.locations).map(l=>l.trader).filter(Boolean),'v9_caravan'])];}
  function pool(id){return [...new Set([...common,...general,...(pools[id]||[])])].filter(x=>window.ZoneRPGItems.items[x]);}
  function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
  function generate(s,id){
    const current=day(s),stock={};for(const item of pool(id)){const r=rule(item),seed=String(s.worldState.seed)+':'+current+':'+id+':'+item;
      const roll=hash(seed)/4294967296;if(roll<r.chance)stock[item]=r.min+hash(seed+':qty')%(r.max-r.min+1);
    }return {day:current,stock};
  }
  function sync(s){s.traderStocks=s.traderStocks||{};for(const id of ids())if(s.traderStocks[id]?.day!==day(s))s.traderStocks[id]=generate(s,id);}
  function normalize(input,s){const result={};for(const id of ids()){const generated=generate(s,id),saved=input?.[id];
    if(saved?.day===generated.day&&saved.stock&&typeof saved.stock==='object')for(const item of Object.keys(generated.stock)){const n=saved.stock[item];if(Number.isFinite(n))generated.stock[item]=Math.max(0,Math.min(generated.stock[item],Math.floor(n)));}
    result[id]=generated;
  }return result;}
  window.ZoneRPGShops={rules,overrides,pools,rule,day,pool,generate,sync,normalize};
})();
