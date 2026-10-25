import { viewModules } from './ViewRegistry';
import { TurnEngine } from '../core/TurnEngine';
import type { Runtime } from '../core/Runtime';

/** DOM, Canvas, speech and downloads live at this boundary. */
export function mountGame(engine:TurnEngine):()=>void {
  let dispose=()=>{};
  engine.attachPresentation(r=>{
    r.browser={document,window};
    r.visualRng={rnd:(a:number,b:number)=>Math.floor(a+Math.random()*(b-a+1)),pick:(items:any[])=>items[Math.floor(Math.random()*items.length)],shuffle:(items:any[])=>[...items].sort(()=>Math.random()-.5)};
    Object.defineProperty(r,'viewState',{get:()=>engine.getState(),configurable:true});
    const inputs=()=>Object.fromEntries(['deepRaidTarget','tradeWant','tradeGive','tradeAmount','tradeTeam','opOptimizeTarget','opMobilizeTarget'].map(id=>[id,(document.getElementById(id) as HTMLInputElement)?.value]));
    const execute=(name:string)=>(...args:any[])=>{
      const result=engine.dispatch(name,args,inputs());
      if(!result.ok){r.logMsg(result.error,'warn');r.renderLog?.();}
      return result.value;
    };
    const direct=new Set('showTab setBuildFilter setBuildQuery closeScenarioIntro showScenarioIntro setIntroProgress exportSave importSave generateFinalPDF refreshTradeRisk'.split(' '));
    r.commands=new Proxy({}, {get:(_,key:string)=>direct.has(key)?(...args:any[])=>r[key](...args):execute(key)});
    for(const module of viewModules)module.define(r);
    // Imported state goes through validation and migration before the current game changes.
    r.importSave=()=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(file.size>5000000){alert('Файл сохранения слишком большой.');return;}const result=engine.loadSave(await file.text());if(!result.ok)alert('Не удалось загрузить сохранение: '+result.error);};input.click();};
    r.exportSave=()=>{if(!engine.getState().site)return;const blob=new Blob([engine.exportSave()],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`PREDEL_save_M${engine.getState().month}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    for(const step of viewModules.flatMap(m=>m.steps).sort((a,b)=>a.order-b.order))step.run(r);
    const repaint=()=>r.render?.();
    const unsubscribe=engine.subscribe(repaint);
    const effects=engine.events.on('effect',({type,payload})=>{
      switch(type){
        case 'started':
          document.getElementById('startOverlay')!.style.display='none';r.fxEngine.particles=[];r.applyScenarioTheme();r.updateDynamicAtmosphere();
          Promise.resolve(r.startAudioForScenario(payload.scenario)).finally(()=>{r.renderEnvironmentTelemetry();r.showScenarioIntro(payload.scenario);});break;
        case 'loaded':
          r.closeScenarioIntro();document.getElementById('startOverlay')!.style.display='none';document.getElementById('endOverlay')!.style.display='none';
          if(r.audioEngine.ctx){r.buildScenarioAudio(engine.getState().scenario);r.audioEngine.scenario=engine.getState().scenario;r.setMasterVolume();}r.fxEngine.particles=[];if(engine.getState().ended)r.presentEndGame(!!engine.getState().finalWin,engine.getState().endReason);break;
        case 'ended':r.presentEndGame?.(payload.win,payload.reason);break;
        case 'speak':r.aiSpeak(...payload);break;
        case 'notice':r.aiNotice(...payload);break;
        case 'cue':r.playEventCue(...payload);break;
        case 'announce':r.announceEvent(...payload);break;
        case 'speech':r.PredelAudio?.say(...payload);break;
        case 'voiceReset':r.PredelAudio?.reset();break;
        case 'voiceStop':r.PredelAudio?.stop();break;
        case 'log':r.PredelAudio?.report(payload.text,payload.kind);break;
        case 'tab':r.showTab(payload);break;
        case 'focus':document.getElementById(payload)?.focus();break;
        case 'saved':r.updateSaveUI();r.renderLog();break;
        case 'deleted':r.initStart();break;
        case 'error':console.error(payload);break;
      }
    });
    (window as any).game=r.commands;
    document.getElementById('nextBtn')!.onclick=execute('nextMonth');
    document.getElementById('soundToggle')!.onclick=r.toggleAudio;
    document.getElementById('saveBtn')!.onclick=()=>execute('saveGame')(true);
    document.getElementById('loadBtn')!.onclick=execute('loadGame');
    document.getElementById('volumeSlider')!.oninput=(event)=>{r.audioEngine.volume=Number((event.target as HTMLInputElement).value)/100;if(r.audioEngine.ctx)r.setMasterVolume();r.updateAudioUI();};
    r.updateAudioUI();r.updateSaveUI();r.primeScenarioImages();r.initFX();r.initSceneAnim();r.initMapScene();r.initCinematics();r.initStart();
    const pagehide=()=>execute('saveGame')(false);window.addEventListener('pagehide',pagehide);
    dispose=()=>{effects();unsubscribe();window.removeEventListener('pagehide',pagehide);r.stopAudioLayers();r.PredelAudio?.stop();};
  });
  return ()=>dispose();
}
