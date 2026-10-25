/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.maybeEvent = function maybeEvent(restoredTitle=null){
 const restoring=typeof restoredTitle==='string';
 const chance=__ctx.state.month<=__ctx.state.prepMonths?.38:.62; if(!restoring&&__ctx.random()>chance)return;
 const common=[
 {title:'Повреждение насосов',text:'Датчики фиксируют нестабильную работу водного контура.',choices:[
  ['Ремонтировать сейчас',()=>{if(__ctx.state.resources.electronics>=5&&__ctx.state.resources.steel>=3){__ctx.state.resources.electronics-=5;__ctx.state.resources.steel-=3;__ctx.state.bunker.water+=5;__ctx.logMsg('Насосы восстановлены.','good')}else{__ctx.state.bunker.water-=5;__ctx.logMsg('Не хватило деталей, ремонт неполный.','bad')}}],
  ['Перейти на нормирование',()=>{__ctx.state.morale-=3;__ctx.state.bunker.water-=2;__ctx.state.resources.food+=2;__ctx.logMsg('Введено жёсткое нормирование воды.','warn')}]
 ]},
 {title:'Старый склад данных',text:'Разведка нашла серверную и техническую библиотеку. Это шанс сохранить знания, но вылазка рискованна.',choices:[
  ['Отправить группу',()=>{if(__ctx.random()<.78-__ctx.state.hazard/220){__ctx.state.bunker.knowledge+=10;__ctx.state.bunker.intel+=4;__ctx.logMsg('Архивы и инструкции доставлены в убежище.','good')}else{__ctx.state.health-=4;__ctx.logMsg('Группа вернулась с потерями.','bad')}}],
  ['Не рисковать',()=>{__ctx.state.morale+=1;__ctx.logMsg('Ресурс разведки сохранён.','')}]
 ]}
 ];
 const ice=[{title:'Ледяной шторм',text:'Ветер и наледь перегружают наружные системы.',choices:[['Отключить внешние контуры',()=>{__ctx.state.bunker.power-=2;__ctx.state.resources.fuel-=3;__ctx.logMsg('Системы пережили шторм с умеренными потерями.','warn')}],['Рискнуть и оставить питание',()=>{if(__ctx.state.bunker.integrity+__ctx.state.bunker.power>75){__ctx.state.morale+=2;__ctx.logMsg('Шторм пережит без отключения.','good')}else{__ctx.state.bunker.power-=6;__ctx.state.bunker.integrity-=3;__ctx.logMsg('Наружное оборудование повреждено.','bad')}}]]}];
 const heat=[{title:'Пыльная жара',text:'На поверхности экстремальная температура и пыль. Радиаторы теряют эффективность.',choices:[['Снизить нагрузку',()=>{__ctx.state.morale-=2;__ctx.state.bunker.thermal+=2;__ctx.logMsg('Энергопотребление снижено, перегрев сдержан.','warn')}],['Промыть контур',()=>{if(__ctx.state.bunker.water>20){__ctx.state.bunker.water-=2;__ctx.state.bunker.thermal+=5;__ctx.logMsg('Система охлаждения стабилизирована.','good')}else{__ctx.state.health-=3;__ctx.logMsg('Воды недостаточно, перегрев продолжился.','bad')}}]]}];
 const nuclear=[{title:'Радиоактивный фронт',text:'Ветер несёт свежую пыль. Наружные фильтры быстро загрязняются.',choices:[['Сменить фильтры',()=>{if(__ctx.state.resources.electronics>=3&&__ctx.state.resources.steel>=2){__ctx.state.resources.electronics-=3;__ctx.state.resources.steel-=2;__ctx.state.bunker.shield+=4;__ctx.logMsg('Фильтрация усилена.','good')}else{__ctx.state.health-=4;__ctx.logMsg('Запасных частей не хватило.','bad')}}],['Полная герметизация',()=>{__ctx.state.morale-=3;__ctx.state.bunker.thermal-=2;__ctx.state.bunker.shield+=2;__ctx.logMsg('Убежище временно переведено в закрытый цикл.','warn')}]]}];
 const epidemic=[{title:'Очаг заражения',text:'В одном из блоков выявлена вспышка болезни. Нужно выбирать между жёстким карантином и расходом лекарств.',choices:[['Жёсткий карантин',()=>{const q=__ctx.state.built.quarantine||0;__ctx.state.morale-=Math.max(1,4-q);__ctx.state.bunker.medical+=2;__ctx.state.bunker.biosecurity+=q?1:0;__ctx.logMsg('Карантин введён быстро, распространение инфекции замедлено.','warn')}],['Интенсивное лечение',()=>{const cost=Math.max(2,5-(__ctx.state.built.vaccine||0));if(__ctx.state.resources.medicine>=cost){__ctx.state.resources.medicine-=cost;__ctx.state.health+=2+(__ctx.state.built.biolab||0);__ctx.state.bunker.medical+=3;__ctx.logMsg('Вспышку локализовали за счёт лечения и диагностики.','good')}else{__ctx.state.health-=Math.max(1,5-(__ctx.state.bunker.biosecurity||0)/20);__ctx.logMsg('Лекарств не хватило, вспышка ударила по населению.','bad')}}]]},{title:'Мутация штамма',text:'Разведка сообщает о новой волне заболевания. Старые протоколы санитарии работают хуже.',choices:[['Обновить протоколы',()=>{const lab=__ctx.state.built.biolab||0;if(__ctx.state.bunker.knowledge>=18||lab){__ctx.state.bunker.knowledge+=2+lab;__ctx.state.bunker.medical+=2;__ctx.state.bunker.biosecurity+=lab?2:0;__ctx.logMsg('Новые протоколы внедрены.','good')}else{__ctx.state.health-=3;__ctx.logMsg('Поселению не хватает знаний для быстрой адаптации.','bad')}}],['Изолировать верхние уровни',()=>{__ctx.state.resources.food-=3;__ctx.state.morale-=2;__ctx.state.bunker.integrity+=1;__ctx.logMsg('Передвижение ограничено, вспышка замедлена.','warn')}]]}];
 const pool=common.concat(__ctx.state.scenario==='ice'?ice:__ctx.state.scenario==='heat'?heat:__ctx.state.scenario==='epidemic'?epidemic:nuclear);
 __ctx.state.event=restoring?(pool.find(ev=>ev.title===restoredTitle)||null):__ctx.pick(pool);
 if(__ctx.state.event&&!restoring)__ctx.notify_announceEvent(__ctx.state.event.title);
};

