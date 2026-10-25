/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.consumeExpeditionPreparation = function consumeExpeditionPreparation(){if((__ctx.state.expeditionPrep||0)>0){__ctx.logMsg(`🧭 Подготовка маршрута использована: уровень ${__ctx.state.expeditionPrep}.`,'');__ctx.state.expeditionPrep=0;}};

__ctx.passiveResourceRates = function passiveResourceRates(){
 const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced,b=__ctx.state.bunker,stage=__ctx.state.settlementLevel||0,bl=__ctx.state.built||{};const org=1+stage*.10,labor=__ctx.clamp(w.effective/45,.18,2.1);const rates: any={concrete:(.06+stage*.045+b.workshop/850+(bl.cement||0)*.16)*org*labor*policy.maint,steel:(.045+stage*.035+b.workshop/1100+(bl.smelter||0)*.11)*org*labor*policy.maint,machinery:(.010+stage*.010+b.workshop/2600+b.knowledge/5000+(bl.machinePlant||0)*.025)*org*labor,fuel:(.025+stage*.018+b.power/2600+(bl.refinery||0)*.055)*org*labor,food:0,electronics:(.012+stage*.012+b.knowledge/3800+(bl.fab||0)*.038)*org*labor*policy.research,medicine:(.015+stage*.014+b.medical/3200+(bl.pharma||0)*.045+(__ctx.state.scenario==='epidemic'?(bl.vaccine||0)*.035+(bl.biolab||0)*.02:0))*org*labor*Math.sqrt(policy.research)};if(__ctx.state.scenario==='ice')rates.fuel*=1.12;if(__ctx.state.scenario==='epidemic')rates.medicine*=1.22;Object.keys(rates).forEach(k=>rates[k]=Math.max(0,rates[k]*__ctx.operationalProductionMultiplier(k)));return rates;
};

__ctx.passiveLaborEconomy = function passiveLaborEconomy(){
 const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced,stage=__ctx.state.settlementLevel||0;if(__ctx.state.bunker.knowledge>=12&&w.effective>=8){const tierIndex=__ctx.technologyTiers.indexOf(__ctx.currentKnowledgeTier());__ctx.state.bunker.knowledge+=(.035+w.effective/420+__ctx.state.specialists/260)*policy.research*(1+stage*.1)*(1+tierIndex*.025);}const base=__ctx.passiveResourceRates();__ctx.state.lastProduction={...base,food:__ctx.state.lastFoodProduced||0,water:__ctx.state.lastWaterSupply||0};__ctx.entries(base).forEach(([k,v])=>{if(k!=='food')__ctx.state.resources[k]=(__ctx.state.resources[k]||0)+v;});const industrial=__ctx.runIndustrialChains();__ctx.state.lastIndustrial=industrial;for(const d of __ctx.values(industrial)){for(const [r,q] of __ctx.entries(d.produced||{}))__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+q;for(const [r,q] of __ctx.entries(d.consumed||{}))__ctx.state.lastConsumption[r]=(__ctx.state.lastConsumption[r]||0)+q;}
};

__ctx.waterBalanceFor = function waterBalanceFor(potentialFood=0){
 const p=Math.max(0,__ctx.state.population||0),b=__ctx.state.bunker||{},post=__ctx.state.month>__ctx.state.prepMonths;
 // "water" is monthly water-system capacity, not a stored consumable resource.
 // Electricity is required for pumping, purification and recirculation, so a weak power system lowers real throughput.
 const powerFactor=__ctx.clamp(.82+(b.power||0)/220,.72,1.18);
 const supply=Math.max(0,(b.water||0)*powerFactor);
 let perPerson=post?.55:.38;
 if(__ctx.state.scenario==='heat')perPerson*=1.22;
 else if(__ctx.state.scenario==='epidemic')perPerson*=1.12;
 else if(__ctx.state.scenario==='ice')perPerson*=.95;
 const humanNeed=p*perPerson;
 const humanDelivered=Math.min(supply,humanNeed),humanDeficit=Math.max(0,humanNeed-supply);
 const forFood=Math.max(0,supply-humanNeed);
 let waterPerFood=2.35*(1-__ctx.clamp(__ctx.techEffect('farmWaterDiscount'),0,.34));
 if(__ctx.state.scenario==='heat')waterPerFood*=1.12;
 else if(__ctx.state.scenario==='epidemic')waterPerFood*=1.05;
 else if(__ctx.state.scenario==='ice')waterPerFood*=.96;
 else if(__ctx.state.scenario==='nuclear')waterPerFood*=1.03;
 waterPerFood=Math.max(.62,waterPerFood);
 const foodCapacity=forFood/waterPerFood;
 const actualFood=Math.min(Math.max(0,potentialFood),foodCapacity);
 const farmUse=actualFood*waterPerFood;
 const farmCoverage=potentialFood>0?__ctx.clamp(actualFood/potentialFood,0,1):1;
 const humanCoverage=humanNeed>0?__ctx.clamp(humanDelivered/humanNeed,0,1):1;
 return {supply,humanNeed,humanDelivered,humanDeficit,humanCoverage,forFood,waterPerFood,foodCapacity,actualFood,farmUse,farmCoverage};
};

__ctx.waterBalancePreview = function waterBalancePreview(){
 const p=__ctx.state.population||0,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;
 const farmLabor=__ctx.clamp(.68+(w.effective/Math.max(12,p))*0.52*policy.food,.62,1.38),stageFood=1+(__ctx.state.settlementLevel||0)*.045;
 const potential=(__ctx.state.bunker.foodSystem||0)*(.16+(__ctx.state.bunker.power||0)/520)*(__ctx.state.month>__ctx.state.prepMonths?1:.45)*farmLabor*stageFood*(1+__ctx.techEffect('foodOutput'))*__ctx.operationalProductionMultiplier('food');
 return {...__ctx.waterBalanceFor(potential),potentialFood:potential};
};

