/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.updateApocalypse = function updateApocalypse(){
 const oldPhase=__ctx.state.phase;
 const m=__ctx.state.month, prep=__ctx.state.prepMonths;
 if(m<=prep){__ctx.state.phase='Предапокалипсис';__ctx.state.hazard=__ctx.clamp(m/prep*34*__ctx.state.diff,0,40);__ctx.state.cityAccess=__ctx.clamp(__ctx.state.cityAccess-0.5*__ctx.state.diff,0,100)}
 else if(m<=prep+12){__ctx.state.phase='Обрушение';__ctx.state.hazard=__ctx.clamp(35+(m-prep)*3.2*__ctx.state.diff,0,76);__ctx.state.cityAccess=__ctx.clamp(__ctx.state.cityAccess-7*__ctx.state.diff,0,100)}
 else if(m<=prep+48){__ctx.state.phase='Глубокий кризис';__ctx.state.hazard=__ctx.clamp(74+(m-prep-12)*.55*__ctx.state.diff,0,96);__ctx.state.cityAccess=__ctx.clamp(__ctx.state.cityAccess-2.4*__ctx.state.diff,0,100)}
 else {__ctx.state.phase='Новая среда';__ctx.state.hazard=__ctx.clamp(92+Math.sin(m/4)*2,88,100);__ctx.state.cityAccess=0}
 __ctx.state.year=Math.floor(__ctx.state.month/12);
 if(oldPhase!==__ctx.state.phase && __ctx.state.month>0){__ctx.logMsg(`Режим изменился: ${__ctx.state.phase}.`, 'warn');__ctx.notify_aiNotice(`Фаза: ${__ctx.state.phase}`,__ctx.phaseSummary(__ctx.state.phase),{cue:'phase',type:'phase',sub:`месяц ${__ctx.state.month} · ${__ctx.scenarios[__ctx.state.scenario]?.name||''}`});}
};

__ctx.worldHash = function worldHash(n){const x=Math.sin((n+17.39)*127.1)*43758.5453;return x-Math.floor(x);};

__ctx.computeEnvironment = function computeEnvironment(s){
 const h=__ctx.clamp(s.hazard||0,0,100),p=h/100,m=s.month||0,post=Math.max(0,m-(s.prepMonths||18)),season=Math.sin((m+2)*Math.PI/6),roll=__ctx.worldHash(s.worldSeed+m*31),storm=roll<(.10+p*.24),intensity=storm?(.35+p*.65):(.08+p*.22);
 let temperature=17+season*5,radiation=.08,bio=2+p*8,dust=3+p*15,name='Переменная облачность',id='clouds';
 if(s.scenario==='ice'){temperature=14-h*.58+season*5;name=storm?(h>30?'Ледяной шторм':'Холодный фронт'):(h>32?'Снегопад':'Прохладный день');id=storm?'blizzard':h>32?'snow':'clouds';dust=2+p*15;}
 if(s.scenario==='heat'){temperature=22+h*.36+season*3;dust=5+h*.62+(storm?18:0);name=storm?(h>30?'Пыльная буря':'Сухой ветер'):(h>55?'Тепловой купол':'Ясный день');id=storm?'duststorm':'clear';}
 if(s.scenario==='nuclear'){temperature=16-h*.22+season*4;radiation=post>0?(5+285*Math.exp(-post/15))*(storm?1.55:1):.08;dust=post>0?22+p*50+(storm?15:0):4;name=post>0?(storm?'Радиоактивный фронт':'Пепельная дымка'):(storm?'Грозовой фронт':'Переменная облачность');id=post>0?(storm?'fallout':'ash'):'clouds';}
 if(s.scenario==='epidemic'){temperature=18+season*6;bio=post>0?__ctx.clamp(h*.88+(storm?12:0),0,100):2+h*.16;dust=3+p*21;name=post>0?(storm?'Заражённый туман':'Карантинная зона'):(storm?'Утренний туман':'Тихий день');id=storm?'fog':'clouds';}
 const wind=Math.round(7+h*.43+(storm?16+p*24:0)+__ctx.worldHash(m+13)*8),visibility=__ctx.clamp(20-wind*.12-dust*.08-(storm?4+p*4:0)-(s.scenario==='ice'?p*5:0),.3,22);
 return {month:m,scenario:s.scenario,severity:h,temperature:Math.round(temperature*10)/10,radiation:Math.round(radiation*100)/100,bio:Math.round(bio),dust:Math.round(__ctx.clamp(dust,0,100)),wind,visibility:Math.round(visibility*10)/10,weather:{id,name,intensity,storm},band:Math.min(4,Math.floor(h/20))};
};

