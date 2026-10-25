/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.expeditionPreparationBonus = function expeditionPreparationBonus(){return __ctx.clamp((__ctx.state.expeditionPrep||0)*.05,0,.10);};

__ctx.expeditionCargoBonus = function expeditionCargoBonus(){return 1+__ctx.clamp((__ctx.state.expeditionPrep||0)*.12,0,.24);};

__ctx.expeditionMultiplier = function expeditionMultiplier(){const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;return __ctx.clamp((.9+(w.effective/135)*policy.expedition+(__ctx.state.bunker.intel||0)/300)*__ctx.expeditionCargoBonus(),.9,1.62)};

__ctx.scavenge = function scavenge(key){
 if(!__ctx.state.site||__ctx.state.actions<=0||__ctx.state.cityAccess<=0)return;const sc=__ctx.scavenges[key];__ctx.state.actions--;__ctx.state.surfaceMissions++;const mult=__ctx.expeditionMultiplier(),hasPopulation=('population' in sc.gain);let text=[];
 for(const [r,range] of __ctx.entries(sc.gain)){
  let n=__ctx.rnd(range[0],range[1]);if(n>0&&r!=='specialists'&&r!=='population')n=Math.max(1,Math.round(n*mult));
  if(r==='specialists'){
    if(hasPopulation){__ctx.state.specialists+=n;text.push(`специалисты +${n}`);}
    else {const room=Math.max(0,Math.floor((__ctx.state.bunker.capacity||0)-__ctx.state.population)),add=Math.min(room,n);__ctx.state.population+=add;__ctx.state.specialists+=add;if(add>0)__ctx.registerRescue(add,'city');text.push(`специалисты +${add}`);if(add<n)text.push(`не хватило мест для ${n-add}`);}
  } else if(r==='population'){
    const room=Math.max(0,Math.floor((__ctx.state.bunker.capacity||0)-__ctx.state.population)),add=Math.min(room,n);__ctx.state.population+=add;if(add>0)__ctx.registerRescue(add,'city');text.push(`спасённые жители +${add}`);if(add<n)text.push(`не хватило мест для ${n-add}`);
  } else {__ctx.state.resources[r]=Math.max(0,(__ctx.state.resources[r]||0)+n);text.push(`${__ctx.labelRes(r)} ${n>=0?'+':''}${n}`)}
 }
 __ctx.state.specialists=Math.min(__ctx.state.specialists,Math.floor(__ctx.state.population));
 const w=__ctx.workforceData();const risk=sc.risk*__ctx.state.diff*(1+__ctx.state.hazard/130)*__ctx.clamp(1-(w.effective/500)-(__ctx.state.bunker.intel||0)/450,.72,1.05);if(__ctx.random()*100<risk){const loss=__ctx.rnd(1,3);__ctx.state.health-=loss*2;__ctx.state.morale-=loss;__ctx.logMsg(`На вылазке «${sc.name}» произошёл инцидент. Здоровье поселения ухудшилось.`,'bad')}
 __ctx.state.cityAccess=__ctx.clamp(__ctx.state.cityAccess-__ctx.rnd(1,4)*(1+__ctx.state.hazard/100),0,100);__ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.logMsg(`Вылазка: ${sc.name}. Масштаб экспедиции ${Math.round(mult*100)}%. Получено: ${text.join(', ')}.`,'');__ctx.invalidate();
};

__ctx.expeditionScenarioPenalty = function expeditionScenarioPenalty(){return __ctx.state.scenario==='nuclear'?.08:__ctx.state.scenario==='epidemic'?.065:__ctx.state.scenario==='heat'?.045:__ctx.state.scenario==='ice'?.04:.04;};

__ctx.expeditionSurvivalChance = function expeditionSurvivalChance(kind='raid'){
 const b=__ctx.state.bunker,radioLvl=__ctx.state.built.radioCenter||0,base=kind==='trade'?.96:.91;
 const hazardLoss=(__ctx.state.hazard||0)*(kind==='trade'?.0065:.0072)*(__ctx.state.diff||1);
 const intelBonus=Math.min(.12,(b.intel||0)/430)+Math.min(.045,(b.medical||0)/900),radioBonus=kind==='trade'?Math.min(.08,radioLvl*.025):0,techBonus=__ctx.techEffect('expeditionBonus');
 return __ctx.clamp(base-hazardLoss-__ctx.expeditionScenarioPenalty()+intelBonus+radioBonus+techBonus+__ctx.expeditionPreparationBonus(),.08,.97);
};

__ctx.simulateExpedition = function simulateExpedition(team,kind='raid'){const chance=__ctx.expeditionSurvivalChance(kind);let survivors=0;for(let i=0;i<team;i++)if(__ctx.random()<chance)survivors++;return {team,survivors,lost:team-survivors,chance};};

__ctx.applyExpeditionLosses = function applyExpeditionLosses(result,label){if(result.lost<=0)return;const lost=__ctx.losePopulation(result.lost,'expedition');__ctx.state.morale=__ctx.clamp(__ctx.state.morale-(result.survivors===0?7:lost*1.6),0,100);__ctx.logMsg(`${label}: не вернулось ${lost} из ${result.team} человек${result.survivors===0?' — группа погибла полностью.':'.'}`,result.survivors===0?'bad':'warn');};