__ctx.consume = function consume(){
 const p=__ctx.state.population,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;
 const foodNeed=p*(__ctx.state.month<=__ctx.state.prepMonths?.52:.72)/10;
 const medBase=p*.035*(1+__ctx.state.hazard/80)*(__ctx.state.settlementLevel>=4?.9:1)*(__ctx.state.scenario==='epidemic'?1.45:1),medNeed=medBase*(1-__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25));
 const powerStress=__ctx.state.hazard*(__ctx.state.scenario==='heat'?1.15:1)/100,farmLabor=__ctx.clamp(.68+(w.effective/Math.max(12,p))*0.52*policy.food,.62,1.38),stageFood=1+(__ctx.state.settlementLevel||0)*.045;
 // Food systems define the theoretical output. Water then acts as a hard physical ceiling.
 const potentialFood=__ctx.state.bunker.foodSystem*(.16+__ctx.state.bunker.power/520)*(__ctx.state.month>__ctx.state.prepMonths?1:.45)*farmLabor*stageFood*(1+__ctx.techEffect('foodOutput'))*__ctx.operationalProductionMultiplier('food');
 const wb=__ctx.waterBalanceFor(potentialFood),producedFood=wb.actualFood;
 const fuelBase=Math.max(0,1.2+powerStress*2.1-__ctx.state.bunker.power/55),fuelNeed=fuelBase*(1-__ctx.clamp(__ctx.techEffect('fuelUseDiscount'),0,.28));
 __ctx.state.lastFoodPotential=potentialFood;__ctx.state.lastFoodProduced=producedFood;__ctx.state.lastFoodNeed=foodNeed;
 __ctx.state.lastWaterSupply=wb.supply;__ctx.state.lastWaterHumanNeed=wb.humanNeed;__ctx.state.lastWaterForFood=wb.forFood;__ctx.state.lastWaterFarmUse=wb.farmUse;__ctx.state.lastWaterDeficit=wb.humanDeficit;__ctx.state.lastWaterFoodCapacity=wb.foodCapacity;
 __ctx.state.lastConsumption={food:foodNeed,medicine:medNeed,fuel:fuelNeed,water:wb.humanNeed};__ctx.state.lastProduction={food:producedFood,water:wb.supply};
 // Drinking/hygiene has absolute priority. A deficit hurts people directly and leaves no water for agriculture.
 if(wb.humanDeficit>0){const ratio=__ctx.clamp(wb.humanDeficit/Math.max(.1,wb.humanNeed),0,1),scenarioHit=__ctx.state.scenario==='heat'?1.18:1;__ctx.state.health-=__ctx.clamp((1+ratio*5)*scenarioHit,1,7);__ctx.state.morale-=__ctx.clamp(.5+ratio*3,.5,4);__ctx.logMsg(`💧 Дефицит воды: населению не хватает ${__ctx.fmtResource(wb.humanDeficit)} ед. месячной подачи. Фермы получают воду только после людей.`,'bad');}
 if(potentialFood>.25&&wb.farmCoverage<.72&&wb.humanDeficit<=0){__ctx.logMsg(`🌱 Фермы ограничены водой: возможный выпуск ${__ctx.fmtResource(potentialFood)}, фактический ${__ctx.fmtResource(producedFood)}. После потребления населением на сельхозконтур осталось ${__ctx.fmtResource(wb.forFood)} воды.`,'warn');}
 __ctx.state.resources.food+=producedFood-foodNeed;__ctx.state.resources.medicine-=medNeed;__ctx.state.resources.fuel-=fuelNeed;let shortage=0;
 if(__ctx.state.resources.food<0){shortage+=Math.abs(__ctx.state.resources.food)*1.8;__ctx.state.resources.food=0}if(__ctx.state.resources.medicine<0){shortage+=Math.abs(__ctx.state.resources.medicine)*1.2;__ctx.state.resources.medicine=0}if(__ctx.state.resources.fuel<0){shortage+=Math.abs(__ctx.state.resources.fuel)*.8;__ctx.state.resources.fuel=0}
 if(shortage>0){__ctx.state.shortages++;__ctx.state.health-=__ctx.clamp(shortage/8,1,8);__ctx.state.morale-=__ctx.clamp(shortage/10,1,7);__ctx.logMsg('Дефицит запасов ударил по здоровью и морали.','bad');if(__ctx.state.lastShortageAlertMonth!==__ctx.state.month){__ctx.state.lastShortageAlertMonth=__ctx.state.month;__ctx.notify_aiNotice('Критический дефицит','Резервы истощаются. Нужны еда, медикаменты, топливо и достаточная подача воды.',{cue:'bad',type:'crisis',duration:2800,priority:'urgent',cinematic:false});}}
 if(__ctx.state.scenario==='epidemic'&&__ctx.state.resources.medicine<6&&__ctx.state.hazard>35){const protection=(__ctx.state.bunker.biosecurity||0)+(__ctx.state.bunker.medical||0)*.35,loss=__ctx.clamp((6-__ctx.state.resources.medicine)*.45-__ctx.state.bunker.biosecurity/55,0,3);__ctx.state.health-=loss;__ctx.state.morale-=loss>0?.8:0;if(protection>65)__ctx.state.morale=__ctx.clamp(__ctx.state.morale+.15,0,100);}
};

__ctx.passiveSystems = function passiveSystems(){
 const b=__ctx.state.bunker,h=__ctx.state.hazard,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;let exposure=0;if(__ctx.state.scenario==='ice')exposure=h-(b.thermal*1.05+b.power*.22+b.integrity*.12);if(__ctx.state.scenario==='heat')exposure=h-(b.thermal*.9+b.water*.35+b.power*.25+b.integrity*.1);if(__ctx.state.scenario==='nuclear')exposure=h-(b.shield*.9+b.integrity*.24+b.water*.12+b.intel*.08);if(__ctx.state.scenario==='epidemic')exposure=h-(b.medical*.62+b.biosecurity*.72+b.water*.22+b.knowledge*.22+b.integrity*.08+b.power*.08);if(exposure>15){__ctx.state.health-=__ctx.clamp(exposure/18,1,5);__ctx.state.morale-=__ctx.clamp(exposure/24,1,4)}
 const crowd=Math.max(0,__ctx.state.population-__ctx.state.bunker.capacity);if(crowd>0){__ctx.state.health-=crowd*.08;__ctx.state.morale-=crowd*.12}const maint=__ctx.clamp((b.workshop+__ctx.state.specialists*1.5+w.effective*.8*policy.maint)/150,0,.92),preparedFactor=__ctx.state.maintenancePrepared?.45:1;if(__ctx.random()<.20*(1-maint)*preparedFactor){const keys=['water','power','thermal','integrity'],k=__ctx.pick(keys);b[k]=Math.max(0,b[k]-__ctx.rnd(2,5));__ctx.logMsg(`Износ системы: «${__ctx.labelB(k)}» потерял эффективность.`,'warn')}else if(b.workshop>28&&w.effective>15&&__ctx.random()<.10*policy.maint*(__ctx.state.maintenancePrepared?1.35:1)){const keys=['water','power','thermal','integrity'],k=__ctx.pick(keys);b[k]+=1;__ctx.logMsg(`Ремонтные смены повысили надёжность системы «${__ctx.labelB(k)}».`,'good')}
 __ctx.state.health=__ctx.clamp(__ctx.state.health,0,100);__ctx.state.morale=__ctx.clamp(__ctx.state.morale+b.morale*.015+b.knowledge*.008+Math.min(.28,w.effective/300)-.15,0,100);if((__ctx.state.health<26||__ctx.state.morale<22)&&__ctx.state.lastHealthAlertMonth!==__ctx.state.month){__ctx.state.lastHealthAlertMonth=__ctx.state.month;__ctx.notify_aiNotice('Критическое состояние поселения','Падает устойчивость населения. Нужны отдых, лечение и восстановление систем.',{cue:'bad',type:'crisis',duration:2600,priority:'urgent',cinematic:false});}
};

