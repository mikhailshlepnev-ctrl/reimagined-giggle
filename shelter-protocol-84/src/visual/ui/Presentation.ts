/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.aiNotice = function aiNotice(title,text='',opts: any={}){if(opts.cue)__ctx.playEventCue(opts.cue);if(opts.cinematic!==false)__ctx.showCinematic({kicker:opts.kicker||'диспетчер убежища',title,text,sub:opts.sub||'',duration:opts.duration||3200,type:opts.type||'phase'});const msg=`Диспетчер убежища. ${title}. ${text}`.trim();setTimeout(()=>__ctx.aiSpeak(msg,opts.priority||'normal'),opts.delay||140);};

__ctx.renderOperationsTab = function renderOperationsTab(){
 const res=__ctx.viewState.orgReserve||0,buildQueue=__ctx.viewState.reserveBuildDiscount||0,prep=__ctx.viewState.expeditionPrep||0,resourceOpts=['concrete','steel','machinery','fuel','food','electronics','medicine'].map(k=>`<option value="${k}">${__ctx.labelRes(k)}</option>`).join('');
 const reservePips=[0,1].map(i=>`<i class="${res>=i+1?'on':''}"></i>`).join('');
 const pending=[__ctx.viewState.maintenancePrepared?'профилактика систем':null,__ctx.viewState.optimizationTarget?`оптимизация: ${__ctx.labelRes(__ctx.viewState.optimizationTarget)}`:null,__ctx.viewState.mobilizationTarget?`мобилизация: ${__ctx.labelRes(__ctx.viewState.mobilizationTarget)}`:null,prep?`экспедиция ${prep}/2`:null,buildQueue?`стройка −${Math.round(buildQueue*100)}%`:null].filter(Boolean);
 return `<div class="opsOverview"><div class="opsHero"><div class="smallcaps">Оперативное управление</div><h3>Работа есть даже при пустых складах</h3><p class="muted">Оперативные меры тратят действия на организацию труда, ремонт, обучение и перераспределение мощностей. Они не создают большие объёмы ресурсов из воздуха: основной эффект проявляется через эффективность следующего месяца.</p><div class="opsStatus"><span class="tag">действий ${__ctx.viewState.actions}/${__ctx.viewState.actionCapacity}</span>${pending.length?pending.map(x=>`<span class="tag">${x}</span>`).join(''):'<span class="tag">нет подготовленных мер</span>'}</div></div><div class="reserveBox"><div class="smallcaps">Организационный резерв</div><h3>${res.toFixed(1)} / 2.0</h3><div class="reserveGauge">${reservePips}</div><p class="footerHint">Каждое неиспользованное действие при переходе месяца превращается в 0,4 ед. резерва. Это не полноценный перенос действий.</p><button onclick="game.useOrgReserve('build')" ${res<1||buildQueue>=.16?'disabled':''}>📐 В стройку: −8%</button><button onclick="game.useOrgReserve('expedition')" ${res<1||prep>=2?'disabled':''}>🧭 В экспедицию</button></div></div><div class="opsCards">
 <div class="card opCard"><h4>♻️ Разбор и переработка</h4><p>Разобрать повреждённую технику и остатки стройплощадки. Источник конечный, поэтому мера спасает от тупика, но не заменяет промышленность.</p><div class="opEffect">Внутренний лом: <b>${__ctx.fmtResource(__ctx.viewState.localScrap)}</b> · сталь и иногда электроника · не чаще 1 раза в месяц</div><button onclick="game.emergencyRecycle()" ${__ctx.viewState.actions<=0||(__ctx.viewState.localScrap||0)<=0||__ctx.viewState.recycleUsedMonth===__ctx.viewState.month?'disabled':''}>Направить бригаду</button></div>
 <div class="card opCard"><h4>🔧 Техническое обслуживание</h4><p>Ремонтные смены восстанавливают две наиболее слабые системы и заранее снижают вероятность аварии в следующем месяце.</p><div class="opEffect">1 действие · раз в месяц · требует напечатанные детали</div><button onclick="game.operationMaintenance()" ${__ctx.viewState.actions<=0||__ctx.viewState.maintenanceUsedMonth===__ctx.viewState.month?'disabled':''}>Провести профилактику</button></div>
 <div class="card opCard"><h4>📐 Инженерная оптимизация</h4><p>Инженеры перестраивают технологический процесс выбранного ресурса. Эффект действует на следующий месячный цикл.</p><select id="opOptimizeTarget">${resourceOpts}</select><div class="opEffect">+22% выпуска выбранного ресурса · 1 действие · раз в месяц</div><button onclick="game.operationOptimize()" ${__ctx.viewState.actions<=0||__ctx.viewState.optimizationUsedMonth===__ctx.viewState.month?'disabled':''}>Оптимизировать процесс</button></div>
 <div class="card opCard"><h4>🎓 Учебная смена</h4><p>Опытные специалисты обучают смены, разбирают технические ошибки и пополняют документацию. Прямой прирост знаний небольшой и ограничен одной сменой в месяц.</p><div class="opEffect">Знания +0,22…0,68 · прогресс подготовки специалиста ${Math.min(5,__ctx.viewState.trainingProgress||0).toFixed(1)}/5</div><button onclick="game.operationTraining()" ${__ctx.viewState.actions<=0||__ctx.viewState.trainingUsedMonth===__ctx.viewState.month?'disabled':''}>Организовать обучение</button></div>
 <div class="card opCard"><h4>🚨 Чрезвычайная мобилизация</h4><p>Поселение концентрирует людей и оборудование на одном критическом производстве. За ускорение приходится платить просадкой остальных линий и моралью.</p><select id="opMobilizeTarget">${resourceOpts}</select><div class="opEffect">цель +35% · остальные производства −12% · мораль −2 · следующий месяц</div><button onclick="game.operationMobilize()" ${__ctx.viewState.actions<=0||__ctx.viewState.mobilizationUsedMonth===__ctx.viewState.month?'disabled':''}>Объявить мобилизацию</button></div>
 <div class="card opCard"><h4>🧭 Подготовка экспедиции</h4><p>Разведка маршрута, проверка средств защиты и заранее сформированный грузовой план. Подготовка сохраняется до следующей вылазки или обменной экспедиции.</p><div class="opEffect">уровень ${prep}/2 · каждый уровень: +5 п.п. к выживанию и +12% к доставляемому грузу</div><button onclick="game.operationPrepareExpedition()" ${__ctx.viewState.actions<=0||prep>=2?'disabled':''}>Подготовить маршрут</button></div>
 </div>`;
};

__ctx.initFX = function initFX(){
 __ctx.fxEngine.canvas=__ctx.browser.document.getElementById('fxCanvas'); __ctx.fxEngine.ctx=__ctx.fxEngine.canvas.getContext('2d');
 const resize=()=>{__ctx.fxEngine.dpr=Math.min(2,__ctx.browser.window.devicePixelRatio||1);__ctx.fxEngine.w=innerWidth;__ctx.fxEngine.h=innerHeight;__ctx.fxEngine.canvas.width=__ctx.fxEngine.w*__ctx.fxEngine.dpr;__ctx.fxEngine.canvas.height=__ctx.fxEngine.h*__ctx.fxEngine.dpr;__ctx.fxEngine.ctx.setTransform(__ctx.fxEngine.dpr,0,0,__ctx.fxEngine.dpr,0,0);};
 resize(); addEventListener('resize',resize,{passive:true}); requestAnimationFrame(__ctx.animateFX);
};

__ctx.updateDynamicAtmosphere = function updateDynamicAtmosphere(){
 const h=__ctx.clamp(__ctx.viewState.hazard||0,0,100), root=__ctx.browser.document.documentElement; __ctx.fxEngine.scenario=__ctx.viewState.scenario; __ctx.fxEngine.hazard=h;
 const progress=h/100;
 let sat=1.05, bright=1, contrast=1, fx=.18+progress*.62, vignette=.18+progress*.34;
 if(__ctx.viewState.scenario==='ice'){sat=1.02-progress*.24; bright=1-progress*.22; contrast=1+progress*.15;}
 if(__ctx.viewState.scenario==='heat'){sat=1.12+progress*.28; bright=1-progress*.10; contrast=1+progress*.22;}
 if(__ctx.viewState.scenario==='nuclear'){sat=.92-progress*.28; bright=.98-progress*.25; contrast=1+progress*.28;}
 if(__ctx.viewState.scenario==='epidemic'){sat=.95-progress*.12; bright=.99-progress*.12; contrast=1+progress*.18;}
 root.style.setProperty('--hazard-sat',sat.toFixed(2)); root.style.setProperty('--hazard-bright',bright.toFixed(2)); root.style.setProperty('--hazard-contrast',contrast.toFixed(2)); root.style.setProperty('--fx-opacity',fx.toFixed(2)); root.style.setProperty('--vignette',vignette.toFixed(2));
};

__ctx.flashAlert = function flashAlert(){const f=__ctx.browser.document.getElementById('alertFlash'); if(!f)return; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');};

__ctx.initSceneAnim = function initSceneAnim(){
 __ctx.sceneEngine.canvas=__ctx.browser.document.getElementById('sceneCanvas'); if(!__ctx.sceneEngine.canvas)return; __ctx.sceneEngine.ctx=__ctx.sceneEngine.canvas.getContext('2d');
 const fit=()=>{const hero=__ctx.sceneEngine.canvas.parentElement; const r=hero.getBoundingClientRect(); const d=Math.min(2,__ctx.browser.window.devicePixelRatio||1); __ctx.sceneEngine.w=Math.max(10,Math.round(r.width)); __ctx.sceneEngine.h=Math.max(10,Math.round(r.height)); __ctx.sceneEngine.canvas.width=__ctx.sceneEngine.w*d; __ctx.sceneEngine.canvas.height=__ctx.sceneEngine.h*d; __ctx.sceneEngine.ctx.setTransform(d,0,0,d,0,0);};
 fit(); addEventListener('resize',fit,{passive:true}); requestAnimationFrame(__ctx.animateSceneCanvas);
};

__ctx.setMasterVolume = function setMasterVolume(){
 if(!__ctx.audioEngine.master) return;
 const t=(__ctx.audioEngine.muted?0:__ctx.audioEngine.volume);
 __ctx.audioEngine.master.gain.cancelScheduledValues(__ctx.audioEngine.ctx.currentTime);
 __ctx.audioEngine.master.gain.linearRampToValueAtTime(t,__ctx.audioEngine.ctx.currentTime+0.35);
};

__ctx.makeOscLayer = function makeOscLayer(opts: any={}){
 const ctx=__ctx.audioEngine.ctx;
 const osc=ctx.createOscillator(); osc.type=opts.wave||'sine'; osc.frequency.value=opts.freq||50;
 const gain=ctx.createGain(); gain.gain.value=opts.gain||0.03;
 const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=opts.lfoFreq||0.08;
 const lfoGain=ctx.createGain(); lfoGain.gain.value=opts.lfoDepth||2;
 lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
 osc.connect(gain); gain.connect(__ctx.audioEngine.master); osc.start(); lfo.start();
 return {gain,osc,lfo,update(h){if(opts.kind==='drone'){gain.gain.setTargetAtTime((opts.baseGain||0.02)+(h/100)*(opts.rangeGain||0.03),ctx.currentTime,0.6); osc.frequency.setTargetAtTime((opts.baseFreq||46)+(h/100)*(opts.rangeFreq||5),ctx.currentTime,0.7);} if(opts.kind==='hum'){gain.gain.setTargetAtTime((opts.baseGain||0.015)+(h/100)*(opts.rangeGain||0.025),ctx.currentTime,0.6);} },stop(){try{osc.stop()}catch(e){} try{lfo.stop()}catch(e){} gain.disconnect(); lfo.disconnect(); lfoGain.disconnect();}};
};

__ctx.makeSettlementHum = function makeSettlementHum(){
 const ctx=__ctx.audioEngine.ctx; const osc=ctx.createOscillator(); const g=ctx.createGain(); const lfo=ctx.createOscillator(); const lfoG=ctx.createGain();
 osc.type='triangle'; osc.frequency.value=88; g.gain.value=0.0001; lfo.type='sine'; lfo.frequency.value=.06; lfoG.gain.value=6; lfo.connect(lfoG); lfoG.connect(osc.frequency); osc.connect(g); g.connect(__ctx.audioEngine.master); osc.start(); lfo.start();
 return {update(h,stage){const s=stage||0; g.gain.setTargetAtTime(Math.max(0.001,0.005+s*.003-h*.00003),ctx.currentTime,.9); osc.frequency.setTargetAtTime(76+s*5,ctx.currentTime,.9);}, stop(){try{osc.stop()}catch(e){} try{lfo.stop()}catch(e){} g.disconnect(); lfo.disconnect(); lfoG.disconnect();}};
};

__ctx.makeIndustrialClicks = function makeIndustrialClicks(){
 const ctx=__ctx.audioEngine.ctx; let alive=true,timer=null,hazard=0,stage=0;
 function tick(){ if(!alive) return; const now=ctx.currentTime; const src=ctx.createBufferSource(); src.buffer=__ctx.audioEngine.noiseBuffer; const filter=ctx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=1200+stage*120; const g=ctx.createGain(); g.gain.value=0.0001; src.connect(filter); filter.connect(g); g.connect(__ctx.audioEngine.master); src.start(now); g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.0035+stage*.0009,now+.002); g.gain.exponentialRampToValueAtTime(0.0001,now+.05); src.stop(now+.06); }
 function schedule(){ if(!alive) return; if(stage>=2) tick(); timer=setTimeout(schedule, __ctx.clamp(2400-stage*180+hazard*4,600,2600)); }
 schedule();
 return {update(h,s){hazard=h;stage=s||0;},stop(){alive=false; clearTimeout(timer);}};
};

__ctx.makeAdaptiveScore = function makeAdaptiveScore(scenario){const ctx=__ctx.audioEngine.ctx,filter=ctx.createBiquadFilter(),bus=ctx.createGain();filter.type='lowpass';filter.frequency.value=900;bus.gain.value=0.0001;filter.connect(bus);bus.connect(__ctx.audioEngine.master);const pad=[0,1,2].map((i)=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=i===0?'triangle':i===1?'sine':'sawtooth';g.gain.value=0.0001;osc.connect(g);g.connect(filter);osc.start();return{osc,g}});let alive=true,timer=null,hazard=0,stage=0;const roots: any={ice:45,heat:40,nuclear:36,epidemic:41};const motifs: any={ice:[0,3,7,10],heat:[0,2,5,7],nuclear:[0,1,6,7],epidemic:[0,3,5,8]};function rootNow(){const prof=__ctx.musicProfile();return roots[scenario]+Math.round(prof.growth*4)-Math.round(prof.panic*3)}function updateVoices(){const prof=__ctx.musicProfile(),root=rootNow(),ints=motifs[scenario]||motifs.ice; pad.forEach((v,i)=>{const note=root+(ints[[0,2,3][i]]||0)+(prof.triumph>.58?12:0); v.osc.frequency.setTargetAtTime(__ctx.midiFreq(note),ctx.currentTime,.8); const base=[.008,.007,.0045][i]; const amt=base+(prof.growth*.003)+(prof.triumph*.0025)-(prof.panic*.0022); v.g.gain.setTargetAtTime(Math.max(.0001,amt),ctx.currentTime,.8);}); filter.frequency.setTargetAtTime(420+prof.growth*880+prof.triumph*520-prof.panic*180+hazard*4,ctx.currentTime,.7); bus.gain.setTargetAtTime(.22+(stage*.015),ctx.currentTime,.8);} function blip(freq,dur=.28,gain=.012,type='sine',delay=0){const now=ctx.currentTime+delay;const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.value=freq;g.gain.value=.0001;osc.connect(g);g.connect(filter);osc.start(now);g.gain.setValueAtTime(.0001,now);g.gain.linearRampToValueAtTime(gain,now+.03);g.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.stop(now+dur+.05);} function sequence(){if(!alive)return;const prof=__ctx.musicProfile(),root=rootNow(),ints=motifs[scenario]||motifs.ice;const fast=prof.panic>.45||prof.scarcity>.45;const triumphant=prof.triumph>.65&&prof.panic<.32;const baseGain=.008+prof.growth*.004+(triumphant?.004:0); const dur=fast?.18:.28; const step=fast?850:triumphant?1600:2300; const notes=fast?[ints[0],ints[1],ints[3]]:triumphant?[ints[0],ints[2],12+ints[3]]:[ints[0],ints[2]]; notes.forEach((iv,i)=>blip(__ctx.midiFreq(root+iv+(triumphant?12:0)),dur,baseGain*(1-i*.15),scenario==='nuclear'?'triangle':'sine',i*(fast?.09:.14))); timer=setTimeout(sequence,step-Math.round(stage*60)+Math.round(prof.panic*180));} updateVoices(); sequence(); return{update(h,s){hazard=h;stage=s||0;updateVoices();},stop(){alive=false;clearTimeout(timer);pad.forEach(v=>{try{v.osc.stop()}catch(e){} try{v.g.disconnect()}catch(e){}});try{filter.disconnect()}catch(e){} try{bus.disconnect()}catch(e){}}};};

__ctx.updateSaveUI = function updateSaveUI(){const b=__ctx.browser.document.getElementById('loadBtn'),st=__ctx.browser.document.getElementById('saveStatus'),info=__ctx.getSaveInfo();if(b)b.disabled=!info;if(st)st.textContent=info?`${__ctx.scenarios[info.scenario]?.icon||''} месяц ${info.month}`:'нет сохранения';};

__ctx.applyScenarioTheme = function applyScenarioTheme(){
 const root=__ctx.browser.document.documentElement; const body=__ctx.browser.document.body;
 if(!__ctx.viewState.scenario){
   root.style.setProperty('--theme-accent','#d8ff72'); root.style.setProperty('--theme-glow','rgba(216,255,114,.25)'); root.style.setProperty('--theme-image','none');
   body.dataset.scenario=''; __ctx.updateSceneHero(); return;
 }
 const v=__ctx.scenarioVisuals[__ctx.viewState.scenario];
 root.style.setProperty('--theme-accent',v.accent); root.style.setProperty('--theme-glow',v.glow); root.style.setProperty('--theme-image',`url('${v.image}')`);
 body.dataset.scenario=__ctx.viewState.scenario;
 __ctx.updateSceneHero();
};

__ctx.updateSceneHero = function updateSceneHero(){
 const el=__ctx.browser.document.getElementById('sceneContent');
 if(!__ctx.viewState.scenario){
   el.innerHTML=`<div class="sceneTopline"><div><div class="smallcaps">Стратегия выживания</div><div class="sceneTitle">ПРЕДЕЛ</div><div class="sceneMood">Выберите сценарий апокалипсиса и подготовьте убежище до того, как поверхность станет почти непригодной для жизни.</div></div></div><div class="sceneBadges"><span class="sceneBadge">4 режима</span><span class="sceneBadge">случайный район</span><span class="sceneBadge">строительство и управление поселением</span></div>`;
   return;
 }
 const s=__ctx.scenarios[__ctx.viewState.scenario], v=__ctx.scenarioVisuals[__ctx.viewState.scenario];
 const stageText = __ctx.viewState.month===0 ? 'Фаза: выбор площадки' : `${__ctx.viewState.phase} · месяц ${__ctx.viewState.month}`;
 const hazardText = __ctx.viewState.month===0 ? 'Интенсивность катастрофы пока минимальна, но окно подготовки ограничено.' : `Интенсивность катастрофы: ${Math.round(__ctx.viewState.hazard)}%.`;
 el.innerHTML=`<div class="sceneTopline"><div><div class="smallcaps">${s.icon} ${s.name}</div><div class="sceneTitle">${__ctx.viewState.city?__ctx.viewState.city:'Неизвестный район'}</div><div class="sceneMood">${v.mood}</div></div><div class="sceneBadge">${stageText}</div></div><div class="sceneBadges">${v.tags.map(t=>`<span class="sceneBadge">${t}</span>`).join('')}<span class="sceneBadge live">${hazardText}</span>${__ctx.viewState.site?`<span class="sceneBadge">площадка: ${__ctx.viewState.site.name}</span>`:''}</div>`;
};

