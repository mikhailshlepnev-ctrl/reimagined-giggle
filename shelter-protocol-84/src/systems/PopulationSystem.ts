/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.workforceData = function workforceData(){
 const p=Math.max(0,__ctx.state.population||0);
 const dependents=Math.min(Math.max(2,Math.round(p*.22)),Math.max(0,Math.round(p*.38)));
 const baseWorkers=Math.max(0,p-dependents);
 const healthFactor=.55+.45*__ctx.clamp(__ctx.state.health,0,100)/100;
 const moraleFactor=.68+.32*__ctx.clamp(__ctx.state.morale,0,100)/100;
 const trained=Math.min(__ctx.state.specialists||0,baseWorkers);
 const skillBonus=trained*.55;
 const systemEfficiency=__ctx.clamp(.82+(__ctx.state.bunker.workshop||0)/260+(__ctx.state.bunker.knowledge||0)/420,0.82,1.35);
 const effective=Math.max(0,(baseWorkers*healthFactor*moraleFactor+skillBonus)*systemEfficiency);
 return {population:p,dependents,baseWorkers,trained,effective,healthFactor,moraleFactor,systemEfficiency};
};

__ctx.populationDynamics = function populationDynamics(){
 const spare=Math.max(0,__ctx.state.bunker.capacity-__ctx.state.population);
 if(__ctx.state.month>__ctx.state.prepMonths&&spare>1&&__ctx.state.health>62&&__ctx.state.morale>58&&__ctx.state.resources.food>10&&__ctx.state.bunker.water>24){
   const stability=__ctx.clamp(((__ctx.state.health-55)+(__ctx.state.morale-50))/100,0,.9);
   const growth=Math.min(spare,__ctx.state.population*.00145*stability*(1+(__ctx.state.settlementLevel||0)*.08));__ctx.state.population+=growth;__ctx.state.naturalGrowth+=growth;
 }
 if(__ctx.state.month>__ctx.state.prepMonths&&__ctx.state.health<32&&__ctx.state.hazard>65&&__ctx.random()<.22){const requested=Math.min(__ctx.state.population*.035,__ctx.rnd(1,2)),loss=__ctx.losePopulation(requested,'environment');__ctx.logMsg(`Тяжёлые условия привели к потерям населения: −${loss.toFixed(1)} чел.`,'bad')}
};

__ctx.medicalTreatmentPreview = function medicalTreatmentPreview(){
 const health=__ctx.clamp(Number(__ctx.state.health)||0,0,100),medical=Math.max(0,Number(__ctx.state.bunker.medical)||0),population=Math.max(0,Number(__ctx.state.population)||0);
 const discount=__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25),nominal=__ctx.clamp(2+(population-18)/18,2,5);
 const cost=Math.round(__ctx.clamp(nominal*(1-discount),2,5)*10)/10;
 // The overlapping requested ranges remain monotone at 30 and 50 medicine.
 const base=medical<15?2:medical<30?3+(medical-15)/15:medical<50?4+(medical-30)/10:6+__ctx.clamp((medical-50)/50,0,1);
 const efficiency=health<=30?1:health<=60?1-(health-30)/100:health<=80?.7-(health-60)*.0225:health<=90?.25-(health-80)*.02:.05*Math.pow((100-health)/10,1.25);
 const gain=medical>0?Math.max(0,Math.round(Math.min(100-health,base*efficiency)*100)/100):0;
 let reason='';
 if(!__ctx.state.site)reason='Сначала выберите площадку';
 else if(__ctx.state.ended||health<=0||population<=0)reason='Кампания завершена';
 else if(__ctx.state.event)reason='Сначала примите решение по событию';
 else if(__ctx.state.treatmentUsedMonth===__ctx.state.month)reason='Смена в этом месяце уже проведена';
 else if(__ctx.state.actions<=0)reason='Нет доступных действий';
 else if(medical<=0)reason='Нужна действующая медицинская инфраструктура';
 else if(gain<.01)reason='Обычное лечение уже не даёт заметного прироста';
 else if(!__ctx.canPay({medicine:cost}))reason='Не хватает медикаментов';
 return {health,medical,population,discount,nominal,cost,base,efficiency,gain,after:Math.min(100,health+gain),reason,available:!reason};
};

__ctx.medicalHealthText = function medicalHealthText(value){return Number(value).toLocaleString('ru-RU',{maximumFractionDigits:2});};

__ctx.addHealthCause = function addHealthCause(key,delta){
 const before=__ctx.state.health;__ctx.state.health=__ctx.clamp(before+delta,0,100);const p=__ctx.state.physical;p.healthLedger[key]=(p.healthLedger[key]||0)+__ctx.state.health-before;
};

