/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.aiSpeak = function aiSpeak(message,priority='normal'){if(!__ctx.viewState.voiceEnabled||__ctx.audioEngine.muted||!('speechSynthesis' in __ctx.browser.window)||!message)return;try{if(priority!=='queue')speechSynthesis.cancel();const u: any=new SpeechSynthesisUtterance(__ctx.predelSpeechText(message));u.lang='ru-RU';u.rate=priority==='urgent'?0.98:0.93;u.pitch=0.74;u.volume=Math.min(.82,Math.max(.34,__ctx.audioEngine.volume*.95));const voices=speechSynthesis.getVoices();const ru=voices.find(v=>/^ru/i.test(v.lang)&&/female|irina|milena|oksana|anna/i.test(v.name))||voices.find(v=>/^ru/i.test(v.lang));if(ru)u.voice=ru;speechSynthesis.speak(u);}catch(e){}};

__ctx.createNoiseBuffer = function createNoiseBuffer(ctx){
 const len=ctx.sampleRate*2;
 const buf=ctx.createBuffer(1,len,ctx.sampleRate);
 const data=buf.getChannelData(0);
 for(let i=0;i<len;i++) data[i]=Math.random()*2-1;
 return buf;
};

__ctx.ensureAudio = function ensureAudio(){
 if(__ctx.audioEngine.ctx) return __ctx.audioEngine.ctx;
 const AC=__ctx.browser.window.AudioContext||__ctx.browser.window.webkitAudioContext;
 if(!AC) return null;
 const ctx: any=new AC();
 const master=ctx.createGain();
 master.gain.value=0;
 master.connect(ctx.destination);
 __ctx.audioEngine.ctx=ctx; __ctx.audioEngine.master=master; __ctx.audioEngine.noiseBuffer=__ctx.createNoiseBuffer(ctx);
 return ctx;
};

__ctx.stopAudioLayers = function stopAudioLayers(){
 __ctx.audioEngine.layers.forEach(layer=>{try{layer.stop&&layer.stop()}catch(e){}});
 __ctx.audioEngine.layers=[];
 if(__ctx.audioEngine.clicker && __ctx.audioEngine.clicker.stop){__ctx.audioEngine.clicker.stop(); __ctx.audioEngine.clicker=null;}
};

__ctx.makeNoiseLayer = function makeNoiseLayer(opts: any={}){
 const ctx=__ctx.audioEngine.ctx;
 const src=ctx.createBufferSource();
 src.buffer=__ctx.audioEngine.noiseBuffer; src.loop=true;
 const filter=ctx.createBiquadFilter(); filter.type=opts.type||'lowpass'; filter.frequency.value=opts.frequency||300; filter.Q.value=opts.q||0.6;
 const gain=ctx.createGain(); gain.gain.value=opts.gain||0.05;
 src.connect(filter); filter.connect(gain); gain.connect(__ctx.audioEngine.master); src.start();
 return {gain,filter,src,update(h){ if(opts.kind==='wind'){gain.gain.setTargetAtTime((opts.baseGain||0.03)+(h/100)*(opts.rangeGain||0.08),ctx.currentTime,0.5); filter.frequency.setTargetAtTime((opts.baseFreq||240)+(h/100)*(opts.rangeFreq||120),ctx.currentTime,0.6);} if(opts.kind==='hiss'){gain.gain.setTargetAtTime((opts.baseGain||0.02)+(h/100)*(opts.rangeGain||0.05),ctx.currentTime,0.5);} },stop(){try{src.stop()}catch(e){} gain.disconnect(); filter.disconnect();}};
};

__ctx.makeIceCracks = function makeIceCracks(){
 const ctx=__ctx.audioEngine.ctx; let alive=true; let timer=null;
 function one(){
   if(!alive) return;
   const osc=ctx.createOscillator(); const g=ctx.createGain();
   osc.type='triangle'; osc.frequency.value=420+__ctx.visualRng.rnd(-120,160);
   g.gain.value=0;
   osc.connect(g); g.connect(__ctx.audioEngine.master); osc.start();
   const now=ctx.currentTime;
   g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.018,now+0.01); g.gain.exponentialRampToValueAtTime(0.0001,now+0.22);
   osc.frequency.exponentialRampToValueAtTime(Math.max(120,osc.frequency.value*0.35),now+0.21);
   osc.stop(now+0.24);
 }
 function schedule(){ if(!alive) return; one(); timer=setTimeout(schedule,__ctx.visualRng.rnd(3500,9500)); }
 schedule();
 return {update(){},stop(){alive=false; clearTimeout(timer);}};
};

