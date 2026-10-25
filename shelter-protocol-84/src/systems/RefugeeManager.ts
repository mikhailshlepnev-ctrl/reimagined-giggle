/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.registerRescue = function registerRescue(count,source='other'){
 const n=Math.max(0,Number(count)||0); if(n<=0)return 0; __ctx.state.rescuedTotal=(__ctx.state.rescuedTotal||0)+n; return n;
};

__ctx.losePopulation = function losePopulation(count,cause='other'){
 const requested=Math.max(0,Number(count)||0),loss=Math.min(Math.max(0,__ctx.state.population||0),requested); if(loss<=0)return 0;
 __ctx.state.population=Math.max(0,__ctx.state.population-loss); __ctx.state.deathsTotal=(__ctx.state.deathsTotal||0)+loss;
 if(!__ctx.state.lossCauses)__ctx.state.lossCauses={expedition:0,environment:0,refugees:0,other:0}; __ctx.state.lossCauses[cause]=(__ctx.state.lossCauses[cause]||0)+loss;
 __ctx.state.specialists=Math.min(__ctx.state.specialists||0,Math.floor(__ctx.state.population)); return loss;
};

__ctx.humanitarianMetrics = function humanitarianMetrics(){
 const survivors=Math.max(0,__ctx.state.population||0),rescued=Math.max(0,__ctx.state.rescuedTotal||0),deaths=Math.max(0,__ctx.state.deathsTotal||0),arrivals=Math.max(0,__ctx.state.refugeeArrivals||0),accepted=Math.max(0,__ctx.state.refugeeAccepted||0),refused=Math.max(0,__ctx.state.refugeeRefused||0);
 const protectedCount=Math.max(1,(__ctx.state.initialPopulation||0)+rescued+(__ctx.state.naturalGrowth||0)),survivalRate=__ctx.clamp(survivors/protectedCount,0,1),acceptanceRate=arrivals>0?__ctx.clamp(accepted/arrivals,0,1):1,rescueScale=__ctx.clamp(rescued/Math.max(10,(__ctx.state.targetPop||40)*.65),0,1);
 const index=Math.round(__ctx.clamp((survivalRate*.55+rescueScale*.27+acceptanceRate*.18)*100,0,100));
 const grade=index>=92?'S':index>=82?'A':index>=70?'B':index>=56?'C':index>=42?'D':'E';
 const humanitarian=Math.max(0,Math.round(survivors*30+rescued*24-deaths*75-refused*6));
 const systems=Math.max(0,Math.round(__ctx.resilience()*4+(__ctx.state.bunker.knowledge||0)*1.5+(__ctx.state.settlementLevel||0)*75-(__ctx.state.shortages||0)*14));
 return {survivors,rescued,deaths,arrivals,accepted,refused,protectedCount,survivalRate,acceptanceRate,index,grade,humanitarian,systems,total:Math.max(0,humanitarian+systems)};
};

__ctx.refugeeScenarioRisk = function refugeeScenarioRisk(){
 const b=__ctx.state.bunker||{},haz=__ctx.clamp(__ctx.state.hazard||0,0,100); let base=.18,def=.15;
 if(__ctx.state.scenario==='ice'){base=.15;def=((b.thermal||0)*.45+(b.medical||0)*.25+(b.power||0)*.15)/100;}
 else if(__ctx.state.scenario==='heat'){base=.17;def=((b.water||0)*.40+(b.thermal||0)*.25+(b.medical||0)*.20)/100;}
 else if(__ctx.state.scenario==='nuclear'){base=.31;def=((b.shield||0)*.48+(b.medical||0)*.22+(b.integrity||0)*.15)/100;}
 else if(__ctx.state.scenario==='epidemic'){base=.37;def=((b.biosecurity||0)*.55+(b.medical||0)*.30+(__ctx.state.built.quarantine||0)*8+(__ctx.state.built.airlock||0)*6)/100;}
 return __ctx.clamp(base+haz/390-def*.28,.05,.62);
};

__ctx.refugeeRiskText = function refugeeRiskText(){
 if(__ctx.state.scenario==='ice')return 'обморожения, истощение и резкий расход топлива на обогрев';
 if(__ctx.state.scenario==='heat')return 'обезвоживание, тепловые поражения и дополнительная нагрузка на воду и медицину';
 if(__ctx.state.scenario==='nuclear')return 'радиоактивное загрязнение одежды, техники и людей';
 return 'скрытая инфекция и риск заноса нового штамма внутрь комплекса';
};

