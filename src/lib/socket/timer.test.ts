import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionTimer, IntermissionTimer } from "./timer";

describe("SessionTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("fires onExpire after duration", () => {
    const onExpire = vi.fn();
    const timer = new SessionTimer(onExpire, 1000);

    timer.start();
    expect(timer.isRunning()).toBe(true);

    vi.advanceTimersByTime(999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does not fire after clear", () => {
    const onExpire = vi.fn();
    const timer = new SessionTimer(onExpire, 1000);

    timer.start();
    timer.clear();

    vi.advanceTimersByTime(2000);
    expect(onExpire).not.toHaveBeenCalled();
    expect(timer.isRunning()).toBe(false);
  });

  it("returns remaining time", () => {
    const timer = new SessionTimer(() => {}, 5000);
    timer.start();

    vi.advanceTimersByTime(2000);
    expect(timer.getRemainingMs()).toBe(3000);
  });

  it("returns 0 remaining when not started", () => {
    const timer = new SessionTimer(() => {}, 1000);
    expect(timer.getRemainingMs()).toBe(0);
  });

  it("can be restarted with new duration", () => {
    const onExpire = vi.fn();
    const timer = new SessionTimer(onExpire, 1000);

    timer.start();
    timer.start(3000);

    vi.advanceTimersByTime(1000);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});

describe("IntermissionTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("defaults to 4000ms", () => {
    const onExpire = vi.fn();
    const timer = new IntermissionTimer(onExpire);

    timer.start();
    vi.advanceTimersByTime(3999);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