__ctx.recordUse = function recordUse(key,amount){if(amount<=0)return;__ctx.state.resources[key]=Math.max(0,(__ctx.state.resources[key]||0)-amount);__ctx.state.lastConsumption[key]=(__ctx.state.lastConsumption[key]||0)+amount;};

__ctx.physicalDefaults = function physicalDefaults(s){
 return {version:__ctx.PHYSICAL_VERSION,migratedAt:s.month,doseHistoryStart:s.month,residentDose:0,residentLifetimeDose:0,missionDose:0,missionPeople:0,patients:0,infected:0,immune:0,quarantine:0,filterCondition:100,sealHours:0,sealUsedMonth:-999,deconProcessed:0,deconMonth:s.month,pendingDeconWater:0,healthLedger:{},lastHealthLedger:null,lastTrend:null,lastServices:null,lastFoodCoverage:1,lastMedicineCoverage:1,lastEnergyCoverage:1,condition:{},design:{},roadWork:0,routeUsed:{},pendingRefugees:null,shockApplied:s.month>s.prepMonths,cityStocks:{},lastMonthHealth:s.health,previousEnvironment:null,lastPhysicalMonth:s.month,operationContext:null};
};

__ctx.physicalServices = function physicalServices(e=__ctx.physicalDayEnvironment||__ctx.state.environment,s=__ctx.state,fuelCoverage=1){
 const b=s.bunker,pop=Math.max(0,s.population),demand=12+pop*.28+Math.max(0,Math.abs(e.temperature-20)-12)*.18;
 const generation=.35*e.sunlight+.65*fuelCoverage,power=__ctx.clamp(b.power/Math.max(1,demand)*generation,0,1);
 const climate=__ctx.clamp(b.thermal/Math.max(12,12+Math.abs(e.temperature-20)*.85)*power,0,1);
 const indoor=20+(e.temperature-20)*(1-climate),vent=__ctx.clamp((b.ventilation+b.thermal*.12)/Math.max(12,pop)*power,0,1);
 const filtered=__ctx.clamp((p=>p?.filterCondition??100)(s.physical)/100*(.45+b.integrity/100),.05,1);
 const co2=450+(1-vent)*3200+(s.physical?.sealHours>0?2200:0),airParticles=e.dust*(1-filtered)+Math.max(0,pop-b.capacity)*.5;
 const high=20+(e.dayMax-20)*(1-__ctx.clamp(b.thermal/(12+Math.abs(e.dayMax-20)*.85)*power,0,1)),low=20+((e.nightMin??e.temperature-6)-20)*(1-__ctx.clamp(b.thermal/(12+Math.abs((e.nightMin??e.temperature-6)-20)*.85)*power,0,1));
 return {power,indoor,indoorHigh:high,indoorLow:low,ventilation:vent,co2,airParticles,filtered,fuelCoverage};
};

__ctx.deconStatus = function deconStatus(people=4){
 if(!__ctx.falloutActive())return {available:true,reason:'',cost:{},load:0,capacity:0};
 const p=__ctx.state.physical,load=Math.max(1,people),capacity=__ctx.state.bunker.deconCapacity||0,cost: any={fuel:Math.round((.1+load*.015)*100)/100};
 let reason=!(__ctx.state.built.decon>0)?'Нужна станция дезактивации':__ctx.state.bunker.power<8?'Станции нужно не менее 8 энергии':__ctx.waterBalanceFor(0).forFood<load*.12?'Станции не хватает воды после питьевых нужд':p.deconProcessed+load>capacity?'Исчерпана месячная пропускная способность станции':!__ctx.canPay(cost)?'Не хватает топлива для обработки':'';
 return {available:!reason,reason,cost,load,capacity,remaining:Math.max(0,capacity-p.deconProcessed)};
};

__ctx.requireDecon = function requireDecon(people=4){const d=__ctx.deconStatus(people);if(d.available)return true;__ctx.logMsg(d.reason+'. Наружный груз и люди не могут пройти санитарный шлюз.','warn');__ctx.voice?.say('decon_required',d.reason,'normal');__ctx.invalidate();return false;};

__ctx.payDecon = function payDecon(people){const d=__ctx.deconStatus(people);if(__ctx.falloutActive()){__ctx.pay(d.cost);__ctx.state.physical.deconProcessed+=d.load;__ctx.state.physical.pendingDeconWater+=d.load*.12;}};

__ctx.balanceDefaults = function balanceDefaults(s,legacy=false){return {version:__ctx.BALANCE_VERSION,legacy,migratedAt:s.month,legacyMedical:legacy?s.bunker.medical:0,legacyProtected:legacy?s.bunker.capacity:0,servicePriority:'balanced',clinicalSpecialists:Math.max(1,Math.floor((s.specialists||0)*.16)),lastSpecialists:s.specialists||0,chronicFraction:.07+__ctx.worldHash((s.worldSeed||0)+428)*.06,feedstock:legacy?160:120,deposit:s.site?.name?.includes('карьер')?2400:1600,monthlyRaw:null,lastSalvage:{},lastClinical:null,lastServices:null,missionWork:0,stableMonths:0,lastAssessmentMonth:-1,assessment:null,falloutDone:legacy&&s.month>s.prepMonths,falloutStage:0,falloutChoices:[],lastWaitingCareMonth:-1,deconWaste:0,lastDeconWaste:0,monthlyCases:0,lastCasesMonth:-1,protectedDose:0,unprotectedDose:0,lastDoseGroups:null};};

