/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.currentKnowledgeTier = function currentKnowledgeTier(){const k=__ctx.state.bunker?.knowledge||0;let tier=__ctx.technologyTiers[0];for(const t of __ctx.technologyTiers)if(k>=t.knowledge)tier=t;return tier;};

__ctx.nextKnowledgeTier = function nextKnowledgeTier(){const k=__ctx.state.bunker?.knowledge||0;return __ctx.technologyTiers.find(t=>t.knowledge>k)||null;};

__ctx.isTechUnlocked = function isTechUnlocked(t){return (__ctx.state.bunker?.knowledge||0)>=t.knowledge;};

__ctx.techEffect = function techEffect(key){return __ctx.techCatalog.reduce((sum,t)=>sum+(__ctx.isTechUnlocked(t)?(t.effects?.[key]||0):0),0);};

__ctx.knowledgeBuildDiscount = function knowledgeBuildDiscount(){const k=__ctx.state.bunker?.knowledge||0,base=__ctx.clamp((k-8)*.0035,0,.28);return __ctx.clamp(base+__ctx.techEffect('buildDiscount'),0,.38);};

__ctx.industrialInputDiscount = function industrialInputDiscount(){const k=__ctx.state.bunker?.knowledge||0,base=__ctx.clamp((k-12)*.0016,0,.14);return __ctx.clamp(base+__ctx.techEffect('industrialInputDiscount'),0,.30);};

__ctx.totalBuildDiscount = function totalBuildDiscount(){return __ctx.clamp(__ctx.knowledgeBuildDiscount()+(__ctx.state.reserveBuildDiscount||0),0,.50);};

__ctx.calculateModuleCost = function calculateModuleCost(key,level=0){const m=__ctx.modules[key];if(!m)return{};const upgrade=1+level*.38,eff=1-__ctx.totalBuildDiscount(),cost: any={};for(const [r,v] of __ctx.entries(m.cost))cost[r]=Math.max(1,Math.ceil(v*upgrade*eff));return cost;};

__ctx.syncTechnologyUnlocks = function syncTechnologyUnlocks(){if(!Array.isArray(__ctx.state.seenTechs))__ctx.state.seenTechs=[];const newly=__ctx.techCatalog.filter(t=>__ctx.isTechUnlocked(t)&&!__ctx.state.seenTechs.includes(t.id));if(!newly.length)return;__ctx.state.seenTechs.push(...newly.map(t=>t.id));const names=newly.map(t=>t.name).join(', ');__ctx.logMsg(`🔬 Освоены новые технологии: ${names}.`,'good');if(newly.length===1)__ctx.notify_aiSpeak(`Диспетчер убежища. Освоена технология ${newly[0].name}.`,'queue');else __ctx.notify_aiSpeak(`Диспетчер убежища. Освоен новый технологический пакет. Открыто технологий: ${newly.length}.`,'queue');};

__ctx.operationalProductionMultiplier = function operationalProductionMultiplier(resource){
 let mult=1;
 if(__ctx.state.optimizationTarget===resource)mult*=1.22;
 if(__ctx.state.mobilizationTarget){mult*=__ctx.state.mobilizationTarget===resource?1.35:.88;}
 return __ctx.clamp(mult,.78,1.55);
};

__ctx.useOrgReserve = function useOrgReserve(kind){
 if((__ctx.state.orgReserve||0)<1){__ctx.logMsg('Для этой меры нужна 1 единица организационного резерва.','warn');__ctx.invalidate();return;}
 if(kind==='build'){
  if((__ctx.state.reserveBuildDiscount||0)>=.16){__ctx.logMsg('На следующую стройку уже направлен максимальный инженерный резерв.','warn');__ctx.invalidate();return;}
  __ctx.state.orgReserve=Math.round((__ctx.state.orgReserve-1)*10)/10;__ctx.state.reserveBuildDiscount=__ctx.clamp((__ctx.state.reserveBuildDiscount||0)+.08,0,.16);__ctx.logMsg(`📐 Организационный резерв направлен в проектирование: следующая стройка дополнительно дешевле на ${Math.round(__ctx.state.reserveBuildDiscount*100)}%.`,'good');
 }else if(kind==='expedition'){
  if((__ctx.state.expeditionPrep||0)>=2){__ctx.logMsg('Экспедиция уже подготовлена на максимальном уровне.','warn');__ctx.invalidate();return;}
  __ctx.state.orgReserve=Math.round((__ctx.state.orgReserve-1)*10)/10;__ctx.state.expeditionPrep=Math.min(2,(__ctx.state.expeditionPrep||0)+1);__ctx.logMsg(`🧭 Организационный резерв направлен на маршрут экспедиции: подготовка ${__ctx.state.expeditionPrep}/2.`,'good');
 }
 __ctx.invalidate();
};

