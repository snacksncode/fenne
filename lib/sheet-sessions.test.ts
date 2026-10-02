/// <reference types="jest" />
import { createSheetSessions } from './sheet-sessions';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const nativeSheet = () => ({ present: jest.fn(async () => {}), dismiss: jest.fn(async () => {}) });

it('waits for a mounted native sheet and settles selections only after dismissal', async () => {
  const host = createSheetSessions(jest.fn());
  const result = host.present('select', { initial: 4 });
  const settled = jest.fn();
  void result.then(settled);
  const native = nativeSheet();
  const dismissed = deferred();
  native.dismiss.mockReturnValue(dismissed.promise);
  expect(native.present).not.toHaveBeenCalled();
  host.getSnapshot()[0].attach(native);
  expect(native.present).toHaveBeenCalledTimes(1);
  const closing = host.dismiss('select', 5);
  await flush();
  expect(settled).not.toHaveBeenCalled();
  dismissed.resolve();
  await closing;
  await expect(result).resolves.toBe(5);
  expect(host.getSnapshot()).toEqual([]);
});

it('waits for native presentation before dismissing', async () => {
  const host = createSheetSessions(jest.fn());
  const result = host.present('select');
  const native = nativeSheet();
  const presented = deferred();
  native.present.mockReturnValue(presented.promise);
  host.getSnapshot()[0].attach(native);
  const closing = host.dismiss('select', 'chosen');
  await flush();
  expect(native.dismiss).not.toHaveBeenCalled();
  presented.resolve();
  await closing;
  await expect(result).resolves.toBe('chosen');
});

it('swipe cancellation settles once and stale events cannot dismiss a replacement', async () => {
  const host = createSheetSessions(jest.fn());
  const result = host.present('select');
  const first = host.getSnapshot()[0];
  first.didDismiss();
  await expect(result).resolves.toBeUndefined();
  const replacement = host.present('select', 'new');
  first.didDismiss();
  expect(host.getSnapshot()[0].data).toBe('new');
  await host.dismiss('select', 'new choice');
  await expect(replacement).resolves.toBe('new choice');
});

it('serializes rapid same-id replacement behind the original native dismissal', async () => {
  const host = createSheetSessions(jest.fn());
  const first = host.present('select', 1);
  const native = nativeSheet();
  const dismissed = deferred();
  native.dismiss.mockReturnValue(dismissed.promise);
  host.getSnapshot()[0].attach(native);
  const second = host.present('select', 2);
  const third = host.present('select', 3);
  await flush();
  expect(host.getSnapshot().map((entry) => entry.data)).toEqual([1]);
  dismissed.resolve();
  await flush();
  await expect(first).resolves.toBeUndefined();
  await expect(second).resolves.toBeUndefined();
  expect(host.getSnapshot().map((entry) => entry.data)).toEqual([3]);
  await host.dismiss('select', 'third');
  await expect(third).resolves.toBe('third');
});

it.each(['present', 'dismiss'] as const)('cleans up and reports native %s failure without hanging the selection', async (operation) => {
  const report = jest.fn();
  const host = createSheetSessions(report);
  const result = host.present('select');
  const native = nativeSheet();
  const error = new Error('native failed');
  native[operation].mockRejectedValue(error);
  host.getSnapshot()[0].attach(native);
  if (operation === 'dismiss') await host.dismiss('select', 'not committed');
  await expect(result).resolves.toBeUndefined();
  expect(report).toHaveBeenCalledWith(error);
  expect(host.getSnapshot()).toEqual([]);
});

it('dismiss-all cancels selections, including a pending replacement', async () => {
  const host = createSheetSessions(jest.fn());
  const first = host.present('parent');
  host.getSnapshot()[0].attach(nativeSheet());
  const child = host.present('child');
  const replacement = host.present('parent');
  await host.dismissAll();
  await flush();
  await expect(Promise.all([first, child, replacement])).resolves.toEqual([undefined, undefined, undefined]);
  expect(host.getSnapshot()).toEqual([]);
});

it('host disposal cancels outstanding user selections', async () => {
  const host = createSheetSessions(jest.fn());
  const result = host.present('select');
  host.dispose();
  await expect(result).resolves.toBeUndefined();
  expect(host.getSnapshot()).toEqual([]);
});

it('disposal also cancels the previous native sheet while a replacement waits', async () => {
  const host = createSheetSessions(jest.fn());
  const first = host.present('select');
  const native = nativeSheet();
  const dismissed = deferred();
  native.dismiss.mockReturnValue(dismissed.promise);
  host.getSnapshot()[0].attach(native);
  const second = host.present('select');
  host.dispose();
  await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
  expect(host.isIdle()).toBe(true);
  dismissed.resolve();
  await flush();
  expect(host.getSnapshot()).toEqual([]);
});