__ctx.deepCityRaid = function deepCityRaid(){
 if(__ctx.state.cityAccess>0){__ctx.logMsg('Рискованная вылазка откроется только после полной потери обычного доступа к городу.','warn');__ctx.invalidate();return;}
 if(__ctx.state.month-(__ctx.state.lastDeepRaidMonth??-999)<2){__ctx.logMsg('После прошлой дальней вылазки группа ещё не восстановилась. Следующая возможна раз в два месяца.','warn');__ctx.invalidate();return;}
 if(__ctx.state.population<4){__ctx.logMsg('Для дальней вылазки нужны 4 человека.','bad');__ctx.invalidate();return;}if(__ctx.state.actions<=0)return;
 const target=__ctx.input('deepRaidTarget')?.value||'steel';if(!__ctx.deepRaidLoot[target])return;
 __ctx.state.actions--;__ctx.state.lastDeepRaidMonth=__ctx.state.month;__ctx.state.surfaceMissions++;
 const result=__ctx.simulateExpedition(4,'raid');__ctx.applyExpeditionLosses(result,'⚠️ Дальняя вылазка');
 if(result.survivors>0){const range=__ctx.deepRaidLoot[target],base=__ctx.rnd(range[0],range[1]),haul=Math.max(.5,Math.round(base*(result.survivors/4)*__ctx.expeditionMultiplier()*10)/10);__ctx.state.resources[target]=(__ctx.state.resources[target]||0)+haul;__ctx.logMsg(`🎒 Из города вернулись ${result.survivors}/4. Целевой ресурс: ${__ctx.labelRes(target)} +${__ctx.fmtResource(haul)}.`,'good');}
 else __ctx.logMsg(`Группа не вернулась. Целевой ресурс «${__ctx.labelRes(target)}» не доставлен.`,'bad');
 __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.autosaveGame();__ctx.evaluate();__ctx.invalidate();
};

__ctx.establishRadioContact = function establishRadioContact(){
 const lvl=__ctx.state.built.radioCenter||0;if(lvl<1){__ctx.logMsg('Сначала постройте радиоцентр.','warn');__ctx.invalidate();return;}if(__ctx.state.actions<=0)return;
 if(__ctx.state.lastRadioSearchMonth===__ctx.state.month){__ctx.logMsg('В этом месяце радиоцентр уже проводил дальний поиск.','warn');__ctx.invalidate();return;}
 __ctx.state.actions--;__ctx.state.lastRadioSearchMonth=__ctx.state.month;
 const chance=__ctx.clamp(.48+lvl*.15+(__ctx.state.bunker.intel||0)/220+(__ctx.state.bunker.knowledge||0)/500+__ctx.techEffect('radioBonus')-(__ctx.state.hazard||0)/520,.30,.96);
 if(__ctx.random()<chance){__ctx.state.radioContact={name:__ctx.pick(__ctx.survivorSettlements),trust:__ctx.rnd(44,62),distance:__ctx.rnd(9,34)};__ctx.state.morale=__ctx.clamp(__ctx.state.morale+3,0,100);__ctx.logMsg(`📡 Установлена устойчивая связь: ${__ctx.state.radioContact.name}, примерно ${__ctx.state.radioContact.distance} км от нас.`,'good');__ctx.notify_playEventCue('good');}
 else __ctx.logMsg('📡 Радиопоиск не дал устойчивого контакта. В эфире только обрывки переговоров и помехи.','warn');
 __ctx.autosaveGame();__ctx.invalidate();
};

__ctx.tradeExcess = function tradeExcess(resource){return Math.max(0,(__ctx.state.resources[resource]||0)-(__ctx.tradeReserves[resource]||0));};

__ctx.tradeExpedition = function tradeExpedition(){
 const lvl=__ctx.state.built.radioCenter||0;if(lvl<1||!__ctx.state.radioContact){__ctx.logMsg('Для обмена нужен радиоцентр и установленная связь с другим поселением.','warn');__ctx.invalidate();return;}if(__ctx.state.actions<=0)return;
 if(__ctx.state.lastTradeMonth===__ctx.state.month){__ctx.logMsg('В этом месяце обменная экспедиция уже отправлялась.','warn');__ctx.invalidate();return;}
 const want=__ctx.input('tradeWant')?.value||'medicine',give=__ctx.input('tradeGive')?.value||'food';
 const amount=Math.max(1,Number(__ctx.input('tradeAmount')?.value)||5),team=__ctx.clamp(Math.round(Number(__ctx.input('tradeTeam')?.value)||5),1,5);
 if(want===give){__ctx.logMsg('Нельзя обменивать ресурс на тот же самый ресурс.','warn');__ctx.invalidate();return;}if(__ctx.state.population<team){__ctx.logMsg(`Для экспедиции выбран состав ${team}, но свободных жителей недостаточно.`,'bad');__ctx.invalidate();return;}
 const excess=__ctx.tradeExcess(give);if(excess<amount){__ctx.logMsg(`Избыточного ресурса «${__ctx.labelRes(give)}» недостаточно. Доступно для обмена только ${__ctx.fmtResource(excess)}.`,'warn');__ctx.invalidate();return;}
 __ctx.state.resources[give]-=amount;__ctx.state.actions--;__ctx.state.lastTradeMonth=__ctx.state.month;
 const result=__ctx.simulateExpedition(team,'trade');__ctx.applyExpeditionLosses(result,'🚚 Обменная экспедиция');
 if(result.survivors>0){const trustFactor=.82+__ctx.clamp((__ctx.state.radioContact.trust||50)/250,.12,.32),radioFactor=1+Math.max(0,lvl-1)*.04,theoretical=amount*(__ctx.tradeValues[give]||1)/(__ctx.tradeValues[want]||1)*trustFactor*radioFactor*(1+__ctx.techEffect('tradeOutput'))*__ctx.expeditionCargoBonus(),delivered=Math.max(.2,Math.round(theoretical*(result.survivors/team)*10)/10);__ctx.state.resources[want]=(__ctx.state.resources[want]||0)+delivered;__ctx.state.radioContact.trust=__ctx.clamp((__ctx.state.radioContact.trust||50)+2-result.lost*.7,10,100);__ctx.logMsg(`🤝 ${__ctx.state.radioContact.name}: вернулось ${result.survivors}/${team}. Доставлено: ${__ctx.labelRes(want)} +${__ctx.fmtResource(delivered)}. Отдано: ${__ctx.labelRes(give)} ${__ctx.fmtResource(amount)}.`,'good');}
 else{__ctx.state.radioContact.trust=__ctx.clamp((__ctx.state.radioContact.trust||50)-4,10,100);__ctx.logMsg(`Обменный груз потерян вместе с экспедицией: ${__ctx.labelRes(give)} −${__ctx.fmtResource(amount)}.`,'bad');}
 __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.autosaveGame();__ctx.evaluate();__ctx.invalidate();
};