__ctx.operationMaintenance = function operationMaintenance(){
 if(__ctx.state.actions<=0)return;if(__ctx.state.maintenanceUsedMonth===__ctx.state.month){__ctx.logMsg('Техническое обслуживание в этом месяце уже проводилось.','warn');__ctx.invalidate();return;}
 const keys=['integrity','water','power','thermal','medical'],sorted=keys.sort((a,b)=>(__ctx.state.bunker[a]||0)-(__ctx.state.bunker[b]||0)),softCap=Math.min(85,26+(__ctx.state.settlementLevel||0)*11+((__ctx.state.bunker.workshop||0)>=40?4:0)),strength=__ctx.clamp(.65+(__ctx.state.bunker.workshop||0)/120,.65,1.45);
 const beforeA=__ctx.state.bunker[sorted[0]]||0,beforeB=__ctx.state.bunker[sorted[1]]||0;if(beforeA<softCap)__ctx.state.bunker[sorted[0]]=Math.min(softCap,beforeA+strength);if(beforeB<softCap)__ctx.state.bunker[sorted[1]]=Math.min(softCap,beforeB+strength*.45);const gainA=(__ctx.state.bunker[sorted[0]]||0)-beforeA,gainB=(__ctx.state.bunker[sorted[1]]||0)-beforeB;__ctx.state.maintenancePrepared=true;__ctx.state.maintenanceUsedMonth=__ctx.state.month;__ctx.state.actions--;
 __ctx.logMsg(`🔧 Проведено профилактическое обслуживание: ${gainA>0?`${__ctx.labelB(sorted[0])} +${gainA.toFixed(1)}, `:''}${gainB>0?`${__ctx.labelB(sorted[1])} +${gainB.toFixed(1)}. `:''}Риск поломок следующего месяца снижен.`,'good');__ctx.invalidate();
};

__ctx.operationOptimize = function operationOptimize(){
 if(__ctx.state.actions<=0)return;if(__ctx.state.optimizationUsedMonth===__ctx.state.month){__ctx.logMsg('Инженерная оптимизация в этом месяце уже проведена.','warn');__ctx.invalidate();return;}
 const target=__ctx.input('opOptimizeTarget')?.value||'steel';__ctx.state.optimizationTarget=target;__ctx.state.optimizationUsedMonth=__ctx.state.month;__ctx.state.actions--;
 __ctx.logMsg(`📐 Инженерная оптимизация: выпуск ресурса «${__ctx.labelRes(target)}» в следующем месяце получит +22%.`,'good');__ctx.invalidate();
};

__ctx.operationTraining = function operationTraining(){
 if(__ctx.state.actions<=0)return;if(__ctx.state.trainingUsedMonth===__ctx.state.month){__ctx.logMsg('Учебная смена в этом месяце уже проведена.','warn');__ctx.invalidate();return;}
 const w=__ctx.workforceData(),gain=__ctx.clamp(.22+(__ctx.state.specialists||0)/220+(__ctx.state.settlementLevel||0)*.045,.22,.68);__ctx.state.bunker.knowledge+=gain;__ctx.state.trainingProgress=(__ctx.state.trainingProgress||0)+1+Math.min(.5,(__ctx.state.bunker.workshop||0)/100);__ctx.state.trainingUsedMonth=__ctx.state.month;__ctx.state.actions--;__ctx.state.morale=__ctx.clamp(__ctx.state.morale+.2,0,100);
 let trained='';if(__ctx.state.trainingProgress>=5&&__ctx.state.specialists<Math.floor(__ctx.state.population*.5)){__ctx.state.trainingProgress-=5;__ctx.state.specialists++;trained=' Подготовлен новый специалист.';}
 __ctx.syncTechnologyUnlocks();__ctx.logMsg(`🎓 Учебная смена: знания +${gain.toFixed(2)}.${trained}`,'good');__ctx.invalidate();
};

__ctx.operationMobilize = function operationMobilize(){
 if(__ctx.state.actions<=0)return;if(__ctx.state.mobilizationUsedMonth===__ctx.state.month){__ctx.logMsg('Чрезвычайная мобилизация в этом месяце уже проводилась.','warn');__ctx.invalidate();return;}
 const target=__ctx.input('opMobilizeTarget')?.value||'food';__ctx.state.mobilizationTarget=target;__ctx.state.mobilizationUsedMonth=__ctx.state.month;__ctx.state.actions--;__ctx.state.morale=__ctx.clamp(__ctx.state.morale-2,0,100);
 __ctx.logMsg(`🚨 Чрезвычайная мобилизация: «${__ctx.labelRes(target)}» +35% к выпуску в следующем месяце, прочие производства −12%, мораль −2.`,'warn');__ctx.invalidate();
};

