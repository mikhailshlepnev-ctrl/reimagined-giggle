/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';
import catalog from './catalog.json';
import buildings from './buildings.json';
import techs from './techs.json';
import milestones from './milestones.json';
import ice from './scenarios/ice.json';
import heat from './scenarios/heat.json';
import nuclear from './scenarios/nuclear.json';
import epidemic from './scenarios/epidemic.json';
const scenarioList=[ice,heat,nuclear,epidemic];
const runtimeData:any={...catalog,modules:buildings,techCatalog:techs,settlementStages:milestones.settlementStages,scenarios:Object.fromEntries(scenarioList.map(({id,briefing,...rest})=>[id,rest])),scenarioBriefings:Object.fromEntries(scenarioList.map(({id,briefing})=>[id,briefing]))};

export function define(__ctx: Runtime):void {

}
export const steps: Initialization[] = [
{ order:18, run(__ctx:Runtime){__ctx.scenarios = structuredClone(runtimeData.scenarios);
} },
{ order:19, run(__ctx:Runtime){__ctx.cityNames = structuredClone(runtimeData.cityNames);
} },
{ order:20, run(__ctx:Runtime){__ctx.siteTypes = structuredClone(runtimeData.siteTypes);
} },
{ order:21, run(__ctx:Runtime){__ctx.modules = structuredClone(runtimeData.modules);
} },
{ order:22, run(__ctx:Runtime){__ctx.scavenges = structuredClone(runtimeData.scavenges);
} },
{ order:23, run(__ctx:Runtime){__ctx.deepRaidLoot = structuredClone(runtimeData.deepRaidLoot);
} },
{ order:24, run(__ctx:Runtime){__ctx.tradeValues = structuredClone(runtimeData.tradeValues);
} },
{ order:25, run(__ctx:Runtime){__ctx.tradeReserves = structuredClone(runtimeData.tradeReserves);
} },
{ order:26, run(__ctx:Runtime){__ctx.survivorSettlements = structuredClone(runtimeData.survivorSettlements);
} },
{ order:27, run(__ctx:Runtime){__ctx.laborPolicies = structuredClone(runtimeData.laborPolicies);
} },
{ order:28, run(__ctx:Runtime){__ctx.technologyTiers = structuredClone(runtimeData.technologyTiers);
} },
{ order:29, run(__ctx:Runtime){__ctx.techBranches = structuredClone(runtimeData.techBranches);
} },
{ order:30, run(__ctx:Runtime){__ctx.techCatalog = structuredClone(runtimeData.techCatalog);
} },
{ order:41, run(__ctx:Runtime){__ctx.industryChains = structuredClone(runtimeData.industryChains);
} },
{ order:55, run(__ctx:Runtime){__ctx.settlementStages = structuredClone(runtimeData.settlementStages);
} },
{ order:195, run(__ctx:Runtime){__ctx.resIcons = structuredClone(runtimeData.resIcons);
} },
{ order:197, run(__ctx:Runtime){__ctx.mapLocations = structuredClone(runtimeData.mapLocations);
} },
{ order:198, run(__ctx:Runtime){__ctx.printerLevels = structuredClone(runtimeData.printerLevels);
} },
{ order:199, run(__ctx:Runtime){__ctx.gearCatalog = structuredClone(runtimeData.gearCatalog);
} },
{ order:258, run(__ctx:Runtime){__ctx.moduleGroups = structuredClone(runtimeData.moduleGroups);
} },
{ order:280, run(__ctx:Runtime){__ctx.scenarioBriefings = structuredClone(runtimeData.scenarioBriefings);
} },
{ order:438, run(__ctx:Runtime){__ctx.healthCauseNames = structuredClone(runtimeData.healthCauseNames);
} },
{ order:602, run(__ctx:Runtime){__ctx.falloutBriefs = structuredClone(runtimeData.falloutBriefs);
} }
];