__ctx.physicalFoodPotential = function physicalFoodPotential(){
 const p=__ctx.state.population,w=__ctx.workforceData(),policy=__ctx.laborPolicies[__ctx.state.laborPolicy]||__ctx.laborPolicies.balanced,e=__ctx.physicalDayEnvironment||__ctx.state.environment;
 const labor=__ctx.clamp(.68+w.effective/Math.max(12,p)*.52*policy.food,.62,1.38),light=.7+.3*e.sunlight; // fungi/protein retain production; illuminated plants consume energy.
 return __ctx.state.bunker.foodSystem*(.16+__ctx.state.bunker.power/520)*(__ctx.state.month>__ctx.state.prepMonths?1:.45)*labor*(1+(__ctx.state.settlementLevel||0)*.045)*(1+__ctx.techEffect('foodOutput'))*__ctx.operationalProductionMultiplier('food')*light;
};

__ctx.dailyDisease = function dailyDisease(){
 const p=__ctx.state.physical,n=Math.max(1,__ctx.state.population),e=__ctx.physicalDayEnvironment,sv=__ctx.physicalServicesNow;
 p.infected=Math.min(n,p.infected);p.immune=Math.min(n-p.infected,p.immune);
 const susceptible=Math.max(0,n-p.infected-p.immune),control=1/(1+(__ctx.state.built.quarantine||0)*.5+(__ctx.state.built.airlock||0)*.3+__ctx.state.bunker.medical/100);
 const newCases=__ctx.state.scenario==='epidemic'?Math.min(susceptible,p.infected*.23*susceptible/n*(1.1-sv.ventilation*.65)*control):0;
 const recovered=p.infected/9*(.7+.3*p.lastMedicineCoverage),bedCoverage=__ctx.clamp((__ctx.state.bunker.medical*.18)/Math.max(1,p.infected+p.patients),0,1);
 p.infected=__ctx.clamp(p.infected+newCases-recovered,0,n);p.immune=__ctx.clamp(p.immune+recovered-p.immune/150,0,n-p.infected);
 p.quarantine=Math.max(0,p.quarantine-p.quarantine/7);
 p.patients=Math.max(0,p.patients-.035*bedCoverage*p.lastMedicineCoverage);
 __ctx.addHealthCause('infection',-(p.infected/n)*.07*(1.5-bedCoverage*.5));
};

__ctx.clinicalCare = function clinicalCare(s=__ctx.state){
 const x=s.balance||{},sp=__ctx.servicePlan(s),lvl=s.built.med||0,legacy=x.legacy&&x.legacyMedical>15;
 const capacity=12+lvl*32+(legacy?Math.max(0,x.legacyMedical*1.3):0),medicsNeeded=lvl?Math.max(1,lvl*.65):legacy?1:0;
 const medics=sp.medics,skills=medicsNeeded?__ctx.clamp(medics/medicsNeeded,0,1):1,staff=(sp.coverage.medical??1)*skills;
 const power=(__ctx.physicalServicesNow&&s===__ctx.state?__ctx.physicalServicesNow.power:__ctx.physicalServices(s.environment,s).power),equipment=__ctx.clamp(s.bunker.medical/Math.max(1,s.physical?.design.medical||s.bunker.medical),0,1);
 const full=!!lvl||legacy,beds=(lvl*2+(legacy?Math.floor(x.legacyMedical/24):0))*staff*power*equipment,routine=capacity*staff*power*equipment;
 return {level:lvl,legacy,full,capacity,routine,beds,staff,medics,medicsNeeded,coverage:__ctx.clamp(routine/Math.max(1,s.population),0,1),effectiveMedical:full?s.bunker.medical:Math.min(8,s.bunker.medical),chronic:s.population*(x.chronicFraction??.09)};
};

__ctx.medicineDemand = function medicineDemand(){const c=__ctx.clinicalCare(),p=__ctx.state.physical;return (__ctx.state.population*.004+c.chronic*.055+(p.patients||0)*.09+(p.infected||0)*.075)*(1-__ctx.clamp(__ctx.techEffect('medicineUseDiscount'),0,.25));};

