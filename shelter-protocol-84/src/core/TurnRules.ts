/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.scenarioStageFlavor = function scenarioStageFlavor(sc,stage){const sets: any={ice:['лагерь разведчиков','укрытие с обогревом','ледяная колония','термальный узел','северный бастион','полярный город'],heat:['эвакуационный лагерь','охлаждаемая база','пустынная колония','водный узел','солнцезащитный купол','термостойкий город'],nuclear:['убежище первой волны','экранированная база','деконтаминационная колония','подземный узел','радиационный форпост','восстановленный город'],epidemic:['карантинный лагерь','изолированная база','санитарная колония','медицинский узел','биобезопасный форпост','стерильный город']}; return (sets[sc]||sets.ice)[Math.max(0,Math.min(stage,5))];};

__ctx.phaseSummary = function phaseSummary(phase){return ({'Предапокалипсис':'Окно подготовки ещё открыто, но время работает против нас.','Обрушение':'Инфраструктура рушится, а поверхность стремительно становится опасной.','Глубокий кризис':'Ставка сделана на автономность, дисциплину и выносливость.','Новая среда':'Внешний мир почти утрачен. Теперь выживание зависит только от устойчивости системы.'})[phase]||'Условия меняются. Поселение должно адаптироваться.'};

__ctx.bankUnusedActions = function bankUnusedActions(){
 const unused=Math.max(0,__ctx.state.actions||0);__ctx.state.reserveGeneratedLastMonth=0;
 if(unused<=0)return;
 const room=Math.max(0,2-(__ctx.state.orgReserve||0)),gain=Math.min(room,Math.round(unused*.4*10)/10);
 if(gain>0){__ctx.state.orgReserve=Math.round(((__ctx.state.orgReserve||0)+gain)*10)/10;__ctx.state.reserveGeneratedLastMonth=gain;__ctx.logMsg(`🗂️ Неиспользованная управленческая мощность преобразована в организационный резерв: +${gain.toFixed(1)}.`,'good');}
};

__ctx.freshState = function freshState(){return {
 scenario:null, city:null, site:null, month:0, prepMonths:18, year:0, phase:'Подготовка', actions:2, actionCapacity:2,
 targetPop:40, population:18, specialists:8, health:88, morale:78, hazard:0, cityAccess:100,
 resources:{concrete:120,steel:70,machinery:30,fuel:45,food:90,electronics:38,medicine:30},
 localScrap:24, recycleUsedMonth:-1,
 bunker:{integrity:28,shield:12,thermal:18,water:18,power:16,foodSystem:8,medical:8,workshop:6,storage:8,intel:5,knowledge:5,capacity:28,morale:0,biosecurity:0},
 built:{}, sites:[], event:null, log:[], score:0, ended:false, shortages:0, surfaceMissions:0, diff:1, uiTab:'build', initialPopulation:0, rescuedTotal:0, refugeeArrivals:0, refugeeAccepted:0, refugeeRefused:0, deathsTotal:0, refugeeIncidents:0, finalWin:null, lossCauses:{expedition:0,environment:0,refugees:0,other:0},
 laborPolicy:'balanced', settlementLevel:0, naturalGrowth:0, totalDeveloped:0, lastFoodProduced:0, lastFoodPotential:0, lastFoodNeed:0, lastWaterSupply:0, lastWaterHumanNeed:0, lastWaterForFood:0, lastWaterFarmUse:0, lastWaterDeficit:0, lastWaterFoodCapacity:0, lastProduction:{}, lastConsumption:{}, lastIndustrial:{}, history:[], saveVersion:12, lastDeepRaidMonth:-999, lastRadioSearchMonth:-999, lastTradeMonth:-999, radioContact:null, lastShortageAlertMonth:-999, lastHealthAlertMonth:-999, voiceEnabled:true, seenTechs:[], orgReserve:0, reserveBuildDiscount:0, expeditionPrep:0, maintenancePrepared:false, optimizationTarget:null, mobilizationTarget:null, trainingUsedMonth:-999, maintenanceUsedMonth:-999, optimizationUsedMonth:-999, mobilizationUsedMonth:-999, trainingProgress:0, reserveGeneratedLastMonth:0
}};

__ctx.startGame = async function startGame(scenario,targetPop,diff){__ctx.state.scenario=scenario;__ctx.state.targetPop=targetPop;__ctx.state.diff=diff;__ctx.state.city=__ctx.pick(__ctx.cityNames);__ctx.state.population=Math.max(14,Math.round(targetPop*.42));__ctx.state.initialPopulation=__ctx.state.population;__ctx.state.bunker.capacity=Math.max(20,Math.round(targetPop*.58));__ctx.state.sites=__ctx.shuffle(__ctx.siteTypes).slice(0,3).map((s,i)=>({...s,id:i}));__ctx.ensureWorld();__ctx.logMsg('Разведгруппа развёрнута в 8–16 км от города '+__ctx.state.city+'. До прогнозируемого перелома — около '+__ctx.state.prepMonths+' месяцев.','warn');__ctx.invalidate();__ctx.emit('started',{scenario});};

__ctx.shuffle = function shuffle(a){return [...a].sort(()=>__ctx.random()-.5)};

__ctx.logMsg = function logMsg(t,cls=''){__ctx.state.log.unshift({t,cls,m:__ctx.state.month}); if(__ctx.state.log.length>70)__ctx.state.log.pop()};

__ctx.canPay = function canPay(cost){return __ctx.entries(cost).every(([k,v])=>(__ctx.state.resources[k]||0)>=v)};

__ctx.pay = function pay(cost){__ctx.entries(cost).forEach(([k,v])=>__ctx.state.resources[k]-=v)};

__ctx.applyEffect = function applyEffect(e){__ctx.entries(e).forEach(([k,v])=>{if(k in __ctx.state.bunker)__ctx.state.bunker[k]+=v; else if(k==='morale')__ctx.state.morale+=v})};

__ctx.stageRequirementValue = function stageRequirementValue(key){
 if(key==='population')return __ctx.state.population;
 if(key==='resilience')return __ctx.resilience();
 if(key==='capacityRatio')return __ctx.state.population>0?__ctx.state.bunker.capacity/__ctx.state.population:1;
 if(key==='morale')return __ctx.state.morale;
 return __ctx.state.bunker[key]||0;
};

__ctx.stageEligible = function stageEligible(index){const st=__ctx.settlementStages[index];return !!st&&st.requirements.every(([key,val])=>__ctx.stageRequirementValue(key)>=val)};

__ctx.currentStage = function currentStage(){return __ctx.settlementStages[__ctx.state.settlementLevel||0]||__ctx.settlementStages[0]};

__ctx.updateSettlementStage = function updateSettlementStage(){
 let next=__ctx.state.settlementLevel||0;
 while(next+1<__ctx.settlementStages.length&&__ctx.stageEligible(next+1))next++;
 if(next>__ctx.state.settlementLevel){
   for(let lvl=__ctx.state.settlementLevel+1;lvl<=next;lvl++){
     const st=__ctx.settlementStages[lvl];__ctx.state.morale=__ctx.clamp(__ctx.state.morale+4,0,100);__ctx.state.bunker.knowledge+=2;__ctx.state.totalDeveloped++;
     __ctx.logMsg(`${st.icon} Поселение преобразовано: «${st.name}». Новая организация труда повышает эффективность.`,'good');__ctx.notify_aiNotice(`${st.icon} ${st.name}`,`Поселение вышло на новый уровень. ${st.desc}`,{cue:'good',type:'stage',sub:__ctx.scenarioStageFlavor(__ctx.state.scenario,lvl)});
   }
   __ctx.state.settlementLevel=next;
 }
};