__ctx.makeGeiger = function makeGeiger(){
 const ctx=__ctx.audioEngine.ctx; let alive=true; let timer=null; let hazard=20;
 function burst(){
   if(!alive) return;
   const count=__ctx.visualRng.rnd(1,Math.max(2,Math.round(hazard/22)));
   for(let i=0;i<count;i++){
     const delay=i*(20+__ctx.visualRng.rnd(0,30));
     setTimeout(()=>{
       if(!alive) return;
       const src=ctx.createBufferSource(); src.buffer=__ctx.audioEngine.noiseBuffer;
       const filter=ctx.createBiquadFilter(); filter.type='highpass'; filter.frequency.value=2200+__ctx.visualRng.rnd(-500,700);
       const g=ctx.createGain(); g.gain.value=0.0001;
       src.connect(filter); filter.connect(g); g.connect(__ctx.audioEngine.master); src.start();
       const now=ctx.currentTime; g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.014,now+0.002); g.gain.exponentialRampToValueAtTime(0.0001,now+0.055); src.stop(now+0.06);
     }, delay);
   }
 }
 function schedule(){ if(!alive) return; burst(); timer=setTimeout(schedule, __ctx.clamp(1400-hazard*8,260,1300)); }
 schedule();
 return {update(h){hazard=h;},stop(){alive=false; clearTimeout(timer);}};
};

__ctx.makeBeaconChimes = function makeBeaconChimes(kind='radio'){
 const ctx=__ctx.audioEngine.ctx; let alive=true,timer=null,hazard=0,stage=0;
 function ping(){ if(!alive) return; const now=ctx.currentTime; const freqs=kind==='medical'?[540,720]:kind==='heat'?[370,520]:kind==='ice'?[420,560]:[300,460]; freqs.forEach((f,i)=>{const osc=ctx.createOscillator(),g=ctx.createGain(); osc.type=i%2?'sine':'triangle'; osc.frequency.value=f+(stage*8); g.gain.value=0.0001; osc.connect(g); g.connect(__ctx.audioEngine.master); osc.start(now+i*.06); g.gain.setValueAtTime(0.0001,now+i*.06); g.gain.linearRampToValueAtTime(0.012+(stage*.0015),now+i*.06+.015); g.gain.exponentialRampToValueAtTime(0.0001,now+i*.06+.28); osc.stop(now+i*.06+.3); }); }
 function schedule(){ if(!alive) return; ping(); const base=kind==='medical'?__ctx.clamp(5200-stage*380+hazard*16,1800,5200):__ctx.clamp(6800-stage*420+hazard*12,2500,6800); timer=setTimeout(schedule,base);}
 schedule();
 return {update(h,s){hazard=h;stage=s||0;},stop(){alive=false; clearTimeout(timer);}};
};

__ctx.musicProfile = function musicProfile(){const foodNeed=Math.max(1,__ctx.viewState.lastFoodNeed||8),foodRatio=__ctx.clamp((__ctx.viewState.resources.food||0)/(foodNeed*3),0,1.4),medRatio=__ctx.clamp((__ctx.viewState.resources.medicine||0)/(Math.max(1,(__ctx.viewState.lastConsumption?.medicine||2)*6)),0,1.4),panic=__ctx.clamp(Math.max((45-__ctx.viewState.morale)/45,(42-__ctx.viewState.health)/42,(.58-foodRatio),__ctx.viewState.event?.title?0.35:0,(__ctx.viewState.hazard||0)/140),0,1),growth=__ctx.clamp((__ctx.viewState.settlementLevel||0)/5,0,1),hope=__ctx.clamp(__ctx.resilience()/100,0,1),scarcity=__ctx.clamp(Math.max(0,.95-foodRatio)+Math.max(0,.95-medRatio),0,1.3),triumph=__ctx.viewState.ended&&__ctx.resilience()>62?1:__ctx.clamp((growth*.5)+(hope*.35)-(panic*.2),0,1);return{panic,growth,hope,scarcity,triumph};};

__ctx.midiFreq = function midiFreq(m){return 440*Math.pow(2,(m-69)/12)};

