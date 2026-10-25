/** View coordinates for an existing built level; no independent simulation state. */
export interface GridSlot {
  readonly id: string;
  readonly moduleId: string;
  readonly level: number;
  readonly column: number;
  readonly row: number;
  readonly layer: number;
}
