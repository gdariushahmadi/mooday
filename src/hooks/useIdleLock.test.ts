import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useIdleLock } from "@/hooks/useIdleLock";

beforeEach(() => {
 vi.useFakeTimers();
});

afterEach(() => {
 vi.useRealTimers();
});

describe("useIdleLock", () => {
 it("reports `expired` once `idleMs` reaches `timeoutMs`", () => {
 const { result } = renderHook(() =>
 useIdleLock({ timeoutMs: 1_000 }),
 );

 expect(result.current.expired).toBe(false);

 // Advance just under the threshold.
 act(() => {
 vi.advanceTimersByTime(999);
 });
 expect(result.current.expired).toBe(false);

 // Cross the threshold.
 act(() => {
 vi.advanceTimersByTime(2);
 });
 expect(result.current.expired).toBe(true);
 });

 it("resets the timer when `reset()` is called", () => {
 const { result } = renderHook(() =>
 useIdleLock({ timeoutMs: 1_000 }),
 );

 act(() => {
 vi.advanceTimersByTime(2_000);
 });
 expect(result.current.expired).toBe(true);

 act(() => {
 result.current.reset();
 });
 expect(result.current.expired).toBe(false);
 expect(result.current.idleMs).toBe(0);
 });

 it("never expires when `enabled` is false", () => {
 const { result } = renderHook(() =>
 useIdleLock({ timeoutMs: 1_000, enabled: false }),
 );

 act(() => {
 vi.advanceTimersByTime(10_000);
 });
 expect(result.current.expired).toBe(false);
 });

 it("treats synthetic activity events as activity", () => {
 const { result } = renderHook(() =>
 useIdleLock({ timeoutMs: 1_000 }),
 );

 act(() => {
 vi.advanceTimersByTime(900);
 });
 // Dispatch any activity event the hook listens to.
 act(() => {
 window.dispatchEvent(new Event("pointerdown"));
 });
 act(() => {
 vi.advanceTimersByTime(900);
 });
 // Without the activity event we would already be expired at t=1800.
 // With it, we reset at t=900 so t=1800 is only 900 ms into the new cycle.
 expect(result.current.expired).toBe(false);
 });
});
