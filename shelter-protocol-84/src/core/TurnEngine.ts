import { coreModules } from './SystemRegistry';
import { EventBus } from './EventBus';
import { deepReadonlySnapshot, type GameState } from './State';
import { SaveSystem, MemoryStorage, type StorageLike, SAVE_KEY } from './SaveSystem';
import type { Runtime } from './Runtime';
import {validateConfiguration} from '../config/validate';
import milestones from '../config/milestones.json';

export interface EngineEvent { type: string; payload?: any }
export interface CommandResult { ok: boolean; error?: string; value?: unknown }
export interface EngineOptions { seed?: number; storage?: StorageLike; now?: () => string }
const commands = new Set('startGame chooseSite buildModule scavenge deepCityRaid establishRadioContact tradeExpedition nextMonth resolveEvent setLaborPolicy useOrgReserve operationMaintenance operationOptimize operationTraining operationMobilize operationPrepareExpedition setPrinterMode craftGear repairGear repairSystem surveySector recoverMapSite selectSector sectorMission operationTreatment admitWaitingRefugees repairRoute sealShelter setServicePriority aidWaitingRefugees answerTradeOffer evacuateSurvivors emergencyRecycle saveGame loadGame deleteSave previewScenario setTab setVoiceEnabled'.split(' '));
const permittedDuringEvent = new Set('saveGame loadGame deleteSave nextMonth resolveEvent previewScenario setTab setVoiceEnabled'.split(' '));

/** Preserves Predel's existing rules; owns mutation, randomness and persistence.
 * No browser, Canvas or audio objects are needed to run this engine.
 */
export class TurnEngine {
  readonly events = new EventBus<{ effect: EngineEvent; change: Readonly<GameState> }>();
  private readonly runtime: Runtime;
  private readonly saves: SaveSystem;
  private readonly now: () => string;
  private randomState: number;
  private snapshot: any;
  private busy = 0;
  private pendingChange = false;

  constructor(options: EngineOptions = {}) {
    validateConfiguration();
    this.randomState = (options.seed ?? Date.now()) >>> 0 || 1;
    const storage=options.storage ?? new MemoryStorage();
    this.saves = new SaveSystem(storage);
    this.now = options.now ?? (() => new Date().toISOString());
    const r: Runtime = this.runtime = { state: {}, random: () => this.random(), input: id => ({ value: r.inputs?.[id],focus:()=>r.emit('focus',id) }), emit: (type,payload) => this.events.emit('effect',{type,payload}), invalidate: () => this.refresh(), viewState: null };
    r.phaseForMonth=(month:number)=>milestones.phases.find(phase=>month>=phase.firstMonth&&month<=phase.lastMonth)?.name??milestones.phases.at(-1)!.name;
    r.inputs = {};
    r.entries=(object:any):[string,any][]=>Object.entries(object);r.values=(object:any):any[]=>Object.values(object);
    r.storage = storage;
    r.defer = (callback: () => void) => { callback(); return 0; };
    r.voice = { say:(...args:any[]) => r.emit('speech',args), reset:() => r.emit('voiceReset'), stop:()=>r.emit('voiceStop') };
    for (const name of ['renderLog','updateSaveUI','applyScenarioTheme','updateDynamicAtmosphere','flashAlert','hideCinematic','closeScenarioIntro','updateAudioUI']) r[name]=(...args:any[])=>r.emit(name,args);
    r.aiSpeak = (...args:any[])=>r.emit('speak',args);
    r.aiNotice = (...args:any[])=>r.emit('notice',args);
    r.playEventCue = (...args:any[])=>r.emit('cue',args);
    r.announceEvent = (...args:any[])=>r.emit('announce',args);
    for(const name of ['aiSpeak','aiNotice','playEventCue','announceEvent'])r['notify_'+name]=(...args:any[])=>r.emit(({aiSpeak:'speak',aiNotice:'notice',playEventCue:'cue',announceEvent:'announce'} as any)[name],args);
    r.requestTab = (tab:string)=>{r.state.uiTab=tab;r.emit('tab',tab);};
    r.resetGame = ()=>{if(r.state.scenario||r.state.site)this.reset();};
    for(const module of coreModules)module.define(r);
    for(const step of coreModules.flatMap(m=>m.steps).sort((a,b)=>a.order-b.order))step.run(r);
    r.saveGame=(manual=false)=>this.save(manual);
    r.autosaveGame=()=>r.state.site?this.save(false):false;
    r.loadGame=()=>this.load();
    r.hasSave=()=>this.saves.has();
    r.getSaveInfo=()=>{try{const s=this.saves.load();return s?{month:s.month,scenario:s.scenario,stage:s.settlementLevel||0,time:r.storage.getItem(SAVE_KEY+'_TIME')}:null;}catch{return null;}};
    r.deleteSave=()=>{this.saves.remove();r.storage.removeItem(SAVE_KEY+'_TIME');r.emit('deleted');return true;};
    const log=r.logMsg;
    r.logMsg=(text:string,kind='')=>{log(text,kind);r.emit('log',{text,kind});};
    this.reset();
  }

