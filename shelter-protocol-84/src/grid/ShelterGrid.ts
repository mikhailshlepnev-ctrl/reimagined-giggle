import type { DeepReadonly, GameState } from '../core/State';
import type { GridSlot } from './GridSlot';
export type GridSource = Pick<GameState, 'built' | 'bunker' | 'population'> | DeepReadonly<Pick<GameState, 'built' | 'bunker' | 'population'>>;

/** Projection of the existing aggregate model, never a second source of truth. */
export class ShelterGrid {
  readonly slots: readonly GridSlot[];
  readonly columns: number;
  readonly rows: number;
  readonly capacity: number;
  readonly population: number;
  readonly occupied: number;
  readonly freeCapacity: number;
  readonly overflow: number;
  readonly protectedCapacity: number;
  readonly receptionCapacity: number;

  private constructor(source: GridSource, columns: number) {
    if (!Number.isSafeInteger(columns) || columns < 1) throw new RangeError('Grid columns must be a positive integer');
    this.columns = columns;
    const slots: GridSlot[] = [];
    // Sorting makes placement stable across JSON key ordering and import/export.
    for (const moduleId of Object.keys(source.built).sort()) {
      const levels = source.built[moduleId] ?? 0;
      if (!Number.isSafeInteger(levels) || levels < 0) throw new RangeError(`Invalid built level: ${moduleId}`);
      if (slots.length + levels > 10000) throw new RangeError('Too many projected building levels');
      for (let level = 1; level <= levels; level++) {
        const index = slots.length, row = Math.floor(index / columns);
        slots.push(Object.freeze({ id: `${moduleId}:${level}`, moduleId, level, column: index % columns, row, layer: row + 1 }));
      }
    }
    this.slots = Object.freeze(slots);
    this.rows = Math.ceil(slots.length / columns);
    this.capacity = Math.max(0, Math.floor(source.bunker.capacity));
    this.population = Math.max(0, source.population);
    this.occupied = Math.ceil(this.population);
    this.freeCapacity = Math.max(0, Math.floor(this.capacity - this.population));
    this.overflow = Math.max(0, Math.ceil(this.population - this.capacity));
    this.protectedCapacity = Math.max(0, source.bunker.protectedCapacity ?? 0);
    this.receptionCapacity = Math.max(0, source.bunker.receptionCapacity ?? 0);
    Object.freeze(this);
  }
  static fromState(source: GridSource, columns = 6): ShelterGrid { return new ShelterGrid(source, columns); }
}
export function deriveShelterGrid(source: GridSource, columns = 6): ShelterGrid { return ShelterGrid.fromState(source, columns); }