__ctx.buildScenarioAudio = function buildScenarioAudio(scenario){
 __ctx.stopAudioLayers();
 if(!__ctx.audioEngine.ctx) return;
 __ctx.audioEngine.layers.push(__ctx.makeAdaptiveScore(scenario));
 __ctx.audioEngine.layers.push(__ctx.makeSettlementHum());
 __ctx.audioEngine.layers.push(__ctx.makeIndustrialClicks());
 if(scenario==='ice'){
   __ctx.audioEngine.layers.push(__ctx.makeNoiseLayer({type:'lowpass',frequency:280,gain:0.055,kind:'wind',baseGain:0.045,rangeGain:0.075,baseFreq:180,rangeFreq:150}));
   __ctx.audioEngine.layers.push(__ctx.makeOscLayer({wave:'sine',freq:54,gain:0.022,lfoFreq:0.07,lfoDepth:3,kind:'drone',baseGain:0.018,rangeGain:0.02,baseFreq:48,rangeFreq:4}));
   __ctx.audioEngine.layers.push(__ctx.makeIceCracks()); __ctx.audioEngine.layers.push(__ctx.makeBeaconChimes('ice'));
 }
 if(scenario==='heat'){
   __ctx.audioEngine.layers.push(__ctx.makeNoiseLayer({type:'bandpass',frequency:1100,q:0.8,gain:0.026,kind:'hiss',baseGain:0.02,rangeGain:0.045}));
   __ctx.audioEngine.layers.push(__ctx.makeNoiseLayer({type:'lowpass',frequency:340,gain:0.034,kind:'wind',baseGain:0.02,rangeGain:0.05,baseFreq:280,rangeFreq:160}));
   __ctx.audioEngine.layers.push(__ctx.makeOscLayer({wave:'sawtooth',freq:68,gain:0.015,lfoFreq:0.11,lfoDepth:2.2,kind:'hum',baseGain:0.012,rangeGain:0.018}));
   __ctx.audioEngine.layers.push(__ctx.makeBeaconChimes('heat'));
 }
 if(scenario==='nuclear'){
   __ctx.audioEngine.layers.push(__ctx.makeNoiseLayer({type:'lowpass',frequency:260,gain:0.035,kind:'wind',baseGain:0.024,rangeGain:0.06,baseFreq:210,rangeFreq:130}));
   __ctx.audioEngine.layers.push(__ctx.makeOscLayer({wave:'triangle',freq:42,gain:0.02,lfoFreq:0.05,lfoDepth:1.5,kind:'drone',baseGain:0.018,rangeGain:0.028,baseFreq:40,rangeFreq:3}));
   __ctx.audioEngine.clicker=__ctx.makeGeiger(); __ctx.audioEngine.layers.push(__ctx.makeBeaconChimes('radio'));
 }
 if(scenario==='epidemic'){
   __ctx.audioEngine.layers.push(__ctx.makeNoiseLayer({type:'bandpass',frequency:520,q:0.7,gain:0.028,kind:'hiss',baseGain:0.02,rangeGain:0.03}));
   __ctx.audioEngine.layers.push(__ctx.makeOscLayer({wave:'triangle',freq:76,gain:0.016,lfoFreq:0.22,lfoDepth:6,kind:'hum',baseGain:0.012,rangeGain:0.018}));
   __ctx.audioEngine.layers.push(__ctx.makeBeaconChimes('medical'));
 }
 __ctx.updateAudioForHazard(__ctx.viewState.hazard||0);
};

__ctx.updateAudioForHazard = function updateAudioForHazard(h){
 const stage=__ctx.viewState.settlementLevel||0;
 __ctx.audioEngine.layers.forEach(layer=>layer.update&&layer.update(h,stage));
 if(__ctx.audioEngine.clicker&&__ctx.audioEngine.clicker.update) __ctx.audioEngine.clicker.update(h,stage);
};

__ctx.startAudioForScenario = async function startAudioForScenario(scenario){
 const ctx=__ctx.ensureAudio(); if(!ctx) return;
 if(ctx.state==='suspended') await ctx.resume();
 __ctx.audioEngine.scenario=scenario; __ctx.audioEngine.started=true; __ctx.audioEngine.muted=false;
 __ctx.buildScenarioAudio(scenario); __ctx.setMasterVolume(); __ctx.updateAudioUI();
};

__ctx.toggleAudio = function toggleAudio(){
 if(!__ctx.audioEngine.ctx){ if(__ctx.viewState.scenario) __ctx.startAudioForScenario(__ctx.viewState.scenario); else { __ctx.audioEngine.muted=!__ctx.audioEngine.muted; __ctx.updateAudioUI(); } return; }
 __ctx.audioEngine.muted=!__ctx.audioEngine.muted; if(!__ctx.audioEngine.muted && __ctx.audioEngine.ctx.state==='suspended') __ctx.audioEngine.ctx.resume(); __ctx.setMasterVolume(); __ctx.updateAudioUI();
};

