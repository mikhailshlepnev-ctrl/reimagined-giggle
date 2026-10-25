export interface ViewPoint { x: number; y: number }
export interface ViewBounds { x: number; y: number; width: number; height: number }
export interface ViewportOptions {
  onChange: () => void;
  onSelect?: (point: ViewPoint) => void;
}

/** Screen-space camera only. Pointer and keyboard interactions never change game state. */
export class Viewport {
  private width = 1;
  private height = 1;
  private offset: ViewPoint = { x: 0, y: 0 };
  private scale = 1;
  private fitScale = 1;
  private bounds: ViewBounds = { x: 0, y: 0, width: 1, height: 1 };
  private pointer: { id: number; origin: ViewPoint; last: ViewPoint; dragged: boolean } | null = null;
  private readonly abort = new AbortController();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly options: ViewportOptions) {
    const signal = this.abort.signal;
    canvas.addEventListener('pointerdown', this.pointerDown, { signal });
    canvas.addEventListener('pointermove', this.pointerMove, { signal });
    canvas.addEventListener('pointerup', this.pointerUp, { signal });
    canvas.addEventListener('pointercancel', this.pointerCancel, { signal });
    canvas.addEventListener('lostpointercapture', this.pointerCancel, { signal });
    canvas.addEventListener('wheel', this.wheel, { signal, passive: false });
    canvas.addEventListener('keydown', this.keyDown, { signal });
  }

  get zoom(): number { return this.scale; }
  get relativeZoom(): number { return this.scale / this.fitScale; }
  resize(width: number, height: number): void {
    const center = this.toWorld({ x: this.width / 2, y: this.height / 2 });
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.offset = { x: this.width / 2 - center.x * this.scale, y: this.height / 2 - center.y * this.scale };
    this.options.onChange();
  }
  fit(bounds: ViewBounds = this.bounds, padding = 24): void {
    this.bounds = { ...bounds };
    const availableWidth = Math.max(1, this.width - padding * 2), availableHeight = Math.max(1, this.height - padding * 2);
    this.fitScale = this.scale = Math.min(availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height));
    this.offset = { x: (this.width - bounds.width * this.scale) / 2 - bounds.x * this.scale, y: (this.height - bounds.height * this.scale) / 2 - bounds.y * this.scale };
    this.options.onChange();
  }
  panBy(x: number, y: number): void {
    this.offset = { x: this.offset.x + x, y: this.offset.y + y };
    this.options.onChange();
  }
  zoomBy(factor: number, anchor: ViewPoint = { x: this.width / 2, y: this.height / 2 }): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const world = this.toWorld(anchor), next = Math.max(this.fitScale * .3, Math.min(Math.max(this.fitScale * 8, 3), this.scale * factor));
    this.scale = next;
    this.offset = { x: anchor.x - world.x * next, y: anchor.y - world.y * next };
    this.options.onChange();
  }
  toWorld(point: ViewPoint): ViewPoint { return { x: (point.x - this.offset.x) / this.scale, y: (point.y - this.offset.y) / this.scale }; }
  visibleBounds(): ViewBounds {
    const start = this.toWorld({ x: 0, y: 0 });
    return { ...start, width: this.width / this.scale, height: this.height / this.scale };
  }
  apply(context: CanvasRenderingContext2D): void { context.translate(this.offset.x, this.offset.y); context.scale(this.scale, this.scale); }
  dispose(): void {
    if (this.pointer && this.canvas.hasPointerCapture(this.pointer.id)) this.canvas.releasePointerCapture(this.pointer.id);
    this.pointer = null;
    this.abort.abort();
  }
  private eventPoint(event: PointerEvent | WheelEvent): ViewPoint {
    const box = this.canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }
  private pointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.pointer) return;
    const point = this.eventPoint(event);
    this.pointer = { id: event.pointerId, origin: point, last: point, dragged: false };
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(event.pointerId);
  };
  private pointerMove = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    const point = this.eventPoint(event);
    if (Math.hypot(point.x - this.pointer.origin.x, point.y - this.pointer.origin.y) > 5) this.pointer.dragged = true;
    if (this.pointer.dragged) this.panBy(point.x - this.pointer.last.x, point.y - this.pointer.last.y);
    this.pointer.last = point;
  };
  private pointerUp = (event: PointerEvent): void => {
    if (!this.pointer || event.pointerId !== this.pointer.id) return;
    const click = !this.pointer.dragged;
    this.pointer = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (click) this.options.onSelect?.(this.toWorld(this.eventPoint(event)));
  };
  private pointerCancel = (): void => { this.pointer = null; };
  private wheel = (event: WheelEvent): void => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? this.height : 1);
    this.zoomBy(Math.exp(-Math.max(-500, Math.min(500, delta)) * .0015), this.eventPoint(event));
  };
  private keyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => this.panBy(28, 0), ArrowRight: () => this.panBy(-28, 0), ArrowUp: () => this.panBy(0, 28), ArrowDown: () => this.panBy(0, -28),
      '+': () => this.zoomBy(1.2), '=': () => this.zoomBy(1.2), '-': () => this.zoomBy(1 / 1.2), '0': () => this.fit(), f: () => this.fit(), F: () => this.fit(),
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };
}