__ctx.deepRaidCardHTML = function deepRaidCardHTML(){
 const closed=__ctx.viewState.cityAccess<=0,cool=Math.max(0,2-(__ctx.viewState.month-(__ctx.viewState.lastDeepRaidMonth??-999))),surv=__ctx.expeditionSurvivalChance('raid'),wipe=Math.round(__ctx.fullLossProbability(4,'raid')*100),opts=Object.keys(__ctx.deepRaidLoot).map(k=>`<option value="${k}">${__ctx.labelRes(k)}</option>`).join(''),disabled=!closed||cool>0||__ctx.viewState.population<4||__ctx.viewState.actions<=0;
 return `<div class="card riskCard"><h4>⚠️ Вылазка в потерянный город ${__ctx.viewState.expeditionPrep?`<span class="tag">подготовка ${__ctx.viewState.expeditionPrep}/2</span>`:''}</h4><p>После исчезновения обычного доступа можно отправить <b>ровно 4 человека</b> за одним выбранным ресурсом. Экспедиция может вернуться частично или погибнуть полностью.</p><div class="tradeGrid"><label>Целевой ресурс<select id="deepRaidTarget">${opts}</select></label><div><span class="smallcaps">риск сейчас</span><div class="riskMeter"><i style="width:${wipe}%"></i></div><div class="expeditionNote">Выживание одного участника ≈ ${(surv*100).toFixed(1)}% · полная гибель группы ≈ ${wipe}%.</div></div></div><p class="cost">${closed?(cool>0?`Следующая вылазка через ${cool} мес.`:'Доступна сейчас'):'Откроется, когда доступ к городу станет 0%'} · требуется 4 жителя · 1 действие</p><button onclick="game.deepCityRaid()" ${disabled?'disabled':''}>Отправить 4 человек</button></div>`;
};

__ctx.refreshTradeRisk = function refreshTradeRisk(){
 const sel=__ctx.browser.document.getElementById('tradeTeam'),bar=__ctx.browser.document.getElementById('tradeRiskBar'),txt=__ctx.browser.document.getElementById('tradeRiskText');if(!sel||!bar||!txt)return;
 const team=__ctx.clamp(Math.round(Number(sel.value)||5),1,5),surv=__ctx.expeditionSurvivalChance('trade'),wipe=Math.round(__ctx.fullLossProbability(team,'trade')*100);bar.style.width=`${wipe}%`;txt.textContent=`Группа ${team}: выживание одного участника ≈ ${(surv*100).toFixed(1)}%, полная гибель всей экспедиции ≈ ${wipe}%.`;
};

__ctx.render = function render(){__ctx.browser.document.body.dataset.stage=String(__ctx.viewState.settlementLevel||0);__ctx.renderLeft();__ctx.renderCenter();__ctx.renderEvent();__ctx.renderLog();__ctx.drawMap();__ctx.applyScenarioTheme();__ctx.updateDynamicAtmosphere();__ctx.updateAudioForHazard(__ctx.viewState.hazard||0);__ctx.updateAudioUI();__ctx.browser.document.getElementById('phasePill').textContent=`${__ctx.viewState.phase} · месяц ${__ctx.viewState.month}`;__ctx.browser.document.getElementById('nextBtn').disabled=!!__ctx.viewState.event||__ctx.viewState.ended;__ctx.updateSaveUI()};

