import { SCENARIO_IDS, type GameState, type SavedGameState } from './State';

export const SAVE_KEY = 'PREDEL_SAVE_V5';
const MAX_SAVE_BYTES = 5_000_000;
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}
export class SaveValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'SaveValidationError'; }
}
function fail(message: string): never { throw new SaveValidationError(message); }
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function checkJson(value: unknown, path = 'save', stack = new WeakSet<object>()): void {
  if (typeof value === 'number' && !Number.isFinite(value)) fail(`${path}: число должно быть конечным`);
  if (['function', 'symbol', 'bigint'].includes(typeof value)) fail(`${path}: значение нельзя сохранить в JSON`);
  if (value === null || typeof value !== 'object') return;
  if (stack.has(value)) fail(`${path}: циклическая ссылка`);
  stack.add(value);
  for (const [key, item] of Object.entries(value)) checkJson(item, `${path}.${key}`, stack);
  stack.delete(value);
}

export function validateSaveState(value: unknown): asserts value is SavedGameState {
  if (!record(value)) fail('Сохранение должно быть объектом');
  if (value.scenario !== null && !SCENARIO_IDS.includes(value.scenario as never)) fail('Неизвестный сценарий');
  if (!Number.isInteger(value.month) || (value.month as number) < 0 || (value.month as number) > 84) fail('Месяц должен быть в диапазоне 0–84');
  if (value.prepMonths !== undefined && (!Number.isInteger(value.prepMonths) || (value.prepMonths as number) <= 0 || (value.prepMonths as number) > 84)) fail('Некорректная длительность подготовки');
  if (!record(value.resources) || Object.keys(value.resources).length === 0) fail('Отсутствуют ресурсы');
  for (const [key, count] of Object.entries(value.resources)) {
    if (!finite(count) || count < 0) fail(`Ресурс ${key}: требуется конечное неотрицательное количество`);
  }
  if (!record(value.bunker)) fail('Повреждены данные убежища');
  for (const key of ['integrity', 'shield', 'thermal', 'water', 'power', 'foodSystem', 'medical', 'workshop', 'storage', 'intel', 'knowledge', 'capacity']) {
    if (!finite(value.bunker[key]) || (value.bunker[key] as number) < 0) fail(`Повреждён показатель убежища: ${key}`);
  }
  for (const [key, amount] of Object.entries(value.bunker)) {
    if (!finite(amount) || (key !== 'morale' && amount < 0)) fail(`Повреждён показатель убежища: ${key}`);
  }
  if (value.site !== null && (!record(value.site) || typeof value.site.name !== 'string' || !value.site.name.trim())) fail('Некорректная площадка');
  if (value.scenario === null && value.site !== null) fail('Для выбранной площадки нужен сценарий');
  for (const key of ['population', 'specialists', 'health', 'morale']) {
    if (!finite(value[key])) fail(`Повреждён показатель: ${key}`);
  }
  if ((value.population as number) < 0 || (value.specialists as number) < 0) fail('Численность людей не может быть отрицательной');
  if (!record(value.built)) fail('Повреждён список построек');
  let levels = 0;
  for (const [key, level] of Object.entries(value.built)) {
    if (!Number.isSafeInteger(level) || (level as number) < 0) fail(`Некорректный уровень постройки: ${key}`);
    levels += level as number;
  }
  if (levels > 10000) fail('Слишком много построек в файле сохранения');
  if (value.event !== null && value.event !== undefined) fail('Инцидент должен быть сохранён как pendingEvent');
  if (value.pendingEvent != null) {
    if (!record(value.pendingEvent) || typeof value.pendingEvent.title !== 'string' || !value.pendingEvent.title.trim() || !record(value.pendingEvent.data)) fail('Повреждены данные ожидающего события');
  }
  if (value.saveVersion !== undefined && (!Number.isInteger(value.saveVersion) || (value.saveVersion as number) < 0)) fail('Некорректная версия сохранения');
  checkJson(value);
}

/** Only the legacy event's serializable descriptor crosses the storage boundary. */
function toSaveDTO(value: unknown): Record<string, unknown> {
  if (!record(value)) fail('Сохранение должно быть объектом');
  const dto = { ...value };
  if (value.event != null) {
    if (!record(value.event) || typeof value.event.title !== 'string') fail('Повреждено текущее событие');
    dto.pendingEvent = { title: value.event.title, data: value.event.data ?? {} };
  }
  dto.event = null;
  return dto;
}
export function encodeSave(state: GameState | SavedGameState): string {
  const dto = toSaveDTO(state);
  validateSaveState(dto);
  const encoded = JSON.stringify(dto);
  if (new TextEncoder().encode(encoded).length > MAX_SAVE_BYTES) fail('Файл сохранения больше 5 МБ');
  return encoded;
}
export function decodeSave(encoded: string): SavedGameState {
  if (typeof encoded !== 'string' || new TextEncoder().encode(encoded).length > MAX_SAVE_BYTES) fail('Некорректный размер сохранения');
  let parsed: unknown;
  try { parsed = JSON.parse(encoded); } catch { return fail('Сохранение содержит повреждённый JSON'); }
  const dto = toSaveDTO(parsed);
  validateSaveState(dto);
  return dto as SavedGameState;
}

/** Browser storage is injected by the entry point; tests use the same contract in memory. */
export class SaveSystem {
  constructor(private readonly storage: StorageLike = new MemoryStorage(), readonly key = SAVE_KEY) {}
  encode(state: GameState | SavedGameState): string { return encodeSave(state); }
  decode(encoded: string): SavedGameState { return decodeSave(encoded); }
  save(state: GameState | SavedGameState): string {
    const encoded = this.encode(state); // Validation completes before the existing save is touched.
    this.storage.setItem(this.key, encoded);
    return encoded;
  }
  load(): SavedGameState | null { const raw = this.storage.getItem(this.key); return raw === null ? null : this.decode(raw); }
  has(): boolean { return this.storage.getItem(this.key) !== null; }
  remove(): void { this.storage.removeItem(this.key); this.storage.removeItem(`${this.key}_TIME`); }
}
