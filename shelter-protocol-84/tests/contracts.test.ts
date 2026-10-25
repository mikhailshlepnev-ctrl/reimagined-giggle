import test from 'node:test';
import assert from 'node:assert/strict';
import { deepReadonlySnapshot, type GameState } from '../src/core/State';
import { EventBus } from '../src/core/EventBus';
import { decodeSave, encodeSave, MemoryStorage, SAVE_KEY, SaveSystem, SaveValidationError } from '../src/core/SaveSystem';
import { deriveShelterGrid } from '../src/grid/ShelterGrid';

function state(): GameState {
  return {
    scenario: 'nuclear', city: 'Каменец', site: { id: 0, name: 'Скальный склон', mods: { shield: 12 } },
    month: 19, prepMonths: 18, year: 1, phase: 'Обрушение', population: 22.4,
    specialists: 8, health: 87.5, morale: 75, hazard: 45, cityAccess: 73, targetPop: 40,
    actions: 2, actionCapacity: 3, resources: { concrete: 120, steel: 70, machinery: 30, fuel: 45, food: 90, electronics: 38, medicine: 30, parts: 5.5, precisionParts: 2 },
    bunker: { integrity: 28, shield: 12, thermal: 18, water: 18, power: 16, foodSystem: 8, medical: 8, workshop: 6, storage: 8, intel: 5, knowledge: 5, capacity: 28, morale: 0, biosecurity: 0, protectedCapacity: 20, receptionCapacity: 8 },
    built: { habitat: 2, water: 1 }, sites: [], event: null, log: [{ m: 19, cls: 'warn', t: 'Выпадения начались.' }], ended: false,
    finalWin: null, saveVersion: 16, settlementLevel: 1, rescuedTotal: 5, deathsTotal: 1, initialPopulation: 18, history: [],
    worldSeed: 1927, physical: { version: 15, design: { water: 36 }, residentDose: 12.5, pendingRefugees: { group: 4, since: 18 } },
    balance: { version: 16, feedstock: 112.75 },
    community: { nextOfferMonth: 22, offer: { requested: 'parts', offered: 'medicine', amount: 2, receive: 3.2, month: 19, expires: 22 } },
    rescuePoint: { remaining: 15, rescued: 6, lastMonth: 18 },
    extensionFromFutureVersion: { reserve: 4, route: ['A4', 'H4'] },
  };
}

test('read-only state is detached and recursively frozen, including extension fields', () => {
  const live = state();
  const snapshot = deepReadonlySnapshot(live);
  assert.notEqual(snapshot, live);
  assert.ok(Object.isFrozen(snapshot.resources));
  assert.ok(Object.isFrozen(snapshot.bunker));
  assert.ok(Object.isFrozen(snapshot.extensionFromFutureVersion));
  assert.throws(() => { (snapshot.resources as Record<string, number>).parts = 0; }, TypeError);
  live.resources.parts = 1;
  live.bunker.capacity = 60;
  assert.equal(snapshot.resources.parts, 5.5);
  assert.equal(snapshot.bunker.capacity, 28);
});

test('read-only event views expose no live callback capable of mutating simulation', () => {
  const live = state();
  live.event = { title: 'Насосы', choices: [['Ремонт', () => { live.resources.parts = 0; }]] };
  const snapshot = deepReadonlySnapshot(live);
  assert.equal(snapshot.event?.choices?.[0]?.[0], 'Ремонт');
  assert.equal(snapshot.event?.choices?.[0]?.[1], undefined);
  assert.equal(live.resources.parts, 5.5);
});

test('event subscriptions have stable ordering, explicit unsubscribe and disposal', () => {
  const bus = new EventBus<{ change: number }>();
  const received: string[] = [];
  const late = (value: number) => received.push(`late:${value}`);
  const off = bus.on('change', value => { received.push(`first:${value}`); bus.on('change', late); });
  bus.emit('change', 1);
  assert.deepEqual(received, ['first:1']);
  bus.emit('change', 2);
  assert.deepEqual(received, ['first:1', 'first:2', 'late:2']);
  off(); off();
  bus.emit('change', 3);
  assert.equal(received.at(-1), 'late:3');
  bus.dispose();
  bus.emit('change', 4);
  assert.equal(received.at(-1), 'late:3');
  assert.throws(() => bus.on('change', () => {}), /disposed/);
});

test('legacy raw PREDEL_SAVE_V5 JSON is lossless across physical, balance and V17 extensions', () => {
  const legacy = state();
  const encoded = encodeSave(legacy);
  const decoded = decodeSave(encoded);
  assert.deepEqual(decoded, legacy);
  assert.equal(decoded.prepMonths, 18);
  assert.equal(decoded.physical?.residentDose, 12.5);
  assert.equal(decoded.community?.offer?.receive, 3.2);
  assert.equal(decoded.rescuePoint?.remaining, 15);
  assert.deepEqual(decoded.extensionFromFutureVersion, legacy.extensionFromFutureVersion);
});