__ctx.operationPrepareExpedition = function operationPrepareExpedition(){
 if(__ctx.state.actions<=0)return;if((__ctx.state.expeditionPrep||0)>=2){__ctx.logMsg('Маршрут и оснащение следующей экспедиции уже подготовлены максимально.','warn');__ctx.invalidate();return;}
 __ctx.state.actions--;__ctx.state.expeditionPrep=Math.min(2,(__ctx.state.expeditionPrep||0)+1);__ctx.logMsg(`🧭 Подготовлена следующая экспедиция: уровень ${__ctx.state.expeditionPrep}/2. Риск ниже, грузоподъёмность выше.`,'good');__ctx.invalidate();
};

__ctx.clearOperationalTurnEffects = function clearOperationalTurnEffects(){__ctx.state.optimizationTarget=null;__ctx.state.mobilizationTarget=null;__ctx.state.maintenancePrepared=false;};

__ctx.constructionMultiplier = function constructionMultiplier(){const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;return __ctx.clamp(.92+(w.effective/220)*policy.build+(__ctx.state.specialists||0)/500+(__ctx.state.settlementLevel||0)*.025,.92,1.55)};

__ctx.runIndustrialChains = function runIndustrialChains(){
 const result: any={},w=__ctx.workforceData(),powerFactor=__ctx.clamp((__ctx.state.bunker.power||0)/40,.35,1.55),skill=__ctx.clamp(.55+w.effective/100+(__ctx.state.bunker.knowledge||0)/180,.55,1.8),inputFactor=1-__ctx.industrialInputDiscount();
 for(const [key,ch] of __ctx.entries(__ctx.industryChains)){
  const lvl=__ctx.state.built[ch.building]||0;if(lvl<=0){result[key]={level:0,scale:0,produced:{},consumed:{},inputFactor};continue;}
  const desired=lvl*powerFactor*skill;let scale=1;
  for(const [r,amt] of __ctx.entries(ch.inputs)){const effectiveAmt=amt*inputFactor,reserve=(ch.reserves&&ch.reserves[r])||0,available=Math.max(0,(__ctx.state.resources[r]||0)-reserve);scale=Math.min(scale,available/Math.max(.0001,effectiveAmt*desired));}
  scale=__ctx.clamp(scale,0,1);const consumed: any={},produced: any={};
  for(const [r,amt] of __ctx.entries(ch.inputs)){const q=amt*inputFactor*desired*scale;__ctx.state.resources[r]-=q;consumed[r]=q;}
  for(const [r,amt] of __ctx.entries(ch.outputs)){let q=amt*desired*scale;if(__ctx.state.scenario==='epidemic'&&key==='pharma')q*=1+(__ctx.state.built.vaccine||0)*.12;if(key==='pharma')q*=1+__ctx.techEffect('pharmaOutput');q*=__ctx.operationalProductionMultiplier(r);__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+q;produced[r]=q;}
  result[key]={level:lvl,scale,produced,consumed,inputFactor};
 }
 return result;
};

__ctx.buildModule = function buildModule(key){
 if(!__ctx.state.site||__ctx.state.actions<=0)return;const m=__ctx.modules[key];if(!m||(m.scenario&&m.scenario!==__ctx.state.scenario))return;const level=__ctx.state.built[key]||0,cost=__ctx.calculateModuleCost(key,level);
 if(!__ctx.canPay(cost)){__ctx.logMsg(`Не хватает ресурсов для «${m.name}».`,'bad');__ctx.invalidate();return}
 const labor=__ctx.constructionMultiplier(),reserveUsed=__ctx.state.reserveBuildDiscount||0;__ctx.pay(cost);__ctx.applyEffect(Object.fromEntries(__ctx.entries(m.effect).map(([k,v])=>[k,Math.ceil(v*Math.max(.20,1-level*.08)*labor)])));__ctx.state.built[key]=level+1;__ctx.state.actions--;__ctx.state.reserveBuildDiscount=0;__ctx.updateSettlementStage();
 __ctx.logMsg(`${m.icon} Построено: ${m.name}, уровень ${level+1}. Эффективность бригад: ${Math.round(labor*100)}%${reserveUsed?` · организационный резерв дал ещё −${Math.round(reserveUsed*100)}% к стоимости`:''}.`,'good');if(['radioCenter','biolab','vaccine','solarFarm','shieldHall','greenhouse','habitat'].includes(key)||((__ctx.state.built[key]||0)>=2&&__ctx.random()<.25)){__ctx.notify_aiSpeak(`Диспетчер убежища. Объект ${m.name} введён в эксплуатацию.`, 'queue');}__ctx.invalidate();
};