__ctx.makeTerrain = function makeTerrain(s){const known=Array(__ctx.mapW*__ctx.mapH).fill(0);for(let y=4;y<=6;y++)for(let x=3;x<=5;x++)known[y*__ctx.mapW+x]=1;known[5*__ctx.mapW+4]=2;known[4*__ctx.mapW+3]=2;known[4*__ctx.mapW+5]=2;return {seed:s.worldSeed,known,selected:5*__ctx.mapW+4,visits:{},rewards:[],surveys:0,lastScoutMonth:-999};};

__ctx.locationFor = function locationFor(id){return __ctx.mapLocations.find(n=>n.id===id);};

__ctx.locationKnown = function locationKnown(id){__ctx.ensureWorld();const n=__ctx.locationFor(id);return !n||__ctx.state.terrain.known[n.y*__ctx.mapW+n.x]===2;};

__ctx.canSurvey = function canSurvey(index){if(!Number.isInteger(index)||index<0||index>=63||__ctx.state.terrain.known[index]===2)return false;const x=index%9,y=Math.floor(index/9);return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>x+dx>=0&&x+dx<9&&y+dy>=0&&y+dy<7&&__ctx.state.terrain.known[(y+dy)*9+x+dx]>0);};

__ctx.selectSector = function selectSector(index){if(!Number.isInteger(index)||index<0||index>=63)return;__ctx.state.terrain.selected=index;__ctx.requestTab('map');};

__ctx.surveySector = function surveySector(remote=false){
 __ctx.ensureWorld();const t=__ctx.state.terrain,i=t.selected,cost=remote?{fuel:1,electronics:.5}:{fuel:1,food:1};
 if(!__ctx.state.site||__ctx.state.event||__ctx.state.ended||__ctx.state.actions<=0||!__ctx.canSurvey(i)||!__ctx.canPay(cost))return;
 if(remote&&!(__ctx.state.gear.scoutDrone>0))return;if(!remote&&__ctx.state.population<3)return;
 __ctx.state.actions--;__ctx.pay(cost);t.lastScoutMonth=__ctx.state.month;let result: any={survivors:3,lost:0,team:3};
 if(!remote){result=__ctx.simulateExpedition(3,'scout');__ctx.applyExpeditionLosses(result,'Разведгруппа');__ctx.state.surfaceMissions++;__ctx.wearGear();}else __ctx.wearGear(true);
 if(result.survivors>0){t.known[i]=2;t.surveys++;const x=i%9,y=Math.floor(i/9);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<9&&yy>=0&&yy<7)t.known[yy*9+xx]=Math.max(1,t.known[yy*9+xx]);}
  __ctx.state.bunker.intel+=.65;const n=__ctx.mapLocations.find(n=>n.y*9+n.x===i);if(n&&!t.rewards.includes(n.id)){if(n.id==='relay'){__ctx.state.bunker.intel+=5;__ctx.state.bunker.knowledge+=3;}if(n.id==='waterSource')__ctx.state.bunker.water+=4;if(n.id==='archiveSite')__ctx.state.bunker.knowledge+=6;t.rewards.push(n.id);}
  __ctx.logMsg(`${remote?'Дрон обследовал':'Разведгруппа обследовала'} сектор ${String.fromCharCode(65+x)}${y+1}.${n?' Обнаружено: '+n.name+'. '+n.desc:' Подходы нанесены на карту; соседние сектора опознаны.'}${!remote?' Вернулись '+result.survivors+'/3.':''}`,'good');
 }else __ctx.logMsg('Разведгруппа не вернулась. Сектор остался необследованным.','bad');
 __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.evaluate();__ctx.invalidate();
};

__ctx.sectorMission = function sectorMission(id){__ctx.requestTab('city');const n=__ctx.locationFor(id);if(__ctx.scavenges[id]&&__ctx.state.cityAccess>0)__ctx.scavenge(id);else if(n&&['industry','supply','rescue'].includes(n.type)){__ctx.requestTab('city');__ctx.input('deepRaidTarget')?.focus();}};

__ctx.sectorCode = function sectorCode(index){return String.fromCharCode(65+index%9)+(Math.floor(index/9)+1);};

__ctx.allMapLocations = function allMapLocations(s=__ctx.state){return [...__ctx.mapLocations,...(s.terrain?.hiddenSites||[])];};

__ctx.mapLocationAt = function mapLocationAt(index,s=__ctx.state){return __ctx.allMapLocations(s).find(n=>n.y*9+n.x===index&&(!n.generated||__ctx.mapEpoch(s)>=n.epoch));};