__ctx.refugeeAttractionData = function refugeeAttractionData(){
 const r=__ctx.resilience(),stage=__ctx.state.settlementLevel||0,crowd=Math.max(0,(__ctx.state.population||0)-(__ctx.state.bunker.capacity||0)),crowdPenalty=crowd/Math.max(1,__ctx.state.bunker.capacity||1);
 const reputation=__ctx.clamp(r+stage*3+Math.min(8,(__ctx.state.bunker.knowledge||0)/12)-crowdPenalty*30,0,100);
 const phaseFactor=__ctx.state.phase==='Предапокалипсис'?.45:__ctx.state.phase==='Обрушение'?1.10:__ctx.state.phase==='Глубокий кризис'?1:.72;
 const chance=__ctx.state.month<Math.max(1,__ctx.state.prepMonths-3)?0:__ctx.clamp(.025+Math.max(0,reputation-32)*.0045*phaseFactor,.02,.36);
 const groupBase=2+Math.floor(Math.max(0,reputation-45)/18)+Math.floor(stage/3),groupMin=Math.max(2,groupBase),groupMax=Math.max(groupMin+1,groupBase+3);
 return {resilience:r,reputation,chance,groupMin,groupMax,risk:__ctx.refugeeScenarioRisk()};
};

__ctx.refugeeAdmissionCosts = function refugeeAdmissionCosts(n){
 const c: any={medicine:Math.max(1,Math.ceil(n*.24))};
 if(__ctx.state.scenario==='ice')c.fuel=Math.max(1,Math.ceil(n*.28));
 else if(__ctx.state.scenario==='heat')c.food=Math.max(1,Math.ceil(n*.28));
 else if(__ctx.state.scenario==='nuclear')c.electronics=Math.max(1,Math.ceil(n*.13));
 else if(__ctx.state.scenario==='epidemic')c.medicine=Math.max(2,Math.ceil(n*.48));
 return c;
};

__ctx.applyRefugeeRisk = function applyRefugeeRisk(n,riskMultiplier=1){
 const risk=__ctx.clamp(__ctx.refugeeScenarioRisk()*riskMultiplier,0,.82); if(__ctx.random()>=risk){__ctx.logMsg('Прибывшая группа прошла адаптацию без серьёзного инцидента.','good');return;}
 __ctx.state.refugeeIncidents=(__ctx.state.refugeeIncidents||0)+1; const severity=1+Math.floor(n/5)+Math.floor((__ctx.state.hazard||0)/55); let deaths=0;
 if(__ctx.state.scenario==='ice'){
   const need=Math.max(1,Math.ceil(n*.20)); const used=Math.min(__ctx.state.resources.fuel||0,need); __ctx.state.resources.fuel=Math.max(0,(__ctx.state.resources.fuel||0)-used); __ctx.state.health-=1.2*severity;
   if(used<need || (__ctx.state.bunker.thermal||0)<35){deaths=__ctx.random()<.18*severity?1:0;__ctx.state.morale-=1;}
   __ctx.logMsg(`❄️ Среди беженцев тяжёлые обморожения. На экстренный обогрев ушло ${used} топлива.`,'warn');
 } else if(__ctx.state.scenario==='heat'){
   const med=Math.min(__ctx.state.resources.medicine||0,Math.max(1,Math.ceil(n*.18)));__ctx.state.resources.medicine=Math.max(0,(__ctx.state.resources.medicine||0)-med);__ctx.state.health-=1.4*severity;
   if(__ctx.waterBalancePreview().humanCoverage<.9)deaths=__ctx.random()<.16*severity?1:0;
   __ctx.logMsg('☀️ Массовое обезвоживание среди прибывших перегрузило медицинский и водный контуры.','warn');
 } else if(__ctx.state.scenario==='nuclear'){
   const med=Math.min(__ctx.state.resources.medicine||0,Math.max(1,Math.ceil(n*.22)));__ctx.state.resources.medicine=Math.max(0,(__ctx.state.resources.medicine||0)-med);__ctx.state.bunker.shield=Math.max(0,(__ctx.state.bunker.shield||0)-Math.max(1,Math.floor(severity/2)));__ctx.state.health-=1.8*severity;
   if((__ctx.state.bunker.shield||0)<35&&__ctx.random()<.20*severity)deaths=Math.min(n,__ctx.rnd(1,Math.max(1,Math.ceil(n*.12))));
   __ctx.logMsg('☢️ Дезактивация выявила сильное загрязнение. Фильтры и медблок работают на пределе.','bad');
 } else {
   const med=Math.min(__ctx.state.resources.medicine||0,Math.max(1,Math.ceil(n*.30)));__ctx.state.resources.medicine=Math.max(0,(__ctx.state.resources.medicine||0)-med);__ctx.state.health-=2.1*severity;__ctx.state.morale-=1;
   const defense=(__ctx.state.bunker.biosecurity||0)+(__ctx.state.bunker.medical||0)*.45+(__ctx.state.built.quarantine||0)*10;
   if(defense<65&&__ctx.random()<.22*severity)deaths=Math.min(n,__ctx.rnd(1,Math.max(1,Math.ceil(n*.14))));
   __ctx.logMsg('☣️ У части прибывших проявились симптомы инфекции. Внутренний карантин немедленно усилен.','bad');
 }
 if(deaths>0){const lost=__ctx.losePopulation(deaths,'refugees');__ctx.logMsg(`Инцидент после приёма беженцев привёл к потерям: −${lost.toFixed(lost%1?1:0)} чел.`,'bad');}
 __ctx.state.health=__ctx.clamp(__ctx.state.health,0,100);__ctx.state.morale=__ctx.clamp(__ctx.state.morale,0,100);
};