__ctx.rawMaterialCycle = function rawMaterialCycle(){
 const x=__ctx.state.balance,lvl=__ctx.state.built.rawDepot||0;let reason='',amount=0;const staff=__ctx.servicePlan().coverage.raw??1;
 if(lvl&&x.deposit>0){const ds=__ctx.deconStatus(4),cost: any={fuel:.18*lvl};if(!ds.available)reason=ds.reason;else if(!__ctx.canPay(cost))reason='Нет топлива для сырьевого участка';else{const firstWeeks=__ctx.falloutActive()&&__ctx.postMonths()===1?23/30:1,possible=Math.min(x.deposit,lvl*12*staff*__ctx.physicalServices().power*__ctx.environmentImpact().cargo*firstWeeks);if(possible>.01){__ctx.recordUse('fuel',cost.fuel);if(__ctx.falloutActive()){const before=__ctx.state.resources.fuel;__ctx.payDecon(4);const used=before-__ctx.state.resources.fuel;__ctx.state.lastDemand.fuel=(__ctx.state.lastDemand.fuel||0)+used;__ctx.state.lastConsumption.fuel=(__ctx.state.lastConsumption.fuel||0)+used;__ctx.state.physical.missionPeople+=Math.min(2,__ctx.servicePlan().assigned.raw||0);}x.deposit-=possible;x.feedstock+=possible;amount=possible;}}}
 x.monthlyRaw={month:__ctx.state.month,amount,reason,remaining:x.deposit};
};