__ctx.routeDescription = function routeDescription(index){
 if(__ctx.routeCheckCurrent(index))return __ctx.mapEpoch()===0?'Маршрут проверен · условия подготовки стабильны':`Маршрут проверен в М${__ctx.state.terrain.checkedAt[index]} · сведения действуют до 6 месяцев`;
 return __ctx.state.terrain.known[index]===2?'Сведения устарели: среда или состояние дорог изменились':'Адрес известен · текущее состояние пути не проверено';
};

__ctx.recoverMapSite = function recoverMapSite(id){
 __ctx.ensureWorld();const n=__ctx.state.terrain.hiddenSites.find(n=>n.id===id),t=__ctx.state.terrain,cost: any={fuel:1,food:1};
 if(!n||!__ctx.mapSiteVisible(n)||t.rewards.includes(id)||!__ctx.state.site||__ctx.state.event||__ctx.state.ended||__ctx.state.actions<=0||__ctx.state.population<3||!__ctx.canPay(cost))return;
 __ctx.state.actions--;__ctx.pay(cost);__ctx.state.surfaceMissions++;
 const result=__ctx.simulateExpedition(3,'raid');__ctx.applyExpeditionLosses(result,'Вывоз находки');__ctx.wearGear();
 if(result.survivors>0){
  // A saved, finite reserve; reloads and repeat surveys cannot roll new loot.
  t.rewards.push(id);t.visits[id]=(t.visits[id]||0)+1;
  if(n.kind==='heritage'){__ctx.state.bunker.knowledge+=4;__ctx.state.morale=__ctx.clamp(__ctx.state.morale+3,0,100);t.heritageRecovered++;__ctx.logMsg(`Спасён ${n.name.toLowerCase()}: знания +4, мораль +3. Вернулись ${result.survivors}/3.`,'good');}
  else{
   const gain=[];for(const [r,q] of __ctx.entries(n.gain)){const delivered=Math.max(1,Math.round(q*result.survivors/3*__ctx.environmentImpact().cargo));__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+delivered;gain.push(`${__ctx.labelRes(r)} +${delivered}`);}
   __ctx.logMsg(`${n.name}: вывезено ${gain.join(', ')}. Вернулись ${result.survivors}/3. Схрон исчерпан.`,'good');
  }
 }else __ctx.logMsg(`Группа не вернулась. Находка «${n.name}» осталась на местности.`,'bad');
 __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.evaluate();__ctx.invalidate();
};

__ctx.recordOutsideDose = function recordOutsideDose(team,kind='raid',index=null,remote=false){
 if(remote||team<=0)return;const p=__ctx.state.physical,e=__ctx.state.environment,idx=index??(__ctx.state.missionTarget&&__ctx.locationFor(__ctx.state.missionTarget)?__ctx.locationFor(__ctx.state.missionTarget).y*9+__ctx.locationFor(__ctx.state.missionTarget).x:31);
 const gd=__ctx.gearData(),robot=gd.id==='rescueDrone'||gd.id==='exosuit',duration=(kind==='scout'?3:kind==='trade'?10:8)*(robot?.65:1)*(1-Math.min(.25,__ctx.state.bunker.intel/400));
 const dose=__ctx.falloutActive()?__ctx.radiationAt(__ctx.state,__ctx.postMonths()*30,idx)*duration/1000:0;
 p.missionDose+=dose*team;p.missionPeople+=team;
 if(dose>20){const damage=Math.min(12,(dose-20)/12)*team/Math.max(1,__ctx.state.population);__ctx.addHealthCause('radiation',-damage);p.patients+=team*.15;}
 if(__ctx.state.scenario==='epidemic')p.infected=Math.min(__ctx.state.population,p.infected+team*e.prevalence/(1+(__ctx.state.built.quarantine||0)*2+(__ctx.state.built.airlock||0)));
 p.lastMissionDose={month:__ctx.state.month,team,perPerson:dose,hours:duration,index:idx};
};

__ctx.repairRoute = function repairRoute(){if(__ctx.state.actions<=0||__ctx.state.event||__ctx.state.ended||__ctx.state.built.printer<2||!__ctx.canPay({parts:2,precisionParts:1,fuel:1}))return;__ctx.pay({parts:2,precisionParts:1,fuel:1});__ctx.state.actions--;__ctx.state.physical.roadWork=Math.min(35,__ctx.state.physical.roadWork+8);__ctx.state.cityAccess=Math.min(100,__ctx.state.cityAccess+8);__ctx.logMsg('Инженерная группа восстановила участок дороги. Проходимость +8; разрушенные здания и исчерпанные схроны не восстанавливаются.','good');__ctx.invalidate();};

__ctx.ensureCommunity = function ensureCommunity(s=__ctx.state){
 if(!s.community||typeof s.community!=='object')s.community={nextOfferMonth:null,offer:null};
 const c=s.community;
 if(s.radioContact&&!Number.isFinite(c.nextOfferMonth))c.nextOfferMonth=s.month+2;
 if(c.offer){const o=c.offer;if(!__ctx.tradeValues[o.requested]||!__ctx.tradeValues[o.offered]||o.requested===o.offered||!['amount','receive','expires','month'].every(k=>Number.isFinite(o[k]))||o.amount<=0||o.receive<=0)c.offer=null;}
 if(!s.rescuePoint||typeof s.rescuePoint!=='object')s.rescuePoint={remaining:14+Math.floor(__ctx.worldHash(s.worldSeed+937)*15),rescued:0,lastMonth:-999};
 return c;
};

__ctx.scheduleCommunityOffer = function scheduleCommunityOffer(){
 const c=__ctx.ensureCommunity();c.nextOfferMonth=__ctx.state.month+3+Math.floor(__ctx.worldHash(__ctx.state.worldSeed+__ctx.state.month*73)*4);
};

