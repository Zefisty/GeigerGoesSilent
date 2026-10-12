(() => {
  const {KEY,VERSION,LEGACY_VERSIONS=[]}=window.ZoneRPGState;
  const KEYS={auto:'zonerpg_autosave',manual:'zonerpg_manual_save'},MIGRATED='zonerpg_dual_save_initialized';
  function parse(raw){
    if(!raw)return{ok:false,reason:'empty'};
    try{const data=JSON.parse(raw);if(!data||![...LEGACY_VERSIONS,VERSION].includes(data.version))return{ok:false,reason:'version'};
      return{ok:true,data,migrate:data.version!==VERSION};
    }catch{return{ok:false,reason:'corrupt'};}
  }
  function migrateLegacy(){
    try{
      if(localStorage.getItem(MIGRATED))return;
      if(Object.values(KEYS).some(key=>localStorage.getItem(key))){localStorage.setItem(MIGRATED,'1');return;}
      const raw=localStorage.getItem(KEY);
      if(!parse(raw).ok)return;
      // Keep the original backup. Copy exactly, then use the existing schema
      // sanitizer on load; migration never silently loads a game.
      localStorage.setItem(KEYS.manual,raw);localStorage.setItem(KEYS.auto,raw);
      localStorage.setItem(MIGRATED,'1');
    }catch{/* A quota or unavailable storage must not destroy the original. */}
  }
  function read(type='manual'){
    migrateLegacy();
    try{const raw=localStorage.getItem(KEYS[type]||KEYS.manual);return parse(raw||(!localStorage.getItem(MIGRATED)?localStorage.getItem(KEY):null));}catch{return{ok:false,reason:'unavailable'};}
  }
  function write(state,type='manual'){
    if(!KEYS[type])return{ok:false,reason:'slot'};
    migrateLegacy();
    try{
      const data={...state,event:state.event?state.event.id.startsWith('arrival_')?state.event:{id:state.event.id,flow:state.event.flow}:null,
        combat:state.combat?{...state.combat,enemy:{hp:state.combat.enemy.hp,maxHp:state.combat.enemy.maxHp}}:null,
        version:VERSION,savedAt:new Date().toISOString(),saveType:type};
      localStorage.setItem(KEYS[type],JSON.stringify(data));
      // Presence of a new slot prevents stale legacy copies returning later.
      localStorage.setItem(MIGRATED,'1');return{ok:true};
    }catch(error){return{ok:false,reason:error?.name==='QuotaExceededError'?'quota':'unavailable'};}
  }
  function remove(type){
    migrateLegacy();
    try{localStorage.setItem(MIGRATED,'1');for(const slot of type?[type]:Object.keys(KEYS))if(KEYS[slot])localStorage.removeItem(KEYS[slot]);return true;}catch{return false;}
  }
  function slots(){
    return Object.keys(KEYS).flatMap(type=>{
      const result=read(type);if(!result.ok)return [];
      const s=result.data,p=s.player||{},rank=window.ZoneRPGRank.calculate({...s,player:p,attributes:s.attributes||{},weaponMastery:s.weaponMastery||{}});
      return [{type,savedAt:s.savedAt||null,location:p.location,level:p.rank||1,rank:rank.name,background:s.backgroundId||'rookie'}];
    });
  }
  window.ZoneRPGSave={KEYS,read,write,remove,slots,migrateLegacy,has:()=>slots().length>0};
})();
