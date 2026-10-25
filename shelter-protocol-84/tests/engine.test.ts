import test from 'node:test';
import assert from 'node:assert/strict';
import { TurnEngine } from '../src/core/TurnEngine';
import { MemoryStorage, SAVE_KEY } from '../src/core/SaveSystem';
import { SCENARIO_IDS, type ScenarioId } from '../src/core/State';
import { deriveShelterGrid } from '../src/grid/ShelterGrid';

const NOW = '2026-10-25T12:00:00.000Z';
function engine(seed = 123, storage = new MemoryStorage()): TurnEngine {
  return new TurnEngine({ seed, storage, now: () => NOW });
}
function command(e: TurnEngine, name: string, args: unknown[] = [], inputs: Record<string, unknown> = {}) {
  const result = e.dispatch(name, args, inputs);
  assert.equal(result.ok, true, `${name}: ${result.error ?? ''}`);
  return result.value;
}
async function started(scenario: ScenarioId = 'ice', seed = 123, storage = new MemoryStorage()): Promise<TurnEngine> {
  const e = engine(seed, storage);
  await command(e, 'startGame', [scenario, 40, 1]);
  command(e, 'chooseSite', [0]);
  return e;
}
function dto(e: TurnEngine): any { return JSON.parse(e.exportSave()); }
function finiteNumbers(value: unknown, path = 'state'): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} must be finite, got ${value}`);
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) finiteNumbers(child, `${path}.${key}`);
  }
}
function assertHealthyNumbers(e: TurnEngine): void {
  const state = e.getState();
  finiteNumbers(state);
  for (const [key, value] of Object.entries(state.resources)) assert.ok(value >= 0, `${key} became negative`);
  assert.ok(state.population >= 0);
  assert.ok(state.specialists >= 0 && state.specialists <= Math.floor(state.population));
  assert.ok(state.health >= 0 && state.health <= 100);
  assert.ok(state.morale >= 0 && state.morale <= 100);
}
/** A supplied, established settlement, not a change to simulation rules or per-turn replenishment. */
async function established(scenario: ScenarioId, seed = 123): Promise<TurnEngine> {
  const e = await started(scenario, seed), saved = dto(e);
  saved.targetPop = 96; saved.population = 96; saved.specialists = 48;
  saved.health = 95; saved.morale = 90; saved.actions = 10;
  for (const key of Object.keys(saved.resources)) saved.resources[key] = 1_000_000;
  Object.assign(saved.bunker, {
    integrity: 150, shield: 160, thermal: 200, water: 400, power: 500, foodSystem: 150,
    medical: 150, workshop: 100, storage: 200, intel: 100, knowledge: 80, capacity: 300,
    protectedCapacity: 300, receptionCapacity: 100, ventilation: 300, deconCapacity: 300, biosecurity: 100,
  });
  Object.assign(saved.built, {
    med: 3, farm: 3, climate: 2, printer: 3, workshop: 2, power: 2, water: 2,
    decon: 2, radioCenter: 2, habitat: 3, reception: 2,
  });
  saved.physical.design = { ...saved.bunker };
  for (const key of Object.keys(saved.physical.condition)) saved.physical.condition[key] = 1;
  saved.physical.filterCondition = 100;
  saved.balance.clinicalSpecialists = 10; saved.balance.lastSpecialists = 48;
  assert.equal(e.loadSave(JSON.stringify(saved)).ok, true);
  return e;
}
/** The last alternative is viable without printed repair components; never retry unavailable choice zero forever. */
function tickOrResolve(e: TurnEngine): void {
  const event = e.getState().event;
  if (event) {
    const count = event.choices?.length ?? 0;
    assert.ok(count > 0, `Missing choices: ${event.title}`);
    command(e, 'resolveEvent', [count - 1]);
  } else command(e, 'nextMonth');
}
function advanceTo(e: TurnEngine, target: number): void {
  for (let steps = 0; e.getState().month < target || e.getState().event; steps++) {
    assert.ok(steps < target * 5 + 20, 'Campaign made no progress through an incident');
    assert.equal(e.getState().ended, false, `Settlement ended early at month ${e.getState().month}`);
    tickOrResolve(e);
    assertHealthyNumbers(e);
  }
}

test('headless start and housing construction retain the audited Predel V17 costs and gains', async () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(typeof window, 'undefined');
  const e = await started();
  const initial = e.getState();
  assert.equal(initial.prepMonths, 18);
  assert.equal(initial.month, 0);
  assert.equal(initial.population, 17); // round(40 × 0.42), as in the original game.
  assert.equal(initial.bunker.capacity, 23); // round(40 × 0.58).
  const before = { ...initial.resources }, actions = initial.actions;
  command(e, 'buildModule', ['habitat']);
  const after = e.getState();
  assert.equal(before.concrete - after.resources.concrete, 35);
  assert.equal(before.steel - after.resources.steel, 18);
  assert.equal(before.food - after.resources.food, 4);
  assert.equal(after.bunker.capacity, 41);
  assert.equal(after.built.habitat, 1);
  assert.equal(after.actions, actions - 1);
  assert.equal(initial.built.habitat, undefined, 'Earlier snapshots must remain detached');
  assertHealthyNumbers(e);
});

test('UI receives detached frozen state and no executable incident closures', async () => {
  const e = await started();
  const saved = dto(e);
  saved.pendingEvent = { title: 'Повреждение насосов', data: {} };
  assert.equal(e.loadSave(JSON.stringify(saved)).ok, true);
  const view = e.getState();
  assert.ok(Object.isFrozen(view) && Object.isFrozen(view.resources) && Object.isFrozen(view.event?.choices));
  assert.equal(view.event?.choices?.[0]?.[1], undefined);
  assert.throws(() => { (view.resources as any).food = 0; }, TypeError);
  assert.throws(() => { (view.bunker as any).capacity = 0; }, TypeError);
  const water = view.bunker.water;
  command(e, 'resolveEvent', [1]);
  assert.equal(e.getState().bunker.water, water - 2);
  assert.equal(view.bunker.water, water);
  assert.equal(view.event?.title, 'Повреждение насосов');
});

test('unresolved incidents block time and construction; a payable alternative resumes the campaign', async () => {
  const e = await started(), saved = dto(e);
  saved.pendingEvent = { title: 'Повреждение насосов', data: {} };
  assert.equal(e.loadSave(JSON.stringify(saved)).ok, true);
  const initial = e.getState(), stock = { ...initial.resources };
  assert.equal(e.dispatch('buildModule', ['habitat']).ok, false);
  command(e, 'nextMonth');
  assert.equal(e.getState().month, initial.month);
  assert.equal(e.getState().actions, initial.actions);
  command(e, 'resolveEvent', [0]); // No printer or precise repair components: remains unresolved.
  assert.equal(e.getState().event?.title, 'Повреждение насосов');
  assert.deepEqual(e.getState().resources, stock);
  command(e, 'resolveEvent', [1]);
  assert.equal(e.getState().event, null);
  command(e, 'nextMonth');
  assert.equal(e.getState().month, 1);
});

test('separate engines replay the same seeded commands identically without sharing mutable runtime', async () => {
  const a = await established('nuclear', 771), b = await established('nuclear', 771);
  assert.equal(a.exportSave(), b.exportSave());
  let steps = 0;
  while (a.getState().month < 24 || a.getState().event) {
    assert.ok(steps++ < 130);
    tickOrResolve(a);
    tickOrResolve(b);
    assert.equal(a.exportSave(), b.exportSave(), `Replay diverged at step ${steps}`);
  }
  assert.equal(a.getState().month, 24);
  assert.equal(a.getState().history.length, 24);
  assert.ok((a.getState().physical?.residentLifetimeDose as number) > 0, 'Replay must exercise actual fallout');
  const frozenB = b.exportSave();
  command(a, 'operationTraining');
  assert.equal(b.exportSave(), frozenB);
});

test('save/reload restores RNG and pending closures, then produces the same subsequent turns', async () => {
  const a = await established('nuclear', 849), b = engine(999);
  advanceTo(a, 18);
  command(a, 'nextMonth'); // Opens the three-stage fallout briefing instead of skipping it.
  assert.equal(a.getState().month, 18);
  assert.ok(a.getState().event?.data?.balanceFallout);
  const saved = a.exportSave();
  assert.equal(JSON.parse(saved).event, null);
  assert.equal(b.loadSave(saved).ok, true);
  assert.equal(b.exportSave(), saved);
  const original = a.exportSave();
  tickOrResolve(b);
  assert.equal(a.exportSave(), original, 'Restored callbacks must not mutate the source engine');
  tickOrResolve(a);
  assert.equal(a.exportSave(), b.exportSave());
  for (let steps = 0; a.getState().month < 25 || a.getState().event; steps++) {
    assert.ok(steps < 60);
    tickOrResolve(a); tickOrResolve(b);
    assert.equal(a.exportSave(), b.exportSave());
  }
});

test('injected storage retains the legacy key and can resume a real engine, not merely a DTO', async () => {
  const storage = new MemoryStorage(), a = await started('heat', 682, storage);
  command(a, 'buildModule', ['habitat']);
  command(a, 'saveGame', [true]);
  assert.equal(storage.getItem(`${SAVE_KEY}_TIME`), NOW);
  const stored = storage.getItem(SAVE_KEY);
  assert.ok(stored);
  const b = engine(3, storage);
  assert.equal(command(b, 'loadGame'), true);
  assert.equal(b.getState().bunker.capacity, a.getState().bunker.capacity);
  assert.equal(b.getState().built.habitat, 1);
  command(b, 'nextMonth');
  assert.equal(b.getState().month, 1);
});

test('raw older saves retain people, housing, stocks and extension fields while acquiring required migrations', async () => {
  const source = await started('heat'), old = dto(source);
  old.saveVersion = 12; old.month = 12; old.population = 31; old.specialists = 8;
  old.bunker.capacity = 60; old.resources.parts = 5.5;
  old.futureExtension = { route: ['A2', 'C4'], reserve: 4 };
  delete old.physical; delete old.balance; delete old.community; delete old.rescuePoint;
  const e = engine(55);
  assert.equal(e.loadSave(JSON.stringify(old)).ok, true);
  const loaded = e.getState();
  assert.equal(loaded.month, 12); assert.equal(loaded.population, 31);
  assert.equal(loaded.bunker.capacity, 60); assert.equal(loaded.resources.parts, 5.5);
  assert.deepEqual(loaded.futureExtension, old.futureExtension);
  assert.equal(loaded.physical?.version, 15); assert.equal(loaded.balance?.version, 16);
  assert.ok(loaded.community && loaded.rescuePoint);
  assertHealthyNumbers(e);
});

test('invalid and un-restorable saves leave state, RNG, future replay and durable save unchanged', async () => {
  const storage = new MemoryStorage(), e = await started('ice', 1, storage), control = engine(77);
  const before = e.exportSave(), durable = storage.getItem(SAVE_KEY);
  assert.equal(control.loadSave(before).ok, true);
  const badResource = JSON.parse(before); badResource.resources.parts = -1;
  const badIncident = JSON.parse(before); badIncident.pendingEvent = { title: 'UNRECOGNIZED INCIDENT', data: {} };
  for (const bad of ['{broken', JSON.stringify(badResource), JSON.stringify(badIncident)]) {
    assert.equal(e.loadSave(bad).ok, false);
    assert.equal(e.exportSave(), before, 'Failed load must be atomic, including rngState');
    assert.equal(storage.getItem(SAVE_KEY), durable);
  }
  tickOrResolve(e); tickOrResolve(control);
  assert.equal(e.exportSave(), control.exportSave());
});

test('neighbor requests follow the simulated calendar and declining schedules a later independent offer', async () => {
  const e = await established('heat', 912), saved = dto(e);
  saved.radioContact = { name: 'Речной пост', distance: 19, trust: 60 };
  saved.community = { nextOfferMonth: 2, offer: null };
  assert.equal(e.loadSave(JSON.stringify(saved)).ok, true);
  advanceTo(e, 2);
  const incoming = e.getState();
  assert.ok(incoming.community?.offer);
  assert.notEqual(incoming.community.offer.requested, incoming.community.offer.offered);
  assert.equal(incoming.community.offer.month, 2);
  assert.equal(incoming.community.offer.expires, 5);
  command(e, 'answerTradeOffer', [false]);
  const declined = e.getState();
  assert.equal(declined.community?.offer, null);
  assert.equal(declined.radioContact?.trust, incoming.radioContact?.trust);
  assert.equal(declined.actions, incoming.actions);
  assert.deepEqual(declined.resources, incoming.resources);
  const later = declined.community?.nextOfferMonth as number;
  assert.ok(later >= 5 && later <= 8);
  advanceTo(e, later);
  assert.equal(e.getState().community?.offer?.month, later);
  assertHealthyNumbers(e);
});

test('housing and spare-parts exchanges remain connected to simulation resources and finite rescue stock', async () => {
  const e = await established('ice', 161), saved = dto(e);
  saved.radioContact = { name: 'Соседний узел', distance: 12, trust: 60 };
  saved.community = { nextOfferMonth: 8, offer: { requested: 'parts', offered: 'medicine', amount: 2, receive: 3.5, month: 0, expires: 3 } };
  saved.terrain.known.fill(2); saved.terrain.discoveredSites = ['evacuation', 'contact'];
  saved.rescuePoint = { remaining: 5, rescued: 0, lastMonth: -999 };
  assert.equal(e.loadSave(JSON.stringify(saved)).ok, true);
  const before = e.getState(), grid = deriveShelterGrid(before);
  assert.equal(grid.capacity, 300);
  assert.equal(grid.freeCapacity, 300 - Math.ceil(before.population));
  command(e, 'answerTradeOffer', [true]);
  assert.equal(e.getState().resources.parts, before.resources.parts - 2);
  assert.equal(e.getState().resources.medicine, before.resources.medicine + 3.5);
  assert.equal(e.getState().actions, before.actions - 1);
  assert.equal(e.getState().community?.offer, null);
  const stock = e.getState().resources;
  command(e, 'tradeExpedition', [], { tradeWant: 'parts', tradeGive: 'food', tradeAmount: 10, tradeTeam: 5 });
  assert.ok(e.getState().resources.parts > stock.parts, 'Outgoing caravan must deliver requested spare parts');
  assert.equal(e.getState().resources.food, stock.food - 10);
  assert.equal(e.getState().lastTradeMonth, 0);
  command(e, 'scavenge', ['evacuation']);
  const rescued = e.getState();
  assert.equal(rescued.rescuePoint?.remaining, 0);
  assert.equal(rescued.rescuePoint?.rescued, 5);
  assert.equal(rescued.rescuedTotal, before.rescuedTotal + 5);
  assert.ok(rescued.population <= rescued.bunker.capacity);
  const settled = e.exportSave();
  command(e, 'evacuateSurvivors');
  assert.equal(e.exportSave(), settled, 'An exhausted rescue point cannot create more people');
  assertHealthyNumbers(e);
});

for (const scenario of SCENARIO_IDS) {
  test(`${scenario}: 84 meaningful monthly cycles finish with finite supplies, actual threats and incident resolution`, async () => {
    const e = await established(scenario, 123);
    const phases = new Set<string>(), incidentTitles = new Set<string>();
    let actions = 0;
    while (!e.getState().ended) {
      const before = e.getState();
      assert.ok(actions++ < 420, `Campaign stuck at M${before.month}: ${before.event?.title}`);
      if (before.event) incidentTitles.add(before.event.title);
      tickOrResolve(e);
      phases.add(e.getState().phase);
      assertHealthyNumbers(e);
    }
    const final = e.getState();
    assert.equal(final.month, 84);
    assert.equal(final.history.length, 84, 'Each simulated month must appear once in history');
    assert.equal(final.event, null);
    assert.equal(final.finalWin, true);
    assert.ok(final.population >= 12);
    assert.ok(incidentTitles.size >= 2, 'Campaign should exercise actual incident choices');
    for (const phase of ['Предапокалипсис', 'Обрушение', 'Глубокий кризис', 'Новая среда']) assert.ok(phases.has(phase));
    assert.ok((final.lastConsumption as Record<string, number>).food > 0, 'The campaign must account for actual food consumption');
    if (scenario === 'nuclear') {
      assert.ok((final.physical?.residentLifetimeDose as number) > 0);
      assert.ok((final.balance?.falloutChoices as unknown[]).length >= 3, 'The three early-fallout decisions must execute');
    }
    const completed = e.exportSave();
    command(e, 'nextMonth');
    assert.equal(e.exportSave(), completed, 'Month 84 must not execute a second time');
  });
}