__ctx.updateCommunityOffers = function updateCommunityOffers(){
 if(!__ctx.state.site||!__ctx.state.radioContact||__ctx.state.ended)return;
 const c=__ctx.ensureCommunity();
 if(c.offer&&__ctx.state.month>c.offer.expires){__ctx.logMsg(`📻 ${__ctx.state.radioContact.name}: срок предложения истёк, караван выбрал другой маршрут.`,'');c.offer=null;__ctx.scheduleCommunityOffer();}
 if(c.offer||__ctx.state.month<c.nextOfferMonth)return;
 const keys=Object.keys(__ctx.tradeValues),seed=__ctx.state.worldSeed+__ctx.state.month*41;
 const surplus=keys.filter(k=>__ctx.tradeExcess(k)>=2),pool=surplus.length?surplus:keys;
 const requested=pool[Math.floor(__ctx.worldHash(seed)*pool.length)];
 const want=keys.filter(k=>k!==requested),offered=want[Math.floor(__ctx.worldHash(seed+93)*want.length)];
 const amount=Math.max(2,Math.min(12,Math.floor(__ctx.tradeExcess(requested)*.3)||3));
 const receive=Math.max(.5,Math.round(amount*__ctx.tradeValues[requested]/__ctx.tradeValues[offered]*(.95+(__ctx.state.radioContact.trust||50)/500)*10)/10);
 c.offer={requested,offered,amount,receive,month:__ctx.state.month,expires:__ctx.state.month+3};
 __ctx.logMsg(`📻 Запрос от ${__ctx.state.radioContact.name}: нужны ${__ctx.labelRes(requested)} — ${__ctx.fmtResource(amount)}. Предлагают ${__ctx.labelRes(offered)} — ${__ctx.fmtResource(receive)}. Ответить можно в разделе «Экспедиции» до конца месяца ${c.offer.expires}.`,'good');
 __ctx.notify_playEventCue('good');__ctx.voice?.say('event','По радиосвязи поступило предложение обмена. Условия и срок ответа — в разделе экспедиций.','queue');
};

