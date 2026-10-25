import type { TurnEngine } from '../../core/TurnEngine';
import type { GameState } from '../../core/State';
import { ShelterGrid } from '../../grid/ShelterGrid';
import type { GridSlot } from '../../grid/GridSlot';
import buildingsJSON from '../../config/buildings.json';
import { Viewport, type ViewPoint } from './Viewport';

type BuildingInfo = { name: string; icon?: string; desc?: string; effect?: Record<string, number> };
const buildings = buildingsJSON as Record<string, BuildingInfo>;
const CELL = { width: 148, height: 92, gapX: 18, gapY: 32, left: 50, top: 110 };
const systemNames: Record<string, string> = { power: 'Энергия', water: 'Водный контур', thermal: 'Климат', medical: 'Медицина', integrity: 'Корпус', ventilation: 'Вентиляция', deconCapacity: 'Дезактивация' };
const css = `.predelCutaway{margin:14px 0;border:1px solid #39534d;border-radius:7px;background:#10252b;color:#dce9dc;overflow:hidden}.predelCutaway>summary{cursor:pointer;padding:13px 15px;font-size:13px;list-style-position:inside}.predelCutaway>summary small{margin-left:12px;color:#a3b7aa;font-size:10px}.predelCutaway .cutawayTools{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid #314b46}.predelCutaway .cutawayTools button{font-size:12px;min-width:34px;padding:7px 10px}.predelCutaway .cutawayTools output{min-width:44px;text-align:center;font:11px Consolas,monospace;color:#bdd4c1}.predelCutaway .cutawayTools select{min-width:0;max-width:100%;flex:1 1 180px;padding:7px;background:#102129;color:#dce9dc;border:1px solid #405e52;border-radius:4px;font-size:11px}.predelCutaway canvas{display:block!important;position:static!important;width:100%!important;height:330px!important;max-width:100%;touch-action:none;background:#0c1b22;cursor:grab;outline-offset:-3px}.predelCutaway canvas:active{cursor:grabbing}.predelCutaway canvas:focus-visible{outline:2px solid #c2d5a0}.predelCutaway .cutawayInfo{padding:12px 15px;border-top:1px solid #314b46;min-height:68px}.predelCutaway .cutawayInfo strong{font-size:12px;display:block;margin-bottom:5px}.predelCutaway .cutawayInfo p{font-size:11px;line-height:1.6;color:#b1c3b7;margin:3px 0}.predelCutaway .cutawayHint{padding:0 15px 12px;font-size:10px;color:#95aa9f;line-height:1.6;margin:0}@media(max-width:600px){.predelCutaway>summary small{display:block;margin:5px 0 0 16px}.predelCutaway canvas{height:280px!important}.predelCutaway .cutawayTools select{flex-basis:100%}}`;

function projectGrid(state: Readonly<GameState>): ShelterGrid {
  const levels = Object.values(state.built).reduce((sum, level) => sum + level, 0);
  return ShelterGrid.fromState(state, Math.max(1, Math.min(6, Math.ceil(Math.sqrt(levels)))));
}
function physicalCondition(state: Readonly<GameState>): Record<string, number> {
  const condition = state.physical?.condition;
  if (!condition || typeof condition !== 'object') return {};
  return Object.fromEntries(Object.entries(condition).filter(([, value]) => typeof value === 'number' && Number.isFinite(value))) as Record<string, number>;
}
function roomCondition(slot: GridSlot, condition: Record<string, number>): number | null {
  const values = Object.keys(buildings[slot.moduleId]?.effect ?? {}).filter(key => key in condition).map(key => condition[key]);
  return values.length ? Math.max(0, Math.min(1, values.reduce((sum, value) => sum + value, 0) / values.length)) : null;
}
function slotPosition(slot: GridSlot): ViewPoint { return { x: CELL.left + slot.column * (CELL.width + CELL.gapX), y: CELL.top + slot.row * (CELL.height + CELL.gapY) }; }
function shortLabel(context: CanvasRenderingContext2D, label: string, width: number): string {
  if (context.measureText(label).width <= width) return label;
  let value = label;
  while (value.length && context.measureText(value + '…').width > width) value = value.slice(0, -1);
  return value + '…';
}