__ctx.monthlyActionCapacity = function monthlyActionCapacity(){
 const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;
 const base=__ctx.state.month<=__ctx.state.prepMonths?2:1;
 const laborBonus=Math.floor(Math.max(0,w.effective*policy.build-12)/14);
 const stageBonus=Math.floor((__ctx.state.settlementLevel||0)/2);
 const workshopBonus=__ctx.state.bunker.workshop>=50?1:0;
 return __ctx.clamp(base+laborBonus+stageBonus+workshopBonus,1,7);
};

__ctx.setLaborPolicy = function setLaborPolicy(key){if(!__ctx.laborPolicies[key])return;__ctx.state.laborPolicy=key;__ctx.logMsg(`${__ctx.laborPolicies[key].icon} Режим труда: ${__ctx.laborPolicies[key].name}. Изменения полностью проявятся со следующего месяца.`,'');__ctx.invalidate()};

__ctx.recordHistory = function recordHistory(){if(!Array.isArray(__ctx.state.history))__ctx.state.history=[];__ctx.state.history.push({month:__ctx.state.month,hazard:__ctx.state.hazard,population:__ctx.state.population,stage:__ctx.state.settlementLevel,rescued:__ctx.state.rescuedTotal||0,deaths:__ctx.state.deathsTotal||0,production:{...(__ctx.state.lastProduction||{})},consumption:{...(__ctx.state.lastConsumption||{})},water:{supply:__ctx.state.lastWaterSupply||0,humanNeed:__ctx.state.lastWaterHumanNeed||0,forFood:__ctx.state.lastWaterForFood||0,farmUse:__ctx.state.lastWaterFarmUse||0,foodCapacity:__ctx.state.lastWaterFoodCapacity||0},resources:{...__ctx.state.resources}});if(__ctx.state.history.length>90)__ctx.state.history.shift();};

__ctx.nextStageRequirementsHTML = function nextStageRequirementsHTML(){
 const next=__ctx.settlementStages[(__ctx.state.settlementLevel||0)+1];if(!next)return `<p class="good">Достигнут высший уровень социальной трансформации.</p>`;
 return `<div class="reqList">${next.requirements.map(([key,val,label])=>{const cur=__ctx.stageRequirementValue(key),ok=cur>=val,show=key==='capacityRatio'?`${Math.round(cur*100)}%`:`${Math.round(cur)}`,need=key==='capacityRatio'?'100%':val;return `<div class="req ${ok?'ok':'no'}"><span>${ok?'✓':'○'} ${label}</span><b>${show} / ${need}</b></div>`}).join('')}</div>`;
};

__ctx.chooseSite = function chooseSite(id){
 if(__ctx.state.site) return;
 __ctx.state.site=__ctx.state.sites.find(s=>s.id===id); const m=__ctx.state.site.mods;
 __ctx.state.bunker.shield+=m.shield||0;__ctx.state.bunker.thermal+=m.heat||0;__ctx.state.bunker.power+=m.power||0;__ctx.state.bunker.water+=m.water||0;__ctx.state.bunker.foodSystem+=m.food||0;
 if(m.cost){__ctx.state.resources.concrete-=Math.max(0,m.cost);__ctx.state.resources.fuel-=Math.max(0,Math.ceil(m.cost/4)); if(m.cost<0){__ctx.state.resources.concrete+=Math.abs(m.cost);__ctx.state.resources.steel+=Math.ceil(Math.abs(m.cost)/2)}}
 __ctx.updateSettlementStage();__ctx.state.actionCapacity=__ctx.monthlyActionCapacity();__ctx.state.actions=__ctx.state.actionCapacity;__ctx.logMsg(`Выбрана площадка «${__ctx.state.site.name}». Строительство начато. Рабочая сила позволяет выполнить ${__ctx.state.actionCapacity} действий в текущем месяце.`,'good');__ctx.notify_aiNotice(`Площадка выбрана: ${__ctx.state.site.name}`,`Развёрнут ${__ctx.scenarioStageFlavor(__ctx.state.scenario,0)}. Начинаем строительство и накопление резервов.`,{cue:'good',type:'intro',sub:__ctx.state.city});__ctx.invalidate();
};

__ctx.fullLossProbability = function fullLossProbability(team,kind='raid'){const s=__ctx.expeditionSurvivalChance(kind);return Math.pow(1-s,team);};

__ctx.labelRes = function labelRes(k){return ({concrete:'бетон',steel:'сталь',machinery:'техника',fuel:'топливо',food:'запасы еды',electronics:'электроника',medicine:'медицина'})[k]||k};

__ctx.fmtResource = function fmtResource(v){const n=Math.max(0,v||0);return n<100?n.toLocaleString('ru-RU',{minimumFractionDigits:0,maximumFractionDigits:1}):__ctx.fmt(n)};

__ctx.emergencyRecycle = function emergencyRecycle(){
 if(!__ctx.state.site||__ctx.state.actions<=0)return;
 if((__ctx.state.localScrap||0)<=0){__ctx.logMsg('Местный запас лома исчерпан. Дальше сталь можно получать только через развитые мастерские.','warn');__ctx.invalidate();return}
 if(__ctx.state.recycleUsedMonth===__ctx.state.month){__ctx.logMsg('В этом месяце перерабатывающая бригада уже работала.','warn');__ctx.invalidate();return}
 const w=__ctx.workforceData();
 const maxTake=Math.min(__ctx.state.localScrap,__ctx.clamp(2+(__ctx.state.bunker.workshop||0)/18+w.effective/35,2,6));
 const take=Math.max(1,Math.round(maxTake*10)/10);
 __ctx.state.localScrap=Math.max(0,__ctx.state.localScrap-take);
 const steelGain=Math.round(take*(0.72+(__ctx.state.bunker.workshop||0)/180)*10)/10;
 const electronicsGain=(__ctx.state.bunker.workshop>=20&&__ctx.random()<.45)?0.5:0;
 __ctx.state.resources.steel+=steelGain;
 if(electronicsGain)__ctx.state.resources.electronics+=electronicsGain;
 __ctx.state.actions--;__ctx.state.recycleUsedMonth=__ctx.state.month;__ctx.state.morale=__ctx.clamp(__ctx.state.morale-0.4,0,100);
 __ctx.logMsg(`♻️ Переработан местный лом: сталь +${steelGain.toFixed(1)}${electronicsGain?`, электроника +${electronicsGain.toFixed(1)}`:''}. Остаток лома ${__ctx.state.localScrap.toFixed(1)}.`,'good');
 __ctx.invalidate();
};

