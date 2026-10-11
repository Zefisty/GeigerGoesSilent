const {runtime}=require('./runtime.cjs');
function audit(r){
 const issues=[],strings=[];
 const check=(where,text)=>{if(typeof text!=='string')return;strings.push({where,text});
  if(/\$\{|\?\.|\b(?:undefined|NaN|nextStage|combatWon|explorationCount|legendaryEvents|worldState|TODO|placeholder)\b|\b[a-z]+_[a-z0-9_]+\b/.test(text))issues.push(where+': code/internal identifier');
  if(/\[(?:ИМЯ|НАЗВАНИЕ)|текст заглушки/i.test(text))issues.push(where+': placeholder');
  const sentences=text.split(/[.!?]+[»”]?\s*/).map(x=>x.trim()).filter(Boolean);
  for(let n=1;n<sentences.length;n++)if(sentences[n]===sentences[n-1])issues.push(where+': consecutive duplicate');
  if(/^(?:Проверка успешна|Событие завершено|Получена награда|Неудача)[.!]?$/.test(text))issues.push(where+': generic result');
 };
 for(const e of r.W.events){check(e.id+'.title',e.category);check(e.id+'.intro',e.text);const stages=e.stages||[{id:'main',text:e.text,choices:e.choices}];
  for(const st of stages){check(e.id+'.'+st.id,st.text);for(const c of st.choices||[]){for(const key of ['label','resultText','winText','fleeText'])check(e.id+'.'+st.id+'.'+key,c[key]);
   if(c.nextStage&&!stages.some(s=>s.id===c.nextStage))issues.push(e.id+': broken nextStage '+c.nextStage);
   if(c.nextEvent&&!r.W.events.some(e=>e.id===c.nextEvent))issues.push(e.id+': broken nextEvent '+c.nextEvent);
   for(const id of Object.keys({...c.effects?.add,...c.effects?.itemCost,...c.when?.items}))if(!r.I.items[id])issues.push(e.id+': missing item '+id);
   if(c.combat&&c.combat!=='autoMutant'&&!r.W.enemyTypes[c.enemyId||c.combat])issues.push(e.id+': missing enemy');
  }}
 }
 for(const q of r.W.quests){check(q.id+'.title',q.title);check(q.id+'.description',q.text);if(!r.W.people[q.giver])issues.push(q.id+': missing giver');}
 for(const [id,p]of Object.entries(r.W.people)){check(id+'.name',p.name);check(id+'.greeting',p.greeting);}
 for(const d of r.W.worldEvents)for(const key of ['title','description','startMessage','endResult'])check(d.id+'.'+key,d[key]);
 for(const loc of Object.keys(r.W.locations))for(const rumor of r.ctx.window.ZoneRPGKnowledge.pool(loc))check(rumor.id,rumor.text);
 return {events:r.W.events.length,quests:r.W.quests.length,strings:strings.length,changed:r.ctx.window.ZoneRPGNarrative.changed().length,issues};
}
if(require.main===module){const result=audit(runtime());console.log(JSON.stringify(result,null,2));if(result.issues.length)process.exitCode=1;}
module.exports={audit};
