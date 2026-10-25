/** Synchronous, typed domain events. No dependency on DOM EventTarget. */
export class EventBus<Events extends object = Record<string, unknown>> {
  private readonly listeners = new Map<keyof Events, Set<(payload: never) => void>>();
  private disposed = false;

  on<K extends keyof Events>(type: K, listener: (payload: Events[K]) => void): () => void {
    if (this.disposed) throw new Error('EventBus has been disposed');
    let set = this.listeners.get(type);
    if (!set) { set = new Set(); this.listeners.set(type, set); }
    const typedListener = listener as (payload: never) => void;
    set.add(typedListener);
    return () => {
      set.delete(typedListener);
      if (set.size === 0 && this.listeners.get(type) === set) this.listeners.delete(type);
    };
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    if (this.disposed) return;
    // New subscriptions take effect on the next emission, not midway through this one.
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(payload as never);
  }

  dispose(): void { this.listeners.clear(); this.disposed = true; }
}