__ctx.shelterProtection = function shelterProtection(s=__ctx.state){
 const x=s.balance||{},pop=Math.max(1,s.population),places=Math.max(0,s.bunker.protectedCapacity||0),covered=Math.min(pop,places),uncovered=Math.max(0,pop-covered);
 const pf=Math.max(1,Math.pow(2,Math.max(0,s.bunker.shield||0)/10)*(.6+.4*__ctx.clamp((s.bunker.integrity||0)/45,0,1))),outsidePF=1.5;
 return {places,covered,uncovered,pf,outsidePF,coverage:covered/pop,effective:1/(covered/pop/pf+uncovered/pop/outsidePF),legacy:!!x.legacy};
};
}
export const steps: Initialization[] = [
{ order:421, run(__ctx:Runtime){__ctx.medicalFreshState = __ctx.freshState;
} },
{ order:423, run(__ctx:Runtime){__ctx.medicalEnsureWorld = __ctx.ensureWorld;
} },
{ order:455, run(__ctx:Runtime){__ctx.physicalWorkforce = __ctx.workforceData;
} },
{ order:456, run(__ctx:Runtime){__ctx.workforceData=function(){const w=__ctx.physicalWorkforce(),p=__ctx.state.physical;if(p&&__ctx.state.population>0)w.effective*=__ctx.clamp(1-(p.patients+p.infected)*.6/__ctx.state.population,.45,1);return w;};
} },
{ order:471, run(__ctx:Runtime){__ctx.physicalPopulation = __ctx.populationDynamics;
} },
{ order:472, run(__ctx:Runtime){__ctx.populationDynamics=function(){const oldHaz=__ctx.state.hazard;__ctx.state.hazard=__ctx.state.health<32?90:0;__ctx.physicalPopulation();__ctx.state.hazard=oldHaz;};
} },
{ order:568, run(__ctx:Runtime){__ctx.balancedMedicalPreview = __ctx.medicalTreatmentPreview;
} },
{ order:569, run(__ctx:Runtime){__ctx.medicalTreatmentPreview=function(){
 const c=__ctx.clinicalCare(),old=__ctx.state.bunker.medical;__ctx.state.bunker.medical=c.effectiveMedical;let p;try{p=__ctx.balancedMedicalPreview();}finally{__ctx.state.bunker.medical=old;}
 const factor=c.full?c.coverage:Math.min(.35,c.coverage),scale=__ctx.state.population>72?__ctx.state.population/72:1;
 p.base=c.full?p.base:Math.min(1.2,p.base);p.gain=Math.round(Math.min(100-p.health,p.base*p.efficiency*factor)*100)/100;p.after=Math.min(100,p.health+p.gain);p.cost=Math.round(p.cost*Math.max(1,scale*c.coverage)*10)/10;p.care=c;
 if(!p.reason&&c.staff<.1)p.reason='Нет доступной медицинской смены';if(!p.reason&&!__ctx.canPay({medicine:p.cost}))p.reason='Не хватает медикаментов';if(!p.reason&&p.gain<.01)p.reason='Доступная помощь не даёт заметного прироста';p.available=!p.reason;return p;
};
} },
{ order:570, run(__ctx:Runtime){__ctx.dailyDisease=function(){
 const p=__ctx.state.physical,n=Math.max(1,__ctx.state.population),sv=__ctx.physicalServicesNow,c=__ctx.clinicalCare(),mc=p.lastMedicineCoverage;
 p.infected=Math.min(n,p.infected);p.immune=Math.min(n-p.infected,p.immune);
 const susceptible=Math.max(0,n-p.infected-p.immune),control=1/(1+(__ctx.state.built.quarantine||0)*.5+(__ctx.state.built.airlock||0)*.3+c.effectiveMedical/100);
 const newCases=__ctx.state.scenario==='epidemic'?Math.min(susceptible,p.infected*.23*susceptible/n*(1.1-sv.ventilation*.65)*control):0;
 const recovered=p.infected/9*(.7+.3*mc);p.infected=__ctx.clamp(p.infected+newCases-recovered,0,n);p.immune=__ctx.clamp(p.immune+recovered-p.immune/150,0,n-p.infected);p.quarantine=Math.max(0,p.quarantine-p.quarantine/7);
 const monthlyNew=(__ctx.state.balance.monthlyMinorCases||0)*(1+Math.max(0,sv.co2-1800)/6000);
 p.patients=Math.min(n,p.patients+monthlyNew/30);
 const capacity=(.12*c.staff+(c.full?c.beds*.25:0))*mc,treated=Math.min(p.patients,capacity/30);p.patients-=treated;
 const unserved=Math.max(0,p.patients-c.beds*2),chronicGap=(1-(.45+.55*c.coverage)*mc)*c.chronic;
 __ctx.addHealthCause('care',-(unserved/n*2+chronicGap/n*.18)/30);
 const bedCoverage=__ctx.clamp(c.beds/Math.max(1,p.infected+p.patients),0,1);__ctx.addHealthCause('infection',-(p.infected/n)*.07*(1.5-bedCoverage*.5));
 __ctx.state.balance.lastClinical={...c,patients:p.patients,infected:p.infected,unserved,chronicGap,medicineCoverage:mc};
};
} },
{ order:584, run(__ctx:Runtime){__ctx.balancedFoodPotential = __ctx.physicalFoodPotential;
} },
{ order:585, run(__ctx:Runtime){__ctx.physicalFoodPotential=function(){return __ctx.balancedFoodPotential()*(__ctx.servicePlan().coverage.farm??1);};
} }
];