/** Optional read-only projection of installed levels. No state, balance or command mutations. */
export function mountGridCutaway(host: HTMLElement, engine: TurnEngine): () => void {
  const details = document.createElement('details');
  details.className = 'predelCutaway';
  details.innerHTML = `<style>${css}</style><summary>Убежище в разрезе<small class="cutawayPopulation"></small></summary><div class="cutawayTools"><button type="button" data-camera="fit">Вписать</button><button type="button" data-camera="out" aria-label="Уменьшить масштаб">−</button><output aria-label="Масштаб">100%</output><button type="button" data-camera="in" aria-label="Увеличить масштаб">+</button><select aria-label="Выбрать установленную секцию"></select></div><canvas tabindex="0" role="img" aria-label="Схема установленных секций убежища"></canvas><div class="cutawayInfo" aria-live="polite"><strong></strong><p></p><p class="cutawayMetrics"></p></div><p class="cutawayHint">Каждая ячейка — установленный уровень модуля. Перетащите схему для перемещения, используйте колесо или кнопки для масштаба. С клавиатуры: стрелки, +/− и 0.</p>`;
  host.append(details);
  const canvas = details.querySelector('canvas')!, context = canvas.getContext('2d');
  if (!context) { details.remove(); return () => {}; }
  const select = details.querySelector('select')!, population = details.querySelector('.cutawayPopulation')!, output = details.querySelector('output')!;
  const heading = details.querySelector('.cutawayInfo strong')!, description = details.querySelector('.cutawayInfo p')!, metrics = details.querySelector('.cutawayMetrics')!;
  let state = engine.getState(), grid = projectGrid(state), selected = '', frame = 0, disposed = false, width = 1, height = 1, dpr = 1, layoutSignature = '';
  const abort = new AbortController();
  const bounds = () => ({ x: 0, y: 0, width: CELL.left * 2 + grid.columns * (CELL.width + CELL.gapX) - CELL.gapX, height: CELL.top + Math.max(1, grid.rows) * (CELL.height + CELL.gapY) + 45 });
  function requestDraw(): void { if (!disposed && details.open && !frame) frame = requestAnimationFrame(draw); }
  const viewport = new Viewport(canvas, { onChange: requestDraw, onSelect: selectPoint });

  function updateInfo(): void {
    const slot = grid.slots.find(value => value.id === selected);
    select.value = slot?.id ?? '';
    if (!slot) {
      heading.textContent = grid.slots.length ? 'Выберите секцию на схеме' : 'Строительство ещё не начато';
      description.textContent = grid.slots.length ? 'На схеме показаны все построенные уровни модулей.' : 'Установленные секции появятся после первого строительства.';
      metrics.textContent = `Жилых мест: ${grid.capacity} · защищённых мест: ${grid.protectedCapacity} · приёмных мест: ${grid.receptionCapacity}`;
      return;
    }
    const module = buildings[slot.moduleId], condition = physicalCondition(state);
    heading.textContent = `${module?.name ?? slot.moduleId} · уровень ${slot.level} из ${state.built[slot.moduleId] ?? slot.level}`;
    description.textContent = module?.desc ?? 'Установленная секция убежища.';
    const status = Object.keys(module?.effect ?? {}).filter(key => key in condition).map(key => `${systemNames[key] ?? key}: состояние ${Math.round(Math.max(0, Math.min(1, condition[key])) * 100)}%`);
    metrics.textContent = status.length ? status.join(' · ') : 'Для этой секции отдельный показатель технического состояния не задан.';
  }
  function selectPoint(point: ViewPoint): void {
    const slot = grid.slots.find(value => { const pos = slotPosition(value); return point.x >= pos.x && point.x <= pos.x + CELL.width && point.y >= pos.y && point.y <= pos.y + CELL.height; });
    selected = slot?.id ?? '';
    updateInfo(); requestDraw();
  }
  function resize(): void {
    if (!details.open || disposed) return;
    const box = canvas.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    const first = width === 1;
    width = box.width; height = box.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    viewport.resize(width, height);
    if (first) viewport.fit(bounds());
    requestDraw();
  }
  function draw(): void {
    frame = 0;
    if (disposed || !details.open) return;
    const c = context!, condition = physicalCondition(state), area = bounds(), visible = viewport.visibleBounds();
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, width, height);
    const background = c.createLinearGradient(0, 0, 0, height); background.addColorStop(0, '#1b3034'); background.addColorStop(1, '#07141b'); c.fillStyle = background; c.fillRect(0, 0, width, height);
    c.save(); viewport.apply(c);
    const rock = c.createLinearGradient(0, 55, 0, area.height); rock.addColorStop(0, '#39483e'); rock.addColorStop(1, '#172c2b');
    c.fillStyle = rock; c.fillRect(12, 58, area.width - 24, area.height - 66);
    c.strokeStyle = '#7e9272'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 58); c.lineTo(area.width, 58); c.stroke();
    c.fillStyle = '#b0c4a3'; c.font = '12px system-ui,sans-serif'; c.fillText(state.site?.name ?? 'Убежище', 32, 38);
    // Fixed mineral seams, independent of simulation randomness or elapsed time.
    c.strokeStyle = 'rgba(163,185,151,.09)'; c.lineWidth = 1;
    const firstRow = Math.max(0, Math.floor((visible.y - CELL.top) / (CELL.height + CELL.gapY)) - 1), lastRow = Math.min(Math.max(1, grid.rows), Math.ceil((visible.y + visible.height - CELL.top) / (CELL.height + CELL.gapY)) + 1);
    for (let row = firstRow; row < lastRow; row++) {
      const y = CELL.top + row * (CELL.height + CELL.gapY);
      c.beginPath(); c.moveTo(20, y - 21); c.lineTo(area.width * .3, y - 13); c.lineTo(area.width * .6, y - 25); c.lineTo(area.width - 20, y - 17); c.stroke();
      c.fillStyle = '#203934'; c.fillRect(CELL.left - 14, y + CELL.height + 6, area.width - CELL.left * 2 + 28, 9);
      c.strokeStyle = '#6b8b79'; c.beginPath(); c.moveTo(CELL.left - 8, y + CELL.height + 9); c.lineTo(area.width - CELL.left + 8, y + CELL.height + 9); c.stroke(); c.strokeStyle = 'rgba(163,185,151,.09)';
    }
    const lights = state.bunker.power > 0 && (condition.power ?? 1) > .05;
    for (const slot of grid.slots) {
      if (slot.row < firstRow || slot.row >= lastRow) continue;
      const { x, y } = slotPosition(slot);
      if (x + CELL.width < visible.x || x > visible.x + visible.width) continue;
      const module = buildings[slot.moduleId], value = roomCondition(slot, condition), active = slot.id === selected;
      const fill = c.createLinearGradient(x, y, x + CELL.width, y + CELL.height); fill.addColorStop(0, lights ? '#3a5a50' : '#2b403e'); fill.addColorStop(1, '#182d2d');
      c.fillStyle = '#0a1c21'; c.fillRect(x - 4, y - 4, CELL.width + 8, CELL.height + 8); c.fillStyle = fill; c.fillRect(x, y, CELL.width, CELL.height);
      c.lineWidth = active ? 3 : 1.2; c.strokeStyle = active ? '#d6e8a8' : value !== null && value < .4 ? '#c77d62' : '#668574'; c.strokeRect(x, y, CELL.width, CELL.height);
      c.fillStyle = lights ? '#d0d3a2' : '#4c645b'; c.fillRect(x + 10, y + 5, CELL.width - 20, 3);
      if (lights) { const glow = c.createLinearGradient(0, y + 8, 0, y + 50); glow.addColorStop(0, 'rgba(221,224,173,.12)'); glow.addColorStop(1, 'rgba(221,224,173,0)'); c.fillStyle = glow; c.fillRect(x + 8, y + 8, CELL.width - 16, 43); }
      c.fillStyle = '#dce6ce'; c.font = '11px system-ui,sans-serif'; c.fillText(shortLabel(c, module?.name ?? slot.moduleId, CELL.width - 18), x + 9, y + 30);
      c.fillStyle = '#a5bca8'; c.font = '10px Consolas,monospace'; c.fillText(`УРОВЕНЬ ${slot.level}`, x + 9, y + 49);
      c.fillStyle = '#10242a'; c.fillRect(x + CELL.width - 33, y + 48, 20, 32); c.strokeStyle = '#516f62'; c.lineWidth = 1; c.strokeRect(x + CELL.width - 33, y + 48, 20, 32);
      if (value !== null) { c.fillStyle = '#10262a'; c.fillRect(x + 9, y + 67, 82, 5); c.fillStyle = value < .4 ? '#d69273' : '#a5c99f'; c.fillRect(x + 9, y + 67, 82 * value, 5); }
    }
    if (!grid.slots.length) { c.fillStyle = '#b5c9b5'; c.font = '15px system-ui,sans-serif'; c.fillText('Здесь появятся установленные секции', 70, 158); }
    c.restore(); output.value = `${Math.round(viewport.relativeZoom * 100)}%`;
  }
  function update(next: Readonly<GameState>): void {
    state = next; grid = projectGrid(state);
    details.hidden = !state.site;
    population.textContent = `${grid.occupied} / ${grid.capacity} мест · ${grid.overflow ? `не хватает ${grid.overflow}` : `свободно ${grid.freeCapacity}`}`;
    const signature = grid.slots.map(slot => slot.id).join('|');
    if (signature !== layoutSignature) {
      layoutSignature = signature;
      const placeholder = new Option(grid.slots.length ? 'Выбрать секцию…' : 'Нет установленных секций', '');
      select.replaceChildren(placeholder, ...grid.slots.map(slot => new Option(`${buildings[slot.moduleId]?.name ?? slot.moduleId} · ур. ${slot.level}`, slot.id)));
      if (!grid.slots.some(slot => slot.id === selected)) selected = '';
      if (details.open) viewport.fit(bounds());
    }
    updateInfo(); requestDraw();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  details.addEventListener('toggle', () => { if (details.open) { resize(); requestDraw(); } else if (frame) { cancelAnimationFrame(frame); frame = 0; } }, { signal: abort.signal });
  select.addEventListener('change', () => { selected = select.value; updateInfo(); requestDraw(); }, { signal: abort.signal });
  details.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.camera === 'fit') viewport.fit(bounds()); else viewport.zoomBy(button.dataset.camera === 'in' ? 1.25 : .8);
  }, { signal: abort.signal }));
  const unsubscribe = engine.subscribe(update);
  update(state);
  return () => { disposed = true; if (frame) cancelAnimationFrame(frame); observer.disconnect(); abort.abort(); viewport.dispose(); unsubscribe(); details.remove(); };
}