__ctx.environmentImpact = function environmentImpact(){
 const e=__ctx.state.environment||__ctx.computeEnvironment(__ctx.state),b=__ctx.state.bunker||{},temperatureLoad=Math.max(0,Math.abs(e.temperature-20)-15)/40,windLoad=Math.max(0,e.wind-22)/95;
 const radiationLoad=__ctx.state.scenario==='nuclear'?Math.log1p(e.radiation)/7:0,bioLoad=__ctx.state.scenario==='epidemic'?e.bio/100:0,visibilityLoad=__ctx.clamp((14-e.visibility)/14,0,1);
 return {waterDemand:1+Math.max(0,e.temperature-28)*.009+(__ctx.state.scenario==='epidemic'?e.bio*.001:0),waterSupply:__ctx.clamp(1-e.dust*.0012-windLoad*.045,.78,1),fuelExtra:Math.max(0,temperatureLoad*.75+windLoad*.18)*(1-__ctx.clamp((b.thermal||0)/180,0,.70)),medicineExtra:bioLoad*.22+radiationLoad*.12,powerFactor:__ctx.clamp(1-temperatureLoad*.13-windLoad*.06,.72,1),wear:__ctx.clamp(temperatureLoad*.025+windLoad*.04+e.dust*.0003,0,.11),outdoorPenalty:__ctx.clamp(temperatureLoad*.045+windLoad*.035+radiationLoad*.065+bioLoad*.055+visibilityLoad*.045,0,.22),cargo:__ctx.clamp(1-windLoad*.08-visibilityLoad*.06,.80,1),healthStress:temperatureLoad*.25+bioLoad*.20+radiationLoad*.25};
};

__ctx.environmentHistoryHTML = function environmentHistoryHTML(metric){
 const key=({'Температура':'temperature','Ветер':'wind','Видимость':'visibility','Радиация':'radiation','Биоопасность':'bio','Пыль / аэрозоли':'dust'})[metric.name],points=(__ctx.state.history||[]).filter(h=>h.environment&&Number.isFinite(h.environment[key])).slice(-20).map(h=>({month:h.month,value:h.environment[key]}));
 if(points.at(-1)?.month!==__ctx.state.month)points.push({month:__ctx.state.month,value:__ctx.state.environment[key]});
 if(points.length<2)return '<small class="historyEmpty">История после второго месяца</small>';
 const lo=Math.min(...points.map(p=>p.value)),hi=Math.max(...points.map(p=>p.value)),range=Math.max(.1,hi-lo);
 return points.map(p=>`<i title="М${p.month}: ${p.value} ${metric.unit}" style="height:${15+(p.value-lo)/range*85}%"></i>`).join('');
};

__ctx.mapEpoch = function mapEpoch(s=__ctx.state){const post=(s.month||0)-(s.prepMonths||18);return post<=0?0:post<=12?1:post<=48?2:3;};

__ctx.postMonths = function postMonths(s=__ctx.state){return Math.max(0,(s.month||0)-(s.prepMonths||18));};

__ctx.falloutActive = function falloutActive(s=__ctx.state){return s.scenario==='nuclear'&&s.month>(s.prepMonths||18);};

__ctx.radiationAt = function radiationAt(s,days,index=49){
 if(s.scenario!=='nuclear'||days<0)return .08;
 const intensity=(.82+__ctx.worldHash(s.worldSeed+117)*.36)*(s.diff||1),hours=Math.max(0,days*24);
 const early=450000*Math.pow(1+hours,-1.2)*Math.exp(-days/70),residual=7*Math.pow(2,-days/(30*365))*Math.exp(-days/620);
 return .08+(early+residual)*intensity*__ctx.localFalloutFactor(index,s);
};

__ctx.shieldFactor = function shieldFactor(s=__ctx.state){return Math.max(1,Math.pow(2,Math.max(0,s.bunker.shield||0)/10)*( .6+.4*__ctx.clamp((s.bunker.integrity||0)/45,0,1)));};