__ctx.renderCenter = function renderCenter(){const c=__ctx.browser.document.getElementById('centerContent');if(!__ctx.viewState.site){c.innerHTML=`<div class="locationCard"><h2>Выберите площадку</h2><p class="muted">Разведка нашла три варианта в окрестностях ${__ctx.viewState.city}. Чем больше людей вы планируете спасти, тем больше будущая рабочая сила — но тем выше требования к жилью и жизнеобеспечению.</p><div class="cards">${__ctx.viewState.sites.map(s=>`<div class="card"><h4>${s.name}</h4><p>${s.desc}</p><div>${s.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><button class="primary" onclick="game.chooseSite(${s.id})">Выбрать</button></div>`).join('')}</div></div>`;return}const prep=__ctx.viewState.month<=__ctx.viewState.prepMonths,remaining=Math.max(0,__ctx.viewState.prepMonths-__ctx.viewState.month),w=__ctx.workforceData(),st=__ctx.currentStage();
 c.innerHTML=`<div class="locationCard"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2>${prep?'Строительство убежища':'Управление поселением'}</h2><p class="muted">${prep?`До перелома: ${remaining} мес.`:`Год ${__ctx.viewState.year}`} · рабочая сила ${Math.round(w.effective)} · действий ${__ctx.viewState.actions}/${__ctx.viewState.actionCapacity}</p></div><div><span class="tag">${__ctx.viewState.site.name}</span><span class="tag">${st.icon} ${st.name}</span></div></div>
 <div class="tabs"><button id="tabBuild" class="active" onclick="game.showTab('build')">Строительство</button><button id="tabCity" onclick="game.showTab('city')">Городские ресурсы</button><button id="tabPopulation" onclick="game.showTab('population')">Население</button><button id="tabTechnology" onclick="game.showTab('technology')">Технологии</button><button id="tabOperations" onclick="game.showTab('operations')">Оперативные меры</button><button id="tabProduction" onclick="game.showTab('production')">Производство</button><button id="tabForecast" onclick="game.showTab('forecast')">Прогноз</button></div><div id="tabContent"></div></div>`;__ctx.showTab(__ctx.viewState.uiTab||'build')};

__ctx.renderProductionTab = function renderProductionTab(){
 const prod=__ctx.viewState.lastProduction||{},cons=__ctx.viewState.lastConsumption||{},hist=(__ctx.viewState.history||[]).slice(-12),keys=Object.keys(__ctx.viewState.resources);
 const tiles=keys.map(k=>{let detail=`расход ${__ctx.fmtResource(cons[k]||0)} / мес. · запас ${__ctx.fmtResource(__ctx.viewState.resources[k]||0)}`;if(k==='food'&&(__ctx.viewState.lastFoodPotential||0)>0)detail=`потенциал ${__ctx.fmtResource(__ctx.viewState.lastFoodPotential)} · расход ${__ctx.fmtResource(__ctx.viewState.lastFoodNeed||0)} · запас ${__ctx.fmtResource(__ctx.viewState.resources.food||0)}`;return `<div class="productionTile"><small>${__ctx.labelRes(k)}</small><b>+${__ctx.fmtResource(prod[k]||0)}</b><small>${detail}</small></div>`}).join('');
 const chains=__ctx.entries(__ctx.industryChains).map(([k,ch])=>{const lvl=__ctx.viewState.built[ch.building]||0,last=(__ctx.viewState.lastIndustrial||{})[k]||{scale:0,produced:{},consumed:{}},out=__ctx.entries(last.produced||{}).map(([r,q])=>`${__ctx.labelRes(r)} +${__ctx.fmtResource(q)}`).join(', ')||'нет выпуска';return `<div class="chainCard"><b>${ch.icon} ${ch.name}</b><div class="chainFlow">${ch.flow}</div><div class="chainStatus">цех: ур. ${lvl} · загрузка ${Math.round((last.scale||0)*100)}% · ${out}</div></div>`}).join('');
 const rows=hist.map(h=>`<tr><td>М${h.month}</td>${keys.map(k=>`<td>+${__ctx.fmtResource((h.production||{})[k]||0)}<br><span class="muted">−${__ctx.fmtResource((h.consumption||{})[k]||0)}</span></td>`).join('')}<td>${Math.round(h.population||0)}</td><td>${Math.round(h.hazard||0)}%</td></tr>`).join('');
 const wb=__ctx.viewState.month>0?{supply:__ctx.viewState.lastWaterSupply,humanNeed:__ctx.viewState.lastWaterHumanNeed,forFood:__ctx.viewState.lastWaterForFood,farmUse:__ctx.viewState.lastWaterFarmUse,foodCapacity:__ctx.viewState.lastWaterFoodCapacity,humanDeficit:__ctx.viewState.lastWaterDeficit}:__ctx.waterBalancePreview();
 const waterPct=wb.humanNeed>0?Math.round(__ctx.clamp((wb.supply/wb.humanNeed)*100,0,100)):100,farmPct=(__ctx.viewState.lastFoodPotential||0)>0?Math.round(__ctx.clamp((__ctx.viewState.lastFoodProduced||0)/__ctx.viewState.lastFoodPotential*100,0,100)):100;
 return `<p class="muted">Производство состоит из базовых мастерских поселения и промышленных цепочек. Знания и промышленные технологии сейчас уменьшают расход сырья в цепочках на <b>${Math.round(__ctx.industrialInputDiscount()*100)}%</b>. Производство еды теперь физически ограничено водой: население получает воду первым, а фермы используют только остаток.</p><div class="event"><h4>💧 Вода → население → еда</h4><div class="productionGrid"><div class="productionTile"><small>Подача воды</small><b>${__ctx.fmtResource(wb.supply)}</b><small>мощность водного контура с учётом энергии</small></div><div class="productionTile"><small>Население</small><b>${__ctx.fmtResource(wb.humanNeed)}</b><small>приоритетное месячное потребление · обеспечение ${waterPct}%</small></div><div class="productionTile"><small>Остаток фермам</small><b>${__ctx.fmtResource(wb.forFood)}</b><small>фактически использовано ${__ctx.fmtResource(wb.farmUse)}</small></div><div class="productionTile"><small>Фермы</small><b>${farmPct}%</b><small>реализовано от потенциальной производительности</small></div></div></div><div class="productionGrid">${tiles}</div><h3>Промышленные цепочки</h3><div class="cards">${chains}</div><div class="section"><h3>Последние 12 месяцев</h3><div class="prodTableWrap"><table class="prodTable"><thead><tr><th>Месяц</th>${keys.map(k=>`<th>${__ctx.labelRes(k)}</th>`).join('')}<th>Люди</th><th>Опасность</th></tr></thead><tbody>${rows||`<tr><td colspan="${keys.length+3}" class="muted">Статистика появится после первого прожитого месяца.</td></tr>`}</tbody></table></div></div>`;
};

__ctx.showTab = function showTab(tab){
 __ctx.commands.setTab(tab);['Build','City','Population','Technology','Operations','Production','Forecast'].forEach(x=>{const b=__ctx.browser.document.getElementById('tab'+x);if(b)b.classList.toggle('active',x.toLowerCase()===tab)});const el=__ctx.browser.document.getElementById('tabContent');if(!el)return;
 if(tab==='build'){const labor=__ctx.constructionMultiplier(),available=__ctx.entries(__ctx.modules).filter(([,m])=>!m.scenario||m.scenario===__ctx.viewState.scenario),savePct=Math.round(__ctx.knowledgeBuildDiscount()*100),reservePct=Math.round((__ctx.viewState.reserveBuildDiscount||0)*100);el.innerHTML=`<p class="muted">Эффективность строительных бригад сейчас <b>${Math.round(labor*100)}%</b>. Знания снижают стоимость строительства и модернизации всех объектов на <b>${savePct}%</b>${reservePct?`, организационный резерв дополнительно даёт <b>−${reservePct}%</b> на следующую стройку`:''}.${__ctx.viewState.scenario==='epidemic'?' Специальные карантинные объекты отмечены как биозащита.':''}</p><div class="cards">${available.map(([k,m])=>{const lvl=__ctx.viewState.built[k]||0,costObj=__ctx.calculateModuleCost(k,lvl),cost=__ctx.entries(costObj).map(([r,v])=>`${__ctx.labelRes(r)} ${v}`).join(' · ');return `<div class="card ${m.scenario==='epidemic'?'epidemicOnly':''}"><h4>${m.icon} ${m.name} <span class="tag">ур. ${lvl}</span>${m.scenario==='epidemic'?'<span class="tag">биозащита</span>':''}${Math.round(__ctx.totalBuildDiscount()*100)?`<span class="tag">−${Math.round(__ctx.totalBuildDiscount()*100)}% ресурсов</span>`:''}</h4><p>${m.desc}</p><p class="cost">${cost}</p><button onclick="game.buildModule('${k}')" ${__ctx.viewState.actions<=0?'disabled':''}>${lvl?'Модернизировать':'Строить'}</button></div>`}).join('')}</div>`;}
 if(tab==='city'){const ex=__ctx.expeditionMultiplier();el.innerHTML=`<p class="muted">Пока город доступен, работают обычные вылазки. После падения доступа до 0% остаются только опасные дальние рейды. Радиоцентр открывает отдельную сеть обмена с другими автономными поселениями.</p><div class="cards">${__ctx.entries(__ctx.scavenges).map(([k,sc])=>`<div class="card"><h4>${sc.name}</h4><p>${sc.desc||`Базовый риск: ${sc.risk}% · доступ к городу ${Math.round(__ctx.viewState.cityAccess)}%`}</p><p class="footerHint">Риск: ${sc.risk}% · доступ к городу ${Math.round(__ctx.viewState.cityAccess)}% · масштаб ${Math.round(ex*100)}%</p><button onclick="game.scavenge('${k}')" ${__ctx.viewState.actions<=0||__ctx.viewState.cityAccess<=0?'disabled':''}>Организовать вылазку</button></div>`).join('')}${__ctx.deepRaidCardHTML()}${__ctx.radioTradeCardHTML()}</div>`;}
 if(tab==='population'){const w=__ctx.workforceData(),hm=__ctx.humanitarianMetrics(),ra=__ctx.refugeeAttractionData();el.innerHTML=`<div class="event"><h4>🫂 Гуманитарная миссия · рейтинг ${hm.grade}</h4><p><b>Главная цель кампании:</b> сохранить как можно больше человеческих жизней. Сейчас в поселении ${Math.round(hm.survivors)} человек; с поверхности спасено ${Math.round(hm.rescued)}, потеряно ${Math.round(hm.deaths)}. Из ${Math.round(hm.arrivals)} беженцев, дошедших до периметра, принято ${Math.round(hm.accepted)}, отказано ${Math.round(hm.refused)}.</p><p><b>Приток беженцев:</b> ${Math.round(ra.chance*100)}% в месяц при текущей репутации ${Math.round(ra.reputation)}/100. Высокая устойчивость делает поселение магнитом для выживших, но каждая новая группа создаёт риск: ${__ctx.refugeeRiskText()}.</p></div><div class="event"><h4>${__ctx.currentStage().icon} ${__ctx.currentStage().name}</h4><p>${__ctx.currentStage().desc}</p><p><b>Рабочая сила:</b> ${Math.round(w.effective)} из ${Math.round(w.baseWorkers)} потенциально трудоспособных · специалистов ${__ctx.viewState.specialists} · иждивенцев ${w.dependents}.</p><p><b>Следующая трансформация:</b></p>${__ctx.nextStageRequirementsHTML()}</div><h3>Трудовая политика</h3><div class="cards">${__ctx.entries(__ctx.laborPolicies).map(([k,pol])=>`<div class="card"><h4>${pol.icon} ${pol.name}</h4><p>${pol.desc}</p><button onclick="game.setLaborPolicy('${k}')" ${__ctx.viewState.laborPolicy===k?'disabled':''}>${__ctx.viewState.laborPolicy===k?'Активно':'Выбрать'}</button></div>`).join('')}</div>`;}
 if(tab==='technology')el.innerHTML=__ctx.renderTechnologyTab();
 if(tab==='operations')el.innerHTML=__ctx.renderOperationsTab();
 if(tab==='production')el.innerHTML=__ctx.renderProductionTab();
 if(tab==='forecast'){let f='';if(__ctx.viewState.scenario==='ice')f='Сначала падает урожайность и растёт стоимость отопления. Даже при холоде фермы зависят от остатка воды после потребления населением; устойчивы только комплексы, одновременно развивающие энергетику, водоснабжение и пищевой цикл.';if(__ctx.viewState.scenario==='heat')f='Главный предел — вода и отвод тепла. Население имеет абсолютный приоритет на водоснабжение, поэтому рост численности напрямую сокращает воду, доступную фермам. Без расширения водного контура продовольственная система упрётся в жёсткий физический предел.';if(__ctx.viewState.scenario==='nuclear')f='Первые месяцы опаснее всего из-за осадков и разрушения инфраструктуры. Важны глубина, фильтрация и вода: население расходует очищенную воду первым, и только остаток может поддерживать закрытые фермы.';if(__ctx.viewState.scenario==='epidemic')f='Численность одновременно сила и эпидемиологический риск. Большое население резко повышает потребление безопасной воды и уменьшает остаток для ферм. Карантин, медицина, санитарные системы и развитый водный контур должны расти вместе.';el.innerHTML=`<div class="event"><h4>Долгосрочный прогноз</h4><p>${f}</p><p><b>Конечное состояние:</b> ${__ctx.scenarios[__ctx.viewState.scenario].final}</p><p><b>Социальная цель:</b> спасти максимум людей и минимизировать потери. Высокая устойчивость увеличивает приток беженцев, поэтому инфраструктура, медицина и жильё должны опережать гуманитарную нагрузку.</p><p><b>Атмосфера режима:</b> ${__ctx.scenarioVisuals[__ctx.viewState.scenario].audio}.</p></div>`;}
};

__ctx.renderLog = function renderLog(){__ctx.browser.document.getElementById('log').innerHTML=__ctx.viewState.log.map(x=>`<p class="${x.cls}"><span class="time">М${x.m}.</span> ${x.t}</p>`).join('')};

__ctx.moduleCardsHTML = function moduleCardsHTML(){return __ctx.entries(__ctx.modules).filter(([k,m])=>(!m.scenario||m.scenario===__ctx.viewState.scenario)&&(__ctx.buildFilter==='all'||__ctx.moduleGroups[__ctx.buildFilter]?.includes(k))&&(!__ctx.buildQuery||m.name.toLowerCase().includes(__ctx.buildQuery.toLowerCase()))).map(([k,m])=>{const lvl=__ctx.viewState.built[k]||0,cost=__ctx.calculateModuleCost(k,lvl),need=k==='printer'?__ctx.printerRequirement(lvl):'',ok=__ctx.canPay(cost)&&!need,disabled=__ctx.viewState.actions<=0||!ok||__ctx.viewState.event||__ctx.viewState.ended,eff=__ctx.entries(m.effect).map(([r,v])=>`${({foodSystem:'фермы',capacity:'места',shield:'защита',intel:'разведка',biosecurity:'биозащита',morale:'мораль',knowledge:'знания',workshop:'ремонт'})[r]||__ctx.labelB(r)} ${v>=0?'+':''}${Math.ceil(v*Math.max(.20,1-lvl*.08)*__ctx.constructionMultiplier())}`).join(' · ');return `<article class="card buildCard ${ok?'buildReady':'buildMissing'}"><div class="buildCardHead"><div class="moduleIcon">${m.icon}</div><div><h4>${m.name}</h4><span class="moduleLevel">${lvl?'Уровень '+lvl:'Не построено'}${k==='printer'?' / 5':''}</span></div><span class="availability ${ok?'good':'warn'}">${ok?'ГОТОВО':'НУЖНО'}</span></div><p>${m.desc}</p><div class="effectLine">${eff}</div>${__ctx.costHTML(cost)}${need?`<div class="requirementLine">${need}</div>`:''}<button ${ok?'class="readyBuild"':''} onclick="game.buildModule('${k}')" ${disabled?'disabled':''}>${need?lvl>=5?'Предельный уровень':'Нужна техническая база':!__ctx.canPay(cost)?'Не хватает ресурсов':__ctx.viewState.ended?'Кампания завершена':__ctx.viewState.event?'Сначала решите событие':__ctx.viewState.actions<=0?'Нет действий':lvl?'Улучшить до ур. '+(lvl+1)+' · 1 действие':'Построить · 1 действие'}</button>${k==='printer'&&lvl?'<button class="textBtn" onclick="game.showTab(\'printer\')">Открыть производство и оснащение →</button>':''}</article>`;}).join('')||'<p class="muted">Ничего не найдено.</p>';};

__ctx.setBuildFilter = function setBuildFilter(value){__ctx.buildFilter=value;__ctx.browser.document.getElementById('buildCards').innerHTML=__ctx.moduleCardsHTML();__ctx.browser.document.querySelectorAll('.buildFilters button').forEach(b=>b.classList.toggle('active',b.dataset.filter===value));};

__ctx.setBuildQuery = function setBuildQuery(value){__ctx.buildQuery=value;__ctx.browser.document.getElementById('buildCards').innerHTML=__ctx.moduleCardsHTML();};

__ctx.renderBuildTab = function renderBuildTab(){return `<div class="tabHeading"><div><span class="eyebrow">Инфраструктура / развитие</span><h2>Построить завтрашний день</h2><p>Эффективность бригад ${Math.round(__ctx.constructionMultiplier()*100)}% · экономия ресурсов ${Math.round(__ctx.totalBuildDiscount()*100)}%</p></div><span class="actionBadge">${__ctx.viewState.actions} ${__ctx.pluralRu(__ctx.viewState.actions,'действие','действия','действий')}</span></div><div class="buildToolbar"><div class="buildFilters">${[['all','Все'],['life','Жизнь'],['industry','Производство'],['defense','Защита'],['knowledge','Знания']].map(([k,v])=>`<button data-filter="${k}" class="${__ctx.buildFilter===k?'active':''}" onclick="game.setBuildFilter('${k}')">${v}</button>`).join('')}</div><input type="search" id="buildSearch" placeholder="Найти объект…" aria-label="Поиск объекта" value="${__ctx.escapeHTML(__ctx.buildQuery)}" oninput="game.setBuildQuery(this.value)"></div><div class="cards" id="buildCards">${__ctx.moduleCardsHTML()}</div>`;};

__ctx.renderPrinterTab = function renderPrinterTab(){
 const lvl=__ctx.viewState.built.printer||0,preview=__ctx.printerCycle(true),last=__ctx.viewState.lastPrinter,cfg=__ctx.printerLevels[Math.max(0,lvl-1)],next=lvl<5?__ctx.printerLevels[lvl]:null,need=__ctx.printerRequirement(lvl),req=next?.need||{};
 return `<div class="tabHeading"><div><span class="eyebrow">Аддитивное производство / оснащение</span><h2>Воспроизводить необходимое</h2><p>${lvl?'Уровень '+lvl+' · '+cfg.name:'Запчастей без производства не будет'}</p></div><span class="liveTag">${preview.status}</span></div><div class="printerOverview"><div class="printerDiagram ${lvl&&preview.scale>0?'working':'idle'} ${!lvl?'blueprint':''}"><div class="printerMachine"><div class="printerRail"></div><div class="printerNozzle"></div><div class="printedObject"></div><div class="printerBase"></div></div><div class="printerLevels">${__ctx.printerLevels.map((l,i)=>`<span class="${i<lvl?'on':''}" title="${l.name}">${i+1}</span>`).join('')}</div><h3>${lvl?cfg.name:'Сначала постройте 3D-принтер'}</h3><p>${lvl?cfg.desc:__ctx.modules.printer.desc}</p><button onclick="game.showTab('build')">${lvl?'Строительство и модернизация':'Перейти к строительству'}</button></div><div class="printerControls"><span class="eyebrow">Следующий месячный цикл · оценка</span><div class="miniMetrics"><div><b>+${__ctx.fmtResource(preview.produced.parts||0)}</b><small>запчастей / мес.</small></div><div><b>+${__ctx.fmtResource(preview.produced.precisionParts||0)}</b><small>точных деталей / мес.</small></div><div><b>${Math.round(preview.scale*100)}%</b><small>загрузка линии</small></div></div><p class="footerHint">Расчёт по текущему сырью и мощности. Фактический выпуск зависит от остатков после жизнеобеспечения и промышленных цепочек.</p><div class="segmented">${[['balanced','Обычный'],['precision','Точный'],['off','Стоп']].map(([k,v])=>`<button class="${__ctx.viewState.printerMode===k?'active':''}" onclick="game.setPrinterMode('${k}')" ${!lvl||(k==='precision'&&lvl<2)?'disabled':''}>${v}</button>`).join('')}</div><p class="footerHint">Сырьё / мес.: ${__ctx.entries(preview.consumed).map(([r,v])=>`${__ctx.labelRes(r)} ${__ctx.fmtResource(v)}`).join(' · ')||'линия не работает'}. Резервируются 2 топлива, 1 электроника и 1 сталь.</p><div class="partsStock"><span>Запчасти <b>${__ctx.fmtResource(__ctx.viewState.resources.parts)}</b></span><span>Точные детали <b>${__ctx.fmtResource(__ctx.viewState.resources.precisionParts)}</b></span></div>${next?`<h4>Следующий уровень: ${next.name}</h4><div class="reqList">${__ctx.entries(req).map(([k,v])=>`<div class="req ${(__ctx.viewState.bunker[k]||0)>=v?'ok':'no'}"><span>${__ctx.labelB(k)}</span><b>${Math.round(__ctx.viewState.bunker[k]||0)}/${v}</b></div>`).join('')||'<p class="muted">Доступен без дополнительных требований.</p>'}</div>`:'<p class="good">Достигнут предел аддитивного производства.</p>'}</div></div><div class="sectionHeading"><h3>Оснащение внешних групп</h3><span>Используется лучший исправный комплект</span></div><p class="muted">Оснащение уменьшает влияние опасности среды, но не даёт абсолютной гарантии. Каждый выход расходует его ресурс. Разведанный маршрут, подготовка и медицина дополнительно повышают шансы возвращения.</p><div class="cards">${__ctx.entries(__ctx.gearCatalog).map(([id,g])=>{const d=__ctx.viewState.gear[id],made=d!==undefined,active=(d||0)>0,repairCost: any={parts:2,precisionParts:g.level-1};return `<article class="card gearCard"><div class="eyebrow">Принтер ур. ${g.level}</div><h3>${g.name}</h3><p>${g.desc}</p>${made?`<div class="durability"><span>Ресурс ${Math.round(d)}%</span><div class="bar"><i style="width:${d}%"></i></div></div><p class="footerHint">Ремонт: 2 запчасти + ${g.level-1} точных деталей.</p><button onclick="game.repairGear('${id}')" ${d>=100||lvl<2||!__ctx.canPay(repairCost)||__ctx.viewState.actions<=0||__ctx.viewState.event||__ctx.viewState.ended?'disabled':''}>Восстановить · 1 действие</button>`:`${__ctx.costHTML(g.cost)}<button onclick="game.craftGear('${id}')" ${lvl<g.level||__ctx.viewState.bunker.power<8||!__ctx.canPay(g.cost)||__ctx.viewState.actions<=0||__ctx.viewState.event||__ctx.viewState.ended?'disabled':''}>${lvl<g.level?'Требуется принтер ур. '+g.level:__ctx.viewState.bunker.power<8?'Нужно хотя бы 8 энергии':'Изготовить · 1 действие'}</button>`}</article>`;}).join('')}</div><h3>Сложный ремонт систем</h3><p class="muted">Нужен принтер ур. 2. Один ремонт: 2 запчасти, 1 точная деталь, 1 сталь и 1 действие. Восстанавливает ${4+Math.min(5,lvl)} единиц системы.</p><div class="repairButtons">${['power','water','thermal','medical','integrity'].map(k=>`<button onclick="game.repairSystem('${k}')" ${lvl<2||!__ctx.canPay({parts:2,precisionParts:1,steel:1})||__ctx.viewState.actions<=0||__ctx.viewState.event||__ctx.viewState.ended?'disabled':''}>${__ctx.labelB(k)} · ${Math.round(__ctx.viewState.bunker[k])}</button>`).join('')}</div>`;
};

__ctx.environmentMetrics = function environmentMetrics(){const e=__ctx.viewState.environment||__ctx.computeEnvironment(__ctx.viewState);return [{name:'Температура',value:`${e.temperature>0?'+':''}${e.temperature.toFixed(1)}°`,unit:'C',hint:'Нагрузка на климат, топливо и водопотребление',tone:Math.abs(e.temperature-20)>27?'danger':''},{name:'Ветер',value:e.wind,unit:'км/ч',hint:'Влияет на износ наружных систем и безопасность маршрутов',tone:e.wind>55?'danger':''},{name:'Видимость',value:e.visibility.toFixed(1),unit:'км',hint:'Влияет на навигацию, риск и доставку грузов',tone:e.visibility<5?'danger':''},__ctx.viewState.scenario==='nuclear'?{name:'Радиация',value:e.radiation<1?e.radiation.toFixed(2):Math.round(e.radiation),unit:'мкЗв/ч',hint:'Влияет на внешние миссии, защиту и медицинскую нагрузку',tone:e.radiation>10?'danger':''}:__ctx.viewState.scenario==='epidemic'?{name:'Биоопасность',value:e.bio,unit:'/ 100',hint:'Влияет на внешние группы, лекарства и риски при приёме людей',tone:e.bio>50?'danger':''}:{name:'Пыль / аэрозоли',value:e.dust,unit:'/ 100',hint:'Влияет на очистку воды и износ оборудования',tone:e.dust>55?'danger':''}];};

__ctx.renderEnvironmentTab = function renderEnvironmentTab(){const e=__ctx.viewState.environment,im=__ctx.environmentImpact(),gd=__ctx.gearData(),next=__ctx.computeEnvironment({...__ctx.viewState,month:__ctx.viewState.month+1,hazard:__ctx.clamp(__ctx.viewState.hazard+2,0,100)});return `<div class="tabHeading"><div><span class="eyebrow">Мониторинг / причинные связи</span><h2>Мир за периметром</h2><p>Показатели обновляются каждый игровой месяц. Числа — модель сценария.</p></div><button onclick="game.showScenarioIntro('${__ctx.viewState.scenario}',true)">Брифинг режима ↗</button></div><div class="environmentCards">${__ctx.environmentMetrics().map(m=>`<article class="environmentCard ${m.tone}"><span>${m.name}</span><b>${m.value} <small>${m.unit}</small></b><p>${m.hint}.</p><div class="sparkline">${__ctx.environmentHistoryHTML(m)}</div></article>`).join('')}</div><div class="impactGrid"><article class="card"><h3>Жизнеобеспечение</h3><div class="resource"><span>водопотребление</span><b>×${im.waterDemand.toFixed(2)}</b></div><div class="resource"><span>пропускная способность воды</span><b>${Math.round(im.waterSupply*im.powerFactor*100)}%</b></div><div class="resource"><span>топливо сверх базового</span><b>+${__ctx.fmtResource(im.fuelExtra)} / мес.</b></div><div class="resource"><span>добавка к лекарствам</span><b>+${__ctx.fmtResource(im.medicineExtra*Math.max(1,__ctx.viewState.population/24))} / мес.</b></div><p>Температура увеличивает затраты на климат. Пыль, ветер и нагрузка на энергетику снижают подачу воды. Фермы получают только остаток после людей.</p></article><article class="card"><h3>Внешние операции</h3><div class="resource"><span>штраф среды сверх опасности фазы</span><b>−${(im.outdoorPenalty*100).toFixed(1)} п.п.</b></div><div class="resource"><span>доставка грузов</span><b>${Math.round(im.cargo*100)}%</b></div><div class="resource"><span>оснащение</span><b>${gd.id?Math.round(gd.reduction*100)+'% защиты':'нет'}</b></div><div class="resource"><span>возвращение в дальней вылазке</span><b>${(__ctx.expeditionSurvivalChance('raid')*100).toFixed(1)}%</b></div><p>Погода, видимость и сценарные угрозы входят в расчёт каждого участника. Дрон открывает карту без отправки людей.</p></article><article class="card"><h3>Состояние оборудования</h3><div class="resource"><span>добавка к вероятности износа</span><b>+${(im.wear*100).toFixed(1)} п.п.</b></div><div class="resource"><span>автоматическая профилактика</span><b>${__ctx.viewState.maintenancePaid===null?'не требовалась':__ctx.viewState.maintenancePaid?'выполнена':'нет запчастей'}</b></div><p>Наружные системы изнашиваются быстрее при ветре, пыли и экстремальной температуре. 3D-печать снабжает профилактику и сложный ремонт.</p></article><article class="card"><h3>Долгий горизонт</h3><p>${__ctx.scenarios[__ctx.viewState.scenario].final}</p><p>18 месяцев подготовки → обрушение → глубокий кризис → новая среда. Сезоны и погодные фронты накладываются на общий ход катастрофы.</p><p class="footerHint">Показатели не заменяют реальный прогноз или данные дозиметра; это параметры игрового мира.</p></article></div>`;};

__ctx.installLivingWorld = function installLivingWorld(){
 const hero=__ctx.browser.document.querySelector('.sceneHero'),grid=__ctx.browser.document.querySelector('.grid');grid.before(hero);const env=__ctx.browser.document.createElement('div');env.id='environmentBar';env.className='environmentBar';hero.after(env);
 const camera=__ctx.browser.document.querySelector('.map'),details=__ctx.browser.document.createElement('details');details.className='perimeterCamera';details.innerHTML='<summary><span>⌁ Камера периметра</span><small>состояние внешней среды и развитие поселения</small></summary>';camera.before(details);details.append(camera);details.addEventListener('toggle',()=>dispatchEvent(new Event('resize')));__ctx.browser.document.getElementById('centerContent').after(details);
 __ctx.browser.document.querySelector('.brand small').textContent='ЖИВОЙ МИР / ОБНОВЛЕНИЕ 16';__ctx.browser.document.querySelector('.brandmark').textContent='П';
 const audio=__ctx.browser.document.querySelector('.audioDock');audio.insertAdjacentHTML('beforeend','<button id="audioSettingsBtn" class="audioSettings" type="button" aria-label="Настройки звука">⚙</button>');__ctx.browser.document.getElementById('audioSettingsBtn').onclick=()=>__ctx.browser.window.PredelAudio?.openSettings?.();
 const next=__ctx.browser.document.getElementById('nextBtn');next.insertAdjacentHTML('afterend','<p class="turnHint">Время движется только по вашей команде.</p>');__ctx.browser.document.querySelector('.grid > aside:last-child').classList.add('dispatchPanel');
 __ctx.browser.document.getElementById('volumeSlider').setAttribute('aria-label','Громкость звука');
};

__ctx.exportSave = function exportSave(){if(!__ctx.viewState.site||__ctx.viewState.event||__ctx.viewState.ended)return;const blob: any=new Blob([JSON.stringify(__ctx.saveSnapshot(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=__ctx.browser.document.createElement('a');a.href=url;a.download=`PREDEL_save_M${__ctx.viewState.month}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

__ctx.makePredelLivingAmbience = function makePredelLivingAmbience(scenario){
  const c=__ctx.audioEngine.ctx;let alive=true,timer=null,h=__ctx.viewState.hazard||0,stage=__ctx.viewState.settlementLevel||0;
  const noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),lfo=c.createOscillator(),mod=c.createGain();
  noise.buffer=__ctx.audioEngine.noiseBuffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=360;gain.gain.value=.0001;
  noise.connect(filter);filter.connect(gain);gain.connect(__ctx.audioEngine.master);lfo.frequency.value=.075;mod.gain.value=.006;lfo.connect(mod);mod.connect(gain.gain);noise.start();lfo.start();
  const hum=c.createOscillator(),humG=c.createGain();hum.type='sine';hum.frequency.value=60;humG.gain.value=.003;hum.connect(humG);humG.connect(__ctx.audioEngine.master);hum.start();
  let turns=0;
  function wind(){const e=__ctx.viewState.environment||{},wind=e.wind||5+h*.35;return Math.max(0,Math.min(1,wind/90));}
  function update(hz,s){h=hz||0;stage=s||0;const level=__ctx.PredelAudio.pref.ambience,w=wind();gain.gain.setTargetAtTime((.006+w*.035+h*.00015)*level,c.currentTime,1.4);mod.gain.setTargetAtTime((.002+w*.009)*level,c.currentTime,1.7);filter.frequency.setTargetAtTime(scenario==='ice'?180+w*500:scenario==='heat'?450+w*950:240+w*460,c.currentTime,1.8);humG.gain.setTargetAtTime((.0015+stage*.0011)*level,c.currentTime,1.5);hum.frequency.setTargetAtTime(57+stage*3,c.currentTime,1.5);}
  function bird(){const vol=__ctx.PredelAudio.pref.ambience*.009*(1-h/45),p=Math.random()*1.4-.7,f=1700+Math.random()*1000;__ctx.predelSound.note(f,.15,vol,'sine',0,f*1.25,p);__ctx.predelSound.note(f*1.15,.13,vol*.8,'sine',.17,f*.9,p);if(Math.random()<.4)__ctx.predelSound.note(f*.98,.2,vol*.55,'sine',.33,f*1.1,p);}
  function tick(){
    if(!alive)return;update(__ctx.viewState.hazard||0,__ctx.viewState.settlementLevel||0);turns++;
    if(!__ctx.audioEngine.muted&&!__ctx.browser.document.hidden){
      const v=__ctx.PredelAudio.pref.ambience,p=Math.random()*1.6-.8,weather=__ctx.viewState.environment?.weather?.id||'';
      if(h<35&&Math.random()<.32)bird();
      if(h<45&&turns%6===0)__ctx.predelSound.noise(2,.008*v*(1-h/55),180,.6,'lowpass',0,p);
      if(/rain|storm|blizzard|dust|front/.test(weather)&&Math.random()<.4)__ctx.predelSound.noise(1.2,.012*v,scenario==='heat'?2600:1600,.5,'highpass',0,p);
      if(scenario==='ice'&&h>30&&Math.random()<.2){__ctx.predelSound.noise(.13,.014*v,1300,2.4,'bandpass',0,p);__ctx.predelSound.note(210,.55,.01*v,'triangle',.05,69,p);}
      if(scenario==='heat'&&h>48&&Math.random()<.35){for(let i=0;i<3;i++)__ctx.predelSound.noise(.03,.006*v,1700+Math.random()*3000,1,'highpass',i*.1,p);}
      if(scenario==='nuclear'&&h>28){const count=Math.ceil(h/25);for(let i=0;i<count;i++)if(Math.random()<h/110)__ctx.predelSound.noise(.022,.009*v,2300,1,'highpass',Math.random()*.7,p);if(h>60&&turns%13===0)__ctx.predelSound.noise(2.4,.045*v,90,.6,'lowpass',0,p);}
      if(scenario==='epidemic'&&h>22&&turns%15===0&&h<82){__ctx.predelSound.note(490,1.5,.004*v,'sine',0,660,p);__ctx.predelSound.note(660,1.7,.003*v,'sine',1.4,440,p);}
      if(stage>1&&turns%5===0)__ctx.predelSound.noise(.05,.005*v,900+stage*170,2,'bandpass',0,p*.3);
      if(h>55&&/storm|blizzard|front/.test(weather)&&turns%11===0)__ctx.predelSound.noise(1.8,.03*v,120,.8,'lowpass',0,p);
    }
    timer=setTimeout(tick,1800+Math.random()*1300);
  }
  update(h,stage);timer=setTimeout(tick,1500);
  return{update,stop(){alive=false;clearTimeout(timer);for(const o of[noise,lfo,hum])try{o.stop();}catch(_){}for(const n of[noise,filter,gain,lfo,mod,hum,humG])try{n.disconnect();}catch(_){}}};
};

__ctx.medicalTreatmentCardHTML = function medicalTreatmentCardHTML(){
 const p=__ctx.medicalTreatmentPreview(),used=__ctx.viewState.treatmentUsedMonth===__ctx.viewState.month;
 const last=used&&__ctx.viewState.lastTreatment?.month===__ctx.viewState.month?__ctx.viewState.lastTreatment:null;
 return `<article class="card opCard medicalCareCard" id="medicalCareCard"><span class="eyebrow">Медицинская смена · один раз в месяц</span><h4>🩺 Лечение и восстановление</h4><p>Медперсонал проводит лечение, перевязки и реабилитацию. Лекарства и медицинская инфраструктура дают реальное восстановление здоровья.</p><div class="medicalCareResult"><div><span>${last?'До смены':'Здоровье сейчас'}</span><b>${__ctx.medicalHealthText(last?last.before:p.health)}%</b></div><span class="medicalCareArrow">→</span><div><span>После смены</span><b>${__ctx.medicalHealthText(last?last.after:p.after)}%</b></div></div>${last?`<p class="good">Получено +${__ctx.medicalHealthText(last.gain)} п.п. здоровья. Израсходовано медикаментов: ${__ctx.fmtResource(last.cost)}. Текущее здоровье: ${__ctx.medicalHealthText(p.health)}%.</p>`:`<div class="medicalCareMetrics"><span>Медицина <b>${__ctx.medicalHealthText(p.medical)}</b></span><span>Базовый эффект <b>+${__ctx.medicalHealthText(p.base)}</b></span><span>Эффективность лечения <b>${__ctx.medicalHealthText(p.efficiency*100)}%</b></span></div><div class="opEffect">1 действие · ожидаемый прирост <b>+${__ctx.medicalHealthText(p.gain)} п.п. здоровья</b></div>${__ctx.costHTML({medicine:p.cost})}`}<p class="footerHint">Расход зависит от населения и медицинских технологий${p.discount?` (экономия до ${Math.round(p.discount*100)}%)`:''}. Это разовый расход со склада; месячное потребление лекарств сохраняется.</p>${p.reason?`<p class="medicalCareReason ${used?'good':'warn'}">${p.reason}.</p>`:''}<button id="medicalCareBtn" class="${p.available?'primary':''}" onclick="game.operationTreatment()" ${p.available?'':'disabled'}>${used?'Смена проведена в этом месяце':'Медицинская смена · 1 действие'}</button><details class="medicalCareRules"><summary>От чего зависит восстановление</summary><p>При медицине ниже 15 базовый эффект — до +2; от 15 до 30 — +3–4; от 30 до 50 — +4–6; от 50 — +6–7. Это прирост до поправки на текущее здоровье.</p><p>При здоровье до 30% действует полный эффект; при 60% — 70%; при 80% — 25%; при 90% — 5%. Выше 90% обычное лечение даёт лишь небольшой прирост. Расчёт без случайного разброса.</p><p>Продолжающиеся дефициты, перенаселение и воздействие среды могут снова снизить здоровье в следующем месяце. Медицинская смена не заменяет защиту и жизнеобеспечение.</p></details></article>`;
};

__ctx.physicalPanelHTML = function physicalPanelHTML(){
 const p=__ctx.viewState.physical,e=__ctx.viewState.environment,sv=p.lastServices||__ctx.physicalServices(),ledger=p.lastHealthLedger,d=__ctx.deconStatus(),metric=(title,value)=>`<div class="physicalMetric"><small>${title}</small><b>${value}</b></div>`;
 return `<section class="physicalSummary" id="physicalSummary"><h3>Внутри убежища · влияние на людей</h3><div class="physicalGrid">${metric('Температура жилья',sv.indoor.toFixed(1)+' °C')}${metric('Воздух · оценка CO₂',Math.round(sv.co2)+' ppm')}${metric('Фильтры',Math.round(p.filterCondition)+'%')}${metric('Пациенты / заразные',p.patients.toFixed(1)+' / '+p.infected.toFixed(1))}${metric('Питьевая вода',Math.round((__ctx.waterBalancePreview().humanCoverage||0)*100)+'% потребности')}${metric('Свет снаружи',Math.round(e.sunlight*100)+'% нормы')}${__ctx.falloutActive()?metric('Доза жителей за месяц',p.residentDose.toFixed(3)+' мЗв')+metric('Экранирование помещения','×'+__ctx.shieldFactor().toFixed(1))+metric('Доза постоянного жителя с М'+p.doseHistoryStart,p.residentLifetimeDose.toFixed(3)+' мЗв'):''}</div><p class="physicalHint">Температура, воздух и мощности — расчётная инженерная модель. Доза постоянного жителя и дозы наружных групп учитываются отдельно. Прошлая доза прибывших неизвестна. Общий индекс внешней нагрузки повторно не вычитается из здоровья.</p>${p.lastTrend?`<p><b>Диспетчер:</b> ${__ctx.escapeHTML(p.lastTrend.text)}</p>`:''}${ledger?`<details id="healthLedger"><summary>Почему изменилось здоровье · М${ledger.month}: ${__ctx.medicalHealthText(ledger.before)}% → ${__ctx.medicalHealthText(ledger.after)}%</summary><table class="physicalLedger"><tbody>${__ctx.entries(ledger.causes).filter(([,v])=>Math.abs(v)>.00001).map(([k,v])=>`<tr><td>${__ctx.healthCauseNames[k]||k}</td><td class="${v>=0?'good':'bad'}">${v>=0?'+':''}${v.toFixed(3)} п.п.</td></tr>`).join('')||'<tr><td>Повреждающих воздействий и восстановления не было</td><td>0</td></tr>'}</tbody></table><p class="physicalHint">Изменения после месячного цикла (лечение, вылазки, события): ${(__ctx.viewState.health-ledger.after).toFixed(3)} п.п. Полученная доза не стирается лечением. Долговременный риск отражается историей дозы; автоматического ежемесячного списания за низкий фон нет.</p></details>`:'<p class="physicalHint">Причины изменения здоровья появятся после первого месячного цикла.</p>'}${__ctx.viewState.scenario==='nuclear'?`<div class="deconBlock" id="deconStatus"><div class="physicalStation"><b>☢ Станция дезактивации · ур. ${__ctx.viewState.built.decon||0}</b><span>${__ctx.falloutActive()?d.available?'Работает':d.reason:'Подготовка до выпадений'}</span></div><p>После выпадений все наружные грузы и беженцы проходят санитарный шлюз. Внутреннее производство продолжается без наружного приёма. Пропускная способность: ${__ctx.fmtResource(d.remaining||__ctx.viewState.bunker.deconCapacity||0)} / ${__ctx.fmtResource(__ctx.viewState.bunker.deconCapacity||0)} условных ед. обработки за месяц.</p><p class="physicalHint">На одну операцию расходуется топливо; вода резервируется после питьевых нужд. При отсутствии станции сначала постройте её в «Строительстве». Аварийная переработка использует внутренний резерв.</p><button onclick="game.showTab('build')">Строительство станции ↗</button></div>`:''}${p.lastMissionDose?`<p class="physicalHint">Последняя наружная группа: ${p.lastMissionDose.team} чел., ${p.lastMissionDose.hours.toFixed(1)} ч; внешняя доза одного участника ≈ ${p.lastMissionDose.perPerson.toFixed(3)} мЗв. Данные маршрута могут быть неполными.</p>`:''}</section>`;
};

__ctx.balancePanelHTML = function balancePanelHTML(){
 const sp=__ctx.servicePlan(),c=__ctx.clinicalCare(),q=__ctx.shelterProtection(),a=__ctx.autonomyData(),x=__ctx.viewState.balance,metric=(label,value)=>`<div class="physicalMetric"><small>${label}</small><b>${value}</b></div>`;
 return `<section class="physicalSummary balancePanel" id="balancePanel"><h3>Мощности, смены и устойчивость · V16</h3>${x.legacy?'<p class="warn">Перенесённая партия. Накопленные возможности сохранены; новые партии развиваются по правилам V16.</p>':''}<div class="physicalGrid">${metric('Занято / доступно работников',__ctx.fmtResource(sp.used)+' / '+__ctx.fmtResource(sp.available))}${metric('Потребность / мощность энергии',__ctx.fmtResource(sp.powerDemand)+' / '+__ctx.fmtResource(__ctx.viewState.bunker.power))}${metric('Плановая медицина',__ctx.fmtResource(c.routine)+' / '+Math.round(__ctx.viewState.population)+' жителей')}${metric('Медики / требуется',__ctx.fmtResource(c.medics)+' / '+__ctx.fmtResource(c.medicsNeeded))}${metric('Стационарные места',__ctx.fmtResource(c.beds))}${metric('Сырьё / местный резерв',__ctx.fmtResource(x.feedstock)+' / '+__ctx.fmtResource(x.deposit))}${__ctx.viewState.scenario==='nuclear'?metric('Защищено / жителей',Math.floor(q.covered)+' / '+Math.ceil(__ctx.viewState.population))+metric('Экран защищённых помещений','×'+q.pf.toFixed(1)):''}</div><p>Результат снабжения: <b>${a.title}</b>. Последовательных устойчивых месяцев: ${x.stableMonths} / 6. Достаточность запасов проверяется на 12 месяцев.</p><p>Воспроизводство: <b>${a.renewable?"выпуск покрывает расходы по истории наблюдений":(x.flowHistory||[]).length<6?"нужно не менее шести месяцев наблюдений":"выпуск пока не покрывает все расходы по истории наблюдений"}</b>.</p><label class="balancePriority">Приоритет смен <select onchange="game.setServicePriority(this.value)" ${__ctx.viewState.event||__ctx.viewState.ended?'disabled':''}>${[['balanced','Сбалансированный'],['medicine','Медицинская помощь'],['food','Питание'],['industry','Промышленность']].map(([k,v])=>`<option value="${k}" ${sp.priority===k?'selected':''}>${v}</option>`).join('')}</select></label><details><summary>Установлено / фактически работает</summary><table class="physicalLedger"><tbody>${__ctx.physicalKeys.filter(k=>(__ctx.viewState.physical.design[k]||0)>0).map(k=>`<tr><td>${__ctx.labelB(k)}</td><td>${__ctx.fmtResource(__ctx.viewState.physical.design[k])} / ${__ctx.fmtResource(__ctx.viewState.bunker[k])}</td><td>${Math.round((__ctx.viewState.physical.condition[k]??1)*100)}%</td></tr>`).join('')}</tbody></table><p class="physicalHint">Профилактика и ремонт восстанавливают состояние до установленного предела. Новую мощность даёт модернизация.</p></details><details><summary>Распределение работников</summary><table class="physicalLedger"><tbody>${Object.keys(sp.assigned).map(k=>`<tr><td>${({life:'Жизнеобеспечение',medical:'Медицина',farm:'Фермы',maintenance:'Обслуживание',printer:'3D-печать',salvage:'Сортировка лома',raw:'Сырьевой участок'})[k]||__ctx.industryChains[k]?.name||k}</td><td>${__ctx.fmtResource(sp.assigned[k])} / ${__ctx.fmtResource(sp.requested[k])}</td><td>${Math.round(sp.coverage[k]*100)}%</td></tr>`).join('')}</tbody></table></details><details><summary>Прогноз запасов и воспроизводство</summary><table class="physicalLedger"><thead><tr><th>Ресурс</th><th>Расход / выпуск</th><th>Запас при дефиците</th></tr></thead><tbody>${a.rows.map(r=>`<tr><td>${__ctx.labelRes(r.key)}</td><td>${__ctx.fmtResource(r.demand)} / ${__ctx.fmtResource(r.output)}</td><td class="${r.months<6?'warn':'good'}">${Number.isFinite(r.months)?r.months.toFixed(1)+' мес.':'баланс покрыт'}</td></tr>`).join('')}</tbody></table><p class="physicalHint">Конечная сортировка лома отделена от воспроизводимого выпуска. Прогноз предполагает прежнюю нагрузку и доступность сырья, топлива, работников и оборудования.</p></details>${x.lastRawDose?`<p>Сырьевой участок · М${x.lastRawDose.month}: группа ${__ctx.fmtResource(x.lastRawDose.crew)}, наружная работа ${x.lastRawDose.hours.toFixed(0)} ч на участника, доза ${x.lastRawDose.perPerson.toFixed(3)} мЗв. В первую неделю после выпадений добыча приостановлена.</p>`:""}${x.lastDoseGroups?`<p>Доза последнего расчётного месяца: в защищённой зоне ${x.lastDoseGroups.protectedDose.toFixed(3)} мЗв; вне защищённой зоны ${x.lastDoseGroups.unprotectedDose.toFixed(3)} мЗв на человека. Фактическое размещение учитывается в общем здоровье.</p>`:''}${x.monthlyRaw?.reason?`<p class="warn">Сырьевой участок: ${__ctx.escapeHTML(x.monthlyRaw.reason)}.</p>`:''}${__ctx.viewState.scenario==='nuclear'?`<p>Загрязнённые материалы в изолированном хранении: ${__ctx.fmtResource(x.deconWaste)} усл. ед. Станция очищает поверхности и контролирует грузы; загрязнённое содержимое требует отдельной проверки.</p>`:''}</section>`;
};

__ctx.predelSpeechText = function predelSpeechText(text){
  // Do not touch captions. Already accented words must remain accented once.
  return String(text||'').replace(/[А-Яа-яЁё\u0301]+/g,word=>{
    if(word.includes('\u0301'))return word;
    const hint=__ctx.PREDEL_SPEECH_STRESS[word.toLocaleLowerCase('ru')];
    if(!hint)return word;
    if(word===word.toLocaleUpperCase('ru'))return hint.toLocaleUpperCase('ru');
    return word[0]===word[0].toLocaleUpperCase('ru')?hint[0].toLocaleUpperCase('ru')+hint.slice(1):hint;
  });
};
}
export const steps: Initialization[] = [
{ order:0, run(__ctx:Runtime){'use strict';
} },
{ order:99, run(__ctx:Runtime){;
} },
{ order:257, run(__ctx:Runtime){__ctx.buildFilter = 'all';
} },
{ order:257, run(__ctx:Runtime){__ctx.buildQuery = '';
} },
{ order:271, run(__ctx:Runtime){__ctx.navigation = [['build','Инфраструктура'],['map','Карта'],['city','Экспедиции'],['printer','3D-печать'],['population','Люди'],['technology','Знания'],['operations','Управление'],['production','Экономика'],['forecast','Среда']];
} },
{ order:272, run(__ctx:Runtime){__ctx.originalRenderCenter = __ctx.renderCenter;
} },
{ order:273, run(__ctx:Runtime){__ctx.renderCenter=function(){__ctx.originalRenderCenter();if(!__ctx.viewState.site)return;const tabs=__ctx.browser.document.querySelector('#centerContent .tabs');tabs.innerHTML=__ctx.navigation.map(([k,v])=>`<button id="tab${k[0].toUpperCase()+k.slice(1)}" class="${__ctx.viewState.uiTab===k?'active':''}" onclick="game.showTab('${k}')">${v}</button>`).join('');};
} },
{ order:274, run(__ctx:Runtime){__ctx.originalShowTab = __ctx.showTab;
} },
{ order:275, run(__ctx:Runtime){__ctx.showTab=function(tab){
 if(!__ctx.viewState.site&&['map','printer','forecast'].includes(tab))return;__ctx.commands.setTab(tab);const el=__ctx.browser.document.getElementById('tabContent');if(!el)return;
 if(tab==='build')el.innerHTML=__ctx.renderBuildTab();else if(tab==='map')el.innerHTML=__ctx.renderTerrainTab();else if(tab==='printer')el.innerHTML=__ctx.renderPrinterTab();else if(tab==='forecast')el.innerHTML=__ctx.renderEnvironmentTab();else {__ctx.originalShowTab(tab);if(tab==='city'){el.insertAdjacentHTML('afterbegin',`<div class="tabHeading"><div><span class="eyebrow">Внешние операции / текущая среда</span><h2>Вернуть каждого домой</h2><p>Оснащение: ${__ctx.gearData().name} · погода: ${__ctx.viewState.environment.weather.name}</p></div><button onclick="game.showTab('map')">Открыть карту ↗</button></div>`);el.querySelectorAll('.cards > .card').forEach((card,index)=>{const key=Object.keys(__ctx.scavenges)[index];if(!key)return;if(!__ctx.locationKnown(key)){card.classList.add('undiscovered');card.querySelector('button').disabled=true;card.insertAdjacentHTML('beforeend','<p class="mapLocked">Локация не обследована. Откройте подход с карты.</p>');}else card.insertAdjacentHTML('beforeend',`<p class="mapUnlocked">Маршрут обследован · доставка и навигация улучшены</p>`);const note=card.querySelector('.footerHint');if(note)note.textContent=`Риск инцидента ${__ctx.cityIncidentRisk(key).toFixed(1)}% · доступ ${Math.round(__ctx.viewState.cityAccess)}% · доставка ${Math.round(__ctx.cityDeliveryMultiplier(key)*100)}%`;});}if(tab==='operations'){const card=[...el.querySelectorAll('.opCard')].find(x=>x.querySelector('h4')?.textContent.includes('Техническое обслуживание'));if(card){const complex=__ctx.viewState.month>__ctx.viewState.prepMonths||__ctx.viewState.settlementLevel>=2,cost: any={parts:1,precisionParts:complex?.5:0};card.querySelector('p').textContent='Напечатанные детали восстанавливают две слабые системы и снижают риск аварий следующего месяца.';card.querySelector('.opEffect').textContent=`1 действие · 1 запчасть${complex?' + 0,5 точной детали · принтер ур. 2':' · принтер ур. 1'} · раз в месяц`;card.insertAdjacentHTML('beforeend',__ctx.costHTML(cost));card.querySelector('button').disabled=__ctx.viewState.actions<=0||__ctx.viewState.maintenanceUsedMonth===__ctx.viewState.month||(__ctx.viewState.built.printer||0)<(complex?2:1)||!__ctx.canPay(cost);}}}
 __ctx.browser.document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.id.toLowerCase()==='tab'+tab));
};
} },
{ order:276, run(__ctx:Runtime){__ctx.originalSceneHero = __ctx.updateSceneHero;
} },
{ order:277, run(__ctx:Runtime){__ctx.updateSceneHero=function(){if(!__ctx.viewState.scenario){__ctx.originalSceneHero();return;}__ctx.ensureWorld();const bands=['Последние спокойные дни','Привычный мир даёт трещины','Всё, что казалось вечным','Поверхность становится чужой','За пределом обитаемого'];__ctx.browser.document.getElementById('sceneContent').innerHTML=`<div class="sceneTopline"><div><div class="eyebrow">${__ctx.scenarios[__ctx.viewState.scenario].name} / ${__ctx.viewState.city||'Неизвестный район'}</div><div class="sceneTitle">${bands[__ctx.viewState.environment.band]}</div><div class="sceneMood">${__ctx.viewState.month<=__ctx.viewState.prepMonths?'У вас ещё есть время, чтобы спасти людей.':'Сохранить жизнь. Восстановить системы. Найти путь домой.'}</div></div><div class="worldClock"><span>МЕСЯЦ</span><b>${String(__ctx.viewState.month).padStart(2,'0')}</b><small>из 84 · ${__ctx.viewState.phase}</small></div></div><div class="sceneBottom"><span class="worldStatus"><i></i>КАМЕРА ВНЕШНЕГО КОНТУРА · В ПРЯМОМ ЭФИРЕ</span><div class="worldPhaseTrack">${['Мир','Тревога','Обрушение','Кризис','Предел'].map((v,i)=>`<span class="${i<=__ctx.viewState.environment.band?'on':''}">${v}</span>`).join('')}</div></div>`;};
} },
{ order:278, run(__ctx:Runtime){__ctx.originalRender = __ctx.render;
} },
{ order:279, run(__ctx:Runtime){__ctx.render=function(){__ctx.ensureWorld();__ctx.originalRender();__ctx.renderEnvironmentTelemetry();const next=__ctx.browser.document.getElementById('nextBtn');next.innerHTML=__ctx.viewState.event?'Принять решение <span>→</span>':'Следующий месяц <span>→</span>';next.disabled=__ctx.viewState.ended;next.onclick=()=>__ctx.viewState.event?__ctx.browser.document.getElementById('eventBox').scrollIntoView({behavior:'smooth',block:'center'}):__ctx.commands.nextMonth();__ctx.browser.document.body.classList.toggle('hasEvent',!!__ctx.viewState.event);};
} },
{ order:298, run(__ctx:Runtime){__ctx.installLivingWorld();
} },
{ order:302, run(__ctx:Runtime){__ctx.browser.document.querySelector('.saveDock').insertAdjacentHTML('beforeend','<button id="exportSaveBtn" aria-label="Скачать сохранение в JSON" title="Скачать сохранение">↓</button><button id="importSaveBtn" aria-label="Загрузить сохранение из JSON" title="Загрузить файл сохранения">↑</button>');
} },
{ order:303, run(__ctx:Runtime){__ctx.browser.document.getElementById('exportSaveBtn').onclick=__ctx.exportSave;
} },
{ order:304, run(__ctx:Runtime){__ctx.browser.document.getElementById('importSaveBtn').onclick=__ctx.importSave;
} },
{ order:305, run(__ctx:Runtime){__ctx.renderLog=function(){__ctx.browser.document.getElementById('log').innerHTML=__ctx.viewState.log.map(x=>`<p class="${['good','warn','bad'].includes(x.cls)?x.cls:''}"><span class="time">М${Number(x.m)||0}.</span> ${__ctx.escapeHTML(x.t)}</p>`).join('');};
} },
{ order:310, run(__ctx:Runtime){addEventListener('keydown',event=>{if(event.key==='Escape'){const overlay=__ctx.browser.document.getElementById('scenarioIntro');if(overlay&&overlay.style.display!=='none')__ctx.closeScenarioIntro();}});
} },
{ order:312, run(__ctx:Runtime){__ctx.originalAnnounceEvent = __ctx.announceEvent;
} },
{ order:338, run(__ctx:Runtime){__ctx.updateDynamicAtmosphere=function(){
 __ctx.artOriginalAtmosphere();const p=__ctx.clamp(__ctx.artHazard()/100,0,1);__ctx.browser.document.documentElement.style.setProperty('--fx-opacity',(p<.16?0:__ctx.artEase(.16,1,p)*.29).toFixed(3));
 __ctx.browser.document.documentElement.style.setProperty('--world-progress',String(p));__ctx.browser.document.body.dataset.worldStage=String(Math.min(4,Math.floor(p*5)));
};
} },
{ order:342, run(__ctx:Runtime){__ctx.browser.window.PredelAudio=__ctx.PredelAudio;
} },
{ order:348, run(__ctx:Runtime){__ctx.predelOriginalSetMaster = __ctx.setMasterVolume;
} },
{ order:349, run(__ctx:Runtime){__ctx.setMasterVolume = function(){__ctx.predelOriginalSetMaster();__ctx.PredelAudio.setVolume(__ctx.audioEngine.volume);if(__ctx.audioEngine.muted)__ctx.PredelAudio.stop();};
} },
{ order:376, run(__ctx:Runtime){__ctx.stabilityRenderEvent = __ctx.renderEvent;
} },
{ order:393, run(__ctx:Runtime){__ctx.stabilityProductionTab = __ctx.renderProductionTab;
} },
{ order:394, run(__ctx:Runtime){__ctx.renderProductionTab=function(){
 const html=__ctx.stabilityProductionTab(),missed=__ctx.entries(__ctx.viewState.lastUnmetConsumption||{}).filter(([,v])=>v>__ctx.RESOURCE_EPSILON);
 return html+(missed.length?`<div class="event"><h4>Непокрытая потребность</h4><p>Расход в таблице — фактически использованные ресурсы. Не обеспечено: ${missed.map(([r,v])=>`${r==='water'?'вода':__ctx.labelRes(r)} ${__ctx.fmtResource(v)}`).join(' · ')}.</p></div>`:'');
};
} },
{ order:396, run(__ctx:Runtime){__ctx.exportSave=function(){if(!__ctx.viewState.site)return;const blob: any=new Blob([JSON.stringify(__ctx.saveSnapshot(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=__ctx.browser.document.createElement('a');a.href=url;a.download=`PREDEL_save_M${__ctx.viewState.month}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
} },
{ order:397, run(__ctx:Runtime){__ctx.browser.document.getElementById('exportSaveBtn').onclick=__ctx.exportSave;
} },
{ order:399, run(__ctx:Runtime){for(const n of __ctx.mapLocations)n.familiar=__ctx.familiarMapSites.has(n.id);
} },
{ order:419, run(__ctx:Runtime){__ctx.localShowTab = __ctx.showTab;
} },
{ order:420, run(__ctx:Runtime){__ctx.showTab=function(tab){
 if(tab!=='city')return __ctx.localShowTab(tab);
 __ctx.commands.setTab(tab);const el=__ctx.browser.document.getElementById('tabContent');if(!el||!__ctx.viewState.site)return;
 __ctx.ensureWorld();__ctx.originalShowTab(tab);
 el.insertAdjacentHTML('afterbegin',`<div class="tabHeading"><div><span class="eyebrow">Внешние операции / ${__ctx.viewState.environment.weather.name}</span><h2>Вывозить ресурсы, спасать людей</h2><p>Обычные городские адреса известны с начала игры. Разведка проверяет пути и ищет временные точки.</p></div><button onclick="game.showTab('map')">Карта района ↗</button></div>`);
 el.querySelectorAll('.cards > .card').forEach((card,index)=>{
  const key=Object.keys(__ctx.scavenges)[index];if(!key)return;
  const n=__ctx.locationFor(key),known=__ctx.locationKnown(key),button=card.querySelector('button');
  if(!known){card.classList.add('undiscovered');card.querySelector('h4').textContent='Эвакуационные сигналы';card.querySelector('p').textContent='Место сбора людей меняется. Разведгруппа должна найти действующий пункт эвакуации.';button.disabled=true;card.insertAdjacentHTML('beforeend','<p class="mapLocked">Временный пункт ещё не найден. Его ищет разведка.</p>');}
  else card.insertAdjacentHTML('beforeend',`<p class="${__ctx.routeCheckCurrent(n.y*9+n.x)?'mapUnlocked':'warn'}">${__ctx.routeDescription(n.y*9+n.x)}</p><button class="textBtn" onclick="game.selectSector(${n.y*9+n.x})">${__ctx.sectorCode(n.y*9+n.x)} · показать на карте →</button>`);
  const note=card.querySelector('.footerHint');if(note)note.textContent=`Риск инцидента ${__ctx.cityIncidentRisk(key).toFixed(1)}% · доступ ${Math.round(__ctx.viewState.cityAccess)}% · доставка ${Math.round(__ctx.cityDeliveryMultiplier(key)*100)}%`;
 });
 __ctx.browser.document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.id.toLowerCase()==='tab'+tab));
};
} },
{ order:431, run(__ctx:Runtime){__ctx.medicalOperationsTab = __ctx.renderOperationsTab;
} },
{ order:432, run(__ctx:Runtime){__ctx.renderOperationsTab=function(){return __ctx.medicalOperationsTab().replace('Оперативные меры тратят действия на организацию труда, ремонт, обучение и перераспределение мощностей. Они не создают большие объёмы ресурсов из воздуха: основной эффект проявляется через эффективность следующего месяца.', 'Оперативные меры направляют персонал на лечение, ремонт, обучение и организацию производства. Медицинская смена восстанавливает здоровье сразу; подготовленные производственные меры действуют в следующем месяце.').replace('<div class="opsCards">','<div class="opsCards">'+__ctx.medicalTreatmentCardHTML());};
} },
{ order:515, run(__ctx:Runtime){__ctx.environmentMetrics=function(){const e=__ctx.viewState.environment||__ctx.computeEnvironment(__ctx.viewState);return [
 {name:'Температура',value:e.temperature.toFixed(1),unit:'°C',hint:'Средняя температура расчётного месяца; экстремумы учитываются отдельно'},
 {name:'Ветер',value:e.wind,unit:'км/ч',hint:'Транспорт, наружные работы и износ'},
 {name:'Видимость',value:e.visibility.toFixed(1),unit:'км',hint:'Навигация и доставка'},
 __ctx.viewState.scenario==='nuclear'?{name:'Радиация',value:e.radiation<1?e.radiation.toFixed(3):e.radiation.toFixed(1),unit:'мкЗв/ч',hint:'У убежища на конец месяца; доза вычисляется по изменению фона внутри месяца',tone:e.radiation>10?'danger':''}:__ctx.viewState.scenario==='epidemic'?{name:'Заболеваемость',value:Math.round(e.prevalence*1000),unit:'на 1000',hint:'Оценка по региональным сведениям; не универсальное показание биодатчика'}:{name:'Пыль / аэрозоли',value:e.dust,unit:'индекс',hint:'Оценочная нагрузка на воздух и оборудование'}];};
} },
{ order:516, run(__ctx:Runtime){__ctx.physicalRenderEvent = __ctx.renderEvent;
} },
{ order:519, run(__ctx:Runtime){__ctx.physicalOperations = __ctx.renderOperationsTab;
} },
{ order:520, run(__ctx:Runtime){__ctx.renderOperationsTab=function(){__ctx.ensureWorld();const p=__ctx.viewState.physical,q=p.pendingRefugees;return __ctx.physicalOperations()+__ctx.physicalPanelHTML()+`<div class="opsCards"><article class="card opCard"><h4>Инженерная расчистка маршрута</h4><p>Восстановление проходимости: +8 к доступу. Нужно 2 запчасти, 1 точная деталь, 1 топливо и принтер ур. 2.</p><button onclick="game.repairRoute()" ${__ctx.viewState.actions<=0||__ctx.viewState.built.printer<2||!__ctx.canPay({parts:2,precisionParts:1,fuel:1})?'disabled':''}>Расчистить · 1 действие</button></article><article class="card opCard"><h4>Резервная герметизация</h4><p>Защита от поступления частиц на 24 часа. Резерв ограничен кислородом, CO₂ и расходниками. Гамма-экранирование не меняется.</p><button onclick="game.sealShelter()" ${__ctx.viewState.actions<=0||p.sealUsedMonth===__ctx.viewState.month?'disabled':''}>Включить резерв · 1 действие</button></article>${q?`<article class="card opCard"><h4>Люди в наружном пункте: ${q.group}</h4><p>Ожидают с М${q.since}. Приём через станцию дезактивации; максимум два месяца ожидания.</p><button onclick="game.admitWaitingRefugees()" ${__ctx.viewState.actions<=0||!__ctx.deconStatus(q.group).available?'disabled':''}>Дезактивация и карантин · 1 действие</button></article>`:''}</div>`;};
} },
{ order:521, run(__ctx:Runtime){__ctx.renderEnvironmentTab=function(){
 const e=__ctx.viewState.environment;return `<div class="tabHeading"><div><span class="eyebrow">Среда / услуги / здоровье</span><h2>Причины и последствия</h2><p>84 месяца кампании: 18 подготовки и 66 после катастрофы. Пики, спады и местные риски рассчитываются отдельно.</p></div></div><div class="environmentCards">${__ctx.environmentMetrics().map(m=>`<article class="environmentCard"><span>${m.name}</span><b>${m.value} <small>${m.unit}</small></b><p>${m.hint}</p></article>`).join('')}</div><div class="physicalGrid"><div class="card">Дневной максимум <b>${e.dayMax.toFixed(1)} °C</b><p>Влажность ${e.humidity}%. Сезоны сохраняются.</p></div><div class="card">Доступность источников воды <b>${Math.round(e.waterAvailability*100)}%</b><p>Зависит от засухи, сезона и состояния территории.</p></div><div class="card">Свет <b>${Math.round(e.sunlight*100)}%</b><p>Солнечная составляющая энергии и растительная часть закрытых ферм. Грибные и белковые линии сохраняют часть выпуска.</p></div></div>${__ctx.physicalPanelHTML()}<div class="physicalSummary"><h3>Логика текущего сценария</h3><p>${__ctx.viewState.scenario==='nuclear'?'Ранние выпадения быстро спадают. Поздние трудности связаны с разрушением снабжения, светом, холодными сезонами и износом. Карта содержит неоднородное загрязнение. Масштаб климатического эффекта — выбранное допущение тяжёлого регионального сценария.':__ctx.viewState.scenario==='ice'?'Выбран сценарий тяжёлой вулканической зимы и регионального нарушения снабжения. Первые зимы тяжелее; аэрозольное воздействие постепенно ослабевает. Быстрое планетарное оледенение не моделируется.':__ctx.viewState.scenario==='heat'?'Региональная засуха и волны жары: сезоны, влажность, ночное восстановление и водные источники. Температура не растёт бесконечно из-за номера хода.':'Вымышленная респираторная инфекция. Региональные волны, заносы, восприимчивость и вентиляция определяют передачу; туман сам по себе не заражает людей.'}</p><p class="physicalHint">Сценарная модель игры, а не реальный прогноз или медицинский расчёт. При достаточных условиях внутри поздний месяц сам по себе не отнимает здоровье.</p></div>`;
};
} },
{ order:522, run(__ctx:Runtime){__ctx.physicalTerrain = __ctx.renderTerrainTab;
} },
{ order:524, run(__ctx:Runtime){__ctx.physicalShow = __ctx.showTab;
} },
{ order:525, run(__ctx:Runtime){__ctx.showTab=function(tab){__ctx.physicalShow(tab);if(!__ctx.viewState.site)return;const el=__ctx.browser.document.getElementById('tabContent');if(tab==='city'&&__ctx.falloutActive()){
 const d=__ctx.deconStatus();el.insertAdjacentHTML('afterbegin',`<div class="deconBlock">☢ ${d.available?'Санитарный шлюз работает':d.reason}. Все наружные грузы требуют дезактивации.</div>`);
 for(const button of el.querySelectorAll('button[onclick]')){const action=button.getAttribute('onclick');if(!d.available&&/game\.(scavenge|deepCityRaid|tradeExpedition)/.test(action)){button.disabled=true;button.title=d.reason;}}
 }if(tab==='map'&&__ctx.falloutActive())for(const button of el.querySelectorAll('button[onclick]'))if(!__ctx.deconStatus(3).available&&/game\.(sectorMission|recoverMapSite|surveySector\(false)/.test(button.getAttribute('onclick')))button.disabled=true;
 if(tab==='city')for(const card of el.querySelectorAll('.cards > .card')){const a=card.querySelector('button[onclick]')?.getAttribute('onclick'),id=a?.match(/scavenge\('([^']+)'\)/)?.[1],stock=id&&__ctx.viewState.physical.cityStocks[id];if(stock)card.insertAdjacentHTML('beforeend',`<p class="physicalHint">Остаток учтённого запаса: ${__ctx.entries(stock).map(([r,q])=>__ctx.labelRes(r)+' '+__ctx.fmtResource(q)).join(' · ')}. Запас конечный.</p>`);}
};
} },
{ order:526, run(__ctx:Runtime){__ctx.physicalLeft = __ctx.renderLeft;
} },
{ order:530, run(__ctx:Runtime){__ctx.browser.window.PredelAudio.say=function(key,text='',priority='normal'){if(key==='month_danger'||key==='phase_new'||key==='phase_crisis')key=__ctx.viewState.physical?.lastTrend?.key||'threat_persistent';if(key==='month_stable'&&(__ctx.viewState.health<45||__ctx.viewState.physical?.lastFoodCoverage<.98||__ctx.viewState.lastWaterDeficit>.1))key='threat_persistent';return __ctx.physicalAudioSay(key,text,priority);};
} },
{ order:542, run(__ctx:Runtime){__ctx.physicalKeys.push('protectedCapacity','receptionCapacity');
} },
{ order:616, run(__ctx:Runtime){__ctx.balancedBuildTab = __ctx.renderBuildTab;
} },
{ order:617, run(__ctx:Runtime){__ctx.renderBuildTab=function(){return __ctx.balancedBuildTab().replace(/<p>Эффективность бригад.*?<\/p>/,'<p>Мощность определяется установленным оборудованием. Рабочая сила определяет доступные смены и действия. Экономия материалов защитных сооружений — до 12%.</p>')+__ctx.balancePanelHTML();};
} },
{ order:618, run(__ctx:Runtime){__ctx.balancedOperationsTab = __ctx.renderOperationsTab;
} },
{ order:619, run(__ctx:Runtime){__ctx.renderOperationsTab=function(){const q=__ctx.viewState.physical.pendingRefugees;return __ctx.balancedOperationsTab()+__ctx.balancePanelHTML()+(q?`<article class="card"><h4>Экстренная помощь прибывшим</h4><p>Нужен отдельный приёмный отсек на ${q.group} человек. Вход в жилую зону — после дезактивации и карантина.</p><button onclick="game.aidWaitingRefugees()" ${__ctx.viewState.actions<=0||__ctx.viewState.event||__ctx.viewState.ended||__ctx.viewState.bunker.receptionCapacity<q.group||__ctx.viewState.balance.lastWaitingCareMonth===__ctx.viewState.month||!__ctx.canPay({food:1,medicine:1})?'disabled':''}>Первая помощь · 1 действие · еда 1 + медицина 1</button></article>`:'');};
} },
{ order:620, run(__ctx:Runtime){__ctx.balancedMedicalCard = __ctx.medicalTreatmentCardHTML;
} },
{ order:621, run(__ctx:Runtime){__ctx.medicalTreatmentCardHTML=function(){const c=__ctx.clinicalCare();return __ctx.balancedMedicalCard().replace('Медперсонал проводит лечение, перевязки и реабилитацию.',c.full?'Медперсонал проводит лечение, перевязки и реабилитацию в пределах доступной мощности.':'Доступна первая помощь. Для стационара, сложного лечения и широкой медицинской смены нужен медблок.').replace('Это разовый расход со склада;',`Обслуживание ${__ctx.fmtResource(c.routine)} жителей, стационарных мест ${__ctx.fmtResource(c.beds)}. Это разовый расход со склада;`);};
} },
{ order:622, run(__ctx:Runtime){__ctx.balancedEnvironmentTab = __ctx.renderEnvironmentTab;
} },
{ order:623, run(__ctx:Runtime){__ctx.renderEnvironmentTab=function(){return __ctx.balancedEnvironmentTab()+__ctx.balancePanelHTML();};
} },
{ order:624, run(__ctx:Runtime){__ctx.balancedShowTab = __ctx.showTab;
} },
{ order:625, run(__ctx:Runtime){__ctx.showTab=function(tab){__ctx.balancedShowTab(tab);if(['production','population','technology'].includes(tab)&&__ctx.viewState.site)__ctx.browser.document.getElementById('tabContent').insertAdjacentHTML('beforeend',__ctx.balancePanelHTML());};
} },
{ order:631, run(__ctx:Runtime){(function installCommandHeader(){
 const topbar=__ctx.browser.document.querySelector('.topbar'),telemetry=__ctx.browser.document.getElementById('environmentBar');
 const header=__ctx.browser.document.createElement('header');header.id='commandHeader';header.className='commandHeader';header.setAttribute('aria-label','Постоянная панель управления поселением');
 topbar.before(header);header.append(topbar,telemetry);
 const turn=__ctx.browser.document.createElement('div');turn.className='commandTurn';turn.hidden=true;
 turn.innerHTML='<span id="commandActions" class="commandActions" title="Осталось действий в текущем месяце"></span><button id="commandNextBtn" class="primary" type="button">Следующий месяц →</button>';
 topbar.querySelector('.topRight').append(turn);
 __ctx.browser.document.getElementById('commandNextBtn').onclick=()=>__ctx.browser.document.getElementById('nextBtn').click();
 function measure(){__ctx.browser.document.documentElement.style.setProperty('--command-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');}
 function refresh(){
  turn.hidden=!__ctx.viewState.site;
  const button=__ctx.browser.document.getElementById('commandNextBtn'),actions=__ctx.browser.document.getElementById('commandActions');
  button.textContent=__ctx.viewState.event?'Принять решение →':'Следующий месяц →';button.disabled=!__ctx.viewState.site||__ctx.viewState.ended;
  actions.textContent=`${__ctx.viewState.actions||0}/${__ctx.viewState.actionCapacity||0}`;actions.setAttribute('aria-label',`Действий осталось ${__ctx.viewState.actions||0} из ${__ctx.viewState.actionCapacity||0}`);
  header.classList.toggle('commandHasEvent',!!__ctx.viewState.event);
  const details=telemetry.querySelector('.envDetails');if(details)details.onclick=()=>{__ctx.commands.showTab('forecast');__ctx.browser.document.getElementById('tabContent')?.scrollIntoView({behavior:__ctx.browser.window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
  measure();
 }
 const renderTelemetry=__ctx.renderEnvironmentTelemetry;
 __ctx.renderEnvironmentTelemetry=function(){renderTelemetry();refresh();};
 const start=__ctx.initStart;
 __ctx.initStart=function(){start();refresh();};
 __ctx.browser.document.addEventListener('click',event=>{
  if(!event.target.closest?.('.locationCard>.tabs button'))return;
  const content=__ctx.browser.document.getElementById('tabContent');
  if(content&&content.getBoundingClientRect().top<header.getBoundingClientRect().bottom)content.scrollIntoView({behavior:'auto',block:'start'});
 });
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(header);
 addEventListener('resize',measure);refresh();
})();
} },
{ order:633, run(__ctx:Runtime){(()=>{
 const plateCache: any=new Map(),cameraStates: any=new WeakMap();
 const reduceMotion=__ctx.browser.window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pointer: any={x:0,y:0};let gpu=null,gpuTried=false,cardRepaintPending=false,gpuFailure='';
 const smooth=(a,b,v)=>{const x=__ctx.clamp((v-a)/(b-a),0,1);return x*x*(3-2*x);};
 function weights(hazard){const p=__ctx.clamp(hazard/100,0,1),mid=smooth(.10,.55,p),late=smooth(.50,.97,p);return [1-mid,mid*(1-late),mid*late];}
 function repaintCards(){__ctx.browser.document.querySelectorAll('canvas[data-scenario]').forEach(c=>{if(c.width&&c.height)__ctx.drawLivingWorld(c.getContext('2d'),c.width,c.height,c.dataset.scenario,96,18000,true);});}
 function queueCards(){if(cardRepaintPending)return;cardRepaintPending=true;requestAnimationFrame(()=>{cardRepaintPending=false;repaintCards();});}
 function plate(key){
  if(plateCache.has(key))return plateCache.get(key);
  const src=__ctx.CINEMA_ASSETS[key];if(!src)return null;
  const item: any={image:new Image(),ready:false,promise:null};plateCache.set(key,item);
  item.promise=new Promise(resolve=>{item.image.onload=()=>{item.ready=true;resolve(item);queueCards();};item.image.onerror=()=>resolve(item);});
  item.image.src=src;return item;
 }
 function plates(sc){return ['calm',sc+'-mid',sc+'-late'].map(plate);}
 function makeGPU(){
  if(gpuTried)return gpu;gpuTried=true;
  try{
   const canvas=__ctx.browser.document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
   if(!gl||typeof gl.createShader!=='function'){gpuFailure='unavailable';return null;}
   const vertex=`attribute vec2 aPosition;varying vec2 uv;void main(){uv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
   const fragment=`precision mediump float;
varying vec2 uv;uniform sampler2D uA;uniform sampler2D uB;uniform sampler2D uC;
uniform vec3 uWeights;uniform vec2 uSize;uniform vec2 uPointer;uniform float uImageAspect,uTime,uPhase,uScenario,uStorm,uWind,uVisibility;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec2 fit(vec2 q){float a=uSize.x/uSize.y;if(a>uImageAspect){float s=uImageAspect/a;q.y=(q.y-.5)*s+.5-(1.-s)*.25;}else q.x=(q.x-.5)*a/uImageAspect+.5;return q;}
vec3 sampleWorld(vec2 q){return texture2D(uA,q).rgb*uWeights.x+texture2D(uB,q).rgb*uWeights.y+texture2D(uC,q).rgb*uWeights.z;}
void main(){
 vec2 q=fit(uv);float top=1.-q.y;float ground=smoothstep(.35,.98,top);
 vec2 camera=vec2(sin(uTime*.075)*.0016,cos(uTime*.063)*.0009)+uPointer*.002;
 q+=camera*(.30+ground*.75);
 float heat=(1.-step(.5,abs(uScenario-1.)))*uPhase;
 q.x+=sin(q.y*130.+uTime*1.5+sin(q.x*27.))*heat*.0014*smoothstep(.25,.8,top);
 float river=smoothstep(.57,.70,q.x)*smoothstep(.50,.75,top)*(1.-uPhase);
 q.y+=sin(q.x*220.+uTime*1.6)*.0007*river;
 vec3 col=sampleWorld(q);
 vec2 texel=vec2(1./uSize.x,1./uSize.y)*2.4;
 vec3 glow=(sampleWorld(q+texel)+sampleWorld(q-texel)+sampleWorld(q+vec2(texel.x,-texel.y)))/3.;
 col+=max(glow-.65,0.)*.12;
 float fog=noise(vec2(q.x*5.-uTime*(.022+uWind*.0004),q.y*7.+uTime*.012));
 fog=mix(fog,noise(q*13.+vec2(-uTime*.017,uTime*.009)),.32);
 float horizon=exp(-pow((top-.46)*5.5,2.));
 float fogAmount=(.015+uPhase*.065+uStorm*.055+(1.-uVisibility)*.045)*horizon*smoothstep(.25,.9,fog);
 vec3 fogColor=uScenario<.5?vec3(.72,.81,.87):uScenario<1.5?vec3(.63,.47,.32):uScenario<2.5?vec3(.48,.53,.52):vec3(.61,.68,.66);
 col=mix(col,fogColor,fogAmount*2.1);
 float warm=max(0.,col.r-col.g*.75-col.b*.38);
 col+=vec3(1.,.37,.08)*warm*.025*sin(uTime*7.+q.x*90.)*(.25+heat);
 float vignette=1.-.22*pow(length((uv-.5)*vec2(1.1,.95)),1.7);
 col*=vignette;col=(col-.5)*1.025+.5;
 col+=(hash(gl_FragCoord.xy+mod(floor(uTime*18.),71.))-.5)*.006;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
   function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'shader compile');return s;}
   const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
   gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const pos=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   const uniforms: any={};for(const name of ['uA','uB','uC','uWeights','uSize','uPointer','uImageAspect','uTime','uPhase','uScenario','uStorm','uWind','uVisibility'])uniforms[name]=gl.getUniformLocation(program,name);
   const textures: any=new Map();let age=0;
   function texture(image){let entry=textures.get(image);if(entry){entry.age=++age;return entry.texture;}
    const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.set(image,{texture:t,age:++age});
    if(textures.size>6){const oldest=[...textures].sort((a,b)=>a[1].age-b[1].age)[0];gl.deleteTexture(oldest[1].texture);textures.delete(oldest[0]);}return t;
   }
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpu=null;});
   canvas.addEventListener('webglcontextrestored',()=>{gpuTried=false;});
   gpu={canvas,gl,program,uniforms,texture};return gpu;
  }catch(e){gpuFailure=e.message;return null;}
 }
 function cover(c,img,w,h,alpha=1,dx=0,dy=0){
  const scale=Math.max(w/img.width,h/img.height)*1.012,iw=img.width*scale,ih=img.height*scale;
  c.globalAlpha=alpha;c.drawImage(img,(w-iw)*.5+dx,(h-ih)*.63+dy,iw,ih);
 }
 function fallbackMotion(c,w,h,sc,p,time,img){
  if(reduceMotion||!c.getTransform)return;const matrix=c.getTransform();
  if(matrix.b||matrix.c||matrix.e||matrix.f)return;
  const sx=matrix.a,sy=matrix.d,source=c.canvas;
  if(sc==='heat'&&p>.20){c.save();c.beginPath();c.rect(w*.32,h*.25,w*.68,h*.45);c.clip();
   for(let y=h*.25;y<h*.70;y+=7){const offset=Math.sin(y*.12+time*1.7)*p*1.1;c.drawImage(source,w*.31*sx,y*sy,w*.69*sx,7*sy,w*.31+offset,y,w*.69,7);}c.restore();
  }
  const flow=sc==='epidemic'?.8:Math.pow(1-p,2);if(flow<.07)return;
  const scale=Math.max(w/img.width,h/img.height)*1.012,iw=img.width*scale,ih=img.height*scale,ox=(w-iw)*.5,oy=(h-ih)*.63;
  c.save();c.beginPath();[[.83,.57],[1,.56],[1,.64],[.91,.72],[.97,.82],[1,.87],[1,1],[.80,1],[.73,.84],[.70,.75],[.76,.64]].forEach(([x,y],i)=>i?c.lineTo(ox+x*iw,oy+y*ih):c.moveTo(ox+x*iw,oy+y*ih));c.closePath();c.clip();
  for(let y=Math.max(0,oy+ih*.56);y<h;y+=8){const shift=Math.sin(y*.15+time*1.5)*flow*.85;c.drawImage(source,0,y*sy,w*sx,8*sy,shift,y,w,8);}c.restore();
 }
 function drawPlates(c,w,h,sc,hazard,ts){
  const entries=plates(sc),calm=entries[0]?.ready?entries[0].image:null;
  if(!calm){c.fillStyle='#101e24';c.fillRect(0,0,w,h);return false;}
  const images=entries.map(e=>e?.ready?e.image:calm),blend=weights(hazard),p=__ctx.clamp(hazard/100,0,1),time=reduceMotion?18:ts/1000;
  const env=__ctx.viewState.scenario===sc?__ctx.viewState.environment:null,storm=env?.weather?.storm?1:0,wind=Math.max(env?.wind||7,8+p*45),visibility=__ctx.clamp((env?.visibility||20)/20,0,1),g=c.canvas?.hasAttribute?.('data-scenario')?null:makeGPU();
  const mode=g?'webgl':'canvas';if(c.canvas?.dataset&&c.canvas.dataset.worldRenderer!==mode){c.canvas.dataset.worldRenderer=mode;if(gpuFailure)c.canvas.dataset.worldGpuStatus=gpuFailure.slice(0,500);}
  if(g){
   try{
    const {gl,uniforms:u}=g,rw=Math.max(2,Math.min(1920,Math.round(w*Math.min(1.35,__ctx.browser.window.devicePixelRatio||1)))),rh=Math.max(2,Math.round(rw*h/w));
    if(g.canvas.width!==rw||g.canvas.height!==rh){g.canvas.width=rw;g.canvas.height=rh;}gl.viewport(0,0,rw,rh);gl.useProgram(g.program);
    images.forEach((img,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,g.texture(img));gl.uniform1i(u[['uA','uB','uC'][i]],i);});
    gl.uniform3f(u.uWeights,...blend);gl.uniform2f(u.uSize,w,h);gl.uniform2f(u.uPointer,reduceMotion?0:pointer.x,reduceMotion?0:pointer.y);gl.uniform1f(u.uImageAspect,calm.width/calm.height);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uPhase,p);gl.uniform1f(u.uScenario,Math.max(0,['ice','heat','nuclear','epidemic'].indexOf(sc)));gl.uniform1f(u.uStorm,storm);gl.uniform1f(u.uWind,wind);gl.uniform1f(u.uVisibility,visibility);gl.drawArrays(gl.TRIANGLES,0,6);c.drawImage(g.canvas,0,0,w,h);return true;
   }catch(e){gpuFailure=e.message;gpu=null;}
  }
  const move=reduceMotion?0:Math.sin(time*.075)*w*.0015;c.save();cover(c,images[0],w,h,1,move);if(blend[1]>0)cover(c,images[1],w,h,blend[1]/Math.max(.0001,blend[0]+blend[1]),move);if(blend[2]>0)cover(c,images[2],w,h,blend[2],move);c.restore();fallbackMotion(c,w,h,sc,p,time,calm);
  return true;
 }
 function atmosphere(c,w,h,sc,hazard,ts){
  const p=__ctx.clamp(hazard/100,0,1),t=(reduceMotion?18000:ts)/1000,e=__ctx.viewState.scenario===sc?__ctx.viewState.environment:null,storm=e?.weather?.storm?1:0,windFactor=__ctx.clamp((e?.wind||12+p*50)/30,.4,3);
  const snow=sc==='ice'&&p>.12&&(!e||e.temperature<1),ash=sc==='nuclear'&&p>.32&&(!e||e.dust>22),rain=sc==='epidemic'&&storm&&p>.12,dust=sc==='heat'&&p>.20;
  const count=Math.round(snow?18+p*120+storm*45:ash?10+p*65:dust?10+p*45:rain?55+storm*25:5);
  c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
  for(let i=0;i<count;i++){
   const seed=__ctx.artSeed(i*37+31),depth=.25+__ctx.artSeed(i*73+7)*.75,fall=snow?15+depth*42:rain?210+depth*220:ash?8+depth*14:dust?-5-depth*8:1.5;
   const drift=(snow?-24-p*65-storm*40:dust?-25-p*45:ash?-12-p*14:rain?-35:3)*windFactor;
   const x=((seed*w*1.3+t*drift*depth+w*4)%(w*1.3))-w*.15,y=((__ctx.artSeed(i*13+19)*h*1.25+t*fall*depth+h*5)%(h*1.25))-h*.12;
   c.globalAlpha=(snow?.12+depth*.42:rain?.10+depth*.13:ash?.12+depth*.18:dust?.04+depth*.14:.12)*Math.min(1,w/600+.3);
   if(rain){c.strokeStyle='#b4c5c9';c.lineWidth=.5+depth*.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-3*depth,y+16*depth);c.stroke();}
   else{c.fillStyle=snow?'#ecf5f7':dust?'#d8c8a3':ash?'#c5cfca':'#e7dfb7';c.beginPath();c.ellipse(x,y,(snow?.7+depth*1.8:ash?.5+depth*.8:dust?1+depth*2:.6),snow?.5+depth: dust?.6: .65,0,0,6.283);c.fill();}
  }
  c.globalAlpha=1;
  if(p>.25){
   const drift=Math.sin(t*.075)*w*.10,gradient=c.createRadialGradient(w*.65+drift,h*.69,0,w*.65+drift,h*.69,w*.62);
   const color=sc==='heat'?'184,136,83':sc==='ice'?'190,216,229':sc==='nuclear'?'134,150,145':'169,191,184';gradient.addColorStop(0,`rgba(${color},${(.02+p*.07)*(storm?1.5:1)})`);gradient.addColorStop(1,`rgba(${color},0)`);c.fillStyle=gradient;c.fillRect(0,0,w,h);
  }
  c.restore();
 }
 const proceduralWorld=__ctx.drawLivingWorld;
 __ctx.drawLivingWorld=function(c,w,h,sc='ice',hazard=0,ts=0,compact=false){
  if(!c||w<=0||h<=0)return;
  if(c.canvas?.id==='introWorldCanvas'){const box=c.canvas.parentElement.getBoundingClientRect(),d=Math.min(1.5,__ctx.browser.window.devicePixelRatio||1);w=Math.max(10,Math.round(box.width));h=Math.max(10,Math.round(box.height));if(c.canvas.width!==Math.round(w*d)||c.canvas.height!==Math.round(h*d)){c.canvas.width=Math.round(w*d);c.canvas.height=Math.round(h*d);c.setTransform(d,0,0,d,0,0);}}
  const isCard=c.canvas?.hasAttribute?.('data-scenario');if(isCard)hazard=96;
  const animated=c===__ctx.sceneEngine.ctx||c.canvas?.id==='introWorldCanvas';
  if(animated&&!reduceMotion){let camera=cameraStates.get(c);if(!camera||camera.sc!==sc){camera={sc,hazard,ts};cameraStates.set(c,camera);}const dt=Math.max(0,Math.min(100,ts-camera.ts));camera.hazard+=(hazard-camera.hazard)*(1-Math.exp(-dt/500));camera.ts=ts;hazard=camera.hazard;}
  c.save();c.globalAlpha=1;const rendered=drawPlates(c,w,h,sc,hazard,ts);if(rendered)atmosphere(c,w,h,sc,hazard,ts);c.restore();
 };
 // Real shelter lighting and activity replace the old geometric settlement sketch.
 __ctx.artSettlement=function(c,w,h,ts){
  if(!plate('calm')?.ready||!__ctx.viewState.scenario)return;
  const t=(reduceMotion?18000:ts)/1000,built=__ctx.viewState.built||{},scale=Math.max(w/1774,h/887)*1.012,ox=(w-1774*scale)*.5,oy=(h-887*scale)*.63;
  const point=(x,y)=>[ox+x*1774*scale,oy+y*887*scale];
  const energy=__ctx.clamp((__ctx.viewState.bunker?.power||0)/65,.12,1),growth=__ctx.clamp(__ctx.values(built).reduce((a,b)=>a+b,0)/28,0,1);
  c.save();c.globalCompositeOperation='screen';
  for(const [x,y] of [[.153,.535],[.269,.548]]){const [px,py]=point(x,y),r=Math.max(15,w*.045),light=c.createRadialGradient(px,py,0,px,py,r);light.addColorStop(0,`rgba(255,187,84,${(.07+growth*.04)*energy*(.98+.02*Math.sin(t*1.2))})`);light.addColorStop(1,'rgba(255,170,70,0)');c.fillStyle=light;c.fillRect(px-r,py-r,r*2,r*2);}
  if(built.printer&&__ctx.viewState.printerMode!=='off'){const [x,y]=point(.18,.648),r=w*.021,light=c.createRadialGradient(x,y,0,x,y,r);light.addColorStop(0,`rgba(137,202,227,${.025+energy*.035*(.5+.5*Math.sin(t*2.3))})`);light.addColorStop(1,'rgba(137,202,227,0)');c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);}
  c.restore();
  if(built.radioCenter){const [x,y]=point(.225,.387),mast=Math.min(50,h*.105);c.save();c.strokeStyle='rgba(37,49,52,.82)';c.lineWidth=Math.max(.7,w/1700);c.beginPath();c.moveTo(x,y);c.lineTo(x,y-mast);c.moveTo(x-mast*.16,y-mast*.65);c.lineTo(x+mast*.16,y-mast*.65);c.stroke();c.fillStyle=`rgba(238,122,88,${.45+.45*Math.pow(Math.max(0,Math.sin(t*1.8)),8)})`;c.beginPath();c.arc(x,y-mast,Math.max(.8,w/1400),0,6.283);c.fill();c.restore();}
 };
 __ctx.animateSceneCanvas=function(ts){requestAnimationFrame(__ctx.animateSceneCanvas);if(__ctx.browser.document.hidden||ts-__ctx.livingArt.lastHero<(reduceMotion?800:42))return;__ctx.livingArt.lastHero=ts;const overlay=__ctx.browser.document.getElementById('startOverlay');if(overlay&&overlay.style.display!=='none')return;const c=__ctx.sceneEngine.ctx;if(!c)return;__ctx.sceneEngine.t=ts;__ctx.drawLivingWorld(c,__ctx.sceneEngine.w,__ctx.sceneEngine.h,__ctx.viewState.scenario||'ice',__ctx.artHazard(),ts);__ctx.artSettlement(c,__ctx.sceneEngine.w,__ctx.sceneEngine.h,ts);};
 __ctx.animateMapScene=function(ts){requestAnimationFrame(__ctx.animateMapScene);if(__ctx.browser.document.hidden||ts-__ctx.livingArt.lastMap<(reduceMotion?800:67)||!__ctx.browser.document.querySelector('.perimeterCamera')?.open)return;__ctx.livingArt.lastMap=ts;const c=__ctx.mapSceneEngine.ctx;if(!c)return;__ctx.drawLivingWorld(c,__ctx.mapSceneEngine.w,__ctx.mapSceneEngine.h,__ctx.viewState.scenario||'ice',__ctx.artHazard(),ts,true);__ctx.artSettlement(c,__ctx.mapSceneEngine.w,__ctx.mapSceneEngine.h,ts);};

 /* A rotating presentation layer over the existing, authoritative survey map. */
 const mapSVG=__ctx.terrainSVG;
 __ctx.terrainSVG=function(){
  const html=mapSVG(),cx=405,cy=447,r=980,elapsed=(performance.now()/1000)%8;
  let wedge='';for(let i=0;i<64;i++){const a=(-64+i)*Math.PI/180,b=(i-63)*Math.PI/180,alpha=Math.pow((i+1)/64,2)*.21;wedge+=`<path d="M${cx} ${cy}L${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r}A${r} ${r} 0 0 1 ${cx+Math.cos(b)*r} ${cy+Math.sin(b)*r}Z" fill="#90f5ce" opacity="${alpha.toFixed(3)}"/>`;}
  const rings=[95,190,285,380,475].map(radius=>`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#8ccebb" stroke-opacity=".11" stroke-width=".8"/>`).join('');
  const echoes=__ctx.allMapLocations().filter(n=>__ctx.mapSiteVisible(n)).map(n=>{const x=n.x*90+45,y=28+n.y*76+38,bearing=(Math.atan2(y-cy,x-cx)+Math.PI*2)%(Math.PI*2),delay=-((elapsed-bearing/(Math.PI*2)*8+8)%8);return `<circle class="radarEcho" cx="${x}" cy="${y}" r="21" fill="none" stroke="#b4ffdb" stroke-width="1.4" style="animation-delay:${delay}s"/>`;}).join('');
  const overlay=`<defs><clipPath id="radarField"><rect x="0" y="28" width="810" height="532" rx="4"/></clipPath><radialGradient id="scopeGlass"><stop offset="0" stop-color="#7cd4bd" stop-opacity=".025"/><stop offset="1" stop-color="#061716" stop-opacity=".20"/></radialGradient></defs><g class="radarOverlay" pointer-events="none" aria-hidden="true" clip-path="url(#radarField)"><rect y="28" width="810" height="532" fill="url(#scopeGlass)"/>${rings}<path d="M405 28V560M0 447H810" stroke="#91c4b5" stroke-opacity=".08" stroke-dasharray="3 7"/><g class="radarSweep" style="animation-delay:-${elapsed}s">${wedge}<path d="M405 447H1385" stroke="#b9ffe3" stroke-opacity=".72" stroke-width="1.1"/></g>${echoes}<circle cx="405" cy="447" r="4" fill="#dcf8d8" fill-opacity=".9"/></g>`;
  return html.replace('</svg>',overlay+'</svg>');
 };
 const terrainTab=__ctx.renderTerrainTab;
 __ctx.renderTerrainTab=function(){return terrainTab().replace('<div class="mapLegend">','<div class="radarReadout"><span><i></i> КРУГОВОЙ ОБЗОР</span><span>КАНАЛ РАЗВЕДКИ · 360°</span></div><div class="mapLegend">');};

 function worldTheater(open){const hero=__ctx.browser.document.querySelector('.sceneHero');if(!hero)return;hero.classList.toggle('worldTheater',open);__ctx.browser.document.body.classList.toggle('worldTheaterOpen',open);const button=__ctx.browser.document.getElementById('worldTheaterBtn');if(button){button.textContent=open?'× Вернуться в убежище':'⤢ Развернуть панораму';button.setAttribute('aria-pressed',String(open));}dispatchEvent(new Event('resize'));}
 const hero=__ctx.browser.document.querySelector('.sceneHero');
 if(hero){
  hero.insertAdjacentHTML('beforeend','<button id="worldTheaterBtn" class="worldTheaterBtn" type="button" aria-pressed="false">⤢ Развернуть панораму</button><div class="worldLens" aria-hidden="true"><span>ВНЕШНИЙ КОНТУР</span><i></i></div>');
  __ctx.browser.document.getElementById('worldTheaterBtn').onclick=()=>worldTheater(!hero.classList.contains('worldTheater'));
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;});hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
 }
 addEventListener('keydown',e=>{if(e.key==='Escape'&&hero?.classList.contains('worldTheater'))worldTheater(false);});
 __ctx.browser.window.PredelCinema={ready:sc=>Promise.all(plates(sc).filter(Boolean).map(p=>p.promise)),weights,renderer:()=>gpu?'webgl':'canvas',assetNames:()=>Object.keys(__ctx.CINEMA_ASSETS)};
 plate('calm');
})();
} },
{ order:634, run(__ctx:Runtime){__ctx.PREDEL_SPEECH_STRESS = Object.freeze({
  'началось':'начало́сь','началась':'начала́сь','начали':'на́чали',
  'принят':'при́нят','приняты':'при́няты','принята':'принята́',
  'переданы':'пе́реданы','занесены':'занесены́','получены':'полу́чены',
  'выбрана':'вы́брана','обеспечьте':'обеспе́чьте','обеспечены':'обеспе́чены',
  'обеспечение':'обеспе́чение','обеспечения':'обеспе́чения',
  'катастрофа':'катастро́фа','катастрофы':'катастро́фы','катастрофу':'катастро́фу',
  'контур':'ко́нтур','контура':'ко́нтура','контуры':'ко́нтуры',
  'углубляйте':'углубля́йте','наладьте':'нала́дьте','разведайте':'разве́дайте',
  'запасов':'запа́сов','запчасти':'запча́сти','запчастей':'запчасте́й',
  'деталей':'дета́лей','насосов':'насо́сов','оборудования':'обору́дования',
  'очаг':'оча́г','очаги':'очаги́','карантин':'каранти́н',
  'обрушение':'обруше́ние','обрушения':'обруше́ния',
  'потеряна':'поте́ряна','потерян':'поте́рян','понесла':'понесла́',
  'открылась':'откры́лась','пополнен':'попо́лнен','осталась':'оста́лась',
  'спасли':'спасли́','спасти':'спасти́','людей':'люде́й',
  'воротами':'воро́тами','ворот':'воро́т','жильём':'жильём','наружу':'нару́жу',
  'герметизацию':'герметиза́цию','герметизация':'герметиза́ция',
  'дезактивация':'дезактива́ция','дезактивацию':'дезактива́цию',
  'радиоактивный':'радиоакти́вный','радиоактивного':'радиоакти́вного',
  'подвергаются':'подверга́ются','выявлен':'вы́явлен','архивы':'архи́вы',
  'снабжения':'снабже́ния','эвакуации':'эвакуа́ции','эвакуацию':'эвакуа́цию',
  'сформировалась':'сформирова́лась','утрачен':'утра́чен',
  'восстановлена':'восстано́влена','расширены':'расши́рены',
  'потребления':'потребле́ния','водоснабжения':'водоснабже́ния',
  'обстановке':'обстано́вке','обстановку':'обстано́вку','планирования':'плани́рования',
  'автономное':'автоно́мное','автономного':'автоно́много',
  'подготовленные':'подгото́вленные','развития':'разви́тия','питьевые':'питьевы́е'
});
} },
{ order:657, run(__ctx:Runtime){__ctx.v17RadioHTML = __ctx.radioTradeCardHTML;
} },
{ order:659, run(__ctx:Runtime){__ctx.v17RenderEvent = __ctx.renderEvent;
} },
{ order:666, run(__ctx:Runtime){__ctx.v17TerrainTab = __ctx.renderTerrainTab;
} },
{ order:668, run(__ctx:Runtime){__ctx.v17ShowTab = __ctx.showTab;
} },
{ order:669, run(__ctx:Runtime){__ctx.showTab=function(tab){__ctx.v17ShowTab(tab);if(tab!=='city'||!__ctx.viewState.site)return;const el=__ctx.browser.document.getElementById('tabContent');
 const old=el.querySelector("button[onclick=\"game.scavenge('evacuation')\"]")?.closest('.card');
 if(old)old.outerHTML=__ctx.evacuationCardHTML();else if(!el.querySelector('#evacuationMission'))el.querySelector('.cards')?.insertAdjacentHTML('beforeend',__ctx.evacuationCardHTML());
};
} },
{ order:670, run(__ctx:Runtime){__ctx.predelAtmosphereState = {phase:0,scenario:'',site:'',events:0,liveNodes:0};
} },
{ order:671, run(__ctx:Runtime){__ctx.browser.window.PredelAtmosphere = __ctx.predelAtmosphereState;
} },
{ order:673, run(__ctx:Runtime){__ctx.makePredelLivingAmbience = function(scenario){
  const c=__ctx.audioEngine.ctx, bus=c.createGain(),sources: any=new Set(),nodes: any=new Set([bus]);
  let alive=true,timer=null,phase=__ctx.predelSoundPhase(),lastPhase=phase,turn=0;
  bus.gain.value=0;bus.connect(__ctx.audioEngine.master);
  const params={
    ice:{wind:[.024,.13,.17,.12],freq:[390,680,420,280],air:[.003,.024,.032,.017],rumble:[.003,.026,.018,.009],tone:49},
    heat:{wind:[.012,.075,.095,.065],freq:[750,1650,2100,1100],air:[.003,.025,.034,.018],rumble:[.002,.018,.011,.006],tone:61},
    nuclear:{wind:[.012,.055,.065,.048],freq:[310,470,360,250],air:[.002,.02,.013,.007],rumble:[.003,.07,.032,.018],tone:36},
    epidemic:{wind:[.014,.035,.025,.032],freq:[520,690,420,350],air:[.003,.018,.009,.006],rumble:[.003,.023,.012,.008],tone:56}
  }[scenario]||{wind:[.01,.05,.06,.04],freq:[400,600,500,400],air:[.002,.01,.01,.005],rumble:[.002,.02,.01,.005],tone:48};
  function node(n){nodes.add(n);return n;}
  function start(o,t=c.currentTime){sources.add(o);o.start(t);return o;}
  function disconnect(n){try{n.disconnect();}catch(_){}nodes.delete(n);}
  function ownEnd(o,list){o.onended=()=>{sources.delete(o);for(const n of list)disconnect(n);__ctx.predelAtmosphereState.liveNodes=nodes.size;};}
  function stereo(output,pan){
    if(!c.createStereoPanner){output.connect(bus);return null;}
    const p=node(c.createStereoPanner());p.pan.value=pan;output.connect(p);p.connect(bus);return p;
  }
  function texture(type,freq,q,pan){
    const src=node(c.createBufferSource()),filter=node(c.createBiquadFilter()),gain=node(c.createGain());
    src.buffer=__ctx.audioEngine.noiseBuffer;src.loop=true;filter.type=type;filter.frequency.value=freq;filter.Q.value=q;gain.gain.value=0;
    src.connect(filter);filter.connect(gain);stereo(gain,pan);start(src);
    return {src,filter,gain};
  }
  const gust=texture('lowpass',400,.55,-.35),air=texture('highpass',2000,.5,.45),rumble=texture('lowpass',110,.7,0),river=texture('bandpass',1100,.6,.65);
  const motor=node(c.createOscillator()),motorGain=node(c.createGain()),motorFilter=node(c.createBiquadFilter());
  motor.type='triangle';motor.frequency.value=58;motorFilter.type='lowpass';motorFilter.frequency.value=170;motorGain.gain.value=0;
  motor.connect(motorFilter);motorFilter.connect(motorGain);stereo(motorGain,-.15);start(motor);
  const tension=node(c.createOscillator()),tensionGain=node(c.createGain());tension.type='sine';tension.frequency.value=params.tone;tensionGain.gain.value=0;
  tension.connect(tensionGain);stereo(tensionGain,.25);start(tension);
  const lfo=node(c.createOscillator()),depth=node(c.createGain());lfo.frequency.value=.075;depth.gain.value=.002;
  lfo.connect(depth);depth.connect(gust.gain.gain);start(lfo);
  function ready(){return alive&&!__ctx.audioEngine.muted&&!__ctx.browser.document.hidden&&c.state==='running';}
  function noise(d,g,f,type='bandpass',pan=0,delay=0,q=.7){
    if(!ready())return;
    const o=node(c.createBufferSource()),flt=node(c.createBiquadFilter()),env=node(c.createGain()),t=c.currentTime+delay;
    o.buffer=__ctx.audioEngine.noiseBuffer;o.loop=true;flt.type=type;flt.frequency.value=f;flt.Q.value=q;
    env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(g,t+Math.min(.15,d*.14));env.gain.exponentialRampToValueAtTime(.00001,t+d);
    o.connect(flt);flt.connect(env);const p=stereo(env,pan);ownEnd(o,[o,flt,env,...(p?[p]:[])]);start(o,t);o.stop(t+d+.04);
  }
  function tone(f,end,d,g,pan=0,delay=0,type='sine'){
    if(!ready())return;
    const o=node(c.createOscillator()),env=node(c.createGain()),t=c.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(12,end),t+d);
    env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(g,t+Math.min(.2,d*.15));env.gain.exponentialRampToValueAtTime(.00001,t+d);
    o.connect(env);const p=stereo(env,pan);ownEnd(o,[o,env,...(p?[p]:[])]);start(o,t);o.stop(t+d+.04);
  }
  function siren(g=.025){tone(390,690,2.4,g,-.6);tone(690,390,2.8,g,-.6,2.3);noise(.3,.012,1900,'highpass',-.6,5.2);}
  function metal(){const p=Math.random()*1.5-.75;noise(.09,.035,1700,'bandpass',p,0,2.5);tone(270+Math.random()*130,82,1.5,.016,p,.04,'triangle');}
  function disaster(){
    if(!ready())return;__ctx.predelAtmosphereState.events++;
    if(scenario==='ice'){noise(5.2,.20,125,'lowpass',-.4);noise(2.4,.055,1700,'bandpass',.5,.3);metal();}
    if(scenario==='heat'){noise(3.4,.10,180,'lowpass',.3);for(let i=0;i<7;i++)noise(.12,.025,1500+Math.random()*2000,'highpass',Math.random()*1.4-.7,i*.2);siren(.018);}
    if(scenario==='nuclear'){noise(5,.25,85,'lowpass',-.3);noise(1.1,.10,420,'bandpass',.4,.04);tone(48,23,4.2,.07,0);siren(.022);}
    if(scenario==='epidemic'){siren(.035);noise(1.4,.075,550,'bandpass',.4,1.6);noise(.18,.055,170,'lowpass',.4,3);}
  }
  function update(h=__ctx.viewState.hazard||0,stage=__ctx.viewState.settlementLevel||0){
    if(!alive)return;phase=__ctx.predelSoundPhase();
    const t=c.currentTime,e=__ctx.viewState.environment||{},w=__ctx.clamp((Number(e.wind)||8)/85,.07,1),site=__ctx.viewState.site?.name||'';
    const open=/плато|карьер/.test(site)?1.25:/склон|холм/.test(site)?.78:1;
    const storm=e.weather?.storm?1.5:1,settled=__ctx.viewState.ended?.55:1;
    bus.gain.setTargetAtTime(__ctx.clamp(Number(__ctx.PredelAudio.pref.ambience)||0,0,1)*settled,t,.18);
    gust.gain.gain.setTargetAtTime(params.wind[phase]*(.6+w*.7)*open*storm,t,1.6);
    gust.filter.frequency.setTargetAtTime(params.freq[phase]*(.8+w*.5),t,1.8);
    air.gain.gain.setTargetAtTime(params.air[phase]*storm*open,t,1.8);
    air.filter.frequency.setTargetAtTime(scenario==='heat'?1700:scenario==='ice'?2800:1400,t,1.6);
    rumble.gain.gain.setTargetAtTime(params.rumble[phase]*(1+(__ctx.viewState.event?.title?.length? .2:0)),t,1.6);
    river.gain.gain.setTargetAtTime(/Речная/.test(site)?[.033,.023,.012,.009][phase]:/Лесистый/.test(site)?[.008,.014,.008,.006][phase]:0,t,1.7);
    river.filter.frequency.setTargetAtTime(/Речная/.test(site)?scenario==='ice'?450:1200:2200,t,1.8);
    const power=(__ctx.viewState.bunker?.power||0)>0?1:.2;
    motorGain.gain.setTargetAtTime((.003+stage*.0015)*power*(phase===1?1.4:1),t,1.2);
    motor.frequency.setTargetAtTime(54+stage*3+(scenario==='heat'?14:0),t,1.3);
    tensionGain.gain.setTargetAtTime([.001,.012,.009,.005][phase],t,2);
    tension.frequency.setTargetAtTime(params.tone+(__ctx.viewState.health<35?-3:0)+stage*.3,t,2.1);
    depth.gain.setTargetAtTime(params.wind[phase]*.18,t,1.8);
    lfo.frequency.setTargetAtTime(scenario==='ice'?.10:scenario==='heat'?.19:.055,t,1.2);
    if(phase!==lastPhase){if(phase===1)disaster();else if(phase>lastPhase){noise(3,.045,160,'lowpass',.2);if(phase===2)metal();}lastPhase=phase;}
    Object.assign(__ctx.predelAtmosphereState,{phase,scenario,site,liveNodes:nodes.size});
  }
  function tick(){
    if(!alive)return;update();turn++;
    if(ready()){
      const p=Math.random()*1.7-.85,r=Math.random(),site=__ctx.viewState.site?.name||'',storm=!!__ctx.viewState.environment?.weather?.storm,stage=__ctx.viewState.settlementLevel||0;
      if(phase===0){
        if(r<.26){const f=1900+Math.random()*1200;tone(f,f*1.23,.16,.012,p);tone(f*1.15,f*.9,.23,.009,p,.18);}
        else if(r<.58){noise(3,.015,180,'lowpass',p);tone(86,53,2.8,.005,p);}
        else if(/Промышленная|карьер/.test(site)&&r<.8){metal();}
        if(scenario==='epidemic'&&__ctx.viewState.hazard>15&&turn%7===0)siren(.008);
      }else if(phase===1){
        if(r<.2)siren(scenario==='epidemic'?.027:.013);
        else if(r<.55){noise(2.8,scenario==='nuclear'?.15:.08,scenario==='nuclear'?95:145,'lowpass',p);if(scenario!=='epidemic')metal();}
        else metal();
        if(scenario==='heat')for(let i=0;i<4;i++)noise(.07,.015,2200,'highpass',p,i*.25);
      }else if(scenario==='ice'){
        if(r<.6){noise(.15,.045,1450,'bandpass',p,0,3);tone(380,66,1.4,.022,p,.04,'triangle');}else noise(3,.07,180,'lowpass',p);
      }else if(scenario==='heat'){
        for(let i=0;i<3+Math.floor(Math.random()*5);i++)noise(.04+Math.random()*.13,.017,1200+Math.random()*3600,'highpass',p,i*.16);
        if(storm)noise(2.6,.06,2100,'bandpass',p);
      }else if(scenario==='nuclear'){
        const radiation=Number(__ctx.viewState.environment?.radiation)||1;
        for(let i=0;i<Math.min(12,2+Math.ceil(Math.log2(1+Math.max(0,radiation))*2));i++)noise(.018,.023,2700,'highpass',p,Math.random()*1.5);
        if(r<.24)noise(3.4,.085,80,'lowpass',p);
      }else if(scenario==='epidemic'){
        if(r<.28){noise(.6,.025,720,'bandpass',p);noise(.12,.017,1900,'highpass',p,.7);}
        else if(r<.5)metal();
        else if(phase===2&&turn%7===0)siren(.009);
      }
      if(phase>0&&storm)noise(2.4,.07,scenario==='heat'?1200:210,'bandpass',p);
      if(phase>0&&(__ctx.viewState.health??100)<35&&turn%4===0){tone(780,780,.11,.012,.1);tone(780,780,.11,.01,.1,.25);}
      if(stage>=2&&turn%3===0)noise(.1,.012,980+stage*100,'bandpass',-.15);
      __ctx.predelAtmosphereState.events++;
    }
    timer=setTimeout(tick,(phase===1?2600:phase===0?3400:2400)+Math.random()*3000);
  }
  update();timer=setTimeout(tick,1200);
  return {update,stop(){
    if(!alive)return;alive=false;clearTimeout(timer);
    for(const o of sources){try{o.stop();}catch(_){}o.onended=null;}
    sources.clear();for(const n of [...nodes])disconnect(n);__ctx.predelAtmosphereState.liveNodes=0;
  }};
};
} },
{ order:675, run(__ctx:Runtime){__ctx.browser.document.addEventListener('input',event=>{if(event.target.id==='audioAmbience'&&__ctx.audioEngine.ctx)__ctx.updateAudioForHazard(__ctx.viewState.hazard||0);});
} },
{ order:678, run(__ctx:Runtime){(()=>{
 const reduced=__ctx.browser.window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const baseWorld=__ctx.drawLivingWorld,baseSettlement=__ctx.artSettlement,baseHero=__ctx.updateSceneHero,baseArtHazard=__ctx.artHazard;
 function presentationStage(){const post=Math.max(0,(__ctx.viewState.month||0)-(__ctx.viewState.prepMonths||18));return post<=0?0:post<=12?1:post<=48?2:3;}
 function phaseFloor(){const post=Math.max(0,(__ctx.viewState.month||0)-(__ctx.viewState.prepMonths||18));return post<=0?0:post<=12?48+post:post<=48?60+(post-12)*.44:Math.min(88,76+(post-48)*.35);}
 // A spring thaw or a receding epidemic does not rebuild the ruined city.
 // Keep physical hazard, forecasts and risks unchanged; only scenic plates retain history.
 __ctx.artHazard=function(){return Math.max(baseArtHazard(),phaseFloor());};
 let activity: any={kind:'',at:0},lastPhase='',phaseAt=0;
 const tau=Math.PI*2,materialCache: any=new Map();
 function shade(hex,amount){const n=parseInt(hex.slice(1),16),target=amount>0?255:0,a=Math.abs(amount);return `rgb(${[n>>16,(n>>8)&255,n&255].map(v=>Math.round(v+(target-v)*a)).join(',')})`;}
 function surface(c,x,y,span,color){const g=c.createLinearGradient(x,y,x+span*.25,y+span);g.addColorStop(0,shade(color,.13));g.addColorStop(.45,color);g.addColorStop(1,shade(color,-.45));return g;}
 function seed(i){const n=Math.sin(i*127.1+173.9)*43758.5453;return n-Math.floor(n);}
 function terrainMaterial(site,snow,dry,post){
  const key=[site,snow,dry,post].join(':');if(materialCache.has(key))return materialCache.get(key);
  const tile=__ctx.browser.document.createElement('canvas');tile.width=1200;tile.height=540;const d=tile.getContext('2d');
  // Deterministic small detail is rendered once per material and retained, not regenerated each frame.
  for(let i=0;i<1150;i++){
   const x=seed(i+1)*1200,y=371+seed(i+1453)*169;if(site==='river'&&x>790)continue;
   const near=(y-355)/185,size=.35+near*(.8+seed(i+71)*2.8);
   d.fillStyle=i%3===0?'rgba(224,226,202,.12)':'rgba(4,18,20,.16)';d.fillRect(x,y,size*2,size*.48);
  }
  for(let i=0;i<74;i++){
   const x=seed(i+870)*1200,y=386+seed(i+1943)*150;if(site==='river'&&x>790)continue;
   const size=1+(y-380)/100+seed(i+87)*3;
   d.fillStyle='rgba(6,17,18,.20)';d.beginPath();d.ellipse(x+size,y+1,size*2.6,size*.6,0,0,tau);d.fill();
   poly(d,[[x-size,y],[x-size*.4,y-size],[x+size,y-size*.8],[x+size*1.5,y]],snow?'rgba(204,220,221,.36)':dry?'rgba(185,160,113,.23)':'rgba(128,147,128,.21)');
   if(!snow&&!dry&&(!post||i%3===0)){line(d,[[x+4,y],[x+2,y-5],[x+6,y-2]],'rgba(138,162,109,.23)',.6);}
  }
  for(let i=0;i<13;i++){const y=384+i*12;line(d,[[10,y],[150,y+Math.sin(i)*13],[335,y-10],[550,y+11]],snow?'rgba(235,242,241,.11)':'rgba(156,171,144,.09)',1+(i/13));}
  if(materialCache.size>=5)materialCache.delete(materialCache.keys().next().value);materialCache.set(key,tile);return tile;
 }
 function terrain(){const name=__ctx.viewState.site?.name||'';return /карьер/i.test(name)?'quarry':/лес/i.test(name)?'forest':/Промышлен/i.test(name)?'industrial':/плато/i.test(name)?'plateau':/Речн/i.test(name)?'river':'rock';}
 function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function condition(){return {post:__ctx.viewState.month>__ctx.viewState.prepMonths,p:__ctx.clamp((__ctx.viewState.hazard||0)/100,0,1),sc:__ctx.viewState.scenario,stage:__ctx.viewState.settlementLevel||0};}
 function drawTerrain(c,w,h,ts){
  const {post,p,sc}=condition(),site=terrain(),t=(reduced?18000:ts)/1000;
  const snow=sc==='ice'&&post,dry=sc==='heat'&&post,poison=sc==='nuclear'&&post;
  const soil=snow?'#71818c':dry?'#6a4c38':poison?'#394139':'#31483e';
  const edge=snow?'#b5c6ce':dry?'#a38762':poison?'#697261':'#6c8070';
  c.save();c.scale(w/1200,h/540);
  // The site occupies the foreground while the original photographed world remains in the distance.
  const rgb=[parseInt(soil.slice(1,3),16),parseInt(soil.slice(3,5),16),parseInt(soil.slice(5,7),16)].join(','),ground=c.createLinearGradient(0,316,150,540);
  ground.addColorStop(0,`rgba(${rgb},0)`);ground.addColorStop(.24,`rgba(${rgb},.80)`);ground.addColorStop(.65,soil);ground.addColorStop(1,shade(soil,-.36));
  poly(c,[[0,325],[150,316],[310,342],[455,329],[620,348],[830,328],[1020,346],[1200,317],[1200,540],[0,540]],ground);
  if(site==='rock'){
   poly(c,[[0,126],[52,168],[122,140],[198,241],[245,258],[360,380],[180,448],[0,459]],surface(c,0,120,380,snow?'#a1b3c1':'#46504e'));
   poly(c,[[0,126],[52,168],[122,140],[101,233],[183,283],[144,359],[33,368],[0,412]],surface(c,0,140,240,snow?'#d1dde2':'#72796f'));
   for(let i=0;i<8;i++)line(c,[[i*29,230+i%3*25],[80+i*24,305+i%2*19],[60+i*32,381]],'rgba(17,27,28,.30)',3);
   poly(c,[[830,355],[967,284],[1036,311],[1110,204],[1200,276],[1200,400]],snow?'#8499a8':'#4d5954');
  }else if(site==='quarry'){
   poly(c,[[470,356],[1200,286],[1200,509],[723,518],[430,417]],'#242e2d');
   for(let i=0;i<5;i++){const y=336+i*32;poly(c,[[570-i*30,y+35],[1200,y-49],[1200,y-23],[600-i*30,y+61]],i%2?soil:edge);}
   line(c,[[885,354],[885,216],[832,193],[1054,193],[982,216]],'#242e30',8);
   line(c,[[885,217],[832,193],[982,216]],edge,2);
   const hook=302+Math.sin(t*.65)*12;line(c,[[1010,194],[1010,hook]],'#b1b7a5',1);c.strokeStyle='#aab5a4';c.beginPath();c.arc(1005,hook,5,0,Math.PI);c.stroke();
  }else if(site==='forest'){
   for(let row=0;row<2;row++)for(let i=0;i<18;i++){
    const x=i*76+(row?-28:10),y=340+row*40+(i%3)*8,ht=66+(i*31)%55,sway=reduced?0:Math.sin(t*.7+i)*Math.min(5,1+(__ctx.viewState.environment?.wind||0)/25);
    if(x>145&&x<480&&row)continue;
    line(c,[[x,y],[x+sway,y-ht]],'#23312d',4);
    if(!(post&&sc==='nuclear'&&i%3===0))for(let j=0;j<3;j++)poly(c,[[x+sway,y-ht-j*2],[x-ht*.26-j*5,y-ht*.32+j*14],[x+ht*.26+j*5,y-ht*.32+j*14]],snow?(row?'#819d9e':'#a7bfc0'):dry?'#554b34':row?'#213c33':'#466153');
   }
  }else if(site==='industrial'){
   for(let i=0;i<5;i++){
    const x=610+i*114,y=343-(i%2)*16,hh=50+(i*37)%74;
    c.fillStyle='rgba(7,17,19,.27)';c.beginPath();c.ellipse(x+49,y+3,58,7,0,0,tau);c.fill();
    poly(c,[[x,y],[x,y-hh],[x+64,y-hh-8],[x+76,y-hh+2],[x+76,y]],surface(c,x,y-hh,hh,i%2?'#475955':'#64726a'));
    poly(c,[[x+64,y-hh-8],[x+76,y-hh+2],[x+76,y],[x+64,y-4]],'#34433e');
    line(c,[[x,y-hh],[x+64,y-hh-8],[x+76,y-hh+2]],'#929d87',1.5);
    for(let row=0;row<Math.floor(hh/14);row++)line(c,[[x+2,y-row*13-4],[x+63,y-row*13-10]],'rgba(25,42,39,.23)',.7);
    if(post&&i%2===0){poly(c,[[x,y-hh],[x+21,y-hh+17],[x+44,y-hh+4],[x+64,y-hh+13],[x+64,y-hh-8]],'#293b35');line(c,[[x+35,y-hh+15],[x+31,y-hh+34],[x+44,y-hh+46]],'rgba(11,25,23,.55)',1);}
    for(let j=0;j<4;j++){const wx=x+7+j*14,wy=y-hh+18;c.fillStyle='#263b3a';c.fillRect(wx,wy,7,12);line(c,[[wx,wy+12],[wx+7,wy+12]],'#748679',.8);c.fillStyle='rgba(147,179,172,.24)';c.fillRect(wx+1,wy+1,2,5);}
    c.fillStyle='#233a36';c.fillRect(x+22,y-21,15,21);line(c,[[x+22,y-21],[x+37,y-21],[x+37,y]],'#849481',.6);
    if(i%2){line(c,[[x+53,y],[x+53,y-38]],'#9caa95',1.3);for(let z=0;z<6;z++)line(c,[[x+49,y-z*6],[x+57,y-z*6]],'#9caa95',.6);}
    line(c,[[x+3,y-4],[x+11,y-4],[x+11,y-29]],'rgba(156,160,132,.54)',2);
   }
   for(let i=0;i<3;i++){const x=770+i*96,top=206+i*23;poly(c,[[x,340],[x+9,top],[x+24,top],[x+33,340]],surface(c,x,top,140,'#69766e'));c.strokeStyle='#98a38e';c.lineWidth=2;c.beginPath();c.ellipse(x+16,top,8,2,0,0,tau);c.stroke();for(let y=top+20;y<340;y+=24)line(c,[[x+7,y],[x+27,y]],'rgba(26,42,38,.31)',1);line(c,[[x+18,top+7],[x+23,337]],'rgba(25,43,40,.52)',1);}
   line(c,[[540,368],[540,342],[1168,342],[1168,389]],'#818d80',7);
  }else if(site==='plateau'){
   poly(c,[[520,357],[690,303],[1050,293],[1200,319],[1200,540],[570,540]],surface(c,530,290,400,snow?'#93a6b0':'#697166'));
   poly(c,[[600,371],[718,346],[938,354],[1200,338],[1200,540],[580,540]],surface(c,620,330,240,soil));
   for(let i=0;i<4;i++){
    const x=680+i*132,y=327-(i%2)*18,hh=85-i*8;line(c,[[x,y],[x,y-hh]],'#b0b9af',4);
    c.save();c.translate(x,y-hh);c.rotate(reduced?i:t*(.6+(__ctx.viewState.environment?.wind||0)/80)+i);for(let j=0;j<3;j++){c.rotate(tau/3);poly(c,[[0,-3],[6,-33],[1,-47],[-2,-9]],'#b8c8bc');}c.restore();
   }
  }else if(site==='river'){
   poly(c,[[830,329],[937,326],[899,372],[1040,410],[1030,462],[1200,489],[1200,540],[928,540],[896,468],[952,424],[810,379]],dry?'#7c684b':snow?'#8ba5af':'#426b70');
   for(let i=0;i<22;i++){const y=346+i*9,x=885+Math.sin(i*.7)*47+(i>10?i*4:0),flow=reduced?0:Math.sin(t*1.3+i)*10;line(c,[[x+flow,y],[x+23+(i%3)*11+flow,y]],snow?'rgba(221,237,238,.4)':dry?'rgba(61,51,33,.35)':'rgba(161,205,196,.45)',1);}
   if(dry)for(let i=0;i<8;i++)line(c,[[900+i*9,380+i*10],[915+i*9,389+i*10],[910+i*9,402+i*10]],'#493e2d',1);
   line(c,[[788,383],[916,400],[937,391]],'#a39a7f',7);
  }
  c.drawImage(terrainMaterial(site,snow,dry,post),0,0);
  // Main access road remains visible in all six terrains.
  poly(c,[[220,433],[394,407],[570,432],[789,540],[682,540],[510,456],[390,438]],surface(c,350,410,160,'#778174'));
  line(c,[[265,435],[395,422],[540,444],[724,540]],'rgba(207,205,166,.22)',1);
  line(c,[[268,438],[394,427],[537,449],[710,540]],'rgba(23,39,34,.19)',2.2);
  line(c,[[275,432],[394,419],[542,441],[739,540]],'rgba(23,39,34,.16)',2);
  for(let i=0;i<16;i++){const x=560+i*10,y=460+i*5;line(c,[[x-5,y],[x+3,y+1]],'rgba(202,204,171,.12)',.8);}
  if(post){
   for(let i=0;i<18;i++){const x=480+(i*71)%700,y=379+(i*29)%141;poly(c,[[x,y],[x+7,y-5],[x+16,y+2]],i%2?'#29322e':edge);}
   if(sc==='ice'){for(let i=0;i<6;i++)poly(c,[[i*240,456+i%2*30],[i*240+130,432+i%2*30],[i*240+225,477],[i*240,493]],'rgba(215,230,234,.43)');}
   if(sc==='heat'||sc==='nuclear')for(let i=0;i<7;i++){
    const x=630+i*77,rise=((t*(sc==='heat'?11:6)+i*19)%100),y=359-rise;
    c.fillStyle=`rgba(${sc==='heat'?'105,83,65':'80,89,78'},${(1-rise/115)*.28})`;c.beginPath();c.ellipse(x+Math.sin(t*.4+i)*15,y,9+rise*.16,14+rise*.19,0,0,tau);c.fill();
    if(sc==='heat'&&(site==='forest'||site==='industrial')){const flick=.5+.5*Math.sin(t*7+i);poly(c,[[x-5,362],[x+Math.sin(t*9+i)*4,344-flick*9],[x+6,362]],`rgba(230,133,62,${.4+flick*.4})`);}
   }
  }
  // A short shock front marks the transition rather than repeating throughout the campaign.
  if(!reduced&&__ctx.viewState.phase!==lastPhase){lastPhase=__ctx.viewState.phase;phaseAt=ts;}
  const shock=(ts-phaseAt)/1000;
  if(post&&!reduced&&shock>=0&&shock<7&&/Обрушение/.test(__ctx.viewState.phase||'')){
   const x=910,y=321,r=shock*110;c.strokeStyle=`rgba(234,205,154,${Math.max(0,.35-shock*.05)})`;c.lineWidth=8;c.beginPath();c.ellipse(x,y,r,r*.22,0,0,tau);c.stroke();
  }
  c.restore();
 }
 __ctx.drawLivingWorld=function(c,w,h,sc='ice',hazard=0,ts=0,compact=false){const inCampaign=__ctx.viewState.site&&__ctx.viewState.scenario===sc&&!c.canvas?.hasAttribute?.('data-scenario')&&c.canvas?.id!=='introWorldCanvas';baseWorld(c,w,h,sc,inCampaign?Math.max(hazard,phaseFloor()):hazard,ts,compact);if(__ctx.viewState.site&&__ctx.viewState.scenario===sc&&!c.canvas?.hasAttribute?.('data-scenario')&&c.canvas?.id!=='introWorldCanvas')drawTerrain(c,w,h,ts);};
 __ctx.artSettlement=function(c,w,h,ts){
  if(!__ctx.viewState.site){baseSettlement(c,w,h,ts);return;}
  const {post,stage,sc}=condition(),t=(reduced?18000:ts)/1000,b=__ctx.viewState.built||{},energy=__ctx.clamp((__ctx.viewState.bunker?.power||0)/45,.15,1);
  c.save();c.scale(w/1200,h/540);
  // The shelter grows with the actual level and built facilities.
  const buildings=Math.min(7,1+stage+(b.habitat||0));
  for(let i=0;i<buildings;i++){
   const x=190+(i%4)*73,y=414-Math.floor(i/4)*39;
   c.fillStyle='rgba(6,17,18,.32)';c.beginPath();c.ellipse(x+37,y+3,42,6,0,0,tau);c.fill();
   poly(c,[[x,y],[x,y-33],[x+9,y-45],[x+53,y-45],[x+65,y-33],[x+65,y]],surface(c,x,y-45,65,i?'#63776b':'#7a8d7b'));
   poly(c,[[x+53,y-45],[x+65,y-33],[x+65,y],[x+53,y-2]],'#3e554b');
   poly(c,[[x,y-33],[x+9,y-45],[x+53,y-45],[x+58,y-40],[x+10,y-40]],'#98a78b');
   line(c,[[x+3,y-5],[x+53,y-5]],'rgba(28,47,39,.5)',1.5);
   c.fillStyle='#253e37';c.fillRect(x+26,y-22,11,22);line(c,[[x+27,y-20],[x+36,y-20],[x+36,y-1]],'#9aab8e',.7);
   for(let vent=0;vent<3;vent++)line(c,[[x+28,y-35+vent*2],[x+36,y-35+vent*2]],'rgba(26,46,37,.75)',.8);
   line(c,[[x,y],[x,y-33],[x+9,y-45],[x+53,y-45],[x+65,y-33],[x+65,y]],'#9cac96',1);
   c.fillStyle=`rgba(227,196,125,${energy*(.55+.07*Math.sin(t*1.4+i))})`;c.fillRect(x+12,y-28,9,12);c.fillRect(x+42,y-28,9,12);
   if(sc==='ice'&&post)poly(c,[[x-2,y-34],[x+9,y-46],[x+53,y-46],[x+68,y-33]],'#b9cfd1');
  }
  // Floodlight sweep, with an emergency beacon for unresolved events.
  const beam=reduced?.4:Math.sin(t*.17)*.38;
  c.save();c.translate(471,335);c.rotate(beam);poly(c,[[0,0],[190,52],[188,77]],`rgba(229,225,177,${energy*.065})`);c.restore();
  line(c,[[471,415],[471,333]],'#86968b',3);glow(c,471,335,17,`rgba(245,214,145,${energy*.5})`);
  const alert=!!__ctx.viewState.event||!!__ctx.viewState.physical?.pendingRefugees;
  if(alert){const alpha=reduced?.7:.35+.55*Math.pow(Math.max(0,Math.sin(t*4)),4);glow(c,255,365,36,`rgba(244,107,72,${alpha*.42})`);c.fillStyle=`rgba(255,125,83,${alpha})`;c.fillRect(250,363,7,4);}
  if(b.radioCenter){
   line(c,[[420,391],[427,294],[434,391]],'#a3b4a4',2);line(c,[[414,321],[440,321]],'#a3b4a4',2);
   c.fillStyle='#d4bd83';c.beginPath();c.arc(427,294,3,0,tau);c.fill();
   if(__ctx.viewState.contact||__ctx.viewState.radioContact||__ctx.viewState.contacts?.length){for(let i=0;i<3;i++){const r=12+((t*9+i*16)%48);c.strokeStyle=`rgba(143,211,194,${(1-r/65)*.42})`;c.lineWidth=1;c.beginPath();c.arc(427,294,r,-Math.PI*.8,-Math.PI*.2);c.stroke();}}
  }
  if(b.farm){c.fillStyle='rgba(127,179,141,.25)';c.beginPath();c.ellipse(538,407,39,24,0,Math.PI,tau);c.fill();c.strokeStyle='#93b5a2';c.stroke();line(c,[[499,407],[577,407]],'#93b5a2',2);}
  if(b.power){for(let i=0;i<3;i++)poly(c,[[580+i*22,414],[592+i*22,402],[611+i*22,402],[600+i*22,414]],'#527e8a');}
  // Real actions trigger a visible returning convoy; normal preparation retains sparse traffic.
  const active=performance.now()-activity.at<14000&&activity.kind==='convoy';
  if(active||!post){const f=reduced?.65:(active?__ctx.clamp((performance.now()-activity.at)/14000,0,1):(t*.025)%1),x=720-f*390,y=535-f*109;
   c.fillStyle='#b1a888';c.fillRect(x,y-11,24,10);c.fillRect(x+2,y-17,10,7);c.fillStyle='#1d2c2d';c.fillRect(x+3,y-3,5,5);c.fillRect(x+17,y-3,5,5);glow(c,x-3,y-6,14,'rgba(239,224,162,.30)');}
  if(b.med&&sc==='epidemic'){c.fillStyle='#b8d7c6';c.fillRect(328,374,9,3);c.fillRect(331,371,3,9);}
  c.restore();
 };
 __ctx.updateSceneHero=function(){
  baseHero();if(!__ctx.viewState.site)return;
  const phase=presentationStage(),sc=__ctx.viewState.scenario,phaseName=['Предапокалипсис','Обрушение','Глубокий кризис','Новая среда'][phase];
  const titles: any={
   ice:['Последние спокойные дни','Мир под ледяным покровом','Годы холода и изоляции','Жизнь за ледяным пределом'],
   heat:['Последние спокойные дни','Города в пыли и огне','Годы жажды и выживания','Жизнь среди выжженных земель'],
   nuclear:['Последние спокойные дни','После ударной волны','Годы среди руин','Новый мир после выпадений'],
   epidemic:['Последние спокойные дни','Карантин над городом','Годы эпидемических волн','Жизнь после большой эпидемии']
  };
  const title=__ctx.browser.document.querySelector('#sceneContent .sceneTitle');if(title)title.textContent=(titles[sc]||titles.ice)[phase];
  const eyebrow=__ctx.browser.document.querySelector('#sceneContent .eyebrow');if(eyebrow)eyebrow.textContent=`${__ctx.scenarios[sc]?.name||'ПРЕДЕЛ'} / ${__ctx.viewState.city||'Неизвестный район'} / ${__ctx.viewState.site.name}`;
  const mood=__ctx.browser.document.querySelector('#sceneContent .sceneMood');if(mood){
   const moods=[
    'Город ещё доступен. Укрепляйте убежище и спасайте тех, кто остаётся снаружи.',
    'Инфраструктура разрушается. Проверяйте защиту людей и готовность маршрутов.',
    'Руины остаются за периметром. Жизнь держится на автономных системах и взаимопомощи.',
    'Погода меняется, последствия остаются. Восстанавливайте жизнь в новой среде.'
   ];
   mood.textContent=__ctx.viewState.event?`Требуется решение: ${__ctx.viewState.event.title}.`:__ctx.viewState.health<35?'Люди нуждаются в срочной помощи. Проверьте воду, медицину и условия в убежище.':moods[phase];
  }
  const track=__ctx.browser.document.querySelectorAll('#sceneContent .worldPhaseTrack span'),active=phase?phase+1:__ctx.viewState.month>12?1:0;track.forEach((el,index)=>el.classList.toggle('on',index<=active));
  const status=__ctx.browser.document.querySelector('.worldStatus');if(status){status.textContent=`${__ctx.viewState.site.name} · ${phaseName} · прямой эфир`;status.setAttribute('aria-label',`Анимированная панорама: ${__ctx.viewState.site.name}. ${phaseName}. Уровень поселения ${__ctx.viewState.settlementLevel||0}.`);}
  if(__ctx.sceneEngine.canvas){__ctx.sceneEngine.canvas.dataset.location=terrain();__ctx.sceneEngine.canvas.dataset.phase=String(phase);__ctx.sceneEngine.canvas.setAttribute('role','img');__ctx.sceneEngine.canvas.setAttribute('aria-label',`Живая панорама — ${__ctx.viewState.site.name}; ${phaseName}`);}
 };
 const priorLog=__ctx.logMsg;
 __ctx.logMsg=function(text,kind){priorLog(text,kind);if(/вернул|доставлен|обмен.*заверш|спасён|рейс выполнен|приняты на склад/i.test(text)){activity={kind:'convoy',at:performance.now()};}};
 __ctx.browser.window.PredelWorld={terrain,presentationStage,phaseFloor,feedback:kind=>{activity={kind,at:performance.now()};},drawTerrain};
})();
} }
];