__ctx.resolveEvent = function resolveEvent(i){const ev=__ctx.state.event;if(!ev)return;const h0=__ctx.state.health,m0=__ctx.state.morale;ev.choices[i][1]();__ctx.state.event=null;__ctx.state.health=__ctx.clamp(__ctx.state.health,0,100);__ctx.state.morale=__ctx.clamp(__ctx.state.morale,0,100);__ctx.updateSettlementStage();__ctx.notify_playEventCue((__ctx.state.health<h0||__ctx.state.morale<m0-1)?'bad':'good');__ctx.invalidate()};

__ctx.eventChoiceRequirements = function eventChoiceRequirements(ev,index){
 const requirements: any={cost:{},reason:'',strict:false};
 if(ev.title==='Повреждение насосов'&&index===0){requirements.cost={parts:2,precisionParts:1};requirements.strict=true;if((__ctx.state.built.printer||0)<2)requirements.reason='Нужен 3D-принтер ур. 2';}
 if(ev.title==='Радиоактивный фронт'&&index===0){requirements.cost={parts:2};requirements.strict=true;if(!(__ctx.state.built.printer>0))requirements.reason='Нужен 3D-принтер';}
 if(ev.title==='Очаг заражения'&&index===1){requirements.cost={medicine:Math.max(2,5-(__ctx.state.built.vaccine||0))};requirements.strict=true;}
 if(ev.title==='Ледяной шторм'&&index===0)requirements.cost={fuel:3};
 if(ev.title==='Мутация штамма'&&index===1)requirements.cost={food:3};
 if(ev.title==='Старый склад данных'&&index===0&&__ctx.state.population<3)requirements.reason='Нужно не менее 3 жителей';
 if(requirements.strict&&!__ctx.canPay(requirements.cost))requirements.reason+=(requirements.reason?' · ':'')+'Не хватает ресурсов';
 return requirements;
};

