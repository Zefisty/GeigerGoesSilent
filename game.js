(() => {
  const engine=window.ZoneRPGEngine,root=document.getElementById('app');
  const render=()=>window.ZoneRPGUI.render(engine.getState());
  function run(name,value,extra){engine.action(name,value,extra);}
  function focusPlayerName(select=false){const input=root.querySelector?.('.player-name-input');input?.focus();if(select)input?.select();}
  function cancelPlayerName(){window.ZoneRPGUI.cancelPlayerNameEdit();render();}
  function confirmPlayerName(){
    const ui=window.ZoneRPGUI;if(!ui.isPlayerNameEditing())return;
    const result=window.ZoneRPGState.validatePlayerName(ui.playerNameDraft());
    if(!result.ok){ui.setPlayerNameError(result.error);render();focusPlayerName();return;}
    ui.cancelPlayerNameEdit();run('renamePlayer',result.value);
  }
  function activate(el){const a=el.dataset.action,v=el.dataset.value,x=el.dataset.extra;
    if(['load','newGame','startGame','eventReturn'].includes(a))window.ZoneRPGFieldJournalUI.setCopyStatus('');
    if(a==='pinQuest'||a==='dismissExpeditionSummary'){run(a,v);return;}
    if(a==='copyExpeditionSummary'){
      const text=window.ZoneRPGFieldJournal.summaryText(engine.getState());
      const done=message=>{window.ZoneRPGFieldJournalUI.setCopyStatus(message);render();};
      if(!navigator.clipboard?.writeText){done('Скопируй текст из поля ниже.');return;}
      navigator.clipboard.writeText(text).then(()=>done('Итог скопирован.'),()=>done('Скопируй текст из поля ниже.'));return;
    }
    if(a==='close'&&engine.getState().expeditionReturn&&engine.getState().mode==='play'){run('dismissExpeditionSummary');return;}
    if(a==='editPlayerName'){if(engine.getState().mode!=='character')return;window.ZoneRPGUI.beginPlayerNameEdit(engine.getState());render();focusPlayerName(true);return;}
    if(a==='confirmPlayerName'){confirmPlayerName();return;}
    if(a==='restPicker'||a==='restPickerBack'){
      const s=engine.getState();if(a==='restPicker'&&(s.mode!=='play'||s.event||s.combat||s.expedition.active||s.travelTo))return;
      window.ZoneRPGUI.setRestPicker(a==='restPicker');render();return;
    }
    if(a==='restChoice'){
      const s=engine.getState();if(!window.ZoneRPGUI.isRestPickerOpen()||s.mode!=='play'||s.event||s.combat||s.expedition.active||s.travelTo||!['short','camp'].includes(v))return;
      run(v==='short'?'breath':'rest');const after=engine.getState();window.ZoneRPGUI.setRestPicker(after.worldClock===s.worldClock,after.log.at(-1)||'');render();return;
    }
    if(a==='close'&&window.ZoneRPGUI.isRestPickerOpen()){window.ZoneRPGUI.setRestPicker(false);render();return;}
    if(a==='savePicker'||a==='savePickerBack'){if(engine.getState().mode!=='menu')return;window.ZoneRPGUI.setSavePicker(a==='savePicker'&&engine.getState().hasSave);render();return;}
    if(a==='close'&&engine.getState().mode==='menu'&&window.ZoneRPGUI.isSavePickerOpen()){window.ZoneRPGUI.setSavePicker(false);render();return;}
    if(a==='databaseTab'){window.ZoneRPGUI.setDatabaseTab(v);run('readJournal',v);render();return;}
    if(a==='home'){run('mainMenu');return;}
    if(a==='panel'){if(engine.getState().expeditionReturn)run('dismissExpeditionSummary');if(v==='menu'){run('openPanel','pause');return;}run('openPanel',v);if(v==='encyclopedia')run('readJournal',window.ZoneRPGUI.getDatabaseTab());return;}
    if(a==='travelPanel'){run('openPanel','map');return;}
    if(a==='close'){run('closePanel');return;}
    if(a==='save'){run('save');return;}if(a==='notebook'||a==='news'){run(a,v,x);return;}
    if(['dismissHint','resetTutorial','mute','defend','zoneAction','zonePOI','zoneStudy','zoneService'].includes(a)){run(a,v,x);return;}
    if(a==='livingAction'||a==='storyAction'||a==='claimStoryRewards'||a==='questSearch'||a==='joinFaction'||a==='leaveFaction'||a==='researchQuest'){run(a,v,x);return;}
    if(a==='attack'||a==='aim'||a==='reload'||a==='flee'||a==='newGame'||a==='startGame'||a==='breath'||a==='load'||a==='deleteSave'||a==='deletePrompt'||a==='acceptQuest'||a==='turnIn'||a==='event'||a==='eventReturn'||a==='travel'||a==='explore'||a==='use'||a==='equipGear'||a==='equipSlot'||a==='equipWeapon'||a==='equipArmor'||a==='unequipSlot'||a==='switchWeapon'||a==='artifact'||a==='drop'||a==='buy'||a==='sell'||a==='rest'||a==='mainMenu'||a==='resume'||a==='npcAction'||a==='investAttribute'){run(a,v,x);return;}
    if(a==='combat'){if(v==='items')run('openPanel','combatItems');else if(v==='weapons')run('openPanel','combatWeapons');else if(v.startsWith('use:')){run('combatUse',v.slice(4));if(engine.getState().mode!=='dead')run('openPanel','combat');}else if(v.startsWith('weapon:')){run('equipWeapon',v.slice(7));run('openPanel','combat');}else run(v);return;}
    if(a==='saveInfo'){run('save');return;}
  }
  root.addEventListener('click',e=>{if(window.ZoneRPGUI.isPlayerNameEditing()&&!e.target.closest('[data-player-name-editor]'))cancelPlayerName();const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();window.ZoneRPGAudio?.unlock();if(['attack','reload','buy','sell','turnIn','acceptQuest'].includes(el.dataset.action)){el.disabled=true;setTimeout(()=>{if(el.isConnected)el.disabled=false;},180);}activate(el);});
  root.addEventListener('input',e=>{if(e.target.matches?.('.player-name-input')){window.ZoneRPGUI.updatePlayerNameDraft(e.target.value);return;}const item=e.target.dataset.shopQuantity;if(item){const row=engine.getState().shop?.stock.find(x=>x.id===item);if(!row)return;const qty=Math.max(1,Math.min(Number(e.target.max),Math.floor(Number(e.target.value)||1)));window.ZoneRPGUI.setShopQuantity(item,qty);const card=e.target.closest('[data-shop-item]');if(card){card.querySelector('output').textContent=String(qty);card.querySelector('.shop-total').textContent='Итого: '+(row.price*qty)+' ₽';card.querySelector('[data-action="buy"]').dataset.extra=String(qty);}return;}const name=e.target.dataset.setting;if(!['volume','musicVolume','effectsVolume'].includes(name))return;engine.action('setSetting',{key:name,value:Number(e.target.value),live:true});});
  root.addEventListener('change',e=>{const name=e.target.dataset.setting;if(!name)return;let value=e.target.value;if(value==='true')value=true;else if(value==='false')value=false;else if(['scale','volume','musicVolume','effectsVolume'].includes(name))value=Number(value);run('setSetting',{key:name,value});});
  window.addEventListener('keydown',e=>{const target=e.target;if(window.ZoneRPGUI.isPlayerNameEditing()&&!e.isComposing){if(e.key==='Escape'){e.preventDefault();cancelPlayerName();root.querySelector?.('[data-action="editPlayerName"]')?.focus();return;}if(e.key==='Enter'&&target?.matches('.player-name-input')){e.preventDefault();confirmPlayerName();return;}}if(target?.matches('input,select,textarea,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){const s=engine.getState();if(window.ZoneRPGUI.isRestPickerOpen()){window.ZoneRPGUI.setRestPicker(false);render();e.preventDefault();return;}if(s.mode==='menu'&&window.ZoneRPGUI.isSavePickerOpen()){window.ZoneRPGUI.setSavePicker(false);render();e.preventDefault();return;}if(s.mode==='menu'||s.mode==='dead')return;if(s.expeditionReturn&&s.mode==='play'){run('dismissExpeditionSummary');e.preventDefault();return;}if(s.mode==='play'){run('openPanel','pause');}else if(s.mode==='combatItems'||s.mode==='combatWeapons')run('openPanel','combat');else run('closePanel');e.preventDefault();return;}if(['i','m','j','c'].includes(k)){const s=engine.getState();if(!['play','event'].includes(s.mode)||s.combat)return;run('openPanel',({i:'inventory',m:'map',j:'quests',c:'character'})[k]);e.preventDefault();}});
  document.addEventListener?.('click',e=>{if(window.ZoneRPGUI.isPlayerNameEditing()&&!e.target.closest('[data-player-name-editor]')&&!e.target.closest('[data-action="editPlayerName"]'))cancelPlayerName();});
  engine.onChange(render);render();
})();
