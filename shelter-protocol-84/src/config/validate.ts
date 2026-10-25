import buildings from './buildings.json';
import techs from './techs.json';
import milestones from './milestones.json';

/** Fail at initialization, rather than halfway through a 84-month campaign. */
export function validateConfiguration():void {
  for(const [id,building] of Object.entries(buildings)) {
    if(!building.name||!building.cost||!building.effect)throw new Error('Неполное описание здания: '+id);
    for(const [resource,amount] of Object.entries(building.cost))if(!Number.isFinite(amount)||amount<0)throw new Error('Некорректная стоимость '+id+'/'+resource);
    for(const [system,value] of Object.entries(building.effect))if(!Number.isFinite(value))throw new Error('Некорректный эффект '+id+'/'+system);
  }
  const ids=new Set<string>();
  for(const technology of techs){if(ids.has(technology.id)||!technology.name||!Number.isFinite(technology.knowledge)||technology.knowledge<0)throw new Error('Некорректная технология: '+technology.id);ids.add(technology.id);}
  let next=0;for(const phase of milestones.phases){if(phase.firstMonth!==next||phase.lastMonth<phase.firstMonth)throw new Error('Разрыв последовательности этапов');next=phase.lastMonth+1;}
  if(next!==milestones.campaignMonths+1)throw new Error('Этапы не покрывают всю кампанию');
}