__ctx.maintenanceCost = function maintenanceCost(){const n=__ctx.values(__ctx.state.built||{}).reduce((a,b)=>a+b,0),advanced=(__ctx.state.built.machinePlant||0)+(__ctx.state.built.fab||0)+(__ctx.state.built.biolab||0)+(__ctx.state.built.vaccine||0);return {parts:Math.round((.25+n*.035)*100)/100,precisionParts:__ctx.state.month>__ctx.state.prepMonths&&advanced>0?Math.round((.08+advanced*.035)*100)/100:0};};

__ctx.printerCycle = function printerCycle(preview=false,virtualResources=null){
 const lvl=Math.min(5,__ctx.state.built.printer||0),mode=__ctx.state.printerMode||'balanced',res=virtualResources||__ctx.state.resources;
 if(lvl<1||mode==='off'||__ctx.state.bunker.power<8)return {level:lvl,scale:0,produced:{},consumed:{},status:!lvl?'Не построен':mode==='off'?'Линия остановлена':'Недостаточно мощности'};
 const cfg=__ctx.printerLevels[lvl-1],power=__ctx.clamp((__ctx.state.bunker.power||0)/26,.2,1.3)*__ctx.environmentImpact().powerFactor,skill=__ctx.clamp(.75+(__ctx.state.bunker.knowledge||0)/160,.75,1.3),factor=power*skill;
 const precise=mode==='precision'&&lvl>=2,basicOut=cfg.basic*(precise?.4:1)*factor,precisionOut=cfg.precise*(precise?1.65:1)*factor;
 const inputs: any={steel:(.7+lvl*.28)*factor,electronics:(.12+lvl*.10)*(precise?1.3:1)*factor,fuel:(.12+lvl*.045)*factor};let scale=1;
 for(const [r,v] of __ctx.entries(inputs))scale=Math.min(scale,Math.max(0,(res[r]||0)-(r==='fuel'?2:r==='electronics'?1:1))/Math.max(.01,v));
 scale=__ctx.clamp(scale,0,1);const consumed: any={},produced: any={parts:basicOut*scale,precisionParts:precisionOut*scale};
 for(const [r,v] of __ctx.entries(inputs)){consumed[r]=v*scale;if(!preview)__ctx.recordUse(r,v*scale);}
 if(!preview)for(const [r,v] of __ctx.entries(produced)){__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+v;__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+v;}
 return {level:lvl,scale,produced,consumed,status:scale<.02?'Нет сырья':scale<.95?'Частичная загрузка':'Производство работает'};
};

__ctx.printerRequirement = function printerRequirement(level){if(level>=5)return 'Максимальный уровень';const need=__ctx.printerLevels[level]?.need||{};return __ctx.entries(need).filter(([k,v])=>(__ctx.state.bunker[k]||0)<v).map(([k,v])=>`${__ctx.labelB(k)} ${Math.round(__ctx.state.bunker[k]||0)}/${v}`).join(' · ');};

__ctx.gearData = function gearData(){let best: any={id:null,reduction:0,bonus:0,durability:0,name:'Без специального оснащения'};for(const [id,g] of __ctx.entries(__ctx.gearCatalog)){const d=__ctx.clamp(__ctx.state.gear?.[id]||0,0,100);if(d>0&&g.reduction*(.55+d*.0045)>best.reduction)best={...g,id,reduction:g.reduction*(.55+d*.0045),bonus:g.bonus*(.55+d*.0045),durability:d};}return best;};

__ctx.wearGear = function wearGear(remote=false){const gd=__ctx.gearData(),id=remote?'scoutDrone':gd.id;if(!id||!(__ctx.state.gear[id]>0))return;const loss=remote?6:4+(__ctx.state.environment?.severity||0)*.035;__ctx.state.gear[id]=Math.max(0,__ctx.state.gear[id]-loss);if(__ctx.state.gear[id]===0)__ctx.logMsg(`Оснащение «${__ctx.gearCatalog[id].name}» выработало ресурс. Отремонтируйте его перед следующим выходом.`,'warn');};