__ctx.nextMonth = function nextMonth(){
 if(__ctx.state.ended)return;if(!__ctx.state.site){__ctx.logMsg('Сначала выберите площадку для убежища.','warn');__ctx.invalidate();return}if(__ctx.state.event){__ctx.logMsg('Сначала примите решение по текущему событию.','warn');__ctx.invalidate();return}
 __ctx.bankUnusedActions();__ctx.state.actions=0;__ctx.state.month++;__ctx.updateApocalypse();__ctx.consume();__ctx.passiveSystems();__ctx.populationDynamics();__ctx.passiveLaborEconomy();__ctx.updateSettlementStage();__ctx.clearOperationalTurnEffects();__ctx.state.actionCapacity=__ctx.monthlyActionCapacity();__ctx.state.actions=__ctx.state.actionCapacity;__ctx.recordHistory();__ctx.autosaveGame();__ctx.maybeRefugeeArrival();if(!__ctx.state.event)__ctx.maybeEvent();__ctx.evaluate();__ctx.invalidate();
};

__ctx.labelB = function labelB(k){return ({water:'вода',power:'энергия',thermal:'климат',integrity:'корпус',medical:'медицина',workshop:'ремонт',knowledge:'знания',shield:'защита',capacity:'вместимость',foodSystem:'фермы',intel:'разведка',biosecurity:'биозащита',morale:'мораль'})[k]||k};

__ctx.evaluate = function evaluate(){
 if(__ctx.state.population<=0||__ctx.state.health<=0){__ctx.endGame(false,'Поселение погибло: критическая потеря здоровья населения.');return}
 if(__ctx.state.morale<=0){__ctx.endGame(false,'Поселение распалось: доверие и дисциплина разрушились.');return}
 if(__ctx.state.bunker.integrity<=0){__ctx.endGame(false,'Убежище потеряло герметичность и несущую способность.');return}
 if(__ctx.state.month>=84){
  const r=__ctx.resilience();
  if(r>=62 && __ctx.state.population>=Math.max(12,__ctx.state.targetPop*.35)) __ctx.endGame(true,'Поселение прошло семь лет кампании и перешло к устойчивому развитию.');
  else __ctx.endGame(false,'Семь лет прожиты, но система осталась слишком хрупкой для долгосрочного существования.');
 }
};

__ctx.resilience = function resilience(){
 const b=__ctx.state.bunker; const core=(b.integrity+b.water+b.power+b.thermal+b.medical+b.workshop+b.foodSystem+b.knowledge)/8;
 const scenarioFit=__ctx.state.scenario==='ice'?(b.thermal+b.power)/2:__ctx.state.scenario==='heat'?(b.thermal+b.water+b.power)/3:__ctx.state.scenario==='epidemic'?(b.medical+b.biosecurity+b.water+b.knowledge)/4:(b.shield+b.integrity+b.water)/3;
 const social=(__ctx.state.health+__ctx.state.morale+Math.min(100,__ctx.state.specialists*6))/3;
 const labor=__ctx.clamp(__ctx.workforceData().effective/80*10,0,10),organization=(__ctx.state.settlementLevel||0)*1.6;return __ctx.clamp(core*.42+scenarioFit*.28+social*.22+labor+organization-__ctx.state.shortages*1.1,0,100);
};

__ctx.endGame = function endGame(win,reason){__ctx.state.ended=true;__ctx.state.finalWin=!!win;__ctx.state.endReason=reason;__ctx.state.event=null;__ctx.state.pendingEvent=null;const hm=__ctx.humanitarianMetrics();__ctx.state.score=hm.total;__ctx.notify_aiNotice(win?'Устойчивое выживание подтверждено':'Критический коллапс',reason,{cue:win?'good':'bad',type:win?'victory':'collapse'});__ctx.emit('ended',{win,reason});};

__ctx.ensureWorld = function ensureWorld(s=__ctx.state){
 if(!Number.isFinite(s.worldSeed))s.worldSeed=238417;
 if(!s.terrain||!Array.isArray(s.terrain.known)||s.terrain.known.length!==63)s.terrain=__ctx.makeTerrain(s);
 if(s.radioContact)s.terrain.known[6*__ctx.mapW+8]=Math.max(1,s.terrain.known[6*__ctx.mapW+8]);
 s.gear=s.gear||{};s.printerMode=s.printerMode||'balanced';s.resources.parts=Number(s.resources.parts)||0;s.resources.precisionParts=Number(s.resources.precisionParts)||0;
 if(!s.environment||s.environment.month!==s.month||s.environment.scenario!==s.scenario)s.environment=__ctx.computeEnvironment(s);
 s.saveVersion=__ctx.WORLD_VERSION;return s;
};

__ctx.repairSystem = function repairSystem(key){if(!['power','water','thermal','medical','integrity'].includes(key)||__ctx.state.event||__ctx.state.ended||__ctx.state.actions<=0)return;const cost: any={parts:2,precisionParts:1,steel:1};if((__ctx.state.built.printer||0)<2||!__ctx.canPay(cost))return;__ctx.pay(cost);__ctx.state.bunker[key]+=4+Math.min(5,__ctx.state.built.printer);__ctx.state.actions--;__ctx.logMsg(`Сложный ремонт: ${__ctx.labelB(key)} +${4+Math.min(5,__ctx.state.built.printer)}. Установлены прецизионные напечатанные узлы.`,'good');__ctx.invalidate();};

__ctx.cityIncidentRisk = function cityIncidentRisk(key){const sc=__ctx.scavenges[key],w=__ctx.workforceData(),im=__ctx.environmentImpact(),g=__ctx.gearData(),n=__ctx.locationFor(key),route=n&&__ctx.state.terrain.known[n.y*9+n.x]===2?.025:0;return __ctx.clamp((sc.risk*__ctx.state.diff*(1+__ctx.state.hazard/130)*__ctx.clamp(1-w.effective/500-(__ctx.state.bunker.intel||0)/450,.72,1.05)+im.outdoorPenalty*45)*(1-g.reduction*.85)*(1-route),1,85);};

__ctx.costHTML = function costHTML(cost){return `<div class="costList">${__ctx.entries(cost).filter(([,v])=>v>0).map(([r,v])=>{const have=__ctx.state.resources[r]||0,ok=have+1e-8>=v;return `<div class="costItem ${ok?'enough':'missing'}" title="${__ctx.labelRes(r)}: есть ${__ctx.fmtResource(have)}, нужно ${__ctx.fmtResource(v)}"><div><span>${__ctx.resIcons[r]||'◈'} ${__ctx.labelRes(r)}</span><b>${ok?'✓':'−'} ${__ctx.fmtResource(v)}</b></div><small>${ok?'есть '+__ctx.fmtResource(have):'есть '+__ctx.fmtResource(have)+' · не хватает '+__ctx.fmtResource(v-have)}</small><i style="--fill:${Math.min(100,have/v*100)}%"></i></div>`;}).join('')}</div>`;};

__ctx.escapeHTML = function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);};

__ctx.flowPreview = function flowPreview(){
 const rates=__ctx.passiveResourceRates(),wb=__ctx.waterBalancePreview(),p=__ctx.state.population,post=__ctx.state.month>__ctx.state.prepMonths,im=__ctx.environmentImpact(),fuelStress=__ctx.state.hazard*(__ctx.state.scenario==='heat'?1.15:1)/100;
 const prod: any={...rates,food:wb.actualFood},cons: any={food:p*(post?.72:.52)/10,medicine:p*.035*(1+__ctx.state.hazard/80)*(__ctx.state.settlementLevel>=4?.9:1)*(__ctx.state.scenario==='epidemic'?1.45:1)*(1-__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25))+im.medicineExtra*Math.max(1,p/24),fuel:Math.max(0,1.2+fuelStress*2.1-__ctx.state.bunker.power/55)*(1-__ctx.clamp(__ctx.techEffect('fuelUseDiscount'),0,.28))+im.fuelExtra};
 return {prod,cons};
};