__ctx.admitRefugees = function admitRefugees(group,mode='open'){
 group=Math.max(0,Math.round(group)); if(!group)return;
 let accepted=group,refused=0,riskMult=1;
 if(mode==='controlled'){
   const temporary=Math.floor((__ctx.state.bunker.medical||0)/28)+(__ctx.state.built.quarantine||0)*3,free=Math.max(0,Math.floor((__ctx.state.bunker.capacity||0)-(__ctx.state.population||0))),safeSlots=Math.max(1,free+temporary);
   accepted=Math.min(group,safeSlots); refused=group-accepted; const costs=__ctx.refugeeAdmissionCosts(accepted),prepared=__ctx.canPay(costs);
   if(prepared){__ctx.pay(costs);riskMult=.30;__ctx.logMsg(`Контролируемый приём: потрачено ${__ctx.entries(costs).map(([k,v])=>`${__ctx.labelRes(k)} ${v}`).join(', ')}.`,'');}
   else {riskMult=.58;__ctx.logMsg('Для полноценного карантинного протокола не хватило ресурсов. Приём проведён в аварийном режиме.','warn');}
 } else {
   __ctx.state.resources.food=Math.max(0,(__ctx.state.resources.food||0)-group*.45);riskMult=1;__ctx.state.morale=__ctx.clamp(__ctx.state.morale+Math.min(4,1+group*.25),0,100);
 }
 if(accepted>0){__ctx.state.population+=accepted;const specs=Math.min(accepted,__ctx.rnd(0,Math.max(1,Math.ceil(accepted*.24))));__ctx.state.specialists=Math.min(Math.floor(__ctx.state.population),(__ctx.state.specialists||0)+specs);__ctx.state.refugeeAccepted=(__ctx.state.refugeeAccepted||0)+accepted;__ctx.registerRescue(accepted,'refugees');__ctx.logMsg(`🚪 Принято беженцев: ${accepted}${specs?` · специалистов среди них: ${specs}`:''}.`,'good');__ctx.applyRefugeeRisk(accepted,riskMult);}
 if(refused>0){__ctx.state.refugeeRefused=(__ctx.state.refugeeRefused||0)+refused;__ctx.state.morale=__ctx.clamp(__ctx.state.morale-Math.min(4,refused*.35),0,100);__ctx.logMsg(`Из-за ограничений не удалось принять ${refused} человек.`,'warn');}
 __ctx.updateSettlementStage();
};

__ctx.rejectRefugees = function rejectRefugees(group){group=Math.max(0,Math.round(group));__ctx.state.refugeeRefused=(__ctx.state.refugeeRefused||0)+group;__ctx.state.morale=__ctx.clamp(__ctx.state.morale-Math.min(6,1+group*.45),0,100);__ctx.logMsg(`Ворота не открыли. ${group} человек ушли искать другое убежище.`,'warn');};

__ctx.maybeRefugeeArrival = function maybeRefugeeArrival(){
 if(__ctx.state.event||!__ctx.state.site)return false;const a=__ctx.refugeeAttractionData();if(a.chance<=0||__ctx.random()>=a.chance)return false;
 const group=__ctx.rnd(a.groupMin,a.groupMax);__ctx.state.refugeeArrivals=(__ctx.state.refugeeArrivals||0)+group;
 __ctx.state.event=__ctx.refugeeEvent(group);__ctx.notify_announceEvent(__ctx.state.event.title);return true;
};