__ctx.answerTradeOffer = function answerTradeOffer(accept){
 if(!__ctx.state.site||!__ctx.state.radioContact||__ctx.state.event||__ctx.state.ended)return;
 const c=__ctx.ensureCommunity(),o=c.offer;if(!o)return;
 if(__ctx.state.month>o.expires){c.offer=null;__ctx.scheduleCommunityOffer();__ctx.invalidate();return;}
 if(accept){
  if(__ctx.state.actions<=0||__ctx.tradeExcess(o.requested)+__ctx.RESOURCE_EPSILON<o.amount||!__ctx.requireDecon(1))return;
  __ctx.pay({[o.requested]:o.amount});__ctx.state.resources[o.offered]=(__ctx.state.resources[o.offered]||0)+o.receive;__ctx.payDecon(1);__ctx.state.actions--;
  __ctx.state.radioContact.trust=__ctx.clamp((__ctx.state.radioContact.trust||50)+3,10,100);
  __ctx.logMsg(`🤝 Обмен у шлюза завершён. ${__ctx.state.radioContact.name}: отдано ${__ctx.labelRes(o.requested)} ${__ctx.fmtResource(o.amount)}; доставлено ${__ctx.labelRes(o.offered)} +${__ctx.fmtResource(o.receive)}. Люди не выходили на поверхность.`,'good');
  __ctx.notify_playEventCue('good');
 }else __ctx.logMsg(`📻 ${__ctx.state.radioContact.name}: предложение обмена отклонено. Доверие не изменилось.`,'');
 c.offer=null;__ctx.scheduleCommunityOffer();__ctx.updateSettlementStage();__ctx.evaluate();__ctx.invalidate();
};
}
export const steps: Initialization[] = [
{ order:239, run(__ctx:Runtime){__ctx.originalExpeditionMultiplier = __ctx.expeditionMultiplier;
} },
{ order:240, run(__ctx:Runtime){__ctx.expeditionMultiplier=function(){return __ctx.originalExpeditionMultiplier()*__ctx.environmentImpact().cargo*(1+__ctx.routeKnowledge());};
} },
{ order:241, run(__ctx:Runtime){__ctx.expeditionSurvivalChance=function(kind='raid'){
 const b=__ctx.state.bunker,radioLvl=__ctx.state.built.radioCenter||0,gear=__ctx.gearData(),im=__ctx.environmentImpact(),base=kind==='scout'?.985:kind==='trade'?.96:.91,loss=(__ctx.state.hazard||0)*(kind==='scout'?.0045:kind==='trade'?.0065:.0072)*(__ctx.state.diff||1);
 const intelBonus=Math.min(.12,(b.intel||0)/430)+Math.min(.045,(b.medical||0)/900),radioBonus=kind==='trade'?Math.min(.08,radioLvl*.025):0,scenarioPenalty=__ctx.expeditionScenarioPenalty()*(kind==='scout'?.5:1);
 return __ctx.clamp(base-(loss+im.outdoorPenalty+scenarioPenalty)*(1-gear.reduction)+intelBonus+radioBonus+__ctx.techEffect('expeditionBonus')+__ctx.expeditionPreparationBonus()+gear.bonus+__ctx.routeKnowledge(),.06,kind==='scout'?.995:.997);
};
} },
{ order:243, run(__ctx:Runtime){__ctx.scavenge=function(key){
 if(__ctx.state.ended||__ctx.state.event||!__ctx.state.site||__ctx.state.actions<=0||__ctx.state.cityAccess<=0||!__ctx.scavenges[key])return;
 if(!__ctx.locationKnown(key)){__ctx.logMsg('Локация ещё не обследована. Отправьте разведгруппу с карты местности.','warn');__ctx.invalidate();return;}
 const sc=__ctx.scavenges[key];__ctx.state.actions--;__ctx.state.surfaceMissions++;__ctx.state.missionTarget=key;const mult=__ctx.expeditionMultiplier(),hasPopulation='population' in sc.gain;let text=[],rescued=0;
 for(const [r,range] of __ctx.entries(sc.gain)){
  let n=__ctx.rnd(range[0],range[1]);if(n>0&&r!=='specialists'&&r!=='population')n=Math.max(1,Math.round(n*mult));
  if(r==='population'){const room=Math.max(0,Math.floor(__ctx.state.bunker.capacity-__ctx.state.population)),add=Math.min(room,n);__ctx.state.population+=add;rescued=add;if(add)__ctx.registerRescue(add,'city');text.push(`спасённые жители +${add}`);if(add<n)text.push(`не хватило жилых мест для ${n-add} спасаемых людей`);}
  else if(r==='specialists'){if(hasPopulation){const add=Math.min(rescued,n);__ctx.state.specialists+=add;text.push(`из них специалисты ${add}`);}else{const room=Math.max(0,Math.floor(__ctx.state.bunker.capacity-__ctx.state.population)),add=Math.min(room,n);__ctx.state.population+=add;__ctx.state.specialists+=add;if(add)__ctx.registerRescue(add,'city');text.push(`специалисты +${add}`);if(add<n)text.push(`не хватило жилых мест для ${n-add} спасаемых людей`);}}
  else{__ctx.state.resources[r]=Math.max(0,(__ctx.state.resources[r]||0)+n);text.push(`${__ctx.labelRes(r)} ${n>=0?'+':''}${n}`);}
 }
 __ctx.state.specialists=Math.min(__ctx.state.specialists,Math.floor(__ctx.state.population));
 if(__ctx.random()*100<__ctx.cityIncidentRisk(key)){const injury=__ctx.rnd(1,3)*(1-__ctx.gearData().reduction*.5);__ctx.state.health=Math.max(0,__ctx.state.health-injury*2);__ctx.state.morale=Math.max(0,__ctx.state.morale-injury);__ctx.logMsg(`На вылазке «${sc.name}» произошёл инцидент. Погода и экспозиция учтены; здоровье поселения снизилось на ${__ctx.fmtResource(injury*2)}.`,'bad');}
 __ctx.state.cityAccess=__ctx.clamp(__ctx.state.cityAccess-__ctx.rnd(1,4)*(1+__ctx.state.hazard/100),0,100);__ctx.wearGear();__ctx.state.terrain.visits[key]=(__ctx.state.terrain.visits[key]||0)+1;__ctx.consumeExpeditionPreparation();__ctx.state.missionTarget=null;__ctx.updateSettlementStage();__ctx.logMsg(`Вылазка: ${sc.name}. Масштаб экспедиции ${Math.round(mult*100)}%. Получено: ${text.join(', ')}.`,'');__ctx.evaluate();__ctx.invalidate();
};
} },
{ order:245, run(__ctx:Runtime){__ctx.deepCityRaid=function(){if(__ctx.state.event||__ctx.state.ended)return;const a=__ctx.state.actions;__ctx.state.missionTarget='deep';__ctx.originalDeepRaid();if(__ctx.state.actions<a){__ctx.wearGear();__ctx.autosaveGame();__ctx.invalidate();}__ctx.state.missionTarget=null;};
} },
{ order:246, run(__ctx:Runtime){__ctx.originalTradeExpedition = __ctx.tradeExpedition;
} },
{ order:247, run(__ctx:Runtime){__ctx.tradeExpedition=function(){if(__ctx.state.event||__ctx.state.ended)return;const a=__ctx.state.actions;__ctx.state.missionTarget='contact';__ctx.originalTradeExpedition();if(__ctx.state.actions<a){__ctx.wearGear();__ctx.autosaveGame();__ctx.invalidate();}__ctx.state.missionTarget=null;};
} },
{ order:317, run(__ctx:Runtime){__ctx.originalRadioContact = __ctx.establishRadioContact;
} },
{ order:318, run(__ctx:Runtime){__ctx.establishRadioContact=function(){if(__ctx.state.event||__ctx.state.ended)return;__ctx.originalRadioContact();if(__ctx.state.radioContact){__ctx.ensureWorld();__ctx.state.terrain.known[6*__ctx.mapW+8]=Math.max(1,__ctx.state.terrain.known[6*__ctx.mapW+8]);__ctx.autosaveGame();}}
} },
{ order:381, run(__ctx:Runtime){__ctx.stabilityRoute = __ctx.routeKnowledge;
} },
{ order:385, run(__ctx:Runtime){__ctx.expeditionSurvivalChance=function(kind='raid'){
 const previous=__ctx.state.missionTarget;__ctx.state.missionTarget=kind==='trade'?'contact':kind==='raid'?'deep':null;
 try{return __ctx.stabilitySurvival(kind);}finally{__ctx.state.missionTarget=previous;}
};
} },
{ order:386, run(__ctx:Runtime){__ctx.stabilityTrade = __ctx.tradeExpedition;
} },
{ order:387, run(__ctx:Runtime){__ctx.deepCityRaid=function(){try{return __ctx.stabilityDeep();}finally{__ctx.state.missionTarget=null;if(__ctx.state.site)__ctx.invalidate();}};
} },
{ order:388, run(__ctx:Runtime){__ctx.tradeExpedition=function(){try{return __ctx.stabilityTrade();}finally{__ctx.state.missionTarget=null;if(__ctx.state.site)__ctx.invalidate();}};
} },
{ order:410, run(__ctx:Runtime){__ctx.locationKnown=function(id){__ctx.ensureWorld();const n=__ctx.locationFor(id);return !n||__ctx.mapSiteVisible(n);};
} },
{ order:413, run(__ctx:Runtime){__ctx.canSurvey=function(index){return Number.isInteger(index)&&index>=0&&index<63&&!__ctx.routeCheckCurrent(index);};
} },
{ order:414, run(__ctx:Runtime){__ctx.surveySector=function(remote=false){
 __ctx.ensureWorld();const t=__ctx.state.terrain,i=t.selected,cost=remote?{fuel:1,electronics:.5}:{fuel:1,food:1};
 if(!__ctx.state.site||__ctx.state.event||__ctx.state.ended||__ctx.state.actions<=0||!__ctx.canSurvey(i)||!__ctx.canPay(cost))return;
 if(remote&&!(__ctx.state.gear.scoutDrone>0)||!remote&&__ctx.state.population<3)return;
 const recheck=t.known[i]===2;
 __ctx.state.actions--;__ctx.pay(cost);t.lastScoutMonth=__ctx.state.month;
 let result: any={survivors:3,lost:0,team:3};
 if(!remote){result=__ctx.simulateExpedition(3,'scout');__ctx.applyExpeditionLosses(result,'Разведгруппа');__ctx.state.surfaceMissions++;__ctx.wearGear();}else __ctx.wearGear(true);
 if(result.survivors>0){
  t.known[i]=2;t.checkedAt[i]=__ctx.state.month;t.checkedEpoch[i]=__ctx.mapEpoch();t.surveys++;__ctx.state.bunker.intel+=.65;
  const n=__ctx.mapLocationAt(i),discovered=n&&!n.familiar&&!t.discoveredSites.includes(n.id);
  if(discovered)t.discoveredSites.push(n.id);
  if(n&&!n.generated&&!t.rewards.includes(n.id)){
   if(n.id==='relay'){__ctx.state.bunker.intel+=5;__ctx.state.bunker.knowledge+=3;}
   if(n.id==='waterSource')__ctx.state.bunker.water+=4;
   if(n.id==='archiveSite')__ctx.state.bunker.knowledge+=6;
   t.rewards.push(n.id);
  }
  __ctx.logMsg(`${remote?'Дрон':'Разведгруппа'} ${recheck?'повторно проверил'+(remote?'':'а'):'обследовал'+(remote?'':'а')} сектор ${__ctx.sectorCode(i)}. ${discovered?'Обнаружено: '+n.name+'. '+n.desc:n?.familiar?'Проверено: '+n.name+'. Состояние маршрута обновлено.':'Текущее состояние местности нанесено на карту.'}${!remote?' Вернулись '+result.survivors+'/3.':''}`,'good');
 }else __ctx.logMsg('Разведгруппа не вернулась. Состояние маршрута осталось непроверенным.','bad');
 __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.evaluate();__ctx.invalidate();
};
} },
{ order:416, run(__ctx:Runtime){__ctx.sectorMission=function(id){
 if(__ctx.scavenges[id]){__ctx.requestTab('city');__ctx.scavenge(id);return;}
 if(__ctx.state.terrain.hiddenSites.some(n=>n.id===id))__ctx.recoverMapSite(id);
};
} },
{ order:474, run(__ctx:Runtime){__ctx.expeditionSurvivalChance=function(kind='raid'){
 const e=__ctx.state.environment||__ctx.computeEnvironment(__ctx.state),g=__ctx.gearData(),b=__ctx.state.bunker,weather=__ctx.environmentImpact().outdoorPenalty;
 const route=__ctx.routeKnowledge(),preparation=__ctx.expeditionPreparationBonus(),tech=__ctx.techEffect('expeditionBonus'),training=Math.min(.07,b.intel/700),base=kind==='scout'?.985:kind==='trade'?.96:.95;
 const dose=__ctx.falloutActive()?__ctx.radiationAt(__ctx.state,__ctx.postMonths()*30,31)*(kind==='scout'?3:8)/1000:0;
 const radiationRisk=dose>30?Math.min(.65,(dose-30)/300):0;
 return __ctx.clamp(base-weather*(1-g.reduction)-radiationRisk-(__ctx.state.scenario==='epidemic'?e.prevalence*.18:0)+training+route+preparation+tech+g.bonus,.06,.997);
};
} },
{ order:479, run(__ctx:Runtime){__ctx.scavenge=function(key){
 __ctx.ensureWorld();const sc=__ctx.scavenges[key];if(!sc||__ctx.state.ended||__ctx.state.event||!__ctx.state.site||__ctx.state.actions<=0||__ctx.state.cityAccess<=0||!__ctx.locationKnown(key)||!__ctx.requireDecon(4))return;
 const p=__ctx.state.physical;if(!p.cityStocks[key])p.cityStocks[key]=Object.fromEntries(__ctx.entries(sc.gain).filter(([r])=>!['population','specialists'].includes(r)).map(([r,q])=>[r,q[1]*10]));
 const hasPeople='population' in sc.gain||'specialists' in sc.gain;
 if(!hasPeople&&__ctx.values(p.cityStocks[key]).every(q=>q<=0)){__ctx.logMsg('Запасы этого объекта исчерпаны. Используйте производство, другой объект или обмен.','warn');__ctx.invalidate();return;}
 __ctx.state.actions--;__ctx.state.surfaceMissions++;__ctx.state.missionTarget=key;const text=[];let rescued=0;
 try{
  const mult=__ctx.expeditionMultiplier();
  for(const [r,range] of __ctx.entries(sc.gain)){
   let amount=__ctx.rnd(range[0],range[1]);
   if(r==='population'){const room=Math.max(0,Math.floor(__ctx.state.bunker.capacity-__ctx.state.population));rescued=Math.min(room,amount);__ctx.state.population+=rescued;if(rescued)__ctx.registerRescue(rescued,'city');text.push(`спасённые жители +${rescued}`);if(rescued<amount)text.push(`не хватило жилых мест для ${amount-rescued} спасаемых людей`);}
   else if(r==='specialists'){const add='population' in sc.gain?Math.min(rescued,amount):Math.min(Math.max(0,Math.floor(__ctx.state.bunker.capacity-__ctx.state.population)),amount);if(!('population' in sc.gain)){__ctx.state.population+=add;if(add)__ctx.registerRescue(add,'city');}__ctx.state.specialists+=add;text.push(`специалисты +${add}`);}
   else{amount=Math.min(p.cityStocks[key][r],Math.max(1,Math.round(amount*mult)));p.cityStocks[key][r]-=amount;__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+amount;text.push(`${__ctx.labelRes(r)} +${__ctx.fmtResource(amount)}`);}
  }
  __ctx.state.specialists=Math.min(__ctx.state.specialists,Math.floor(__ctx.state.population));
  if(__ctx.random()*100<__ctx.cityIncidentRisk(key)){const injured=__ctx.rnd(1,3)*(1-__ctx.gearData().reduction*.5);p.patients+=injured;__ctx.addHealthCause('injuries',-injured*2*Math.min(1,4/Math.max(1,__ctx.state.population)));__ctx.logMsg(`На вылазке «${sc.name}» есть травмы в группе. Медицинская нагрузка и здоровье затронутой группы учтены.`,'warn');}
  __ctx.payDecon(4);const n=__ctx.locationFor(key);__ctx.recordOutsideDose(4,'raid',n?n.y*9+n.x:null);__ctx.wearGear();__ctx.state.terrain.visits[key]=(__ctx.state.terrain.visits[key]||0)+1;__ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();__ctx.logMsg(`Вылазка: ${sc.name}. Масштаб экспедиции ${Math.round(mult*100)}%. Получено: ${text.join(', ')}.`,'');
 }finally{__ctx.state.missionTarget=null;}
 __ctx.evaluate();__ctx.invalidate();
};
} },
{ order:481, run(__ctx:Runtime){__ctx.deepCityRaid=function(){__ctx.ensureWorld();if(!__ctx.requireDecon(4))return;const a=__ctx.state.actions;__ctx.physicalDeep();if(__ctx.state.actions<a){__ctx.payDecon(4);__ctx.recordOutsideDose(4,'raid');__ctx.invalidate();}};
} },
{ order:483, run(__ctx:Runtime){__ctx.tradeExpedition=function(){__ctx.ensureWorld();const n=Math.max(1,Number(__ctx.input('tradeTeam')?.value)||5);if(!__ctx.requireDecon(n))return;const a=__ctx.state.actions;__ctx.physicalTrade();if(__ctx.state.actions<a){__ctx.payDecon(n);__ctx.recordOutsideDose(n,'trade');__ctx.invalidate();}};
} },
{ order:485, run(__ctx:Runtime){__ctx.recoverMapSite=function(id){__ctx.ensureWorld();if(!__ctx.requireDecon(3))return;const a=__ctx.state.actions;__ctx.physicalRecover(id);if(__ctx.state.actions<a){__ctx.payDecon(3);__ctx.recordOutsideDose(3,'raid');__ctx.invalidate();}};
} },
{ order:487, run(__ctx:Runtime){__ctx.surveySector=function(remote=false){__ctx.ensureWorld();if(!remote&&!__ctx.requireDecon(3))return;const a=__ctx.state.actions,i=__ctx.state.terrain.selected,rewards=[...__ctx.state.terrain.rewards],before=__ctx.state.bunker.water;__ctx.physicalSurvey(remote);if(__ctx.state.actions<a){if(!remote){__ctx.payDecon(3);__ctx.recordOutsideDose(3,'scout',i);}else if(__ctx.falloutActive()&&!(__ctx.state.built.decon>0)&&__ctx.state.bunker.water>before){__ctx.state.bunker.water=before;__ctx.state.terrain.rewards=rewards;__ctx.logMsg('Дрон нашёл источник. Для подключения воды требуется станция дезактивации и повторная проверка после её строительства.','warn');__ctx.state.terrain.checkedAt[i]=-1;}__ctx.invalidate();}};
} },
{ order:596, run(__ctx:Runtime){__ctx.recordOutsideDose=function(team,kind='raid',index=null,remote=false){__ctx.balancedOutsideDose(team,kind,index,remote);if(!remote&&team>0)__ctx.state.balance.missionWork+=team*(kind==='trade'?10:kind==='scout'?3:8)/160;};
} },
{ order:653, run(__ctx:Runtime){__ctx.v17Radio = __ctx.establishRadioContact;
} },
{ order:654, run(__ctx:Runtime){__ctx.establishRadioContact=function(){__ctx.v17Radio();__ctx.ensureCommunity();__ctx.autosaveGame();};
} },
{ order:664, run(__ctx:Runtime){__ctx.v17Scavenge = __ctx.scavenge;
} },
{ order:665, run(__ctx:Runtime){__ctx.scavenge=function(key){if(key==='evacuation')return __ctx.evacuateSurvivors();return __ctx.v17Scavenge(key);};
} }
];
