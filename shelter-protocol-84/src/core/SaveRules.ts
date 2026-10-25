/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.saveSnapshot = function saveSnapshot(){const snap=JSON.parse(JSON.stringify(__ctx.state));snap.event=null;return snap;};

__ctx.normalizeLoadedState = function normalizeLoadedState(saved){
 const f=__ctx.freshState(),merged: any={...f,...saved};merged.resources={...f.resources,...(saved.resources||{})};merged.bunker={...f.bunker,...(saved.bunker||{})};merged.built={...(saved.built||{})};merged.lastProduction={...(saved.lastProduction||{})};merged.lastConsumption={...(saved.lastConsumption||{})};merged.lastIndustrial={...(saved.lastIndustrial||{})};merged.history=Array.isArray(saved.history)?saved.history.slice(-90):[];merged.log=Array.isArray(saved.log)?saved.log:[];merged.event=null;merged.ended=false;merged.saveVersion=12;merged.lossCauses={...f.lossCauses,...(saved.lossCauses||{})};merged.initialPopulation=Number(saved.initialPopulation)||Math.max(14,Math.round((merged.targetPop||40)*.42));merged.rescuedTotal=Number(saved.rescuedTotal)||Math.max(0,(Number(merged.population)||0)-merged.initialPopulation-(Number(merged.naturalGrowth)||0));merged.refugeeArrivals=Number(saved.refugeeArrivals)||0;merged.refugeeAccepted=Number(saved.refugeeAccepted)||0;merged.refugeeRefused=Number(saved.refugeeRefused)||0;merged.deathsTotal=Number(saved.deathsTotal)||0;merged.refugeeIncidents=Number(saved.refugeeIncidents)||0;merged.finalWin=null;if(merged.voiceEnabled===undefined) merged.voiceEnabled=true;if(merged.lastShortageAlertMonth===undefined) merged.lastShortageAlertMonth=-999;if(merged.lastHealthAlertMonth===undefined) merged.lastHealthAlertMonth=-999;if(!Array.isArray(saved.seenTechs))merged.seenTechs=__ctx.techCatalog.filter(t=>(merged.bunker.knowledge||0)>=t.knowledge).map(t=>t.id);else merged.seenTechs=[...saved.seenTechs];merged.orgReserve=__ctx.clamp(Number(merged.orgReserve)||0,0,2);merged.reserveBuildDiscount=__ctx.clamp(Number(merged.reserveBuildDiscount)||0,0,.16);merged.expeditionPrep=__ctx.clamp(Math.round(Number(merged.expeditionPrep)||0),0,2);merged.maintenancePrepared=!!merged.maintenancePrepared;merged.optimizationTarget=merged.optimizationTarget||null;merged.mobilizationTarget=merged.mobilizationTarget||null;merged.trainingProgress=Number(merged.trainingProgress)||0;merged.lastFoodPotential=Number(merged.lastFoodPotential)||0;merged.lastWaterSupply=Number(merged.lastWaterSupply)||0;merged.lastWaterHumanNeed=Number(merged.lastWaterHumanNeed)||0;merged.lastWaterForFood=Number(merged.lastWaterForFood)||0;merged.lastWaterFarmUse=Number(merged.lastWaterFarmUse)||0;merged.lastWaterDeficit=Number(merged.lastWaterDeficit)||0;merged.lastWaterFoodCapacity=Number(merged.lastWaterFoodCapacity)||0;return merged;
};

__ctx.autosaveGame = function autosaveGame(){if(__ctx.state.site&&!__ctx.state.event&&!__ctx.state.ended)__ctx.saveGame(false)};