__ctx.refugeeEvent = function refugeeEvent(group){
 const a=__ctx.refugeeAttractionData(),riskPct=Math.round(a.risk*100);
 return {data:{group},title:'Беженцы у внешнего периметра',text:`К убежищу вышла группа из ${group} человек. Устойчивость поселения ${Math.round(a.resilience)}% сделала его заметным безопасным пунктом. Чем сильнее становится поселение, тем чаще сюда будут идти люди. Риск этого режима: ${__ctx.refugeeRiskText()}. Базовый риск инцидента при немедленном приёме — около ${riskPct}%.`,choices:[
  [`Открыть ворота — принять всех ${group}`,()=>__ctx.admitRefugees(group,'open')],
  [`Контролируемый приём / карантин`,()=>__ctx.admitRefugees(group,'controlled')],
  [`Не открывать ворота`,()=>__ctx.rejectRefugees(group)]
 ]};
};

__ctx.admitWaitingRefugees = function admitWaitingRefugees(){const p=__ctx.state.physical,q=p?.pendingRefugees;if(!q||__ctx.state.actions<=0||__ctx.state.event||__ctx.state.ended||!__ctx.requireDecon(q.group))return;__ctx.state.actions--;p.pendingRefugees=null;__ctx.admitRefugees(q.group,'controlled');__ctx.evaluate();__ctx.invalidate();};

__ctx.aidWaitingRefugees = function aidWaitingRefugees(){const q=__ctx.state.physical.pendingRefugees;if(!q||__ctx.state.event||__ctx.state.ended||__ctx.state.actions<=0||__ctx.state.balance.lastWaitingCareMonth===__ctx.state.month||__ctx.state.bunker.receptionCapacity<q.group||!__ctx.canPay({food:1,medicine:1}))return;__ctx.pay({food:1,medicine:1});__ctx.state.actions--;__ctx.state.balance.lastWaitingCareMonth=__ctx.state.month;q.caredAt=__ctx.state.month;__ctx.logMsg('Прибывшие получили экстренную помощь в отдельном защищённом отсеке. Заселение проходит через дезактивацию и карантин.','good');__ctx.invalidate();};

__ctx.housingStatus = function housingStatus(){
 const capacity=Math.max(0,Math.floor(__ctx.state.bunker?.capacity||0)),population=Math.max(0,__ctx.state.population||0);
 return {capacity,occupied:Math.ceil(population),free:Math.max(0,Math.floor(capacity-population)),over:Math.max(0,Math.ceil(population-capacity))};
};

__ctx.evacuationStatus = function evacuationStatus(){
 __ctx.ensureWorld();const point=__ctx.locationFor('evacuation'),q=__ctx.state.rescuePoint,h=__ctx.housingStatus(),cost: any={fuel:1,food:1},d=__ctx.deconStatus(4);
 const known=__ctx.mapSiteVisible(point),surv=__ctx.expeditionSurvivalChance('raid');
 let reason=!known?'Пункт ещё не найден разведкой':q.remaining<=0?'Все ожидавшие эвакуированы':q.lastMonth===__ctx.state.month?'Группа восстанавливается до следующего месяца':h.free<1?'Нет свободного жилья':__ctx.state.population<3?'Нужны 3 участника спасательной группы':!__ctx.canPay(cost)?'Нужно 1 топливо и 1 еда':!d.available?d.reason:__ctx.state.actions<=0?'Нет действий':__ctx.state.event?'Сначала решите текущее событие':__ctx.state.ended?'Кампания завершена':'';
 return {point,q,h,cost,known,surv,reason};
};