__ctx.craftGear = function craftGear(id){const g=__ctx.gearCatalog[id];if(!g||__ctx.state.ended||!__ctx.state.site||__ctx.state.event||__ctx.state.actions<=0||__ctx.state.bunker.power<8)return;if((__ctx.state.built.printer||0)<g.level||!__ctx.canPay(g.cost)||(__ctx.state.gear[id]||0)>0)return;__ctx.pay(g.cost);__ctx.state.gear[id]=100;__ctx.state.actions--;const text=`Изготовлено оснащение: ${g.name}. Ресурс 100%. Защита применяется ко всем внешним миссиям автоматически.`;__ctx.logMsg(text,'good');__ctx.voice?.say('gearReady',text,'normal');__ctx.notify_playEventCue('gear');__ctx.invalidate();};

__ctx.repairGear = function repairGear(id){const g=__ctx.gearCatalog[id],d=__ctx.state.gear?.[id];if(!g||d===undefined||d>=100||__ctx.state.ended||__ctx.state.event||__ctx.state.actions<=0)return;const cost: any={parts:2,precisionParts:g.level-1};if((__ctx.state.built.printer||0)<2||!__ctx.canPay(cost))return;__ctx.pay(cost);__ctx.state.gear[id]=100;__ctx.state.actions--;__ctx.logMsg(`Оснащение «${g.name}» восстановлено до 100%.`,'good');__ctx.invalidate();};

__ctx.setPrinterMode = function setPrinterMode(mode){if(!['balanced','precision','off'].includes(mode)||__ctx.state.ended||__ctx.state.event)return;if(mode==='precision'&&(__ctx.state.built.printer||0)<2)return;__ctx.state.printerMode=mode;__ctx.invalidate();};

__ctx.routeKnowledge = function routeKnowledge(){const n=__ctx.locationFor(__ctx.state.missionTarget);return n&&__ctx.state.terrain.known[n.y*__ctx.mapW+n.x]===2?.025:Math.min(.025,(__ctx.state.terrain.surveys||0)*.002);};

__ctx.routeCheckCurrent = function routeCheckCurrent(index,s=__ctx.state){
 if(index===49)return true; // The shelter itself never needs an outdoor scouting trip.
 const t=s.terrain,epoch=__ctx.mapEpoch(s);
 return t.known[index]===2&&t.checkedEpoch[index]===epoch&&(epoch===0||s.month-t.checkedAt[index]<=6);
};

__ctx.operationTreatment = function operationTreatment(){
 __ctx.ensureWorld();const preview=__ctx.medicalTreatmentPreview();if(!preview.available)return;
 __ctx.pay({medicine:preview.cost});__ctx.state.actions--;__ctx.state.treatmentUsedMonth=__ctx.state.month;
 __ctx.state.health=preview.after;
 __ctx.state.lastTreatment={month:__ctx.state.month,before:preview.health,after:__ctx.state.health,gain:preview.gain,cost:preview.cost,medical:preview.medical};
 __ctx.logMsg(`🩺 Медицинская смена: здоровье ${__ctx.medicalHealthText(preview.health)}% → ${__ctx.medicalHealthText(__ctx.state.health)}% (+${__ctx.medicalHealthText(preview.gain)} п.п.). Израсходовано медикаментов: ${__ctx.fmtResource(preview.cost)}. Лечение и восстановление проведены.`,'good');
 __ctx.evaluate();__ctx.invalidate();
};

