import { TrueSheet, TrueSheetProvider } from '@lodev09/react-native-true-sheet';
import { ComponentType, ReactNode, createContext, useContext, useRef, useState } from 'react';

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

type ActiveSheet = {
  id: SheetId;
  data?: unknown;
};
type ActiveSheetMap = Partial<Record<SheetId, ActiveSheet>>;
type PendingResultMap = Partial<Record<SheetId, (result: unknown) => void>>;
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
  active: ActiveSheetMap;
  handleDidDismiss: (id: SheetId) => void;
};

type RegisteredSheets = {
  [T in SheetId]: ComponentType<SheetProps<T>>;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export const useSheets = () => {
  const context = useContext(SheetContext);
  if (!context) throw new Error('Sheet components must be rendered inside SheetHost');
  return {
    present: context.present,
    dismiss: context.dismiss,
    dismissAll: context.dismissAll,
  };
};

export const useSheetInternal = () => {
  const context = useContext(SheetContext);
  if (!context) throw new Error('Sheet components must be rendered inside SheetHost');
  return context;
};

const SheetHostContent = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState<ActiveSheetMap>({});
  const pendingResults = useRef<PendingResultMap>({});

  const unmountSheet = (id: SheetId) => {
    setActive((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const resetSheet = (id: SheetId) => {
    const resolve = pendingResults.current[id];

    delete pendingResults.current[id];
    unmountSheet(id);
    resolve?.(undefined);
  };

  const value: SheetContextValue = {
    active,
    present: (id, ...args) => {
      const [options] = args;
      const previousResolve = pendingResults.current[id];
      delete pendingResults.current[id];
      previousResolve?.(undefined);

      setActive((current) => ({
        ...current,
        [id]: { id, data: options?.data },
      }));
      requestAnimationFrame(() => {
        TrueSheet.present(id);
      });
      return new Promise((resolve) => {
        pendingResults.current[id] = resolve as (result: unknown) => void;
      });
    },
    dismiss: async (...args) => {
      const [id, result] = args;
      const resolve = pendingResults.current[id];
      delete pendingResults.current[id];
      resolve?.(result);
      await TrueSheet.dismiss(id);
    },
    dismissAll: () => TrueSheet.dismissAll(),
    handleDidDismiss: resetSheet,
  };

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
};

export const SheetHost = ({ children }: { children: ReactNode }) => {
  return (
    <TrueSheetProvider>
      <SheetHostContent>{children}</SheetHostContent>
    </TrueSheetProvider>
  );
};

export const SheetRegister = ({ sheets }: { sheets: RegisteredSheets }) => {
  const { active } = useSheetInternal();

  const renderSheet = (entry: ActiveSheet) => {
    const Sheet = sheets[entry.id] as ComponentType<{ sheetId: SheetId; data?: unknown }>;
    const props = entry.data === undefined ? { sheetId: entry.id } : { sheetId: entry.id, data: entry.data };
    return <Sheet key={entry.id} {...props} />;
  };

  return <>{Object.values(active).map((entry) => (entry ? renderSheet(entry) : null))}</>;
};
