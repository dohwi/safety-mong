export class SessionTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startedAt: number = 0;
  private durationMs: number;

  constructor(
    private onExpire: () => void,
    durationMs: number = 30000
  ) {
    this.durationMs = durationMs;
  }

  start(durationMs?: number) {
    this.clear();
    if (durationMs !== undefined) {
      this.durationMs = durationMs;
    }
    this.startedAt = Date.now();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.onExpire();
    }, this.durationMs);
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getRemainingMs(): number {
    if (!this.startedAt) return 0;
    const elapsed = Date.now() - this.startedAt;
    return Math.max(0, this.durationMs - elapsed);
  }

  getStartedAt(): number {
    return this.startedAt;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }
}

export class IntermissionTimer extends SessionTimer {
  constructor(onExpire: () => void) {
    super(onExpire, 5000);
  }
}
