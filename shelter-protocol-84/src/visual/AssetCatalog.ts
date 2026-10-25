/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../core/Runtime';
import runtimeData from '../assets/catalog.json';

export function define(__ctx: Runtime):void {

}
export const steps: Initialization[] = [
{ order:5, run(__ctx:Runtime){__ctx.scenarioVisuals = structuredClone(runtimeData.scenarioVisuals);
} },
{ order:339, run(__ctx:Runtime){__ctx.PREDEL_VOICE_DATA = structuredClone(runtimeData.PREDEL_VOICE_DATA);
} },
{ order:340, run(__ctx:Runtime){__ctx.PREDEL_VOICE_LINES = structuredClone(runtimeData.PREDEL_VOICE_LINES);
} },
{ order:632, run(__ctx:Runtime){__ctx.CINEMA_ASSETS = structuredClone(runtimeData.CINEMA_ASSETS);
} }
];
