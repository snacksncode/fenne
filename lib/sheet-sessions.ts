/** The native presentation promise and the user's selection promise have different lifetimes. */
type NativeSheet = { present: () => Promise<void>; dismiss: () => Promise<void> };

export type SheetSession = {
  id: string;
  key: number;
  data: unknown;
  attach: (native: NativeSheet) => void;
  didDismiss: () => void;
  dismiss: (result?: unknown) => Promise<void>;
};

export const createSheetSessions = (reportError: (error: unknown) => void) => {
  let snapshot: SheetSession[] = [];
  let nextKey = 0;
  const pending = new Map<string, SheetSession>();
  const listeners = new Set<() => void>();
  const publish = (next: SheetSession[]) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const present = (id: string, data?: unknown): Promise<unknown> => {
    const previous = pending.get(id);
    let native: NativeSheet | undefined;
    let presentation: Promise<void> | undefined;
    let dismissal: Promise<void> | undefined;
    let predecessorDismissal: Promise<void> | undefined;
    let selected: unknown;
    let settled = false;
    let resolve!: (result: unknown) => void;
    const result = new Promise<unknown>((done) => { resolve = done; });

    const finish = () => {
      if (settled) return;
      settled = true;
      if (pending.get(id) === session) pending.delete(id);
      if (snapshot.includes(session)) publish(snapshot.filter((entry) => entry !== session));
      resolve(selected);
    };
    const fail = (error: unknown) => {
      selected = undefined;
      reportError(error);
      finish();
    };
    const session: SheetSession = {
      id, key: ++nextKey, data,
      attach: (instance) => {
        if (settled || native) return;
        native = instance;
        // TrueSheet.present waits for its own native mount. No guessed delay is needed.
        presentation = instance.present().catch(fail);
      },
      didDismiss: finish,
      dismiss: (value) => {
        if (settled) return Promise.resolve();
        if (dismissal) return dismissal;
        selected = value;
        if (!native) {
          finish();
          return predecessorDismissal ?? Promise.resolve();
        }
        dismissal = (async () => {
          await presentation;
          if (settled) return;
          try {
            await native.dismiss();
            finish();
          } catch (error) {
            fail(error);
          }
        })();
        return dismissal;
      },
    };
    pending.set(id, session);
    const mount = () => {
      if (!settled) publish([...snapshot, session]);
    };
    // Replacing a sheet cancels its old selection and waits for native dismissal.
    if (previous) {
      predecessorDismissal = previous.dismiss();
      void predecessorDismissal.then(mount);
    } else mount();
    return result;
  };

  return {
    present,
    dismiss: (id: string, result?: unknown) => pending.get(id)?.dismiss(result) ?? Promise.resolve(),
    dismissAll: async () => {
      // Capture the sessions: newly opened sheets do not belong to this dismissal.
      const sessions = [...pending.values()].reverse();
      for (const session of sessions) await session.dismiss();
    },
    dispose: () => {
      new Set([...snapshot, ...pending.values()]).forEach((session) => session.didDismiss());
    },
    isIdle: () => snapshot.length === 0 && pending.size === 0,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
};