  private random(): number {
    let x=this.randomState;x^=x<<13;x^=x>>>17;x^=x<<5;this.randomState=x>>>0||1;
    if(this.runtime?.state)this.runtime.state.rngState=this.randomState;
    return this.randomState/4294967296;
  }
  private reset():void {
    const r=this.runtime;r.state=r.freshState();r.state.prepMonths=milestones.preparationMonths;r.state.rngState=this.randomState;r.ensureWorld();this.snapshot=undefined;
  }
  private refresh():void {
    const r=this.runtime;
    if(r.state.scenario){r.ensureWorld();r.updateSettlementStage();r.syncTechnologyUnlocks();}
    this.snapshot=undefined;r.autosaveGame?.();this.pendingChange=true;
    if(!this.busy)this.flush();
  }
  private flush():void { if(this.pendingChange){this.pendingChange=false;this.snapshot=undefined;this.events.emit('change',this.getState());} }
  getState():Readonly<GameState> { return this.snapshot ??= deepReadonlySnapshot(this.runtime.state); }
  subscribe(listener:(state:Readonly<GameState>)=>void):()=>void { return this.events.on('change',listener); }
  dispatch(name:string,args:any[]=[],inputs:Record<string,unknown>={}):CommandResult {
    if(!commands.has(name))return {ok:false,error:'Неизвестная команда: '+name};
    const r=this.runtime;
    if((r.state.event||r.state.ended)&&!permittedDuringEvent.has(name))return {ok:false,error:'Сначала завершите текущее событие или партию.'};
    this.busy++;r.inputs={...inputs};
    try {
      let value:unknown;
      if(name==='previewScenario'){
        if(r.state.site||!r.scenarios[args[0]])return {ok:false,error:'Недопустимый сценарий'};
        r.state.scenario=args[0];r.state.environment=r.computeEnvironment(r.state);this.snapshot=undefined;return {ok:true};
      }
      if(name==='setTab'){r.state.uiTab=String(args[0]);this.snapshot=undefined;return {ok:true};}
      if(name==='setVoiceEnabled'){r.state.voiceEnabled=!!args[0];this.snapshot=undefined;return {ok:true};}
      if(name==='startGame'&&(!r.scenarios[args[0]]||![24,40,64,96].includes(args[1])||![.9,1,1.18].includes(args[2])))return {ok:false,error:'Недопустимые параметры партии'};
      value=r[name](...args);
      this.snapshot=undefined;this.pendingChange=true;
      if(value instanceof Promise)value.catch(error=>r.emit('error',String(error)));
      return {ok:true,value};
    } catch(error) { return {ok:false,error:error instanceof Error?error.message:String(error)}; }
    finally {this.busy--;if(!this.busy)this.flush();}
  }
  exportSave():string { return this.saves.encode(this.runtime.state); }
  loadSave(json:string):CommandResult {
    const r=this.runtime,previous=r.state,rng=this.randomState;
    try {
      const decoded=this.saves.decode(json);
      r.state={...previous};
      const next=r.normalizeLoadedState(decoded);
      r.state=next;this.randomState=Number(decoded.rngState)>>>0||Number(decoded.worldSeed)>>>0||1;
      r.state.rngState=this.randomState;r.restoreCampaignState();this.snapshot=undefined;r.emit('loaded');this.refresh();return {ok:true};
    } catch(error) {r.state=previous;this.randomState=rng;this.snapshot=undefined;return {ok:false,error:error instanceof Error?error.message:String(error)};}
  }
  private save(manual=false):boolean {
    const r=this.runtime;if(!r.state.site)return false;
    try{this.saves.save(r.state);r.storage.setItem(SAVE_KEY+'_TIME',this.now());if(manual){r.logMsg('Игра сохранена в этом браузере.','good');r.emit('saved');}return true;}catch(error){if(manual)r.emit('error',String(error));return false;}
  }
  private load():boolean {const raw=this.runtime.storage.getItem(SAVE_KEY);if(!raw)return false;const result=this.loadSave(raw);if(!result.ok)this.runtime.emit('error',result.error);return result.ok;}
  /** Internal adapter hook. Applications should use getState/dispatch/subscribe. */
  attachPresentation(attach:(runtime:Runtime)=>void):void {attach(this.runtime);}
  dispose():void {this.events.dispose();}
}
