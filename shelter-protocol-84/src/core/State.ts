/** The existing ПРЕДЕЛ state contract. Names and units match PREDEL_SAVE_V5. */
export const SCENARIO_IDS = ['ice', 'heat', 'nuclear', 'epidemic'] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];
export type ResourceKey = 'concrete' | 'steel' | 'machinery' | 'fuel' | 'food' | 'electronics' | 'medicine' | 'parts' | 'precisionParts';
export type ResourceStock = Partial<Record<ResourceKey, number>> & Record<string, number>;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue | undefined };
export type ExtensionFields = { [key: string]: unknown };

export interface BunkerState extends Record<string, number | undefined> {
  integrity: number;
  shield: number;
  thermal: number;
  water: number;
  power: number;
  foodSystem: number;
  medical: number;
  workshop: number;
  storage: number;
  intel: number;
  knowledge: number;
  capacity: number;
  morale: number;
  biosecurity: number;
  ventilation?: number;
  deconCapacity?: number;
  protectedCapacity?: number;
  receptionCapacity?: number;
}

export interface SiteState extends ExtensionFields {
  id?: number;
  name: string;
  desc?: string;
  tags?: string[];
  mods?: Record<string, number>;
}

export interface PendingEventDTO {
  title: string;
  data: Record<string, JsonValue | undefined>;
}
export interface LiveGameEvent extends ExtensionFields {
  title: string;
  text?: string;
  data?: Record<string, JsonValue | undefined>;
  choices?: Array<[string, (() => void)?]>;
}
export interface LogEntry extends ExtensionFields { m: number; t: string; cls: string; }
export interface WeatherState extends ExtensionFields { id: string; name: string; intensity: number; storm: boolean; }
export interface EnvironmentState extends ExtensionFields {
  month: number;
  scenario: ScenarioId;
  severity: number;
  temperature: number;
  radiation: number;
  bio: number;
  dust: number;
  wind: number;
  visibility: number;
  weather: WeatherState;
  visualSeverity?: number;
  prevalence?: number;
}
export interface RadioContact extends ExtensionFields { name: string; trust: number; distance: number; }
export interface TradeOffer extends ExtensionFields {
  requested: string; offered: string; amount: number; receive: number; month: number; expires: number;
}
export interface CommunityState extends ExtensionFields { nextOfferMonth: number | null; offer: TradeOffer | null; }
export interface RescuePointState extends ExtensionFields { remaining: number; rescued: number; lastMonth: number; }

/** Unknown extension fields are retained so physical/balance migrations stay lossless. */
export interface GameState extends ExtensionFields {
  scenario: ScenarioId | null;
  city: string | null;
  site: SiteState | null;
  month: number;
  prepMonths: number;
  year: number;
  phase: string;
  population: number;
  specialists: number;
  health: number;
  morale: number;
  hazard: number;
  cityAccess: number;
  targetPop: number;
  actions: number;
  actionCapacity: number;
  resources: ResourceStock;
  bunker: BunkerState;
  built: Record<string, number>;
  sites: SiteState[];
  event: LiveGameEvent | null;
  pendingEvent?: PendingEventDTO | null;
  log: LogEntry[];
  ended: boolean;
  finalWin: boolean | null;
  saveVersion: number;
  settlementLevel: number;
  rescuedTotal: number;
  deathsTotal: number;
  initialPopulation: number;
  history: Array<Record<string, unknown>>;
  environment?: EnvironmentState | null;
  worldSeed?: number;
  radioContact?: RadioContact | null;
  community?: CommunityState;
  rescuePoint?: RescuePointState;
  physical?: Record<string, unknown> | null;
  balance?: Record<string, unknown> | null;
  terrain?: Record<string, unknown> | null;
}

export interface SavedGameState extends GameState {
  event: null;
  pendingEvent?: PendingEventDTO | null;
}

export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? never
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

/** A detached, recursively frozen view. Live event callbacks are never exposed. */
export function deepReadonlySnapshot<T>(value: T): DeepReadonly<T> {
  const seen = new WeakMap<object, unknown>();
  function copy(input: unknown): unknown {
    if (typeof input === 'function') return undefined;
    if (input === null || typeof input !== 'object') return input;
    if (seen.has(input)) return seen.get(input);
    if (Array.isArray(input)) {
      const result: unknown[] = [];
      seen.set(input, result);
      for (const item of input) result.push(copy(item));
      return Object.freeze(result);
    }
    const result: Record<string, unknown> = {};
    seen.set(input, result);
    for (const [key, item] of Object.entries(input)) {
      if (typeof item === 'function') continue;
      Object.defineProperty(result, key, { value: copy(item), enumerable: true, writable: false, configurable: false });
    }
    return Object.freeze(result);
  }
  return copy(value) as DeepReadonly<T>;
}