__ctx.pluralRu = function pluralRu(n,one,few,many){const a=Math.abs(Math.round(n)),m=a%100;return m>=11&&m<=14?many:a%10===1?one:a%10>=2&&a%10<=4?few:many;};

__ctx.cityDeliveryMultiplier = function cityDeliveryMultiplier(key){return __ctx.originalExpeditionMultiplier()*__ctx.environmentImpact().cargo*(1+__ctx.routeKnowledge(key));};

__ctx.makeHiddenSites = function makeHiddenSites(s){
 const used: any=new Set([...__ctx.mapLocations.map(n=>n.y*9+n.x),49]);
 const specs=[
  {id:'cache-supply',kind:'supply',name:'Резервный схрон',icon:'▣',epoch:1,desc:'Непубличный резерв снабжения: еда, медикаменты и электроника.'},
  {id:'cache-civil',kind:'civil',name:'Схрон гражданской обороны',icon:'⬢',epoch:1,desc:'Уцелевшие запасы топлива, инструмента и медицинских комплектов.'},
  {id:'cache-heritage',kind:'heritage',name:'Эвакуированный музейный фонд',icon:'▤',epoch:1,desc:'Архивы и предметы культурного наследия. Их спасение поддержит знания и мораль.'},
  {id:'cache-relief',kind:'supply',name:'Заброшенный перевалочный склад',icon:'▣',epoch:2,desc:'Новый след снабжения после масштабных изменений поверхности.'}
 ];
 return specs.map((spec,j)=>{
  let i=Math.floor(__ctx.worldHash(s.worldSeed+830+j*139)*63);
  while(used.has(i))i=(i+1)%63;used.add(i);
  const roll=(salt,min,max)=>min+Math.floor(__ctx.worldHash(s.worldSeed+j*241+salt)*(max-min+1));
  const gain=spec.kind==='heritage'?{}:spec.kind==='civil'?{fuel:roll(71,5,10),medicine:roll(72,3,6),machinery:roll(73,1,3)}:{food:roll(81,8,16),medicine:roll(82,4,8),electronics:roll(83,2,5)};
  return {...spec,x:i%9,y:Math.floor(i/9),type:'cache',generated:true,gain};
 });
};

__ctx.mapSiteVisible = function mapSiteVisible(n,s=__ctx.state){return !!n&&(n.familiar||(!n.generated||__ctx.mapEpoch(s)>=n.epoch)&&(s.terrain.discoveredSites||[]).includes(n.id));};

__ctx.localFalloutFactor = function localFalloutFactor(index,s=__ctx.state){return index===49?1:.35+__ctx.worldHash(s.worldSeed+index*97)*5.4+(index%9>5?1.5:0);};

__ctx.sealShelter = function sealShelter(){if(__ctx.state.actions<=0||__ctx.state.event||__ctx.state.ended||__ctx.state.physical.sealUsedMonth===__ctx.state.month)return;__ctx.state.actions--;__ctx.state.physical.sealUsedMonth=__ctx.state.month;__ctx.state.physical.sealHours=24;__ctx.state.physical.filterCondition=Math.min(100,__ctx.state.physical.filterCondition+15);__ctx.logMsg('Резервная герметизация на 24 часа. Фильтрация усилена; ограничение связано с CO₂, кислородом и расходниками. Постоянная вентиляция остаётся необходимой.','warn');__ctx.invalidate();};

__ctx.servicePlan = function servicePlan(s=__ctx.state){
 const b=s.bunker,x=s.balance||{},pop=Math.max(0,s.population),bl=s.built||{},baseWorkers=Math.max(0,pop-Math.min(Math.max(2,Math.round(pop*.22)),Math.max(0,Math.round(pop*.38))));
 const sick=__ctx.clamp(((s.physical?.patients||0)+(s.physical?.infected||0))*.65/Math.max(1,pop),0,.6);
 const available=Math.max(0,baseWorkers*(.72+.28*s.health/100)*(1-sick)-Math.min(baseWorkers*.2,x.missionWork||0));
 const requested: any={life:1.6+pop*.025,maintenance:.8+__ctx.values(bl).reduce((a,v)=>a+v,0)*.055,medical:.25+(bl.med||0)*.9,farm:Math.max(.6,b.foodSystem*.065),salvage:.6,raw:(bl.rawDepot||0)*1.4,printer:(bl.printer||0)? .6+bl.printer*.45:0};
 for(const [key,ch] of __ctx.entries(__ctx.industryChains))requested[key]=(bl[ch.building]||0)*(key==='pharma'||key==='fab'?1.5:1.2);
 const order=['life','maintenance','medical','farm','printer','pharma','refinery','fab','smelter','cement','machinePlant','raw','salvage'];
 const priority=x.servicePriority||'balanced';if(priority==='industry'){order.splice(order.indexOf('farm'),1);order.splice(7,0,'farm');}if(priority==='food'){order.splice(order.indexOf('farm'),1);order.splice(1,0,'farm');}if(priority==='medicine'){order.splice(order.indexOf('medical'),1);order.splice(1,0,'medical');order.splice(order.indexOf('pharma'),1);order.splice(3,0,'pharma');}
 let remaining=available;const assigned: any={},coverage: any={};for(const key of order){assigned[key]=Math.min(remaining,requested[key]||0);remaining-=assigned[key];coverage[key]=requested[key]>0?assigned[key]/requested[key]:1;}
 const industryEnergy=__ctx.entries(__ctx.industryChains).reduce((a,[k,ch])=>a+(bl[ch.building]||0)*(k==='pharma'?1.1:1.5),0);
 const powerDemand=6+pop*.14+b.water*.025+b.ventilation*.025+b.foodSystem*.08+(bl.med||0)*1.2+(bl.printer||0)*1.25+industryEnergy+(bl.rawDepot||0)*.8+Math.max(0,Math.abs((s.environment?.temperature||20)-20)-8)*(.04+pop*.001);
 return {available,requested,assigned,coverage,free:remaining,used:available-remaining,powerDemand,medics:Math.min(x.clinicalSpecialists||0,(bl.med||0)*1.0+(x.legacyMedical>15?1:0)),priority};
};