__ctx.restoreCampaignState = function restoreCampaignState(){
 const pending=__ctx.state.pendingEvent;__ctx.state.pendingEvent=null;__ctx.state.event=null;
 if(!__ctx.state.ended&&pending){
  if(pending.title==='Беженцы у внешнего периметра'){
   const group=Number(pending.data?.group);if(!Number.isInteger(group)||group<1||group>1000)throw Error('Повреждены данные группы беженцев.');
   __ctx.state.event=__ctx.refugeeEvent(group);
  }else __ctx.maybeEvent(pending.title);
  if(!__ctx.state.event)throw Error('Не удалось восстановить сохранённое событие.');
 }
 if(__ctx.state.ended){const reason=__ctx.state.endReason||'Кампания завершена. Итоги восстановлены из сохранения.';__ctx.endGame(!!__ctx.state.finalWin,reason);}
 else __ctx.evaluate();
};
}
export const steps: Initialization[] = [
{ order:100, run(__ctx:Runtime){__ctx.SAVE_KEY = 'PREDEL_SAVE_V5';
} },
{ order:210, run(__ctx:Runtime){__ctx.originalNormalize = __ctx.normalizeLoadedState;
} },
{ order:211, run(__ctx:Runtime){__ctx.normalizeLoadedState=function(saved){const s=__ctx.originalNormalize(saved);__ctx.ensureWorld(s);if((saved.saveVersion||0)<13){s.log.unshift({m:s.month,cls:'warn',t:'Версия «Живой мир»: открыта ближняя карта. Наладьте 3D-печать для профилактики и сложного ремонта. Старые постройки и гуманитарный прогресс сохранены.'});}return s;};
} },
{ order:287, run(__ctx:Runtime){__ctx.originalLoadGame = __ctx.loadGame;
} },
{ order:364, run(__ctx:Runtime){__ctx.saveSnapshot=function(){
 const snap=JSON.parse(JSON.stringify(__ctx.state));
 snap.pendingEvent=__ctx.state.event?{title:__ctx.state.event.title,data:JSON.parse(JSON.stringify(__ctx.state.event.data||{}))}:null;
 snap.event=null;snap.missionTarget=null;snap.stabilityVersion=1;
 return snap;
};
} },
{ order:365, run(__ctx:Runtime){__ctx.saveGame=function(manual=false){
 if(!__ctx.state.site){if(manual){__ctx.logMsg('Сначала начните партию и выберите площадку.','warn');__ctx.renderLog();}__ctx.updateSaveUI();return false;}
 try{__ctx.storage.setItem(__ctx.SAVE_KEY,JSON.stringify(__ctx.saveSnapshot()));__ctx.storage.setItem(__ctx.SAVE_KEY+'_TIME',new Date().toISOString());if(manual){__ctx.logMsg(__ctx.state.event?'Игра сохранена вместе с нерешённым событием.':'Игра сохранена в этом браузере.','good');__ctx.renderLog();}__ctx.updateSaveUI();return true;}
 catch(e){if(manual){__ctx.logMsg('Не удалось записать сохранение в браузер.','bad');__ctx.renderLog();}return false;}
};
} },
{ order:366, run(__ctx:Runtime){__ctx.autosaveGame=function(){if(__ctx.state.site)__ctx.saveGame(false);};
} },
{ order:367, run(__ctx:Runtime){__ctx.stabilityNormalize = __ctx.normalizeLoadedState;
} },
{ order:368, run(__ctx:Runtime){__ctx.normalizeLoadedState=function(saved){
 const s=__ctx.stabilityNormalize(saved);
 for(const r of Object.keys(s.resources))s.resources[r]=Number.isFinite(s.resources[r])?Math.max(0,s.resources[r]):0;
 for(const [k,v] of __ctx.entries(s.bunker))if(!Number.isFinite(v))s.bunker[k]=__ctx.freshState().bunker[k]||0;else if(k!=='morale')s.bunker[k]=Math.max(0,v);
 s.ended=saved.ended===true;s.finalWin=typeof saved.finalWin==='boolean'?saved.finalWin:null;s.endReason=typeof saved.endReason==='string'?saved.endReason:null;
 s.pendingEvent=saved.pendingEvent&&typeof saved.pendingEvent.title==='string'?{title:saved.pendingEvent.title,data:saved.pendingEvent.data||{}}:null;
 s.missionTarget=null;s.environment=__ctx.computeEnvironment(s);s.stabilityVersion=1;
 for(const k of ['rescuedTotal','refugeeArrivals','refugeeAccepted','refugeeRefused','deathsTotal','refugeeIncidents','naturalGrowth'])if(Number.isFinite(saved[k]))s[k]=Math.max(0,saved[k]);
 __ctx.ensureWorld(s);return s;
};
} },
{ order:560, run(__ctx:Runtime){__ctx.balancedNormalize = __ctx.normalizeLoadedState;
} },
{ order:561, run(__ctx:Runtime){__ctx.normalizeLoadedState=function(saved){const s=__ctx.balancedNormalize(saved);if(!saved.balance||saved.balance.version!==__ctx.BALANCE_VERSION){s.balance=null;if(!Number.isFinite(saved.bunker?.protectedCapacity))s.bunker.protectedCapacity=Math.max(28,s.bunker.capacity);__ctx.ensureWorld(s);s.physical.design.protectedCapacity=s.bunker.protectedCapacity;}return s;};
} }
];