__ctx.updateAudioUI = function updateAudioUI(){
 const btn=__ctx.browser.document.getElementById('soundToggle'); const st=__ctx.browser.document.getElementById('soundStatus');
 if(!__ctx.audioEngine.started || __ctx.audioEngine.muted){ btn.textContent='🔇 Звук'; st.textContent=__ctx.viewState.scenario?`атмосфера выключена`:`включится после запуска игры`; }
 else { btn.textContent='🔊 Звук'; const desc=__ctx.viewState.scenario?__ctx.scenarioVisuals[__ctx.viewState.scenario].audio:'атмосфера'; const stageTxt=__ctx.viewState.scenario?` · уровень ${__ctx.currentStage().name.toLowerCase()}`:''; const prof=__ctx.musicProfile(); const mood=prof.panic>.55?' · тревога':prof.triumph>.6?' · надежда':prof.growth>.45?' · развитие':' · выживание'; st.textContent=`${desc}${stageTxt}${mood}`; }
};

__ctx.predelSoundPhase = function predelSoundPhase(){
  if(__ctx.viewState.phase==='Обрушение')return 1;
  if(__ctx.viewState.phase==='Глубокий кризис')return 2;
  if(__ctx.viewState.phase==='Новая среда')return 3;
  return 0;
};
}
export const steps: Initialization[] = [
{ order:73, run(__ctx:Runtime){__ctx.audioEngine = {ctx:null,master:null,noiseBuffer:null,layers:[],clicker:null,started:false,muted:true,volume:.45,scenario:null};
} },
{ order:314, run(__ctx:Runtime){__ctx.originalAudioUI = __ctx.updateAudioUI;
} },
{ order:315, run(__ctx:Runtime){__ctx.updateAudioUI=function(){__ctx.originalAudioUI();const s=__ctx.browser.document.getElementById('soundStatus');if(s&&!__ctx.audioEngine.muted&&__ctx.viewState.scenario)s.textContent=`Диспетчер · ${__ctx.viewState.hazard<35?'живой город':__ctx.viewState.hazard<70?'тревожный эфир':'опасная поверхность'}`;};
} },
{ order:341, run(__ctx:Runtime){__ctx.PredelAudio = (() => {
  const pref: any = { voiceVolume:.9, voiceMode:'dispatcher', voiceURI:'', ambience:.85 };
  try { Object.assign(pref,JSON.parse(localStorage.getItem('PREDEL_AUDIO_V13')||'{}')); } catch (_) {}
  const queue=[];
  const seen: any=new Map();
  let current=null, utterance=null, generation=0, nextTimer=null, hideTimer=null, speaking=false;
  let caption=null, activeVoice=null, lastKey='', lastKeyAt=0;
  const clips=typeof __ctx.PREDEL_VOICE_DATA==='object'?__ctx.PREDEL_VOICE_DATA:{};
  const lineTexts=typeof __ctx.PREDEL_VOICE_LINES==='object'?__ctx.PREDEL_VOICE_LINES:{};
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function persist(){try{localStorage.setItem('PREDEL_AUDIO_V13',JSON.stringify(pref));}catch(_) {}}
  function enabled(){return !!__ctx.viewState.voiceEnabled&&!__ctx.audioEngine.muted&&!__ctx.browser.document.hidden;}
  function install(){
    if(__ctx.browser.document.getElementById('predelAudioStyle'))return;
    const style=__ctx.browser.document.createElement('style');style.id='predelAudioStyle';
    style.textContent=`.dispatcherCaption{position:fixed;left:22px;bottom:22px;max-width:min(580px,calc(100vw - 44px));z-index:130;display:none;grid-template-columns:32px 1fr 24px;align-items:start;gap:12px;padding:15px 17px;background:rgba(9,20,25,.95);border:1px solid #79b6a566;border-left:3px solid #9bd6bd;border-radius:10px;box-shadow:0 14px 45px #0008;color:#e3ede9;backdrop-filter:blur(18px)}.dispatcherCaption.on{display:grid}.dispatcherCaption.urgent{border-left-color:#f0a36d}.dispatcherWave{height:28px;display:flex;gap:3px;align-items:center;justify-content:center}.dispatcherWave i{width:3px;height:8px;background:#a9d7c4;border-radius:2px}.dispatcherCaption.speaking .dispatcherWave i{animation:dispatcherWave .7s infinite alternate}.dispatcherWave i:nth-child(2){animation-delay:-.3s!important}.dispatcherWave i:nth-child(3){animation-delay:-.5s!important}.dispatcherCaption strong{font-size:10px;letter-spacing:1.7px;text-transform:uppercase;color:#a5c8ba;display:block;margin-bottom:5px}.dispatcherCaption p{font-size:13px;line-height:1.55;margin:0}.dispatcherCaption button{padding:0;border:0;background:transparent;color:#9cacb0;font-size:22px;line-height:22px;cursor:pointer}.audioSettings{z-index:1100!important}.audioSettings .modal{max-width:590px}.audioSettings label{display:block;margin:14px 0}.audioSettings input[type=range]{width:100%;accent-color:#abd1b5}.audioSettings select{width:100%;margin-top:7px}.audioSettingRow{display:flex;gap:12px;align-items:center}.audioSettings .voiceHint{font-size:12px;color:#a4b4b7;line-height:1.6}.audioSettings .buttonRow{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}@keyframes dispatcherWave{to{height:24px}}@media(max-width:700px){.dispatcherCaption{left:10px;bottom:10px;max-width:calc(100vw - 20px);padding:12px;gap:8px}.dispatcherCaption p{font-size:12px;max-height:100px;overflow:auto}}@media(prefers-reduced-motion:reduce){.dispatcherCaption.speaking .dispatcherWave i{animation:none}}`;
    __ctx.browser.document.head.appendChild(style);
    caption=__ctx.browser.document.createElement('div');caption.className='dispatcherCaption';caption.id='dispatcherCaption';caption.setAttribute('aria-live','polite');
    caption.innerHTML='<div class="dispatcherWave" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div><strong>Диспетчер · канал 01</strong><p></p></div><button type="button" aria-label="Остановить сообщение">×</button>';
    caption.querySelector('button').onclick=()=>stop();__ctx.browser.document.body.appendChild(caption);
  }
  function subtitle(item){
    install();clearTimeout(hideTimer);caption.querySelector('p').textContent=item.text||lineTexts[item.key]||'Сообщение диспетчера';
    caption.classList.toggle('urgent',item.priority==='urgent');caption.classList.add('on');caption.classList.toggle('speaking',speaking);
  }
  function duck(yes){
    speaking=yes;if(caption)caption.classList.toggle('speaking',yes);
    if(__ctx.audioEngine.master&&__ctx.audioEngine.ctx){const p=__ctx.audioEngine.master.gain,t=__ctx.audioEngine.ctx.currentTime;p.cancelScheduledValues(t);p.setTargetAtTime(__ctx.audioEngine.muted?0:__ctx.audioEngine.volume*(yes?.3:1),t,.12);}
  }
  function stopCurrent(){
    generation++;
    if(current){try{current.pause();current.currentTime=0;current.src='';}catch(_){}current=null;}
    if(utterance&&'speechSynthesis'in __ctx.browser.window){try{speechSynthesis.cancel();}catch(_){}utterance=null;}
    clearTimeout(nextTimer);nextTimer=null;duck(false);
  }
  function stop(){queue.length=0;stopCurrent();clearTimeout(hideTimer);if(caption)caption.classList.remove('on');}
  function complete(gen){
    if(gen!==generation)return;current=null;utterance=null;duck(false);
    clearTimeout(nextTimer);nextTimer=setTimeout(playNext,280);
    clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!speaking&&!queue.length&&caption)caption.classList.remove('on');},4200);
  }
  function russianVoices(){return 'speechSynthesis'in __ctx.browser.window?speechSynthesis.getVoices().filter(v=>/^ru([_-]|$)/i.test(v.lang)):[];}
  function selectVoice(){const v=russianVoices();return v.find(x=>x.voiceURI===pref.voiceURI)||v.find(x=>/natural|neural|online|google|dmitry|svetlana/i.test(x.name))||v.find(x=>!/espeak|mbrola/i.test(x.name))||v[0]||null;}
  function systemSpeak(item,gen){
    if(!('speechSynthesis'in __ctx.browser.window)){complete(gen);return;}
    const v=selectVoice();if(!v){complete(gen);return;}
    const u: any=new SpeechSynthesisUtterance(__ctx.predelSpeechText(item.text));utterance=u;u.voice=v;u.lang='ru-RU';u.rate=.98;u.pitch=1;u.volume=Math.min(1,__ctx.audioEngine.volume*1.8*pref.voiceVolume);
    u.onend=()=>complete(gen);u.onerror=()=>complete(gen);speechSynthesis.speak(u);
    nextTimer=setTimeout(()=>complete(gen),Math.min(60000,Math.max(9000,item.text.length*110)));
  }
  function playNext(){
    nextTimer=null;if(!enabled()){queue.length=0;duck(false);return;}if(current||utterance||!queue.length)return;
    const item=queue.shift(),gen=++generation;duck(true);subtitle(item);lastKey=item.key;lastKeyAt=Date.now();
    if(pref.voiceMode==='system'){systemSpeak(item,gen);return;}
    const url=clips[item.key]||clips.event;
    if(!url){systemSpeak(item,gen);return;}
    const a: any=new Audio(url);current=a;a.dataset.priority=item.priority;a.volume=Math.min(1,__ctx.audioEngine.volume*1.8*pref.voiceVolume);a.preload='auto';
    a.onended=()=>complete(gen);a.onerror=()=>complete(gen);
    a.play().catch(()=>{if(gen===generation){complete(gen);if(caption)caption.classList.remove('speaking');}});
    nextTimer=setTimeout(()=>{if(gen===generation){try{a.pause();}catch(_){}complete(gen);}},65000);
  }
  function say(key,text='',priority='normal'){
    if(!enabled())return false;
    const now=Date.now(),same=seen.get(key)||0;
    if(now-same<1700||(current&&key===lastKey&&now-lastKeyAt<5500)||queue.some(x=>x.key===key))return false;
    seen.set(key,now);if(seen.size>120)for(const[k,t]of seen)if(now-t>60000)seen.delete(k);
    const item: any={key:clips[key]?key:'event',text:String(text||lineTexts[key]||'Поступило важное сообщение.'),priority};
    if(priority==='urgent'){
      if(speaking&&current&&current.dataset?.priority==='urgent'){queue.unshift(item);}else{queue.length=0;stopCurrent();queue.unshift(item);}
    }else{if(queue.length>=3)queue.shift();queue.push(item);}
    playNext();return true;
  }
  function classify(t,cls=''){
    const s=String(t).toLowerCase();
    if(/никто не вернул|погибла полностью|группа не вернулась|вся группа погиб/.test(s))return['mission_total_loss','urgent'];
    if(/не вернулось|погибли|погибло|потери населения|погибших|умерло/.test(s))return[/развед/.test(s)?'scout_loss':/экспедиц|вылазк|групп/.test(s)?'mission_loss':'casualty','urgent'];
    if(/новая среда|сформировалась новая/.test(s))return['phase_new','urgent'];
    if(/глубокий кризис/.test(s))return['phase_crisis','urgent'];
    if(/фаза: обрушение|режим изменился: обрушение|началось обрушение/.test(s))return['phase_collapse','urgent'];
    if(/дефицит воды|воды для населения|населению не хватает.*подачи/.test(s))return['water_shortage','urgent'];
    if(/критическ.*состояни|здоровье.*критическ/.test(s))return['low_health','urgent'];
    if(/критический дефицит|дефицит запасов/.test(s))return['shortage','urgent'];
    if(/не хватило (жилых )?мест|не хватило жилья|недостаточно жилья/.test(s))return['no_rooms','normal'];
    if(/сложный ремонт.*(невозможен|недоступен|нуж|останов)|нет.*запчаст|не хватает.*детал|нет деталей|нужны.*детал|ремонт.*принтер/.test(s))return['repairBlocked','normal'];
    if(/ледяной шторм/.test(s))return['event_ice','urgent'];
    if(/радиоактивный фронт/.test(s))return['event_radiation','urgent'];
    if(/очаг заражения/.test(s))return['event_infection','urgent'];
    if(/мутация штамма/.test(s))return['event_mutation','normal'];
    if(/пыльная жара/.test(s))return['event_heat','normal'];
    if(/повреждение насосов/.test(s))return['event_pump','normal'];
    if(/старый склад данных|серверную и техническую библиотеку/.test(s))return['event_archive','normal'];
    if(/новые беженцы|у ворот|прибыли бежен|группа беженцев.*пришла|беженцы.*просят/.test(s))return['refugee_arrival','normal'];
    if(/принято.*бежен|приняли.*бежен|беженц.*приняты|спасено.*бежен/.test(s))return['refugee_accepted','normal'];
    if(/ворота не открыли|беженц.*отказ|отказ.*бежен/.test(s))return['refugee_refused','normal'];
    if(/обычный доступ.*(потерян|закрыт)|город.*недоступен/.test(s))return['city_closed','urgent'];
    if(/принтер.*(модерниз|улучш|уровень [234])/.test(s))return['printerUpgrade','normal'];
    if(/(3d|3д|трёхмерн|трехмерн).*принтер.*(постро|работ|готов)|построено.*принтер/.test(s))return['printerReady','normal'];
    if(/(партия|печать|изготовлено).*запчаст|запчасти.*(готов|изготов)/.test(s))return['partsReady','normal'];
    if(/снаряжен.*(готов|изготов)|защитный комплект.*(готов|изготов)|дрон.*(собран|готов)|напечатано.*(снаряж|комплект)/.test(s))return['gearReady','normal'];
    if(/беспилот|дрон.*развед/.test(s)&&/открыт|обновл|заверш|разведан/.test(s))return['drone','normal'];
    if(/развед.*(откры|обнаруж|сектор|карт)|карта.*(открыт|обновл)/.test(s))return['scout_found','normal'];
    if(/развед.*(вернул|заверш)/.test(s))return['scout_return','normal'];
    if(/вернулись|вернулось|вылазка:/.test(s))return['mission_success','normal'];
    if(/установлена.*связь|устойчивый контакт/.test(s))return['contact','normal'];
    if(/обмен.*(доставлен|заверш)|отдано:/.test(s))return['trade','normal'];
    if(/технологии открыты|новые технологии|технолог.*разблок|освоен.*технолог/.test(s))return['techUnlocked','normal'];
    if(/новый уровень|поселение выросло|этап развития|новая ступень|поселение перешло|развитие:/.test(s))return['milestone','normal'];
    if(/фермы ограничены водой/.test(s))return['farm_water','normal'];
    if(/износ системы|оборудование повреждено|повреждены.*систем/.test(s))return['damage','normal'];
    if(/обслуживание.*(заверш|провед)|системы восстановлены|насосы восстановлены|техническое обслуживание:/.test(s))return['repair','normal'];
    if(/построен|построено|строительство:/.test(s))return['build','normal'];
    if(/модернизирован|улучшено:|улучшен:/.test(s))return['upgrade','normal'];
    if(/не хватает ресурсов|недостаточно ресурсов/.test(s))return['need_resources','normal'];
    if(/площадка:|выбрана площадка|площадка выбрана/.test(s))return['site','normal'];
    return null;
  }
  function report(text,cls=''){
    const found=classify(text,cls);if(!found)return false;
    return say(found[0],text,found[1]);
  }
  function setVolume(v){__ctx.audioEngine.volume=Math.max(0,Math.min(1,Number(v)||0));if(current)current.volume=Math.min(1,__ctx.audioEngine.volume*1.8*pref.voiceVolume);duck(speaking);}
  function openSettings(){
    install();let modal=__ctx.browser.document.getElementById('predelAudioSettings');if(modal)modal.remove();
    modal=__ctx.browser.document.createElement('div');modal.id='predelAudioSettings';modal.className='overlay audioSettings';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','audioSettingsTitle');
    const voices=russianVoices();
    modal.innerHTML=`<div class="modal"><div class="smallcaps">КАНАЛ СВЯЗИ 01</div><h2 id="audioSettingsTitle">Звук и диспетчер</h2><p class="muted">Голос остаётся спокойным, пока есть время действовать. Важные сообщения сопровождаются полным текстом.</p><label class="audioSettingRow"><input type="checkbox" id="voiceOn" ${__ctx.viewState.voiceEnabled?'checked':''}> Озвучивать важные события</label><label>Голос диспетчера<select id="dispatcherVoice"><option value="dispatcher" ${pref.voiceMode==='dispatcher'?'selected':''}>Диспетчер — встроенная озвучка</option>${voices.map(v=>`<option value="${escapeHTML(v.voiceURI)}" ${pref.voiceMode==='system'&&pref.voiceURI===v.voiceURI?'selected':''}>${escapeHTML(v.name)}</option>`).join('')}</select></label><p class="voiceHint">Встроенный диспетчер работает без интернета. Точные количества и параметры всегда видны в сообщении и журнале. Системный голос читает сообщение целиком; его качество зависит от устройства.</p><label>Общая громкость <span id="masterVolumeLabel">${Math.round(__ctx.audioEngine.volume*100)}%</span><input type="range" id="audioMaster" min="0" max="100" value="${Math.round(__ctx.audioEngine.volume*100)}"></label><label>Громкость голоса <span id="voiceVolumeLabel">${Math.round(pref.voiceVolume*100)}%</span><input type="range" id="audioVoice" min="0" max="100" value="${Math.round(pref.voiceVolume*100)}"></label><label>Звуки внешнего мира <span id="ambienceVolumeLabel">${Math.round(pref.ambience*100)}%</span><input type="range" id="audioAmbience" min="0" max="100" value="${Math.round(pref.ambience*100)}"></label><div class="buttonRow"><button id="testDispatcher">Проверить связь</button><button class="primary" id="closeAudioSettings">Готово</button></div></div>`;
    __ctx.browser.document.body.appendChild(modal);
    const close=()=>{modal.remove();__ctx.browser.document.getElementById('audioSettingsBtn')?.focus();};
    modal.onclick=e=>{if(e.target===modal)close();};modal.querySelector('#closeAudioSettings').onclick=close;
    modal.querySelector('#voiceOn').onchange=e=>{__ctx.commands.setVoiceEnabled(e.target.checked);if(!__ctx.viewState.voiceEnabled)stop();};
    modal.querySelector('#dispatcherVoice').onchange=e=>{stop();pref.voiceMode=e.target.value==='dispatcher'?'dispatcher':'system';pref.voiceURI=pref.voiceMode==='system'?e.target.value:'';persist();};
    modal.querySelector('#audioMaster').oninput=e=>{setVolume(e.target.value/100);modal.querySelector('#masterVolumeLabel').textContent=e.target.value+'%';const slider=__ctx.browser.document.getElementById('volumeSlider');if(slider)slider.value=e.target.value;__ctx.updateAudioUI();};
    modal.querySelector('#audioVoice').oninput=e=>{pref.voiceVolume=e.target.value/100;modal.querySelector('#voiceVolumeLabel').textContent=e.target.value+'%';if(current)current.volume=Math.min(1,__ctx.audioEngine.volume*1.8*pref.voiceVolume);persist();};
    modal.querySelector('#audioAmbience').oninput=e=>{pref.ambience=e.target.value/100;modal.querySelector('#ambienceVolumeLabel').textContent=e.target.value+'%';persist();};
    modal.querySelector('#testDispatcher').onclick=async()=>{if(__ctx.audioEngine.muted&&__ctx.viewState.scenario)await __ctx.startAudioForScenario(__ctx.viewState.scenario);__ctx.commands.setVoiceEnabled(true);modal.querySelector('#voiceOn').checked=true;say('welcome',lineTexts.welcome,'urgent');};
    modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});modal.querySelector('#closeAudioSettings').focus();
  }
  function intro(scenario,text=''){stop();return say('intro_'+scenario,text||lineTexts['intro_'+scenario],'urgent');}
  function reset(){stop();seen.clear();lastKey='';}
  __ctx.browser.document.addEventListener('visibilitychange',()=>{if(__ctx.browser.document.hidden){stop();try{__ctx.audioEngine.ctx?.suspend();}catch(_){}}else if(__ctx.audioEngine.started&&!__ctx.audioEngine.muted){try{__ctx.audioEngine.ctx?.resume();}catch(_){}}});
  return {say,report,intro,stop,reset,setVolume,openSettings,pref,get embedded(){return Object.keys(clips).length>0;},get speaking(){return speaking;},get status(){return {speaking,queued:queue.length,currentKey:lastKey,embeddedClips:Object.keys(clips).length};},get voices(){return russianVoices();},classify};
})();
} },
{ order:343, run(__ctx:Runtime){__ctx.aiSpeak = function(message,priority='normal') {
  const found=__ctx.PredelAudio.classify(message);
  return found?__ctx.PredelAudio.say(found[0],message,priority==='urgent'?'urgent':found[1]):__ctx.PredelAudio.say('event',message,priority);
};
} },
{ order:347, run(__ctx:Runtime){__ctx.buildScenarioAudio = function(scenario){
  __ctx.stopAudioLayers();if(!__ctx.audioEngine.ctx)return;
  __ctx.audioEngine.layers.push(__ctx.makePredelLivingAmbience(scenario));
  const score=__ctx.makeAdaptiveScore(scenario),original=score.update;
  score.update=(h,s)=>original.call(score,h,s);
  __ctx.audioEngine.layers.push(score);__ctx.updateAudioForHazard(__ctx.viewState.hazard||0);
};
} },
{ order:350, run(__ctx:Runtime){__ctx.predelOriginalStartAudio = __ctx.startAudioForScenario;
} },
{ order:351, run(__ctx:Runtime){__ctx.startAudioForScenario = async function(scenario){__ctx.PredelAudio.reset();return __ctx.predelOriginalStartAudio(scenario);};
} },
{ order:529, run(__ctx:Runtime){__ctx.physicalAudioSay = __ctx.browser.window.PredelAudio.say;
} },
{ order:674, run(__ctx:Runtime){__ctx.buildScenarioAudio=function(scenario){__ctx.stopAudioLayers();if(!__ctx.audioEngine.ctx)return;__ctx.audioEngine.layers.push(__ctx.makePredelLivingAmbience(scenario));__ctx.updateAudioForHazard(__ctx.viewState.hazard||0);};
} },
{ order:676, run(__ctx:Runtime){__ctx.v17AudioUI = __ctx.updateAudioUI;
} },
{ order:677, run(__ctx:Runtime){__ctx.updateAudioUI=function(){__ctx.v17AudioUI();const el=__ctx.browser.document.getElementById('soundStatus');if(el&&!__ctx.audioEngine.muted&&__ctx.audioEngine.started&&__ctx.viewState.scenario){const names: any={ice:['зимний город','лавины и тревога','метель и треск льда','полярная пустошь'],heat:['летний город','пожары и тревога','песчаная буря','выжженная пустошь'],nuclear:['живой город','удары и обрушения','радиоактивные руины','мёртвая зона'],epidemic:['живой район','сирены и карантин','зона изоляции','покинутый город']};el.textContent=`${names[__ctx.viewState.scenario]?.[__ctx.predelSoundPhase()]||'внешний мир'} · ${__ctx.viewState.phase}`;}};
} }
];
