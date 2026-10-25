import './visual/style.css';
import { TurnEngine } from './core/TurnEngine';
import { MemoryStorage } from './core/SaveSystem';
import { mountCommandCenter } from './visual/modern/CommandCenter';
import { mountGame } from './visual/BrowserHost';

let storage:Storage|MemoryStorage;
try{const probe='PREDEL_STORAGE_PROBE';localStorage.setItem(probe,'1');localStorage.removeItem(probe);storage=localStorage;}catch{storage=new MemoryStorage();}
const engine=new TurnEngine({storage});
const dispose=mountGame(engine);
const disposeCenter=mountCommandCenter(engine);
if(import.meta.hot)import.meta.hot.dispose(()=>{disposeCenter();dispose();engine.dispose();});