__ctx.evacuateSurvivors = function evacuateSurvivors(){
 if(!__ctx.state.site||__ctx.state.event||__ctx.state.ended)return;
 const e=__ctx.evacuationStatus();if(e.reason)return;
 __ctx.state.actions--;__ctx.pay(e.cost);__ctx.state.surfaceMissions++;__ctx.state.rescuePoint.lastMonth=__ctx.state.month;__ctx.state.missionTarget='evacuation';
 try{
  const result=__ctx.simulateExpedition(3,'raid');__ctx.applyExpeditionLosses(result,'Спасательная группа');
  let rescued=0;
  if(result.survivors>0){
   const room=__ctx.housingStatus().free;
   rescued=Math.min(e.q.remaining,room,result.survivors*2);
   if(__ctx.falloutActive()){
    const population=__ctx.state.population;
    try{
     while(rescued>0){__ctx.state.population=population+rescued;if(__ctx.deconStatus(result.survivors+rescued).available)break;rescued--;}
    }finally{__ctx.state.population=population;}
   }
   if(rescued>0){__ctx.state.population+=rescued;e.q.remaining-=rescued;e.q.rescued+=rescued;__ctx.registerRescue(rescued,'evacuation');__ctx.state.physical.quarantine+=rescued;__ctx.state.physical.patients+=rescued*.1;}
   __ctx.logMsg(`♧ Пункт эвакуации: вернулись ${result.survivors}/3 участников. Спасено ${rescued} человек. Ожидают следующей группы: ${e.q.remaining}.`,'good');
   if(!rescued)__ctx.logMsg('Свободных жилых или санитарных мест для приёма не осталось. Ожидающие остались на пункте.','warn');
  }else __ctx.logMsg('Связь со спасательной группой потеряна. Люди на пункте эвакуации продолжают ждать.','bad');
  if(result.survivors)__ctx.payDecon(result.survivors+rescued);__ctx.recordOutsideDose(result.survivors,'raid',e.point.y*9+e.point.x);__ctx.wearGear();
  if(result.survivors)__ctx.state.terrain.visits.evacuation=(__ctx.state.terrain.visits.evacuation||0)+1;
  __ctx.consumeExpeditionPreparation();__ctx.updateSettlementStage();
 }finally{__ctx.state.missionTarget=null;}
 __ctx.evaluate();__ctx.invalidate();
};
}
export const steps: Initialization[] = [
{ order:248, run(__ctx:Runtime){__ctx.originalRefugeeRisk = __ctx.refugeeScenarioRisk;
} },
{ order:249, run(__ctx:Runtime){__ctx.refugeeScenarioRisk=function(){return __ctx.clamp(__ctx.originalRefugeeRisk()+__ctx.environmentImpact().outdoorPenalty*.13,0,.93);};
} },
{ order:490, run(__ctx:Runtime){__ctx.physicalRefugeeEvent = __ctx.refugeeEvent;
} },
{ order:491, run(__ctx:Runtime){__ctx.refugeeEvent=function(group){const ev=__ctx.physicalRefugeeEvent(group);if(__ctx.falloutActive()){
 ev.text+=' После выпадений все прибывающие проходят станцию дезактивации и изолированный карантинный приём.';
 ev.choices[0][0]='Принять всех через дезактивацию и карантин';ev.choices[0][1]=()=>__ctx.admitRefugees(group,'controlled');
 ev.choices.push(['Организовать наружный пункт ожидания',()=>{if(__ctx.state.physical.pendingRefugees){__ctx.logMsg('Пункт уже занят; группа продолжила путь.','warn');__ctx.rejectRefugees(group);}else{__ctx.state.physical.pendingRefugees={group,since:__ctx.state.month};__ctx.logMsg('Группа размещена в наружном пункте на срок до двух месяцев. Постройте станцию и примите людей из раздела «Управление».','warn');}}]);
 }return ev;};
} },
{ order:493, run(__ctx:Runtime){__ctx.admitRefugees=function(group,mode='open'){__ctx.ensureWorld();if(__ctx.falloutActive()&&!__ctx.requireDecon(group))return;const before=__ctx.state.population;__ctx.physicalAdmission(group,__ctx.falloutActive()?'controlled':mode);const accepted=Math.max(0,__ctx.state.population-before);if(__ctx.falloutActive()&&accepted)__ctx.payDecon(accepted);__ctx.state.physical.quarantine+=accepted;__ctx.state.physical.patients+=accepted*.12;};
} },
{ order:494, run(__ctx:Runtime){__ctx.applyRefugeeRisk=function(n,mult=1){
 const p=__ctx.state.physical,risk=__ctx.refugeeScenarioRisk()*mult;if(__ctx.random()<risk){p.patients+=n*.3;__ctx.addHealthCause('injuries',-Math.min(3,n*.8/Math.max(1,__ctx.state.population)*8));__ctx.logMsg('У прибывших выявлены травмы и истощение. Медицинская нагрузка возросла; стены убежища не теряют экранирование.','warn');}
 if(__ctx.state.scenario==='epidemic')p.infected=Math.min(__ctx.state.population,p.infected+n*__ctx.state.environment.prevalence*(mult<1?.15:1));
};
} }
];