test('saving a pending dilemma stores its title and data, never callback functions', () => {
  const live = state();
  live.event = { title: 'Беженцы у внешнего периметра', data: { group: 4 }, choices: [['Принять', () => { live.population += 4; }]] };
  const encoded = encodeSave(live), decoded = decodeSave(encoded);
  assert.equal(decoded.event, null);
  assert.deepEqual(decoded.pendingEvent, { title: 'Беженцы у внешнего периметра', data: { group: 4 } });
  assert.equal(encoded.includes('choices'), false);
  assert.equal(live.event.title, 'Беженцы у внешнего периметра');
  assert.equal(live.population, 22.4);
});

test('an existing pending-event DTO survives another save without a live callback', () => {
  const saved = state();
  saved.pendingEvent = { title: 'План на первые недели', data: { balanceFallout: true, stage: 2 } };
  assert.deepEqual(decodeSave(encodeSave(saved)).pendingEvent, saved.pendingEvent);
});

test('initial site-null state and completed campaigns remain valid without invented progress', () => {
  const initial = state();
  initial.month = 0; initial.scenario = null; initial.site = null;
  assert.equal(decodeSave(encodeSave(initial)).site, null);
  const ended = state();
  ended.month = 84; ended.ended = true; ended.finalWin = true;
  assert.equal(decodeSave(encodeSave(ended)).ended, true);
  assert.equal(decodeSave(encodeSave(ended)).month, 84);
});

test('unsafe numeric resources, malformed bunker, scenario and months are rejected atomically', () => {
  const system = new SaveSystem();
  system.save(state());
  const good = system.load();
  const cases: Array<(s: GameState) => void> = [
    s => { s.resources.parts = -1; },
    s => { s.resources.food = Number.NaN; },
    s => { s.resources.fuel = Infinity; },
    s => { s.bunker.capacity = NaN; },
    s => { delete (s.bunker as Partial<typeof s.bunker>).water; },
    s => { s.bunker = [] as unknown as typeof s.bunker; },
    s => { s.scenario = 'tectonic' as typeof s.scenario; },
    s => { s.month = 85; },
    s => { s.month = 1.5; },
    s => { s.site = { name: '' }; },
    s => { s.built.habitat = -2; },
  ];
  for (const corrupt of cases) {
    const bad = state(); corrupt(bad);
    assert.throws(() => system.save(bad), SaveValidationError);
    assert.deepEqual(system.load(), good);
  }
  assert.throws(() => decodeSave('{ broken'), SaveValidationError);
  assert.deepEqual(system.load(), good);
});

test('storage is injected and keeps the original save key for compatibility', () => {
  const storage = new MemoryStorage(), system = new SaveSystem(storage);
  assert.equal(system.load(), null);
  assert.equal(system.has(), false);
  system.save(state());
  assert.ok(storage.getItem(SAVE_KEY));
  assert.equal(system.has(), true);
  storage.setItem(`${SAVE_KEY}_TIME`, 'old timestamp');
  system.remove();
  assert.equal(system.load(), null);
  assert.equal(storage.getItem(`${SAVE_KEY}_TIME`), null);
});

test('synchronous storage write failures retain the prior successfully saved state', () => {
  const memory = new MemoryStorage();
  let deny = false;
  const storage = { getItem: (key: string) => memory.getItem(key), removeItem: (key: string) => memory.removeItem(key), setItem: (key: string, value: string) => { if (deny) throw new Error('Quota'); memory.setItem(key, value); } };
  const system = new SaveSystem(storage);
  system.save(state()); deny = true;
  const next = state(); next.month = 20;
  assert.throws(() => system.save(next), /Quota/);
  assert.equal(system.load()?.month, 19);
});

test('grid projection maps each existing level to a stable read-only slot and preserves housing', () => {
  const live = state(), before = JSON.stringify(live), grid = deriveShelterGrid(live, 2);
  assert.deepEqual(grid.slots.map(s => [s.id, s.column, s.row, s.layer]), [
    ['habitat:1', 0, 0, 1], ['habitat:2', 1, 0, 1], ['water:1', 0, 1, 2],
  ]);
  assert.equal(grid.capacity, 28);
  assert.equal(grid.occupied, 23);
  assert.equal(grid.freeCapacity, 5);
  assert.equal(grid.protectedCapacity, 20);
  assert.equal(grid.receptionCapacity, 8);
  assert.equal(JSON.stringify(live), before);
  assert.ok(Object.isFrozen(grid));
  assert.ok(Object.isFrozen(grid.slots[0]));
  live.built.habitat = 3;
  assert.equal(grid.slots.length, 3);
  assert.equal(deriveShelterGrid(live).slots.length, 4);
});

test('grid projection handles no modules and overcrowding without inventing build timers or wiring', () => {
  const live = state(); live.built = {}; live.population = 30.2;
  const grid = deriveShelterGrid(live);
  assert.equal(grid.rows, 0);
  assert.equal(grid.slots.length, 0);
  assert.equal(grid.freeCapacity, 0);
  assert.equal(grid.overflow, 3);
  assert.throws(() => deriveShelterGrid(live, 0), RangeError);
  live.built.habitat = 1.5;
  assert.throws(() => deriveShelterGrid(live), /Invalid built level/);
});