__ctx.environmentSummary = function environmentSummary(){
 const p=__ctx.state.physical,e=__ctx.state.environment,prev=p.previousEnvironment;let key='month_stable',text='Условия стабильны.';
 if(__ctx.falloutActive()&&__ctx.postMonths()===1){key='fallout_acute';text='Первые дни после выпадений — отдельный пик угрозы. Доза месяца учитывает быстрый спад фона.';}
 else if(e.scenario==='nuclear'&&prev?.radiation>e.radiation*1.03){key='radiation_falling';text='Радиационный фон снизился. Состояние дорог, запасов и оборудования оценивается отдельно.';}
 else if(prev&&e.severity<prev.severity-3){key='external_improving';text='Часть внешних условий улучшилась. Сохраняются местные риски.';}
 else if(prev&&e.severity>prev.severity+4){key='threat_persistent';text='Измеренные внешние нагрузки выросли. Проверьте конкретные причины в сводке.';}
 if(p.lastServices?.indoor>=16&&p.lastServices?.indoor<=28)text+=' Температура в жилых блоках удерживается.';
 if(p.lastFoodCoverage<.99){text+=' Главный дефицит — питание.';key='shortage';}
 if(__ctx.state.lastWaterDeficit>.01){text+=' Населению не хватает воды.';key='water_shortage';}
 if(p.lastMedicineCoverage<.99&&p.patients+p.infected>0)text+=' Лечение ограничено запасом медикаментов.';
 p.lastTrend={month:__ctx.state.month,key,text};return p.lastTrend;
};

