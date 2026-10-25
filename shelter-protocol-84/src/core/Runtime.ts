/** Internal compatibility registry used while preserving the tested V17 formulas.
 * Only TurnEngine owns this mutable registry. Presentation receives its read model
 * and sends commands; integrations should use TurnEngine, not this internal type.
 */
export interface Runtime {
  [name: string]: any;
  state: any;
  viewState: any;
  random(): number;
  input(id: string): any;
  emit(type: string, payload?: any): void;
  invalidate(): void;
}
export interface Initialization { order: number; run(runtime: Runtime): void }