__ctx.prepareBalanceMonth = function prepareBalanceMonth(){__ctx.rawMaterialCycle();__ctx.state.balance.lastFeedstockUsed=0;};
}
export const steps: Initialization[] = [
{ order:216, run(__ctx:Runtime){__ctx.originalWaterBalance = __ctx.waterBalanceFor;
} },
{ order:217, run(__ctx:Runtime){__ctx.waterBalanceFor=function(potentialFood=0){const original=__ctx.originalWaterBalance(potentialFood);if(!__ctx.state.scenario)return original;const im=__ctx.environmentImpact(),supply=original.supply*im.waterSupply*im.powerFactor,humanNeed=original.humanNeed*im.waterDemand,humanDelivered=Math.min(supply,humanNeed),humanDeficit=Math.max(0,humanNeed-supply),forFood=Math.max(0,supply-humanNeed),foodCapacity=forFood/original.waterPerFood,actualFood=Math.min(Math.max(0,potentialFood),foodCapacity),farmUse=actualFood*original.waterPerFood;return {...original,supply,humanNeed,humanDelivered,humanDeficit,forFood,foodCapacity,actualFood,farmUse,farmCoverage:potentialFood>0?__ctx.clamp(actualFood/potentialFood,0,1):1,humanCoverage:humanNeed>0?__ctx.clamp(humanDelivered/humanNeed,0,1):1};};
} },
{ order:219, run(__ctx:Runtime){__ctx.originalConsume = __ctx.consume;
} },
{ order:220, run(__ctx:Runtime){__ctx.consume=function(){__ctx.ensureWorld();__ctx.originalConsume();const im=__ctx.environmentImpact(),extra: any={fuel:im.fuelExtra,medicine:im.medicineExtra*Math.max(1,__ctx.state.population/24)};for(const [r,q] of __ctx.entries(extra)){const missing=Math.max(0,q-(__ctx.state.resources[r]||0));__ctx.recordUse(r,q);if(missing>0)__ctx.state.health=Math.max(0,__ctx.state.health-missing*.5);}};
} },
{ order:222, run(__ctx:Runtime){__ctx.passiveSystems=function(){
 const b=__ctx.state.bunker,h=__ctx.state.hazard,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced,im=__ctx.environmentImpact();let exposure=0;
 if(__ctx.state.scenario==='ice')exposure=h-(b.thermal*1.05+b.power*.22+b.integrity*.12);
 if(__ctx.state.scenario==='heat')exposure=h-(b.thermal*.9+b.water*.35+b.power*.25+b.integrity*.1);
 if(__ctx.state.scenario==='nuclear')exposure=h-(b.shield*.9+b.integrity*.24+b.water*.12+b.intel*.08);
 if(__ctx.state.scenario==='epidemic')exposure=h-(b.medical*.62+b.biosecurity*.72+b.water*.22+b.knowledge*.22+b.integrity*.08+b.power*.08);
 if(exposure>15){__ctx.state.health-=__ctx.clamp(exposure/18,1,5)+im.healthStress;__ctx.state.morale-=__ctx.clamp(exposure/24,1,4);}
 const crowd=Math.max(0,__ctx.state.population-b.capacity);if(crowd>0){__ctx.state.health-=crowd*.08;__ctx.state.morale-=crowd*.12;}
 const maint=__ctx.clamp((b.workshop+__ctx.state.specialists*1.5+w.effective*.8*policy.maint)/150,0,.92),due=__ctx.maintenanceCost(),required=__ctx.state.month>__ctx.state.prepMonths||!!__ctx.state.built.printer,paid=!required||__ctx.canPay(due);
 if(required&&paid)__ctx.entries(due).forEach(([k,v])=>__ctx.recordUse(k,v));__ctx.state.maintenancePaid=required?paid:null;
 const risk=(.20*(1-maint)+im.wear)*(__ctx.state.maintenancePrepared?.45:1)*(paid?.65:1.5);
 if(__ctx.random()<risk){const k=__ctx.pick(['water','power','thermal','integrity']),loss=__ctx.rnd(2,4)*(paid?.75:1);b[k]=Math.max(0,b[k]-loss);__ctx.logMsg(`Износ системы «${__ctx.labelB(k)}»: −${__ctx.fmtResource(loss)}.${!paid?' Не хватило напечатанных запчастей для профилактики.':''}`,'warn');}
 if(required&&!paid){const k=['water','power','thermal','integrity'][__ctx.state.month%4];b[k]=Math.max(0,b[k]-.25-im.wear);if(__ctx.state.month%3===0)__ctx.logMsg('Профилактика сорвана: запас напечатанных деталей исчерпан. Нужен работающий 3D-принтер.','warn');}
 else if(required&&b.workshop>28&&w.effective>15&&__ctx.random()<.10*policy.maint){const k=__ctx.pick(['water','power','thermal','integrity']);b[k]+=1;__ctx.logMsg(`Ремонтные смены использовали запчасти и восстановили систему «${__ctx.labelB(k)}».`,'good');}
 __ctx.state.health=__ctx.clamp(__ctx.state.health,0,100);__ctx.state.morale=__ctx.clamp(__ctx.state.morale+b.morale*.015+b.knowledge*.008+Math.min(.28,w.effective/300)-.15,0,100);
 if((__ctx.state.health<26||__ctx.state.morale<22)&&__ctx.state.lastHealthAlertMonth!==__ctx.state.month){__ctx.state.lastHealthAlertMonth=__ctx.state.month;__ctx.notify_aiNotice('Критическое состояние поселения','Нужны лечение, отдых и восстановление систем.',{cue:'bad',cinematic:false,priority:'urgent'});}
};
} },
{ order:225, run(__ctx:Runtime){__ctx.passiveLaborEconomy=function(){__ctx.originalEconomy();__ctx.state.lastPrinter=__ctx.printerCycle();if(!__ctx.state.firstPartsPrinted&&(__ctx.state.lastPrinter.produced.parts||0)>0){__ctx.state.firstPartsPrinted=true;__ctx.logMsg('Первая партия запчастей напечатана. Теперь детали доступны для профилактики и ремонта.','good');__ctx.voice?.say('partsReady','Первая партия запчастей напечатана.','normal');}};
} },
{ order:359, run(__ctx:Runtime){__ctx.recordUse=function(key,amount){
 if(!Number.isFinite(amount)||amount<=0)return;
 const available=Math.max(0,__ctx.state.resources[key]||0),used=Math.min(available,amount);
 __ctx.state.resources[key]=Math.max(0,available-used);
 __ctx.state.lastConsumption[key]=(__ctx.state.lastConsumption[key]||0)+used;
 __ctx.state.lastDemand=__ctx.state.lastDemand||{};__ctx.state.lastUnmetConsumption=__ctx.state.lastUnmetConsumption||{};
 __ctx.state.lastDemand[key]=(__ctx.state.lastDemand[key]||0)+amount;
 __ctx.state.lastUnmetConsumption[key]=(__ctx.state.lastUnmetConsumption[key]||0)+amount-used;
};
} },
{ order:360, run(__ctx:Runtime){__ctx.stabilityConsume = __ctx.consume;
} },
{ order:361, run(__ctx:Runtime){__ctx.consume=function(){
 const before: any={...__ctx.state.resources},shortages=__ctx.state.shortages;
 __ctx.state.lastDemand={};__ctx.state.lastUnmetConsumption={};
 __ctx.stabilityConsume();
 const demand: any={},unmet: any={},actual: any={};
 for(const r of Object.keys(__ctx.state.resources)){
  demand[r]=(__ctx.state.lastConsumption[r]||0)+(__ctx.state.lastUnmetConsumption[r]||0);
  actual[r]=Math.max(0,(before[r]||0)+(__ctx.state.lastProduction[r]||0)-(__ctx.state.resources[r]||0));
  unmet[r]=Math.max(0,demand[r]-actual[r]);
 }
 demand.water=__ctx.state.lastWaterHumanNeed||0;
 actual.water=Math.min(__ctx.state.lastWaterSupply||0,demand.water);
 unmet.water=Math.max(0,demand.water-actual.water);
 __ctx.state.lastDemand=demand;__ctx.state.lastUnmetConsumption=unmet;__ctx.state.lastConsumption=actual;
 if(Object.keys(before).some(r=>unmet[r]>__ctx.RESOURCE_EPSILON)){
  if(__ctx.state.shortages===shortages){__ctx.state.shortages++;__ctx.logMsg('Дополнительные затраты внешней среды не обеспечены запасами. Непокрытая потребность отражена в балансе.','bad');__ctx.voice?.say('shortage','Дополнительные затраты внешней среды не обеспечены запасами.','urgent');}
  __ctx.state.lastShortageCountMonth=__ctx.state.month;
 }
};
} },
{ order:362, run(__ctx:Runtime){__ctx.stabilityPassiveSystems = __ctx.passiveSystems;
} },
{ order:363, run(__ctx:Runtime){__ctx.passiveSystems=function(){
 __ctx.stabilityPassiveSystems();
 if(__ctx.state.maintenancePaid===false)for(const [r,q] of __ctx.entries(__ctx.maintenanceCost())){
  __ctx.state.lastDemand[r]=(__ctx.state.lastDemand[r]||0)+q;
  __ctx.state.lastUnmetConsumption[r]=(__ctx.state.lastUnmetConsumption[r]||0)+q;
 }
};
} },
{ order:435, run(__ctx:Runtime){__ctx.PHYSICAL_VERSION = 15;
} },
{ order:436, run(__ctx:Runtime){__ctx.physicalDayFraction = 1;
} },
{ order:436, run(__ctx:Runtime){__ctx.physicalServicesNow = null;
} },
{ order:437, run(__ctx:Runtime){__ctx.physicalKeys = ['power','water','thermal','medical','integrity','ventilation','deconCapacity'];
} },
{ order:444, run(__ctx:Runtime){__ctx.physicalFresh = __ctx.freshState;
} },
{ order:447, run(__ctx:Runtime){__ctx.physicalEnsure = __ctx.ensureWorld;
} },
{ order:460, run(__ctx:Runtime){__ctx.waterBalanceFor=function(potentialFood=0){
 const e=__ctx.physicalDayEnvironment||__ctx.state.environment||__ctx.computeEnvironment(__ctx.state),sv=__ctx.physicalServicesNow||__ctx.physicalServices(e),p=__ctx.state.population,b=__ctx.state.bunker;
 const supply=Math.max(0,b.water*(.82+b.power/220)*e.waterAvailability*(1-e.dust*.001)*sv.power);
 const humanNeed=p*(__ctx.state.month>__ctx.state.prepMonths?.55:.38)*(__ctx.state.scenario==='heat'?1.12:__ctx.state.scenario==='epidemic'?1.08:1)*(1+Math.max(0,e.dayMax-30)*.01);
 const humanDelivered=Math.min(supply,humanNeed),humanDeficit=Math.max(0,humanNeed-supply),forFood=Math.max(0,supply-humanNeed-(__ctx.state.physical?.pendingDeconWater||0));
 const waterPerFood=Math.max(.62,2.35*(1-__ctx.clamp(__ctx.techEffect('farmWaterDiscount'),0,.34))),foodCapacity=forFood/waterPerFood,actualFood=Math.min(Math.max(0,potentialFood),foodCapacity);
 return {supply,humanNeed,humanDelivered,humanDeficit,forFood,foodCapacity,actualFood,waterPerFood,farmUse:actualFood*waterPerFood,farmCoverage:potentialFood>0?actualFood/potentialFood:1,humanCoverage:humanNeed>0?humanDelivered/humanNeed:1};
};
} },
{ order:462, run(__ctx:Runtime){__ctx.physicalRates = __ctx.passiveResourceRates;
} },
{ order:463, run(__ctx:Runtime){__ctx.passiveResourceRates=function(){const r=__ctx.physicalRates(),sv=__ctx.physicalServicesNow||__ctx.physicalServices();for(const k of Object.keys(r))r[k]*=__ctx.physicalDayFraction*sv.power;return r;};
} },
{ order:468, run(__ctx:Runtime){__ctx.consume=function(){
 __ctx.ensureWorld();const p=__ctx.state.physical,e=__ctx.state.environment,b=__ctx.state.bunker,post=__ctx.postMonths();
 p.healthLedger={};p.lastMonthHealth=__ctx.state.health;p.residentDose=0;__ctx.state.lastProduction={};__ctx.state.lastConsumption={};__ctx.state.lastDemand={};__ctx.state.lastUnmetConsumption={};
 let waterSupply=0,waterNeed=0,waterForFarms=0,waterFoodCapacity=0,waterFarmUse=0,foodPotential=0,foodProduced=0,foodNeedTotal=0,fuelCover=0,foodCover=0,medCover=0,indoor=0,co2=0,air=0;
 if(typeof __ctx.prepareBalanceMonth==='function')__ctx.prepareBalanceMonth();
 const dailyPrinter: any={level:Math.min(5,__ctx.state.built.printer||0),scale:0,produced:{},consumed:{},status:'Нет сырья'};
 for(let day=0;day<30;day++){
  __ctx.physicalDayFraction=1/30;__ctx.physicalDayEnvironment={...e};
  __ctx.physicalDayEnvironment.radiation=__ctx.falloutActive()?__ctx.radiationAt(__ctx.state,(post-1)*30+day+.5):.08;
  __ctx.physicalServicesNow=__ctx.physicalServices(__ctx.physicalDayEnvironment,__ctx.state,__ctx.state.resources.fuel>0?1:0);
  const base=__ctx.passiveResourceRates();for(const [r,q] of __ctx.entries(base)){__ctx.state.resources[r]=(__ctx.state.resources[r]||0)+q;__ctx.state.lastProduction[r]=(__ctx.state.lastProduction[r]||0)+q;}
  const fuelMonthly=Math.max(.15,1.2-b.power/65)+Math.max(0,Math.abs(e.temperature-20)-10)/28*(1-__ctx.clamp(b.thermal/160,0,.8));
  const fuelNeed=fuelMonthly*(1-__ctx.clamp(__ctx.techEffect('fuelUseDiscount'),0,.28))/30,fuelBefore=__ctx.state.resources.fuel;__ctx.recordUse('fuel',fuelNeed);
  const fc=fuelNeed?Math.min(1,fuelBefore/fuelNeed):1;fuelCover+=fc/30;__ctx.physicalServicesNow=__ctx.physicalServices(__ctx.physicalDayEnvironment,__ctx.state,fc);
  const potential=__ctx.physicalFoodPotential(),wb=__ctx.waterBalanceFor(potential),foodNeed=__ctx.state.population*(post>0?.072:.052)/30;
  foodPotential+=potential/30;foodProduced+=wb.actualFood/30;foodNeedTotal+=foodNeed;waterSupply+=wb.supply/30;waterNeed+=wb.humanNeed/30;waterForFarms+=wb.forFood/30;waterFoodCapacity+=wb.foodCapacity/30;waterFarmUse+=wb.farmUse/30;
  __ctx.state.resources.food+=wb.actualFood/30;__ctx.state.lastProduction.food=(__ctx.state.lastProduction.food||0)+wb.actualFood/30;
  const foodBefore=__ctx.state.resources.food;__ctx.recordUse('food',foodNeed);const foodCoverage=foodNeed?Math.min(1,foodBefore/foodNeed):1;foodCover+=foodCoverage/30;
  const industrial=__ctx.runIndustrialChains();__ctx.state.lastIndustrial=industrial;
  const pc=__ctx.printerCycle();dailyPrinter.scale+=pc.scale/30;dailyPrinter.status=pc.status;for(const k of ['produced','consumed'])for(const [r,q] of __ctx.entries(pc[k]||{}))dailyPrinter[k][r]=(dailyPrinter[k][r]||0)+q;
  const patients=p.patients+p.infected,medNeed=typeof __ctx.medicineDemand==='function'?__ctx.medicineDemand()/30:(__ctx.state.population*.012+patients*.08)*(1-__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25))/30;
  const medBefore=__ctx.state.resources.medicine;__ctx.recordUse('medicine',medNeed);const mc=medNeed?Math.min(1,medBefore/medNeed):1;medCover+=mc/30;p.lastMedicineCoverage=mc;
  const sv=__ctx.physicalServicesNow;indoor+=sv.indoor/30;co2+=sv.co2/30;air+=sv.airParticles/30;
  const temperatureLoad=Math.max(0,14-sv.indoor)*.6+Math.max(0,14-sv.indoorLow)*.4+Math.max(0,sv.indoor-29)*.6+Math.max(0,sv.indoorHigh-29)*.4*(1+Math.max(0,e.humidity-50)/100);
  __ctx.addHealthCause('temperature',-temperatureLoad*.035/30);
  __ctx.addHealthCause('water',-(1-wb.humanCoverage)*4/30);
  __ctx.addHealthCause('nutrition',-(1-foodCoverage)*3/30);
  __ctx.addHealthCause('air',-(Math.max(0,sv.co2-1800)/2000+Math.max(0,sv.airParticles-20)/45)*.35/30);
  if(patients>0&&mc<1)__ctx.addHealthCause('infection',-(1-mc)*Math.min(2,patients/Math.max(1,__ctx.state.population)*6)/30);
  if(__ctx.falloutActive()){
   const pf=__ctx.shieldFactor();let dose=0;
   if(typeof __ctx.radiationExposureDay==='function')dose=__ctx.radiationExposureDay((post-1)*30+day);
   else for(let hour=0;hour<24;hour++)dose+=__ctx.radiationAt(__ctx.state,(post-1)*30+day+(hour+.5)/24)/1000/pf;
   p.residentDose+=dose;p.residentLifetimeDose+=dose;
   // Acute injury depends on short-interval high dose; chronic dose is retained as risk, not a monthly poisoning tax.
   if(typeof __ctx.radiationExposureDay!=='function'&&dose>300){__ctx.addHealthCause('radiation',-Math.min(20,(dose-300)/60));p.patients+=__ctx.state.population*__ctx.clamp((dose-300)/1500,0,.5);}
  }
  __ctx.dailyDisease();
  const safe=wb.humanCoverage>.99&&foodCoverage>.99&&sv.indoor>=16&&sv.indoor<=28&&sv.co2<1800&&p.infected<.1;
  if(post>0&&safe&&p.lastMonthHealth<90)__ctx.addHealthCause('recovery',.28*__ctx.clamp((90-__ctx.state.health)/35,0,1)/30);
  if(p.sealHours>0)p.sealHours=Math.max(0,p.sealHours-24);
 }
 __ctx.physicalDayFraction=1;__ctx.physicalDayEnvironment=null;__ctx.physicalServicesNow=null;p.pendingDeconWater=0;
 p.lastFoodCoverage=foodCover;p.lastEnergyCoverage=fuelCover;p.lastMedicineCoverage=medCover;
 p.lastServices={...__ctx.physicalServices(e),indoor,co2,airParticles:air};__ctx.state.lastPrinter=dailyPrinter;
 __ctx.state.lastFoodPotential=foodPotential;__ctx.state.lastFoodProduced=foodProduced;__ctx.state.lastFoodNeed=foodNeedTotal;
 __ctx.state.lastWaterSupply=waterSupply;__ctx.state.lastWaterHumanNeed=waterNeed;__ctx.state.lastWaterDeficit=Math.max(0,waterNeed-waterSupply);__ctx.state.lastWaterForFood=waterForFarms;__ctx.state.lastWaterFoodCapacity=waterFoodCapacity;__ctx.state.lastWaterFarmUse=waterFarmUse;
 __ctx.state.lastProduction.water=waterSupply;__ctx.state.lastDemand.water=waterNeed;__ctx.state.lastConsumption.water=Math.min(waterNeed,waterSupply);__ctx.state.lastUnmetConsumption.water=Math.max(0,waterNeed-waterSupply);
 if(__ctx.values(__ctx.state.lastUnmetConsumption).some(v=>v>1e-8)){__ctx.state.shortages++;__ctx.state.lastShortageCountMonth=__ctx.state.month;__ctx.logMsg('Непокрытая потребность отражена в балансе. Здоровье меняется по фактическим условиям, а не по пустому складу само по себе.','warn');}
 if(__ctx.state.lastWaterDeficit>1e-8)__ctx.logMsg(`Дефицит воды: населению не хватает ${__ctx.fmtResource(__ctx.state.lastWaterDeficit)}. Фермы получают остаток после людей.`,'bad');
};
} },
{ order:469, run(__ctx:Runtime){__ctx.passiveLaborEconomy=function(){
 const w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced;
 if(__ctx.state.bunker.knowledge>=12&&w.effective>=8)__ctx.state.bunker.knowledge+=(.035+w.effective/420+__ctx.state.specialists/260)*policy.research*(1+(__ctx.state.settlementLevel||0)*.1);
};
} },
{ order:470, run(__ctx:Runtime){__ctx.passiveSystems=function(){
 const b=__ctx.state.bunker,p=__ctx.state.physical,e=__ctx.state.environment,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced,due=__ctx.maintenanceCost(),required=__ctx.state.month>__ctx.state.prepMonths||!!__ctx.state.built.printer,paid=!required||__ctx.canPay(due);
 if(required&&paid)for(const [r,q] of __ctx.entries(due))__ctx.recordUse(r,q);else if(required)for(const [r,q] of __ctx.entries(due)){__ctx.state.lastDemand[r]=(__ctx.state.lastDemand[r]||0)+q;__ctx.state.lastUnmetConsumption[r]=(__ctx.state.lastUnmetConsumption[r]||0)+q;}
 __ctx.state.maintenancePaid=required?paid:null;const maint=__ctx.clamp((b.workshop+__ctx.state.specialists*1.5+w.effective*.8*policy.maint)/150,0,.92),wear=__ctx.environmentImpact().wear;
 for(const k of ['power','water','thermal','integrity','ventilation']){
  const stress=k==='water'?Math.max(0,-e.temperature)*.00003:k==='integrity'?e.wind*.000012:e.dust*.000025;
  const rate=required?(.0015+stress+wear*.025)*(paid?.35:1.6)*(__ctx.state.maintenancePrepared?.45:1)*(1-maint*.6):0;
  const loss=b[k]*rate;b[k]=Math.max(0,b[k]-loss);p.condition[k]=__ctx.clamp(b[k]/Math.max(1,p.design[k]),0,1);
 }
 p.filterCondition=__ctx.clamp(p.filterCondition-e.dust*.025+(paid?.8:0),0,100);
 if(required&&!paid&&__ctx.state.month%3===0)__ctx.logMsg('Профилактика сорвана: нет напечатанных деталей. Износ зависит от нагрузки систем.','warn');
 __ctx.state.morale=__ctx.clamp(__ctx.state.morale+b.morale*.015+b.knowledge*.008+.08-Math.max(0,__ctx.state.population-b.capacity)*.06,0,100);
 p.lastHealthLedger={month:__ctx.state.month,before:p.lastMonthHealth,after:__ctx.state.health,causes:{...p.healthLedger},dose:p.residentDose,lifetimeDose:p.residentLifetimeDose,historyStart:p.doseHistoryStart};
};
} },
{ order:480, run(__ctx:Runtime){__ctx.physicalDeep = __ctx.deepCityRaid;
} },
{ order:482, run(__ctx:Runtime){__ctx.physicalTrade = __ctx.tradeExpedition;
} },
{ order:484, run(__ctx:Runtime){__ctx.physicalRecover = __ctx.recoverMapSite;
} },
{ order:486, run(__ctx:Runtime){__ctx.physicalSurvey = __ctx.surveySector;
} },
{ order:492, run(__ctx:Runtime){__ctx.physicalAdmission = __ctx.admitRefugees;
} },
{ order:500, run(__ctx:Runtime){__ctx.physicalChoose = __ctx.chooseSite;
} },
{ order:505, run(__ctx:Runtime){__ctx.physicalTreatment = __ctx.operationTreatment;
} },
{ order:509, run(__ctx:Runtime){__ctx.physicalHistory = __ctx.recordHistory;
} },
{ order:511, run(__ctx:Runtime){__ctx.physicalLabel = __ctx.labelB;
} },
{ order:541, run(__ctx:Runtime){__ctx.BALANCE_VERSION = 16;
} },
{ order:556, run(__ctx:Runtime){__ctx.balancedFresh = __ctx.freshState;
} },
{ order:558, run(__ctx:Runtime){__ctx.balancedEnsure = __ctx.ensureWorld;
} },
{ order:564, run(__ctx:Runtime){__ctx.balancedServicesBase = __ctx.physicalServices;
} },
{ order:565, run(__ctx:Runtime){__ctx.physicalServices=function(e=__ctx.physicalDayEnvironment||__ctx.state.environment,s=__ctx.state,fuelCoverage=undefined){
 if(fuelCoverage===undefined)fuelCoverage=(s.resources.fuel||0)>0?1:0;
 const b=s.bunker,sp=__ctx.servicePlan(s),generation=.35*e.sunlight+.65*fuelCoverage,power=__ctx.clamp(b.power/Math.max(1,sp.powerDemand)*generation,0,1);
 const life=sp.coverage.life??1,climate=__ctx.clamp(b.thermal/Math.max(12,12+Math.abs(e.temperature-20)*.85)*power*life,0,1),indoor=20+(e.temperature-20)*(1-climate);
 const vent=__ctx.clamp((b.ventilation+b.thermal*.12)/Math.max(12,s.population)*power*life,0,1),filtered=__ctx.clamp((s.physical?.filterCondition??100)/100*(.45+b.integrity/100),.05,1);
 const co2=450+(1-vent)*3200+(s.physical?.sealHours>0?2200:0),airParticles=e.dust*(1-filtered)+Math.max(0,s.population-b.capacity)*.5;
 const inside=t=>20+(t-20)*(1-__ctx.clamp(b.thermal/(12+Math.abs(t-20)*.85)*power*life,0,1));
 return {power,indoor,indoorHigh:inside(e.dayMax),indoorLow:inside(e.nightMin??e.temperature-6),ventilation:vent,co2,airParticles,filtered,fuelCoverage,powerDemand:sp.powerDemand,powerAvailable:b.power*generation,staff:sp};
};
} },
{ order:576, run(__ctx:Runtime){__ctx.balancedStageValue = __ctx.stageRequirementValue;
} },
{ order:581, run(__ctx:Runtime){__ctx.balancedPassiveSystems = __ctx.passiveSystems;
} },
{ order:582, run(__ctx:Runtime){__ctx.passiveSystems=function(){
 // Existing discoveries/events may install equipment outside buildModule.
 // Maintenance itself is capped before this reconciliation and cannot add design.
 for(const k of __ctx.physicalKeys)if((__ctx.state.bunker[k]||0)>(__ctx.state.physical.design[k]||0))__ctx.state.physical.design[k]=__ctx.state.bunker[k];
 __ctx.balancedPassiveSystems();for(const k of __ctx.physicalKeys){const max=__ctx.state.physical.design[k]||0;if(max>0){__ctx.state.bunker[k]=Math.min(max,__ctx.state.bunker[k]||0);__ctx.state.physical.condition[k]=__ctx.state.bunker[k]/max;}}
};
} },
{ order:583, run(__ctx:Runtime){__ctx.passiveResourceRates=function(){
 const sp=__ctx.servicePlan(),sv=__ctx.physicalServicesNow||__ctx.physicalServices(),quantity=Math.min(__ctx.state.localScrap||0,(.25+__ctx.state.population*.008+__ctx.state.bunker.workshop*.001)*(sp.coverage.salvage??0)*sv.power*__ctx.physicalDayFraction);
 const outputs: any={concrete:.55,steel:.30,machinery:.055,electronics:.075,food:0,fuel:0,medicine:0};const r: any={};for(const [k,v] of __ctx.entries(outputs))r[k]=v*quantity;
 if(__ctx.physicalDayFraction<1){__ctx.state.localScrap=Math.max(0,__ctx.state.localScrap-quantity);for(const [k,v] of __ctx.entries(r))__ctx.state.balance.lastSalvage[k]=(__ctx.state.balance.lastSalvage[k]||0)+v;}
 return r;
};
} },
{ order:590, run(__ctx:Runtime){__ctx.balancedPayDecon = __ctx.payDecon;
} },
{ order:591, run(__ctx:Runtime){__ctx.payDecon=function(people){const before=__ctx.state.physical.deconProcessed;__ctx.balancedPayDecon(people);if(__ctx.state.physical.deconProcessed>before)__ctx.state.balance.deconWaste+=(__ctx.state.physical.deconProcessed-before)*.04;};
} },
{ order:592, run(__ctx:Runtime){__ctx.balancedConsume = __ctx.consume;
} },
{ order:593, run(__ctx:Runtime){__ctx.consume=function(){
 __ctx.ensureWorld();const x=__ctx.state.balance;x.lastSalvage={};x.protectedDose=0;x.unprotectedDose=0;x.rawCrewDose=0;x.rawCrewHours=0;
 if(x.lastCasesMonth!==__ctx.state.month){x.lastCasesMonth=__ctx.state.month;const minor=__ctx.state.population*.006*(__ctx.state.month>__ctx.state.prepMonths?1:.65);x.monthlyMinorCases=Math.floor(minor)+(__ctx.worldHash(__ctx.state.worldSeed+__ctx.state.month*197)<minor%1?1:0);const chance=__ctx.clamp(__ctx.state.population/350,.03,.4),roll=__ctx.worldHash(__ctx.state.worldSeed+__ctx.state.month*139);if(__ctx.state.month>__ctx.state.prepMonths&&roll<chance){const cases=1+Math.floor(__ctx.worldHash(__ctx.state.worldSeed+__ctx.state.month*31)*2);__ctx.state.physical.patients=Math.min(__ctx.state.population,__ctx.state.physical.patients+cases);x.monthlyCases=cases;__ctx.logMsg('Медицинская нагрузка: '+cases+' новых пациентов после бытовых или производственных происшествий. Доступность помощи учтена.','warn');}else x.monthlyCases=0;}
 __ctx.balancedConsume();x.lastServices=__ctx.servicePlan();x.missionWork=0;x.lastDeconWaste=x.deconWaste;
};
} },
{ order:595, run(__ctx:Runtime){__ctx.balancedOutsideDose = __ctx.recordOutsideDose;
} },
{ order:599, run(__ctx:Runtime){__ctx.balancedHistory = __ctx.recordHistory;
} },
{ order:608, run(__ctx:Runtime){__ctx.balancedNextMonth = __ctx.nextMonth;
} },
{ order:610, run(__ctx:Runtime){__ctx.balancedResolve = __ctx.resolveEvent;
} },
{ order:614, run(__ctx:Runtime){__ctx.balancedLabel = __ctx.labelB;
} }
];