__ctx.radiationExposureDay = function radiationExposureDay(startDay){
 const q=__ctx.shelterProtection(),n=Math.max(1,__ctx.state.population);let raw=0;for(let hour=0;hour<24;hour++)raw+=__ctx.radiationAt(__ctx.state,startDay+(hour+.5)/24)/1000;
 const sheltered=raw/q.pf,unsheltered=raw/q.outsidePF,average=(sheltered*q.covered+unsheltered*q.uncovered)/n;
 __ctx.state.balance.protectedDose+=sheltered;__ctx.state.balance.unprotectedDose+=unsheltered;__ctx.state.balance.lastDoseGroups={...q,protectedDose:__ctx.state.balance.protectedDose,unprotectedDose:__ctx.state.balance.unprotectedDose};
 for(const [dose,people] of [[sheltered,q.covered],[unsheltered,q.uncovered]])if(dose>300&&people>0){__ctx.addHealthCause('radiation',-Math.min(20,(dose-300)/60)*people/n);__ctx.state.physical.patients=Math.min(n,__ctx.state.physical.patients+people*__ctx.clamp((dose-300)/1500,0,.5));}
 const rawJob=__ctx.state.balance.monthlyRaw;
 if(rawJob?.amount>0&&(__ctx.postMonths()>1||startDay%30>=7)){
  const crew=Math.min(2,__ctx.servicePlan().assigned.raw||0),gd=__ctx.gearData(),hours=4*((gd.id==='rescueDrone'||gd.id==='exosuit')?.65:1),dose=__ctx.radiationAt(__ctx.state,startDay+.5,49)*hours/1000;
  __ctx.state.physical.missionDose+=dose*crew;__ctx.state.balance.rawCrewDose=(__ctx.state.balance.rawCrewDose||0)+dose;__ctx.state.balance.rawCrewHours=(__ctx.state.balance.rawCrewHours||0)+hours;
  __ctx.state.balance.lastRawDose={month:__ctx.state.month,crew,hours:__ctx.state.balance.rawCrewHours,perPerson:__ctx.state.balance.rawCrewDose};
 }
 return average;
};
}
export const steps: Initialization[] = [
{ order:214, run(__ctx:Runtime){__ctx.originalUpdateApocalypse = __ctx.updateApocalypse;
} },
{ order:215, run(__ctx:Runtime){__ctx.updateApocalypse=function(){__ctx.originalUpdateApocalypse();__ctx.state.environment=__ctx.computeEnvironment(__ctx.state);const e=__ctx.state.environment;if(e.weather.storm&&__ctx.state.lastWeatherNotice!==__ctx.state.month){__ctx.state.lastWeatherNotice=__ctx.state.month;__ctx.logMsg(`Сводка среды: ${e.weather.name.toLowerCase()}, ветер ${e.wind} км/ч, видимость ${e.visibility} км. Риск снаружи и износ систем выросли.`,'warn');}};
} },
{ order:436, run(__ctx:Runtime){__ctx.physicalDayEnvironment = null;
} },
{ order:453, run(__ctx:Runtime){__ctx.computeEnvironment=function(s){
 const m=Math.max(0,s.month||0),post=__ctx.postMonths(s),active=post>0,seed=s.worldSeed||238417,scenarioScale=__ctx.clamp(s.diff||1,.7,1.5);
 const seasonal=Math.sin((m+2)*Math.PI/6),roll=__ctx.worldHash(seed+Math.floor(m/2)*31),region=__ctx.worldHash(seed+19),front=roll<.19;
 let temperature=14+seasonal*(9+region*3),dayMax=temperature+6,humidity=__ctx.clamp(63-seasonal*13,25,92),dust=4,sunlight=.85,waterAvailability=1,radiation=.08,prevalence=0,name=front?'Переменная облачность':'Ясно',id='clouds',climateAnomaly=0,infrastructure=0;
 const eruption=active?Math.exp(-post/30)*(1-Math.exp(-post/1.3)):0;
 if(s.scenario==='ice'){
  climateAnomaly=-11*eruption*scenarioScale;temperature=12+seasonal*14+climateAnomaly-(front&&active?4*scenarioScale:0);dayMax=temperature+5;
  dust=active?3+32*Math.exp(-post/8)+(front?8:0):3;sunlight=__ctx.clamp(.88-.42*eruption-(front?.15:0),.25,1);waterAvailability=__ctx.clamp(1-Math.max(0,-temperature)*.008,.65,1);
  name=temperature<0?(front?'Снежный фронт':'Морозная погода'):(front?'Холодный дождь':'Прохладный день');id=temperature<0?(front?'blizzard':'snow'):'clouds';infrastructure=active?.52*scenarioScale*Math.exp(-post/65):0;
 }
 if(s.scenario==='heat'){
  const drought=active?__ctx.clamp((.35+.42*(1-Math.exp(-post/10))+.12*Math.sin(post/7)-(front?.12:0))*scenarioScale,.15,.88):.08;
  temperature=23+seasonal*10+drought*3.6;dayMax=temperature+7+(active&&front?5:0);humidity=__ctx.clamp(47-seasonal*16-drought*19+(front?7:0),12,82);
  waterAvailability=__ctx.clamp(1-drought*.58,.43,1);dust=5+drought*36+(front&&active?20:0);sunlight=__ctx.clamp(.98-dust*.002, .65,1);
  name=dayMax>42?'Волна жары':front&&active?'Сухой ветер':seasonal<-.2?'Сезонная передышка':'Засушливая погода';id=front&&active?'duststorm':'clear';infrastructure=active?.38*(1-Math.exp(-post/6)):0;
 }
 if(s.scenario==='nuclear'){
  // The selected severe regional-war preset, not a forecast for every conflict.
  const smoke=active?Math.min(.95,.75*scenarioScale)*(1-Math.exp(-post/1.2))*Math.exp(-post/25):0;
  climateAnomaly=-8*smoke;temperature=14+seasonal*11+climateAnomaly;dayMax=temperature+5;
  radiation=active?__ctx.radiationAt(s,post*30):.08;dust=active?5+68*Math.exp(-post/5)+(front?12:0):4;sunlight=__ctx.clamp(.88-smoke*.6-(front?.1:0),.25,1);
  waterAvailability=active?__ctx.clamp(.82+post*.002,.82,.97):1;infrastructure=active?__ctx.clamp(.93*Math.exp(-post/65),.26,.93):0;
  name=post===1?'Последствия выпадений':active?(dust>25?'Дым и загрязнённая пыль':front?'Ветер над разрушенным районом':'Прояснение над руинами'):front?'Облачность':'Переменная облачность';id=post===1?'fallout':active&&dust>25?'ash':'clouds';
 }
 if(s.scenario==='epidemic'){
  const wave=(at,width,height)=>height*Math.exp(-Math.pow((post-at)/width,2)/2);
  prevalence=active?__ctx.clamp((.002+wave(3,2,.10)+wave(15,3,.07)+wave(32,4,.045)+wave(51,3,.06))*scenarioScale,0,.22):m>12?.001*(m-12):0;
  name=prevalence>.06?'Эпидемическая волна':prevalence>.015?'Повышенная заболеваемость':active?'Межволновой период':'Обычная обстановка';id=front?'fog':'clouds';dust=front?12:4;sunlight=front?.65:.9;infrastructure=active?.5*Math.exp(-post/40):0;
 }
 const wind=Math.round(8+__ctx.worldHash(seed+m*13)*19+(front?18:0)),visibility=__ctx.clamp(22-dust*.12-(front?4:0),1,22);
 const tempStress=Math.max(0,Math.abs(temperature-20)-12)/30,radStress=s.scenario==='nuclear'?Math.log1p(radiation)/9:0;
 const severity=__ctx.clamp(100*(.5*Math.max(tempStress,radStress,prevalence*6)+.2*(dust/100)+.3*infrastructure),0,100);
 const visualSeverity=active?__ctx.clamp(severity+(s.scenario==='nuclear'?infrastructure*55:infrastructure*25),12,96):__ctx.clamp(severity*.15,0,12);
 return {modelVersion:__ctx.PHYSICAL_VERSION,month:m,scenario:s.scenario,post,severity,visualSeverity,temperature:Math.round(temperature*10)/10,dayMax:Math.round(dayMax*10)/10,nightMin:Math.round((temperature-6)*10)/10,humidity:Math.round(humidity),radiation:Math.round(radiation*1000)/1000,bio:Math.round(prevalence*1000),prevalence,dust:Math.round(dust),sunlight,waterAvailability,climateAnomaly,infrastructure,wind,visibility:Math.round(visibility*10)/10,weather:{id,name,intensity:front?.45:.13,storm:front},band:Math.min(4,Math.floor(visualSeverity/20))};
};
} },
{ order:454, run(__ctx:Runtime){__ctx.updateApocalypse=function(){
 const old=__ctx.state.phase,post=__ctx.postMonths();__ctx.state.phase=__ctx.phaseForMonth(__ctx.state.month);__ctx.state.year=Math.floor(__ctx.state.month/12);
 const previous=__ctx.state.environment;__ctx.state.environment=__ctx.computeEnvironment(__ctx.state);__ctx.state.hazard=__ctx.state.environment.severity;
 if(__ctx.state.physical){__ctx.state.physical.previousEnvironment=previous;const e=__ctx.state.environment;
  const access=post<=0?100:__ctx.clamp(95-e.infrastructure*115-Math.max(0,e.dust-20)*.35-Math.max(0,Math.abs(e.temperature-20)-20)*1.4+__ctx.state.physical.roadWork,0,100);
  __ctx.state.cityAccess=access;
 }
 if(old!==__ctx.state.phase&&__ctx.state.month>0)__ctx.logMsg(`Этап: ${__ctx.state.phase}. ${post<=0?'Подготовка.':post<=12?'Переход к автономному снабжению.':post<=48?'Последствия катастрофы и обслуживание систем.':'Адаптация и восстановление доступных районов.'}`,'warn');
};
} },
{ order:459, run(__ctx:Runtime){__ctx.environmentImpact=function(){
 const e=__ctx.physicalDayEnvironment||__ctx.state.environment||__ctx.computeEnvironment(__ctx.state),sv=__ctx.physicalServicesNow||__ctx.physicalServices(e),heat=Math.max(0,e.dayMax-30),wind=Math.max(0,e.wind-25)/70;
 return {waterDemand:1+heat*.01,waterSupply:e.waterAvailability*(1-e.dust*.001),fuelExtra:0,medicineExtra:0,powerFactor:sv.power,wear:__ctx.clamp(e.dust*.00025+wind*.035+Math.abs(e.temperature-20)*.00025,0,.08),outdoorPenalty:__ctx.clamp(heat*.003+Math.max(0,-e.temperature)*.003+wind*.03+e.dust*.0006,0,.32),cargo:__ctx.clamp(1-wind*.1-e.dust*.001,.65,1),healthStress:0};
};
} },
{ order:572, run(__ctx:Runtime){__ctx.shieldFactor=function(s=__ctx.state){return __ctx.shelterProtection(s).effective;};
} }
];