__ctx.setServicePriority = function setServicePriority(value){if(!['balanced','medicine','food','industry'].includes(value)||__ctx.state.event||__ctx.state.ended)return;__ctx.state.balance.servicePriority=value;__ctx.logMsg('Приоритет смен обновлён. Обслуживание и выпуск учитывают общий доступный персонал.','');__ctx.invalidate();};
}
export const steps: Initialization[] = [
{ order:232, run(__ctx:Runtime){__ctx.operationMaintenance=function(){
 if(__ctx.state.actions<=0||__ctx.state.ended||__ctx.state.event||__ctx.state.maintenanceUsedMonth===__ctx.state.month)return;
 const complex=__ctx.state.month>__ctx.state.prepMonths||__ctx.state.settlementLevel>=2,cost: any={parts:1,precisionParts:complex?.5:0};
 if(!(__ctx.state.built.printer>0)||(complex&&__ctx.state.built.printer<2)||!__ctx.canPay(cost)){__ctx.logMsg(`Профилактика недоступна: ${complex?'нужен 3D-принтер ур. 2, 1 запчасть и 0,5 точной детали':'нужен 3D-принтер и 1 запчасть'}.`,'warn');__ctx.invalidate();return;}
 __ctx.pay(cost);const keys=['integrity','water','power','thermal','medical'].sort((a,b)=>(__ctx.state.bunker[a]||0)-(__ctx.state.bunker[b]||0)),softCap=Math.min(100,32+__ctx.state.settlementLevel*12),strength=1+(__ctx.state.built.printer||1)*.45+(__ctx.state.bunker.workshop||0)/100;
 const gains=keys.slice(0,2).map((k,i)=>{const before=__ctx.state.bunker[k];__ctx.state.bunker[k]=Math.max(before,Math.min(softCap,before+strength*(i?.55:1)));return `${__ctx.labelB(k)} +${__ctx.fmtResource(__ctx.state.bunker[k]-before)}`;});__ctx.state.actions--;__ctx.state.maintenancePrepared=true;__ctx.state.maintenanceUsedMonth=__ctx.state.month;__ctx.logMsg(`Профилактика с напечатанными деталями: ${gains.join(', ')}. Риск аварий следующего месяца снижен.`,'good');__ctx.invalidate();
};
} },
{ order:234, run(__ctx:Runtime){__ctx.originalBuildModule = __ctx.buildModule;
} },
{ order:235, run(__ctx:Runtime){__ctx.buildModule=function(key){if(__ctx.state.event||__ctx.state.ended)return;if(key==='printer'){const lvl=__ctx.state.built.printer||0,why=__ctx.printerRequirement(lvl);if(why){__ctx.logMsg(`Модернизация принтера: ${why}.`,'warn');__ctx.invalidate();return;}}__ctx.originalBuildModule(key);};
} },
{ order:382, run(__ctx:Runtime){__ctx.routeKnowledge=function(target=__ctx.state.missionTarget){const n=__ctx.locationFor(target);return n&&__ctx.state.terrain.known[n.y*9+n.x]===2?.025:Math.min(.025,(__ctx.state.terrain.surveys||0)*.002);};
} },
{ order:411, run(__ctx:Runtime){__ctx.routeKnowledge=function(target=__ctx.state.missionTarget){
 const n=__ctx.locationFor(target);
 return n?(__ctx.routeCheckCurrent(n.y*9+n.x)?.025:0):Math.min(.025,(__ctx.state.terrain.surveys||0)*.002);
};
} },
{ order:464, run(__ctx:Runtime){__ctx.runIndustrialChains=function(){
 const results: any={},w=__ctx.workforceData(),sv=__ctx.physicalServicesNow||__ctx.physicalServices(),power=__ctx.clamp(__ctx.state.bunker.power/40,.35,1.55)*sv.power,skill=__ctx.clamp(.55+w.effective/100+__ctx.state.bunker.knowledge/180,.55,1.8),inputFactor=1-__ctx.industrialInputDiscount();
 for(const [key,ch] of __ctx.entries(__ctx.industryChains)){
  const lvl=__ctx.state.built[ch.building]||0,desired=lvl*power*skill*__ctx.physicalDayFraction;let scale=lvl>0?1:0;
  for(const [r,q] of __ctx.entries(ch.inputs))scale=Math.min(scale,Math.max(0,(__ctx.state.resources[r]||0)-(ch.reserves?.[r]||0))/Math.max(.000001,q*inputFactor*desired));
  scale=__ctx.clamp(scale,0,1);const consumed: any={},produced: any={};
  for(const [r,q] of __ctx.entries(ch.inputs)){consumed[r]=q*inputFactor*desired*scale;__ctx.recordUse(r,consumed[r]);}
  for(const [r,q] of __ctx.entries(ch.outputs)){let value=q*desired*scale*(key==='pharma'?(1+__ctx.techEffect('pharmaOutput'))*(__ctx.state.scenario==='epidemic'?1+(__ctx.state.built.vaccine||0)*.12:1):1)*__ctx.operationalProductionMultiplier(r);__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+value;__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+value;produced[r]=value;}
  results[key]={level:lvl,scale,consumed,produced,inputFactor};
 }return results;
};
} },
{ order:465, run(__ctx:Runtime){__ctx.printerCycle=function(preview=false,virtualResources=null){
 const lvl=Math.min(5,__ctx.state.built.printer||0),mode=__ctx.state.printerMode||'balanced',res=virtualResources||__ctx.state.resources,sv=__ctx.physicalServicesNow||__ctx.physicalServices();
 if(!lvl||mode==='off'||__ctx.state.bunker.power<8)return {level:lvl,scale:0,produced:{},consumed:{},status:!lvl?'Не построен':mode==='off'?'Линия остановлена':'Недостаточно мощности'};
 const cfg=__ctx.printerLevels[lvl-1],precise=mode==='precision'&&lvl>=2,factor=__ctx.clamp(__ctx.state.bunker.power/26,.2,1.3)*sv.power*__ctx.clamp(.75+__ctx.state.bunker.knowledge/160,.75,1.3)*(preview?1:__ctx.physicalDayFraction);
 const inputs: any={steel:(.7+lvl*.28)*factor,electronics:(.12+lvl*.1)*(precise?1.3:1)*factor,fuel:(.12+lvl*.045)*factor};let scale=1;
 for(const [r,q] of __ctx.entries(inputs))scale=Math.min(scale,Math.max(0,(res[r]||0)-(r==='fuel'?2:1))/Math.max(.00001,q));
 const produced: any={parts:cfg.basic*(precise?.4:1)*factor*scale,precisionParts:cfg.precise*(precise?1.65:1)*factor*scale},consumed: any={};
 for(const [r,q] of __ctx.entries(inputs)){consumed[r]=q*scale;if(!preview)__ctx.recordUse(r,q*scale);}
 if(!preview)for(const [r,q] of __ctx.entries(produced)){__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+q;__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+q;}
 return {level:lvl,scale,produced,consumed,status:scale<.02?'Нет сырья':scale<.95?'Частичная загрузка':'Производство работает'};
};
} },
{ order:498, run(__ctx:Runtime){__ctx.physicalBuild = __ctx.buildModule;
} },
{ order:499, run(__ctx:Runtime){__ctx.buildModule=function(key){__ctx.ensureWorld();const old: any={...__ctx.state.bunker},lvl=__ctx.state.built[key]||0;__ctx.physicalBuild(key);if((__ctx.state.built[key]||0)>lvl){for(const k of __ctx.physicalKeys){const gain=(__ctx.state.bunker[k]||0)-(old[k]||0);if(gain>0)__ctx.state.physical.design[k]=(__ctx.state.physical.design[k]||0)+gain;}if(key==='decon')__ctx.voice?.say('decon_ready','Станция дезактивации готова. Наружные грузы и карантинный приём доступны.','normal');}};
} },
{ order:503, run(__ctx:Runtime){__ctx.physicalMaintenance = __ctx.operationMaintenance;
} },
{ order:504, run(__ctx:Runtime){__ctx.operationMaintenance=function(){__ctx.ensureWorld();const old: any={...__ctx.state.bunker};__ctx.physicalMaintenance();for(const k of __ctx.physicalKeys){const gain=(__ctx.state.bunker[k]||0)-(old[k]||0);if(gain>0){__ctx.state.physical.design[k]=Math.max(__ctx.state.physical.design[k],__ctx.state.bunker[k]);__ctx.state.physical.condition[k]=__ctx.state.bunker[k]/Math.max(1,__ctx.state.physical.design[k]);}}};
} },
{ order:506, run(__ctx:Runtime){__ctx.operationTreatment=function(){const before=__ctx.state.health;__ctx.physicalTreatment();if(__ctx.state.health>before){__ctx.state.physical.patients=Math.max(0,__ctx.state.physical.patients-(__ctx.state.health-before)*.2);__ctx.state.physical.healthLedger.treatment=(__ctx.state.physical.healthLedger.treatment||0)+__ctx.state.health-before;}};
} },
{ order:574, run(__ctx:Runtime){__ctx.balancedConstruction = __ctx.constructionMultiplier;
} },
{ order:575, run(__ctx:Runtime){__ctx.constructionMultiplier=function(){return 1;};
} },
{ order:578, run(__ctx:Runtime){__ctx.balancedModuleCost = __ctx.calculateModuleCost;
} },
{ order:579, run(__ctx:Runtime){__ctx.calculateModuleCost=function(key,level=0){const cost=__ctx.balancedModuleCost(key,level);if(!__ctx.state.balance?.legacy&&['shell','depth','shelterWard'].includes(key)){const discount=Math.min(.12,__ctx.totalBuildDiscount());for(const r of ['concrete','steel'])if(__ctx.modules[key].cost[r])cost[r]=Math.max(1,Math.ceil(__ctx.modules[key].cost[r]*(1+level*.38)*(1-discount)));}return cost;};
} },
{ order:580, run(__ctx:Runtime){__ctx.operationMaintenance=function(){
 __ctx.ensureWorld();if(__ctx.state.actions<=0||__ctx.state.ended||__ctx.state.event||__ctx.state.maintenanceUsedMonth===__ctx.state.month)return;
 const complex=__ctx.state.month>__ctx.state.prepMonths||__ctx.state.settlementLevel>=2,cost: any={parts:1,precisionParts:complex?.5:0};
 if(!(__ctx.state.built.printer>0)||(complex&&__ctx.state.built.printer<2)||!__ctx.canPay(cost)){__ctx.logMsg('Для профилактики нужны принтер, напечатанные детали и подходящий уровень точности.','warn');__ctx.invalidate();return;}
 __ctx.pay(cost);const p=__ctx.state.physical,keys=__ctx.physicalKeys.filter(k=>(p.design[k]||0)>0).sort((a,b)=>(__ctx.state.bunker[a]/p.design[a])-(__ctx.state.bunker[b]/p.design[b])),gains=[];
 for(const [i,k] of keys.slice(0,2).entries()){const before=__ctx.state.bunker[k]||0,max=p.design[k],strength=(1+__ctx.state.built.printer*.45+__ctx.state.bunker.workshop/100)*(i?.55:1);__ctx.state.bunker[k]=Math.min(max,before+strength);p.condition[k]=__ctx.state.bunker[k]/max;if(__ctx.state.bunker[k]>before)gains.push(__ctx.labelB(k)+' +'+__ctx.fmtResource(__ctx.state.bunker[k]-before));}
 __ctx.state.actions--;__ctx.state.maintenancePrepared=true;__ctx.state.maintenanceUsedMonth=__ctx.state.month;__ctx.logMsg('Профилактика: '+(gains.length?gains.join(', ')+'. ':'Оборудование исправно. ')+'Риск поломок снижен; установленная мощность не меняется.','good');__ctx.invalidate();
};
} },
{ order:586, run(__ctx:Runtime){__ctx.balancedPrinterCycle = __ctx.printerCycle;
} },
{ order:587, run(__ctx:Runtime){__ctx.printerCycle=function(preview=false,virtualResources=null){const f=__ctx.physicalDayFraction,c=__ctx.servicePlan().coverage.printer??1,annotate=r=>{r.staffCoverage=c;r.scale*=c;if(c<.05&&r.level)r.status='Нет персонала';else if(c<.95&&r.level)r.status='Неполная смена';return r;};if(preview){const result=__ctx.balancedPrinterCycle(true,virtualResources);for(const key of ['produced','consumed'])for(const k of Object.keys(result[key]))result[key][k]*=c;return annotate(result);}__ctx.physicalDayFraction*=c;try{return annotate(__ctx.balancedPrinterCycle(false,virtualResources));}finally{__ctx.physicalDayFraction=f;}};
} },
{ order:588, run(__ctx:Runtime){__ctx.runIndustrialChains=function(){
 const results: any={},sp=__ctx.servicePlan(),sv=__ctx.physicalServicesNow||__ctx.physicalServices(),power=__ctx.clamp(__ctx.state.bunker.power/40,.35,1.55)*sv.power,skill=__ctx.clamp(.55+__ctx.workforceData().effective/100+__ctx.state.bunker.knowledge/180,.55,1.8),inputFactor=1-__ctx.industrialInputDiscount();
 for(const [key,ch] of __ctx.entries(__ctx.industryChains)){
  const lvl=__ctx.state.built[ch.building]||0,desired=lvl*power*skill*__ctx.physicalDayFraction*(sp.coverage[key]??1);let scale=lvl>0&&desired>0?1:0;
  for(const [r,q] of __ctx.entries(ch.inputs))scale=Math.min(scale,Math.max(0,(__ctx.state.resources[r]||0)-(ch.reserves?.[r]||0))/Math.max(.000001,q*inputFactor*desired));
  const rawRate=key==='cement'?1.1:key==='smelter'?1.2:0;if(rawRate)scale=Math.min(scale,__ctx.state.balance.feedstock/Math.max(.000001,rawRate*desired));
  scale=__ctx.clamp(scale,0,1);const consumed: any={},produced: any={};for(const [r,q] of __ctx.entries(ch.inputs)){consumed[r]=q*inputFactor*desired*scale;__ctx.recordUse(r,consumed[r]);}
  const rawConsumed=rawRate*desired*scale;__ctx.state.balance.feedstock=Math.max(0,__ctx.state.balance.feedstock-rawConsumed);__ctx.state.balance.lastFeedstockUsed=(__ctx.state.balance.lastFeedstockUsed||0)+rawConsumed;
  for(const [r,q] of __ctx.entries(ch.outputs)){const value=q*desired*scale*(key==='pharma'?(1+__ctx.techEffect('pharmaOutput'))*(__ctx.state.scenario==='epidemic'?1+(__ctx.state.built.vaccine||0)*.12:1):1)*__ctx.operationalProductionMultiplier(r);__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+value;__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+value;produced[r]=value;}
  results[key]={level:lvl,scale,consumed,produced,rawConsumed,inputFactor,staffCoverage:sp.coverage[key]??1};
 }return results;
};
} }
];
