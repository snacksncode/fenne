import { TrueSheetProvider } from '@lodev09/react-native-true-sheet';
import { ComponentType, ReactNode, createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

import { createSheetSessions, SheetSession } from './sheet-sessions';

export interface Sheets {}

// sheets.tsx augments Sheets: each id may define input data and a result type.
// Runtime storage is heterogeneous, so this file erases to unknown internally and restores types at present/dismiss.
type SheetId = keyof Sheets & string;
type SheetData<T extends SheetId> = Sheets[T] extends { data: infer Data }
  ? Data
  : Sheets[T] extends { data?: infer Data }
    ? Data | undefined
    : never;
type SheetResult<T extends SheetId> = Sheets[T] extends { result: infer Result } ? Result : undefined;

type NoDataSheetProps<T extends SheetId> = {
  sheetId: T;
};

type OptionalDataSheetProps<T extends SheetId> = {
  sheetId: T;
  data?: Exclude<SheetData<T>, undefined>;
};

type RequiredDataSheetProps<T extends SheetId> = {
  sheetId: T;
  data: SheetData<T>;
};

export type SheetProps<T extends SheetId> = [SheetData<T>] extends [never]
  ? NoDataSheetProps<T>
  : undefined extends SheetData<T>
    ? OptionalDataSheetProps<T>
    : RequiredDataSheetProps<T>;

type PresentArgs<T extends SheetId> = [SheetData<T>] extends [never]
  ? [options?: { data?: never }]
  : undefined extends SheetData<T>
    ? [options?: { data?: Exclude<SheetData<T>, undefined> }]
    : [options: { data: SheetData<T> }];
type DismissArgs<T extends SheetId> = [SheetResult<T>] extends [undefined]
  ? [id: T, result?: undefined]
  : [id: T, result: SheetResult<T>];

type SheetContextValue = {
  present: <T extends SheetId>(id: T, ...args: PresentArgs<T>) => Promise<SheetResult<T> | undefined>;
  dismiss: <T extends SheetId>(...args: DismissArgs<T>) => Promise<void>;
  dismissAll: () => Promise<void>;
};

type RegisteredSheets = {
  [T in SheetId]: ComponentType<SheetProps<T>>;
};

type SessionHost = ReturnType<typeof createSheetSessions>;
const SheetContext = createContext<SessionHost | null>(null);
const SessionContext = createContext<SheetSession | null>(null);

const useSheetHost = () => {
  const context = useContext(SheetContext);
  if (!context) throw new Error('Sheet components must be rendered inside SheetHost');
  return context;
};

export const useSheets = (): SheetContextValue => {
  const host = useSheetHost();
  const [actions] = useState<SheetContextValue>(() => ({
    present: <T extends SheetId>(id: T, ...[options]: PresentArgs<T>) =>
      host.present(id, options?.data) as Promise<SheetResult<T> | undefined>,
    dismiss: (...[id, result]) => host.dismiss(id, result),
    dismissAll: host.dismissAll,
  }));
  return actions;
};

/** Used for prompts that must wait until the current native sheet has dismissed. */
export const useSheetsIdle = () => {
  const host = useSheetHost();
  return useSyncExternalStore(host.subscribe, host.isIdle);
};

export const useSheetSession = () => {
  const session = useContext(SessionContext);
  if (!session) throw new Error('BaseSheet must be rendered by SheetRegister');
  return session;
};

export const SheetHost = ({ children }: { children: ReactNode }) => {
  const [host] = useState(() => createSheetSessions((error) => console.error('Sheet lifecycle failed', error)));
  useEffect(() => () => host.dispose(), [host]);
  return (
    <TrueSheetProvider>
      <SheetContext.Provider value={host}>{children}</SheetContext.Provider>
    </TrueSheetProvider>
  );
};

export const SheetRegister = ({ sheets }: { sheets: RegisteredSheets }) => {
  const host = useSheetHost();
  const active = useSyncExternalStore(host.subscribe, host.getSnapshot);
  return <>{active.map((session) => {
    const Sheet = sheets[session.id as SheetId] as ComponentType<{ sheetId: SheetId; data?: unknown }>;
    return (
      <SessionContext.Provider key={session.key} value={session}>
        <Sheet sheetId={session.id as SheetId} data={session.data} />
      </SessionContext.Provider>
    );
  })}</>;
};