__ctx.falloutBriefEvent = function falloutBriefEvent(stage){const d=__ctx.falloutBriefs[stage];return {title:d.title,text:d.text,data:{balanceFallout:true,stage},choices:d.choices.map((label,i)=>[label,()=>{if(stage===0&&i===0)__ctx.state.physical.sealHours=24;if(stage===1&&i===1){__ctx.pay({parts:2});__ctx.state.physical.filterCondition=100;}if(stage===2&&i===1){__ctx.pay({electronics:1,fuel:1});__ctx.state.expeditionPrep=Math.min(2,(__ctx.state.expeditionPrep||0)+1);}__ctx.state.balance.falloutChoices.push({stage,choice:i});}])};};
}
export const steps: Initialization[] = [
{ order:291, run(__ctx:Runtime){__ctx.originalMaybeEvent = __ctx.maybeEvent;
} },
{ order:292, run(__ctx:Runtime){__ctx.maybeEvent=function(restoredTitle=null){__ctx.originalMaybeEvent(restoredTitle);const ev=__ctx.state.event;if(!ev)return;if(ev.title==='Повреждение насосов'){ev.text='Изношен ротор насоса. Полное восстановление требует прецизионного напечатанного узла.';ev.choices[0]=['Установить узел: 2 запчасти + 1 точная деталь',()=>{if((__ctx.state.built.printer||0)>=2&&__ctx.canPay({parts:2,precisionParts:1})){__ctx.pay({parts:2,precisionParts:1});__ctx.state.bunker.water+=5;__ctx.logMsg('Насосы восстановлены напечатанным прецизионным узлом.','good');}else{__ctx.state.bunker.water=Math.max(0,__ctx.state.bunker.water-3);__ctx.logMsg('Нет напечатанного узла или принтера ур. 2. Выполнен только временный ремонт насосов.','bad');}}];}if(ev.title==='Радиоактивный фронт'){ev.choices[0]=['Напечатанные фильтры: 2 запчасти',()=>{if((__ctx.state.built.printer||0)>0&&__ctx.canPay({parts:2})){__ctx.pay({parts:2});__ctx.state.bunker.shield+=4;__ctx.logMsg('Напечатанные фильтры установлены, защита усилена.','good');}else{__ctx.state.health=Math.max(0,__ctx.state.health-4);__ctx.logMsg('Нет сменных напечатанных фильтров. Радиационный фронт повысил нагрузку на людей.','bad');}}];}};
} },
{ order:294, run(__ctx:Runtime){__ctx.resolveEvent=function(i){if(!Number.isInteger(i)||!__ctx.state.event?.choices?.[i]||__ctx.state.ended)return;__ctx.originalResolve(i);__ctx.evaluate();__ctx.autosaveGame();};
} },
{ order:378, run(__ctx:Runtime){__ctx.resolveEvent=function(index){
 const ev=__ctx.state.event;if(!ev||__ctx.state.ended||!Number.isInteger(index)||!ev.choices[index])return;
 const req=__ctx.eventChoiceRequirements(ev,index);if(req.reason){__ctx.logMsg(req.reason+'. Выберите доступный способ решения.','warn');__ctx.invalidate();return;}
 const before: any={...__ctx.state.resources},health=__ctx.state.health,morale=__ctx.state.morale;
 ev.choices[index][1]();
 let missing=0;for(const [r,v] of __ctx.entries(__ctx.state.resources)){if(v<0){missing-=v;__ctx.state.resources[r]=0;}}
 for(const [k,v] of __ctx.entries(__ctx.state.bunker))if(k!=='morale'&&Number.isFinite(v))__ctx.state.bunker[k]=Math.max(0,v);
 if(missing>__ctx.RESOURCE_EPSILON){__ctx.state.health-=__ctx.clamp(missing/2,.5,4);__ctx.state.morale-=__ctx.clamp(missing/3,.25,3);if(__ctx.state.lastShortageCountMonth!==__ctx.state.month){__ctx.state.shortages++;__ctx.state.lastShortageCountMonth=__ctx.state.month;}__ctx.logMsg('Расход по событию не обеспечен запасами. Аварийное решение ухудшило здоровье и мораль; отрицательный запас не создаётся.','bad');}
 __ctx.state.event=null;__ctx.state.pendingEvent=null;__ctx.state.health=__ctx.clamp(__ctx.state.health,0,100);__ctx.state.morale=__ctx.clamp(__ctx.state.morale,0,100);
 __ctx.state.specialists=Math.min(__ctx.state.specialists,Math.floor(__ctx.state.population));__ctx.updateSettlementStage();
 const last=__ctx.state.history.at(-1);if(last&&last.month===__ctx.state.month){last.population=__ctx.state.population;last.rescued=__ctx.state.rescuedTotal||0;last.deaths=__ctx.state.deathsTotal||0;last.resources={...__ctx.state.resources};last.eventDelta=last.eventDelta||{};for(const r of Object.keys(before))last.eventDelta[r]=(last.eventDelta[r]||0)+(__ctx.state.resources[r]-before[r]);}
 __ctx.notify_playEventCue(__ctx.state.health<health||__ctx.state.morale<morale-1?'bad':'good');__ctx.evaluate();__ctx.invalidate();
};
} },
{ order:379, run(__ctx:Runtime){__ctx.stabilityMaybeEvent = __ctx.maybeEvent;
} },
{ order:380, run(__ctx:Runtime){__ctx.maybeEvent=function(restoredTitle=null){
 __ctx.stabilityMaybeEvent(restoredTitle);
 if(__ctx.state.event?.title==='Старый склад данных')__ctx.state.event.choices[0]=['Отправить разведгруппу',()=>{
  const im=__ctx.environmentImpact(),g=__ctx.gearData(),chance=__ctx.clamp(.78-(__ctx.state.hazard/220+im.outdoorPenalty)*(1-g.reduction)+__ctx.expeditionPreparationBonus()+__ctx.techEffect('expeditionBonus'),.05,.97);
  __ctx.state.surfaceMissions++;
  if(__ctx.random()<chance){__ctx.state.bunker.knowledge+=10;__ctx.state.bunker.intel+=4;__ctx.logMsg('Архивы и инструкции доставлены в убежище.','good');}
  else{__ctx.state.health-=4*(1-g.reduction*.5);__ctx.logMsg('Группа вернулась с травмами. Архивы доставить не удалось.','bad');}
  __ctx.wearGear();__ctx.consumeExpeditionPreparation();
 }];
};
} },
{ order:488, run(__ctx:Runtime){__ctx.physicalEventRequirements = __ctx.eventChoiceRequirements;
} },
{ order:489, run(__ctx:Runtime){__ctx.eventChoiceRequirements=function(ev,index){const r=__ctx.physicalEventRequirements(ev,index);if((ev.title==='Беженцы у внешнего периметра'&&index<2||ev.title==='Старый склад данных'&&index===0)&&__ctx.falloutActive()){const d=__ctx.deconStatus(ev.data?.group||3);if(!d.available)r.reason=d.reason;r.cost={...r.cost,...d.cost};}return r;};
} },
{ order:513, run(__ctx:Runtime){__ctx.physicalMaybeEvent = __ctx.maybeEvent;
} },
{ order:514, run(__ctx:Runtime){__ctx.maybeEvent=function(title=null){__ctx.physicalMaybeEvent(title);if(__ctx.state.event?.title==='Старый склад данных'&&__ctx.falloutActive()){const action=__ctx.state.event.choices[0][1];__ctx.state.event.choices[0][1]=()=>{if(!__ctx.requireDecon(3))return;action();__ctx.payDecon(3);__ctx.recordOutsideDose(3,'raid');};}if(!title&&__ctx.state.event?.title==='Очаг заражения'&&__ctx.state.physical.infected<.1){__ctx.state.event=null;__ctx.logMsg('Региональная эпидемическая волна: внутри новых случаев не выявлено. Контроль контактов сохраняется.','');}if(__ctx.state.event?.title==='Радиоактивный фронт'){
 __ctx.state.event.text='Ветер поднял пыль с загрязнённого участка. Нужны чистые фильтры и контроль поступающего воздуха. Гамма-экран стен от замены фильтра не меняется.';
 __ctx.state.event.choices[0][1]=()=>{if(__ctx.state.built.printer>0&&__ctx.canPay({parts:2})){__ctx.pay({parts:2});__ctx.state.physical.filterCondition=100;__ctx.logMsg('Напечатанные корпуса и сменные фильтрующие элементы установлены. Очистка воздуха восстановлена; экранирование не изменилось.','good');}};
 __ctx.state.event.choices[1][1]=()=>{__ctx.state.physical.sealHours=24;__ctx.state.morale=__ctx.clamp(__ctx.state.morale-1,0,100);__ctx.logMsg('Включён резервный закрытый режим на 24 часа. После этого необходима штатная вентиляция.','warn');};
 }};
} },
{ order:604, run(__ctx:Runtime){__ctx.balancedEventRequirements = __ctx.eventChoiceRequirements;
} },
{ order:605, run(__ctx:Runtime){__ctx.eventChoiceRequirements=function(ev,index){if(ev.data?.balanceFallout){const cost=ev.data.stage===1&&index===1?{parts:2}:ev.data.stage===2&&index===1?{electronics:1,fuel:1}:{};const reason=!__ctx.canPay(cost)?'Не хватает ресурсов для выбранной меры':'';return {cost,reason,strict:true};}return __ctx.balancedEventRequirements(ev,index);};
} },
{ order:606, run(__ctx:Runtime){__ctx.balancedMaybeEvent = __ctx.maybeEvent;
} },
{ order:607, run(__ctx:Runtime){__ctx.maybeEvent=function(title=null){const stage=__ctx.falloutBriefs.findIndex(d=>d.title===title);if(stage>=0){__ctx.state.event=__ctx.falloutBriefEvent(stage);return;}__ctx.balancedMaybeEvent(title);if(!title&&__ctx.state.scenario==='nuclear'&&!__ctx.falloutActive()&&__ctx.state.event?.title==='Радиоактивный фронт'){__ctx.state.event=null;__ctx.logMsg('Плановая радиометрия: новых радиоактивных выпадений нет. Подготовка продолжается.','');}};
} },
{ order:611, run(__ctx:Runtime){__ctx.resolveEvent=function(index){const ev=__ctx.state.event;if(!ev?.data?.balanceFallout){__ctx.balancedResolve(index);return;}if(!Number.isInteger(index)||!ev.choices[index]||__ctx.state.ended||__ctx.eventChoiceRequirements(ev,index).reason)return;ev.choices[index][1]();const stage=ev.data.stage;__ctx.state.event=null;if(stage<2){__ctx.state.balance.falloutStage=stage+1;__ctx.state.event=__ctx.falloutBriefEvent(stage+1);__ctx.invalidate();}else{__ctx.state.balance.falloutDone=true;__ctx.state.balance.falloutStage=3;__ctx.logMsg('План первых суток принят. Месяц учитывает изменение фона по часам и фактическое размещение людей.','');__ctx.balancedNextMonth();}__ctx.autosaveGame();};
} },
{ order:651, run(__ctx:Runtime){__ctx.v17ResolveEvent = __ctx.resolveEvent;
} },
{ order:652, run(__ctx:Runtime){__ctx.resolveEvent=function(i){const before=__ctx.state.month;__ctx.v17ResolveEvent(i);if(__ctx.state.month!==before){__ctx.updateCommunityOffers();__ctx.invalidate();}};
} }
];