__ctx.autonomyData = function autonomyData(){
 const sv=__ctx.physicalServices(),c=__ctx.clinicalCare(),q=__ctx.shelterProtection(),monthly=__ctx.state.month>0,fp=__ctx.flowPreview(),prod=monthly?__ctx.state.lastProduction:fp.prod,need=monthly?__ctx.state.lastDemand:fp.cons,rows=[];let total=0,count=0;
 for(const key of ['food','fuel','medicine','parts','precisionParts','steel','electronics']){
  const demand=Math.max(0,need?.[key]||0),output=Math.max(0,(prod?.[key]||0)-(__ctx.state.balance.lastSalvage?.[key]||0)),stock=Math.max(0,__ctx.state.resources[key]||0),gap=Math.max(0,demand-output),months=gap>1e-8?stock/gap:Infinity,coverage=demand>1e-8?__ctx.clamp((output+stock/12)/demand,0,1):1;
  if(demand>1e-8){total+=coverage;count++;}rows.push({key,stock,demand,output,months,coverage});
 }
 const rawUse=__ctx.state.balance.lastFeedstockUsed||0,rawOutput=Math.min(__ctx.state.balance.monthlyRaw?.amount||0,__ctx.state.balance.deposit/12),rawCoverage=rawUse>0?__ctx.clamp((rawOutput+__ctx.state.balance.feedstock/12)/rawUse,0,1):1;
 const water=__ctx.waterBalancePreview(),supply=Math.min(rawCoverage,...rows.filter(r=>r.demand>1e-8).map(r=>r.coverage),1),life=Math.min(water.humanCoverage,sv.power,__ctx.clamp((sv.indoor-4)/12,0,1),__ctx.clamp((40-sv.indoor)/12,0,1),__ctx.clamp((5000-sv.co2)/3200,0,1));
 const medical=c.coverage*(__ctx.state.physical.lastMedicineCoverage??1),protectedCoverage=__ctx.falloutActive()?q.coverage:1;
 const readiness=__ctx.clamp(100*(.40*life+.30*supply+.15*medical+.15*protectedCoverage),0,100);
 const vulnerable=rows.filter(r=>r.demand>0&&r.months<12),stable=life>=.95&&supply>=.98&&medical>=.8&&protectedCoverage>=.98;
 const history=__ctx.state.balance.flowHistory||[],renewable=history.length>=6&&rows.every(r=>{const demand=history.reduce((sum,h)=>sum+(h.demand[r.key]||0),0),output=history.reduce((sum,h)=>sum+(h.production[r.key]||0),0);return demand<1e-8||output+1e-8>=demand*.98;});
 const title=__ctx.state.month<=__ctx.state.prepMonths?'Подготовка поселения':stable&&renewable&&__ctx.state.balance.stableMonths>=6?'Автономное поселение':readiness>=70&&vulnerable.every(r=>r.months>=6)?'Устойчивое поселение':'Выживание с уязвимым снабжением';
 return {rows,life,supply,medical,protectedCoverage,readiness,stable,renewable,title,vulnerable,months:__ctx.state.balance.stableMonths};
};
}
export const steps: Initialization[] = [
{ order:1, run(__ctx:Runtime){__ctx.clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
} },
{ order:2, run(__ctx:Runtime){__ctx.pick = a=>a[Math.floor(__ctx.random()*a.length)];
} },
{ order:3, run(__ctx:Runtime){__ctx.rnd = (a,b)=>Math.floor(a+__ctx.random()*(b-a+1));
} },
{ order:4, run(__ctx:Runtime){__ctx.fmt = n=>Math.round(n).toLocaleString('ru-RU');
} },
{ order:56, run(__ctx:Runtime){__ctx.state = {};
} },
{ order:194, run(__ctx:Runtime){__ctx.WORLD_VERSION = 13;
} },
{ order:196, run(__ctx:Runtime){__ctx.mapW = 9;
} },
{ order:196, run(__ctx:Runtime){__ctx.mapH = 7;
} },
{ order:202, run(__ctx:Runtime){__ctx.originalLabelRes = __ctx.labelRes;
} },
{ order:203, run(__ctx:Runtime){__ctx.labelRes=k=>({parts:'запчасти',precisionParts:'точные детали'})[k]||__ctx.originalLabelRes(k);
} },
{ order:204, run(__ctx:Runtime){__ctx.fmtResource=function(v){const n=Math.max(0,Number(v)||0);return n<100?n.toLocaleString('ru-RU',{minimumFractionDigits:0,maximumFractionDigits:n<1?2:1}):__ctx.fmt(n);};
} },
{ order:205, run(__ctx:Runtime){__ctx.originalFreshState = __ctx.freshState;
} },
{ order:206, run(__ctx:Runtime){__ctx.freshState=function(){const s=__ctx.originalFreshState();Object.assign(s,{saveVersion:__ctx.WORLD_VERSION,worldSeed:Math.floor(__ctx.random()*1000000),environment:null,terrain:null,gear:{},printerMode:'balanced',lastPrinter:null,maintenancePaid:null,missionTarget:null,lastWeatherNotice:-1,forecastFocus:'now'});s.resources.parts=0;s.resources.precisionParts=0;return s;};
} },
{ order:224, run(__ctx:Runtime){__ctx.originalEconomy = __ctx.passiveLaborEconomy;
} },
{ order:244, run(__ctx:Runtime){__ctx.originalDeepRaid = __ctx.deepCityRaid;
} },
{ order:285, run(__ctx:Runtime){__ctx.originalStartGame = __ctx.startGame;
} },
{ order:289, run(__ctx:Runtime){__ctx.originalLogMsg = __ctx.logMsg;
} },
{ order:293, run(__ctx:Runtime){__ctx.originalResolve = __ctx.resolveEvent;
} },
{ order:295, run(__ctx:Runtime){__ctx.originalHistory = __ctx.recordHistory;
} },
{ order:296, run(__ctx:Runtime){__ctx.recordHistory=function(){__ctx.originalHistory();const last=__ctx.state.history.at(-1);if(last){last.environment=JSON.parse(JSON.stringify(__ctx.state.environment));last.surveyed=__ctx.state.terrain.known.filter(k=>k===2).length;last.gear=JSON.parse(JSON.stringify(__ctx.state.gear));}};
} },
{ order:306, run(__ctx:Runtime){__ctx.originalEndGame = __ctx.endGame;
} },
{ order:308, run(__ctx:Runtime){__ctx.originalNextMonth = __ctx.nextMonth;
} },
{ order:309, run(__ctx:Runtime){__ctx.nextMonth=function(){const before=__ctx.state.month;__ctx.originalNextMonth();if(__ctx.state.month!==before&&!__ctx.state.event&&!__ctx.state.ended)__ctx.voice?.say(__ctx.state.hazard>60?'month_danger':'month_normal',`Месяц ${__ctx.state.month}. ${__ctx.state.environment.weather.name}. Живы ${Math.round(__ctx.state.population)}, спасено ${Math.round(__ctx.state.rescuedTotal)}, потери ${__ctx.state.deathsTotal}.`,'normal');};
} },
{ order:352, run(__ctx:Runtime){__ctx.RESOURCE_EPSILON = 1e-8;
} },
{ order:353, run(__ctx:Runtime){__ctx.canPay=function(cost){return !!cost&&__ctx.entries(cost).every(([k,v])=>Number.isFinite(v)&&v>=0&&Number.isFinite(__ctx.state.resources[k]??0)&&(__ctx.state.resources[k]||0)+__ctx.RESOURCE_EPSILON>=v);};
} },
{ order:354, run(__ctx:Runtime){__ctx.pay=function(cost){for(const [r,v] of __ctx.entries(cost))__ctx.state.resources[r]=Math.max(0,(__ctx.state.resources[r]||0)-v);};
} },
{ order:355, run(__ctx:Runtime){__ctx.stabilityFresh = __ctx.freshState;
} },
{ order:356, run(__ctx:Runtime){__ctx.freshState=function(){const s=__ctx.stabilityFresh();return Object.assign(s,{stabilityVersion:1,lastDemand:{},lastUnmetConsumption:{},pendingEvent:null,endReason:null,lastShortageCountMonth:-999});};
} },
{ order:357, run(__ctx:Runtime){__ctx.stabilityEnsureWorld = __ctx.ensureWorld;
} },
{ order:358, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){
 __ctx.stabilityEnsureWorld(s);
 const t=s.terrain;
 t.known=t.known.map(k=>[0,1,2].includes(k)?k:0);
 if(!Number.isInteger(t.selected)||t.selected<0||t.selected>=63)t.selected=49;
 if(!Number.isFinite(t.seed))t.seed=s.worldSeed;
 if(!Number.isFinite(t.surveys)||t.surveys<0)t.surveys=0;
 t.visits=t.visits&&typeof t.visits==='object'?t.visits:{};
 t.rewards=Array.isArray(t.rewards)?[...new Set(t.rewards.filter(k=>__ctx.mapLocations.some(n=>n.id===k)||(t.hiddenSites||[]).some(n=>n.id===k)))]:[];
 s.lastDemand=s.lastDemand||{};s.lastUnmetConsumption=s.lastUnmetConsumption||{};
 if(s.environment.severity!==s.hazard)s.environment=__ctx.computeEnvironment(s);
 return s;
};
} },
{ order:370, run(__ctx:Runtime){__ctx.stabilityEndGame = __ctx.endGame;
} },
{ order:372, run(__ctx:Runtime){__ctx.stabilityEvaluate = __ctx.evaluate;
} },
{ order:373, run(__ctx:Runtime){__ctx.evaluate=function(){
 if(__ctx.state.ended)return;
 const fatal=__ctx.state.population<=0||__ctx.state.health<=0||__ctx.state.morale<=0||__ctx.state.bunker.integrity<=0;
 if(__ctx.state.event&&!fatal)return;
 __ctx.stabilityEvaluate();
};
} },
{ order:374, run(__ctx:Runtime){__ctx.nextMonth=function(){
 if(__ctx.state.ended)return;
 if(!__ctx.state.site){__ctx.logMsg('Сначала выберите площадку для убежища.','warn');__ctx.invalidate();return;}
 if(__ctx.state.event){__ctx.logMsg('Сначала примите решение по текущему событию.','warn');__ctx.invalidate();return;}
 if(__ctx.state.month>=84){__ctx.evaluate();__ctx.invalidate();return;}
 __ctx.bankUnusedActions();__ctx.state.actions=0;__ctx.state.month++;__ctx.updateApocalypse();__ctx.consume();__ctx.passiveSystems();__ctx.populationDynamics();__ctx.passiveLaborEconomy();__ctx.updateSettlementStage();__ctx.clearOperationalTurnEffects();__ctx.state.actionCapacity=__ctx.monthlyActionCapacity();__ctx.state.actions=__ctx.state.actionCapacity;__ctx.recordHistory();
 if(__ctx.state.population<=0||__ctx.state.health<=0||__ctx.state.morale<=0||__ctx.state.bunker.integrity<=0)__ctx.evaluate();
 else{__ctx.maybeRefugeeArrival();if(!__ctx.state.event)__ctx.maybeEvent();__ctx.evaluate();}
 __ctx.invalidate();
 if(!__ctx.state.event&&!__ctx.state.ended)__ctx.voice?.say(__ctx.state.hazard>60?'month_danger':'month_normal',`Месяц ${__ctx.state.month}. ${__ctx.state.environment.weather.name}. Живы ${Math.round(__ctx.state.population)}, спасено ${Math.round(__ctx.state.rescuedTotal)}, потери ${__ctx.state.deathsTotal}.`,'normal');
};
} },
{ order:384, run(__ctx:Runtime){__ctx.stabilitySurvival = __ctx.expeditionSurvivalChance;
} },
{ order:386, run(__ctx:Runtime){__ctx.stabilityDeep = __ctx.deepCityRaid;
} },
{ order:389, run(__ctx:Runtime){__ctx.stabilityRecordHistory = __ctx.recordHistory;
} },
{ order:390, run(__ctx:Runtime){__ctx.recordHistory=function(){
 for(const r of [...Object.keys(__ctx.state.resources),'water'])__ctx.state.lastDemand[r]=(__ctx.state.lastConsumption[r]||0)+(__ctx.state.lastUnmetConsumption[r]||0);
 __ctx.stabilityRecordHistory();const h=__ctx.state.history.at(-1);if(h){h.demand={...__ctx.state.lastDemand};h.unmet={...__ctx.state.lastUnmetConsumption};}
};
} },
{ order:398, run(__ctx:Runtime){__ctx.familiarMapSites = new Set(['steelworks','market','hospital','fuelDepot','engineering','archiveSite']);
} },
{ order:403, run(__ctx:Runtime){__ctx.localEnsureWorld = __ctx.ensureWorld;
} },
{ order:404, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){
 __ctx.localEnsureWorld(s);const t=s.terrain;
 if(t.localKnowledgeVersion!==1){
  // Keep every old survey, visit and one-time reward. Existing post-collapse
  // surveys have no recorded date and conservatively need a route recheck.
  t.checkedAt=t.known.map(k=>k===2?(__ctx.mapEpoch(s)===0?s.month:0):-1);
  t.checkedEpoch=t.known.map(k=>k===2?0:-1);
  t.discoveredSites=__ctx.mapLocations.filter(n=>!n.familiar&&t.known[n.y*9+n.x]===2).map(n=>n.id);
  t.localKnowledgeVersion=1;
 }
 t.known=t.known.map(k=>Math.max(1,k));
 if(!Array.isArray(t.checkedAt)||t.checkedAt.length!==63)t.checkedAt=Array(63).fill(-1);
 if(!Array.isArray(t.checkedEpoch)||t.checkedEpoch.length!==63)t.checkedEpoch=Array(63).fill(-1);
 if(!Array.isArray(t.hiddenSites))t.hiddenSites=__ctx.makeHiddenSites(s);
 if(!Array.isArray(t.discoveredSites))t.discoveredSites=[];
 t.discoveredSites=[...new Set(t.discoveredSites)];
 t.heritageRecovered=Math.max(0,Number(t.heritageRecovered)||0);
 return s;
};
} },
{ order:412, run(__ctx:Runtime){__ctx.cityIncidentRisk=function(key){
 const sc=__ctx.scavenges[key],w=__ctx.workforceData(),im=__ctx.environmentImpact(),g=__ctx.gearData(),n=__ctx.locationFor(key),checked=n&&__ctx.routeCheckCurrent(n.y*9+n.x);
 const unverified=__ctx.mapEpoch()>0&&!checked?1.10:1;
 return __ctx.clamp((sc.risk*__ctx.state.diff*(1+__ctx.state.hazard/130)*__ctx.clamp(1-w.effective/500-(__ctx.state.bunker.intel||0)/450,.72,1.05)+im.outdoorPenalty*45)*(1-g.reduction*.85)*(checked?.975:1)*unverified,1,85);
};
} },
{ order:422, run(__ctx:Runtime){__ctx.freshState=function(){return Object.assign(__ctx.medicalFreshState(),{treatmentUsedMonth:-999,lastTreatment:null});};
} },
{ order:424, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){
 __ctx.medicalEnsureWorld(s);
 if(!Number.isInteger(s.treatmentUsedMonth))s.treatmentUsedMonth=-999;
 if(!s.lastTreatment||typeof s.lastTreatment!=='object'||!['month','before','after','gain','cost','medical'].every(k=>Number.isFinite(s.lastTreatment[k])))s.lastTreatment=null;
 return s;
};
} },
{ order:445, run(__ctx:Runtime){__ctx.freshState=function(){const s=__ctx.physicalFresh();s.physical=null;return s;};
} },
{ order:448, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){
 __ctx.physicalEnsure(s);
 if(!Number.isFinite(s.bunker.ventilation))s.bunker.ventilation=18+(s.built.climate||0)*8+(s.built.habitat||0)*4;
 if(!Number.isFinite(s.bunker.deconCapacity))s.bunker.deconCapacity=24*(s.built.decon||0);
 const base=__ctx.physicalDefaults(s),old=s.physical;
 if(!old||old.version!==__ctx.PHYSICAL_VERSION){s.physical=base;if(s.site&&s.month>0)s.log.unshift({m:s.month,cls:'warn',t:'V15: системы, люди и запасы сохранены. Доза учитывается с этого месяца; прежняя история облучения не выдумывается. После выпадений постройте станцию дезактивации для наружных грузов и карантинного приёма.'});}
 else{for(const [k,v] of __ctx.entries(base))if(old[k]===undefined)old[k]=v;}
 const p=s.physical;
 for(const key of ['residentDose','residentLifetimeDose','missionDose','missionPeople','patients','infected','immune','quarantine','deconProcessed','roadWork'])p[key]=Math.max(0,Number(p[key])||0);
 p.filterCondition=__ctx.clamp(Number(p.filterCondition)||0,0,100);
 for(const k of __ctx.physicalKeys){if(!Number.isFinite(p.condition[k]))p.condition[k]=1;p.condition[k]=__ctx.clamp(p.condition[k],0,1);if(!Number.isFinite(p.design[k]))p.design[k]=(s.bunker[k]||0)/Math.max(.05,p.condition[k]);}
 if(p.deconMonth!==s.month){p.deconMonth=s.month;p.deconProcessed=0;}
 if(!s.environment||s.environment.modelVersion!==__ctx.PHYSICAL_VERSION||s.environment.month!==s.month)s.environment=__ctx.computeEnvironment(s);
 s.saveVersion=__ctx.PHYSICAL_VERSION;return s;
};
} },
{ order:475, run(__ctx:Runtime){__ctx.cityIncidentRisk=function(key){const sc=__ctx.scavenges[key],g=__ctx.gearData(),n=__ctx.locationFor(key),checked=n&&__ctx.routeCheckCurrent(n.y*9+n.x);return __ctx.clamp(sc.risk*.45+(__ctx.environmentImpact().outdoorPenalty*50)*(1-g.reduction)+(checked?0:3)-Math.min(5,__ctx.state.bunker.intel/30),1,65);};
} },
{ order:501, run(__ctx:Runtime){__ctx.chooseSite=function(id){__ctx.physicalChoose(id);if(__ctx.state.physical)for(const k of __ctx.physicalKeys)__ctx.state.physical.design[k]=Math.max(__ctx.state.physical.design[k],__ctx.state.bunker[k]||0);};
} },
{ order:502, run(__ctx:Runtime){__ctx.repairSystem=function(k){__ctx.ensureWorld();if(!['power','water','thermal','medical','integrity','ventilation','deconCapacity'].includes(k)||__ctx.state.actions<=0||__ctx.state.event||__ctx.state.ended||__ctx.state.built.printer<2||!__ctx.canPay({parts:2,precisionParts:1,steel:1}))return;const max=__ctx.state.physical.design[k],current=__ctx.state.bunker[k]||0;if(current>=max-1e-6){__ctx.logMsg('Система исправна. Для повышения мощности нужна модернизация.','');__ctx.invalidate();return;}__ctx.pay({parts:2,precisionParts:1,steel:1});__ctx.state.bunker[k]=Math.min(max,current+4+Math.min(5,__ctx.state.built.printer));__ctx.state.physical.condition[k]=__ctx.state.bunker[k]/Math.max(1,max);__ctx.state.actions--;__ctx.logMsg(`Сложный ремонт: ${__ctx.labelB(k)} восстановлена до ${__ctx.fmtResource(__ctx.state.bunker[k])}/${__ctx.fmtResource(max)}. Прецизионные детали установлены.`,'good');__ctx.invalidate();};
} },
{ order:508, run(__ctx:Runtime){__ctx.nextMonth=function(){
 if(__ctx.state.ended||!__ctx.state.site||__ctx.state.event||__ctx.state.month>=84){if(__ctx.state.month>=84)__ctx.evaluate();return;}
 __ctx.ensureWorld();__ctx.bankUnusedActions();__ctx.state.actions=0;__ctx.state.month++;__ctx.updateApocalypse();__ctx.ensureWorld();
 if(__ctx.falloutActive()&&!__ctx.state.physical.shockApplied){__ctx.state.physical.shockApplied=true;const damage=Math.max(0,5-__ctx.state.bunker.integrity/20);__ctx.state.bunker.integrity=Math.max(.1,__ctx.state.bunker.integrity-damage);__ctx.logMsg('Произошло выпадение радиоактивных осадков. Наружные грузы и приём людей теперь требуют станции дезактивации. Первые часы учтены отдельно.','warn');}
 __ctx.consume();__ctx.passiveSystems();__ctx.populationDynamics();__ctx.passiveLaborEconomy();__ctx.updateSettlementStage();
 const waiting=__ctx.state.physical.pendingRefugees;if(waiting&&__ctx.state.month-waiting.since>2){__ctx.rejectRefugees(waiting.group);__ctx.state.physical.pendingRefugees=null;__ctx.logMsg('Срок наружного ожидания истёк. Люди продолжили поиск убежища.','warn');}
 __ctx.clearOperationalTurnEffects();__ctx.state.actionCapacity=__ctx.monthlyActionCapacity();__ctx.state.actions=__ctx.state.actionCapacity;__ctx.recordHistory();
 if(__ctx.state.health<=0||__ctx.state.population<=0||__ctx.state.morale<=0||__ctx.state.bunker.integrity<=0)__ctx.evaluate();else{__ctx.maybeRefugeeArrival();if(!__ctx.state.event)__ctx.maybeEvent();__ctx.evaluate();}
 const summary=__ctx.environmentSummary();__ctx.logMsg('Диспетчер: '+summary.text,'');__ctx.invalidate();if(!__ctx.state.event&&!__ctx.state.ended)__ctx.voice?.say(summary.key,summary.text,'normal');
};
} },
{ order:510, run(__ctx:Runtime){__ctx.recordHistory=function(){__ctx.physicalHistory();const h=__ctx.state.history.at(-1);if(h){h.health=__ctx.state.health;h.healthLedger=JSON.parse(JSON.stringify(__ctx.state.physical.lastHealthLedger));h.physical={dose:__ctx.state.physical.residentDose,services:{...__ctx.state.physical.lastServices},patients:__ctx.state.physical.patients,infected:__ctx.state.physical.infected};}};
} },
{ order:512, run(__ctx:Runtime){__ctx.labelB=k=>({ventilation:'вентиляция',deconCapacity:'дезактивация'})[k]||__ctx.physicalLabel(k);
} },
{ order:528, run(__ctx:Runtime){__ctx.flowPreview=function(){const p=__ctx.state.population,b=__ctx.state.bunker,e=__ctx.state.environment,sv=__ctx.physicalServices(),wb=__ctx.waterBalanceFor(__ctx.physicalFoodPotential());return {prod:{...__ctx.passiveResourceRates(),food:wb.actualFood,water:wb.supply},cons:{food:p*(__ctx.state.month>__ctx.state.prepMonths?.072:.052),medicine:(p*.012+(__ctx.state.physical.patients+__ctx.state.physical.infected)*.08)*(1-__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25)),fuel:(Math.max(.15,1.2-b.power/65)+Math.max(0,Math.abs(e.temperature-20)-10)/28*(1-__ctx.clamp(b.thermal/160,0,.8)))*(1-__ctx.clamp(__ctx.techEffect('fuelUseDiscount'),0,.28))}};};
} },
{ order:557, run(__ctx:Runtime){__ctx.freshState=function(){const s=__ctx.balancedFresh();s.bunker.protectedCapacity=28;s.bunker.receptionCapacity=0;s.balance=__ctx.balanceDefaults(s);s.saveVersion=__ctx.BALANCE_VERSION;return s;};
} },
{ order:559, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){
 const needsMigration=!s.balance||s.balance.version!==__ctx.BALANCE_VERSION;
 if(!Number.isFinite(s.bunker.protectedCapacity))s.bunker.protectedCapacity=needsMigration?Math.max(28,s.bunker.capacity||0):28;
 if(!Number.isFinite(s.bunker.receptionCapacity))s.bunker.receptionCapacity=8*(s.built.reception||0);
 __ctx.balancedEnsure(s);
 if(needsMigration){s.balance=__ctx.balanceDefaults(s,!!s.site);if(s.site&&s.month>0)s.log.unshift({m:s.month,cls:'warn',t:'V16: партия перенесена. Люди, запасы, установленная мощность и накопленная защита сохранены. Унаследованные возможности отмечены отдельно; профилактика больше не увеличивает проектную мощность.'});}
 const x=s.balance,d=__ctx.balanceDefaults(s,x.legacy);for(const [k,v] of __ctx.entries(d))if(x[k]===undefined)x[k]=v;
 for(const k of ['feedstock','deposit','missionWork','stableMonths','deconWaste','protectedDose','unprotectedDose'])x[k]=Math.max(0,Number(x[k])||0);
 if(!['balanced','medicine','food','industry'].includes(x.servicePriority))x.servicePriority='balanced';
 if(!Array.isArray(x.flowHistory))x.flowHistory=[];x.flowHistory=x.flowHistory.filter(h=>h&&Number.isFinite(h.month)&&h.production&&h.demand).slice(-12);
 if(s.specialists>x.lastSpecialists){const target=Math.max(1,Math.floor(s.specialists*.16));x.clinicalSpecialists=Math.max(x.clinicalSpecialists,target);}
 x.clinicalSpecialists=__ctx.clamp(Number(x.clinicalSpecialists)||0,0,s.specialists||0);x.lastSpecialists=s.specialists||0;
 x.chronicFraction=__ctx.clamp(Number.isFinite(x.chronicFraction)?x.chronicFraction:.09,0,.18);
 s.saveVersion=__ctx.BALANCE_VERSION;return s;
};
} },
{ order:577, run(__ctx:Runtime){__ctx.stageRequirementValue=function(key){if(key==='medical'){const c=__ctx.clinicalCare();return c.effectiveMedical*(c.full?c.coverage:.5);}return __ctx.balancedStageValue(key);};
} },
{ order:598, run(__ctx:Runtime){__ctx.resilience=function(){if(!__ctx.state.balance)return 0;const a=__ctx.autonomyData(),social=(__ctx.state.health+__ctx.state.morale)/200;return __ctx.clamp(a.readiness*.82+social*18,0,100);};
} },
{ order:600, run(__ctx:Runtime){__ctx.recordHistory=function(){__ctx.balancedHistory();const x=__ctx.state.balance;let a=__ctx.autonomyData();if(x.lastAssessmentMonth!==__ctx.state.month){const production: any={};for(const [r,q] of __ctx.entries(__ctx.state.lastProduction||{}))production[r]=Math.max(0,q-(x.lastSalvage?.[r]||0));x.flowHistory.push({month:__ctx.state.month,production,demand:{...__ctx.state.lastDemand}});x.flowHistory=x.flowHistory.slice(-12);x.stableMonths=__ctx.state.month>__ctx.state.prepMonths&&a.stable?x.stableMonths+1:0;x.lastAssessmentMonth=__ctx.state.month;}a=__ctx.autonomyData();x.assessment={...a,rows:a.rows.map(r=>({...r,months:Number.isFinite(r.months)?r.months:null})),months:x.stableMonths};const h=__ctx.state.history.at(-1);if(h)h.balance={readiness:a.readiness,stableMonths:x.stableMonths,medical:a.medical,protection:a.protectedCoverage};};
} },
{ order:601, run(__ctx:Runtime){__ctx.evaluate=function(){
 if(__ctx.state.population<=0||__ctx.state.health<=0){__ctx.endGame(false,'Поселение погибло: критическая потеря здоровья населения.');return;}
 if(__ctx.state.morale<=0){__ctx.endGame(false,'Поселение распалось: доверие и дисциплина разрушились.');return;}
 if(__ctx.state.bunker.integrity<=0){__ctx.endGame(false,'Убежище потеряло герметичность и несущую способность.');return;}
 if(__ctx.state.month>=84&&!__ctx.state.ended&&!__ctx.state.event){const a=__ctx.autonomyData(),enough=__ctx.state.population>=Math.max(12,__ctx.state.targetPop*.35);__ctx.endGame(enough,enough?'Кампания завершена. '+a.title+'. Сохранённые жизни определяют главный итог.':'Кампания завершена, но поселение понесло критическую убыль населения.');}
};
} },
{ order:609, run(__ctx:Runtime){__ctx.nextMonth=function(){__ctx.ensureWorld();if(__ctx.state.ended||__ctx.state.event||!__ctx.state.site)return;if(__ctx.state.scenario==='nuclear'&&__ctx.state.month===__ctx.state.prepMonths&&!__ctx.state.balance.falloutDone){__ctx.state.balance.falloutStage=0;__ctx.state.event=__ctx.falloutBriefEvent(0);__ctx.invalidate();__ctx.voice?.say('fallout_acute',__ctx.state.event.text,'urgent');return;}__ctx.balancedNextMonth();};
} },
{ order:615, run(__ctx:Runtime){__ctx.labelB=k=>({protectedCapacity:'защищённые места',receptionCapacity:'временные места приёма'})[k]||__ctx.balancedLabel(k);
} },
{ order:645, run(__ctx:Runtime){__ctx.v17EnsureWorld = __ctx.ensureWorld;
} },
{ order:646, run(__ctx:Runtime){__ctx.ensureWorld=function(s=__ctx.state){__ctx.v17EnsureWorld(s);__ctx.ensureCommunity(s);return s;};
} },
{ order:649, run(__ctx:Runtime){__ctx.v17NextMonth = __ctx.nextMonth;
} },
{ order:650, run(__ctx:Runtime){__ctx.nextMonth=function(){const before=__ctx.state.month;__ctx.v17NextMonth();if(__ctx.state.month!==before){__ctx.updateCommunityOffers();__ctx.invalidate();}};
} }
];
