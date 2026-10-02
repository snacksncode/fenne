/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Provider } from 'jotai';
import { useScheduleViewport } from './use-schedule-viewport';

let mockToday = '2026-09-30';
let mockLoading = false;
const mockScheduleMap = { '2026-09-30': { date: '2026-09-30', breakfast: null, lunch: null, dinner: null } };
let mockTabPress: () => void;
jest.mock('./use-today', () => ({ useToday: () => mockToday }));
jest.mock('./use-active-tab-press', () => ({ useActiveTabPress: (callback: () => void) => { mockTabPress = callback; } }));
jest.mock('@/api/schedules', () => ({ useSchedule: () => ({ scheduleMap: mockScheduleMap, isInitialLoading: mockLoading }) }));
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: (style: () => unknown) => style(), withSpring: (value: number) => value,
}));

let viewport: ReturnType<typeof useScheduleViewport>;
let renderer: ReactTestRenderer;
let frame: FrameRequestCallback | undefined;
const scrollToIndex = jest.fn(async () => {});
const Harness = () => { viewport = useScheduleViewport(90); return null; };
const render = () => <Provider><Harness /></Provider>;
const visible = (...dates: string[]) => ({ viewableItems: dates.map((date) => ({ item: { date } })) });
const updateVisible = (...dates: string[]) => act(() => viewport.listProps.onViewableItemsChanged(
  visible(...dates) as Parameters<typeof viewport.listProps.onViewableItemsChanged>[0]
));
const commitFrame = () => act(() => { const next = frame; frame = undefined; next?.(0); });

beforeEach(() => {
  mockToday = '2026-09-30';
  mockLoading = false;
  frame = undefined;
  scrollToIndex.mockClear();
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => { frame = callback; return 1; });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => { frame = undefined; });
  act(() => { renderer = create(render()); });
  viewport.listRef.current = { scrollToIndex } as unknown as NonNullable<typeof viewport.listRef.current>;
});
afterEach(() => { act(() => renderer.unmount()); jest.restoreAllMocks(); });

it('scrolls once after native list readiness, then removes the skeleton when today is visible', () => {
  expect(scrollToIndex).not.toHaveBeenCalled();
  act(() => viewport.listProps.onLoad());
  expect(scrollToIndex).not.toHaveBeenCalled();
  commitFrame();
  expect(scrollToIndex).toHaveBeenCalledWith({ index: 9, viewOffset: -90, animated: false });
  act(() => viewport.listProps.onLoad());
  commitFrame();
  expect(scrollToIndex).toHaveBeenCalledTimes(1);
  updateVisible(mockToday);
  expect(viewport.hasLoaded).toBe(true);
});

it('suppresses intermediate scroll positions until today is reached without a timed lock', () => {
  act(() => viewport.listProps.onLoad());
  commitFrame();
  updateVisible(mockToday);
  updateVisible('2026-09-25');
  expect(viewport.backToTodayStyle).toMatchObject({ opacity: 1 });
  act(() => mockTabPress());
  commitFrame();
  updateVisible('2026-09-26');
  expect(viewport.backToTodayStyle).toMatchObject({ opacity: 0 });
  updateVisible(mockToday);
  updateVisible('2026-10-02');
  expect(viewport.backToTodayStyle).toMatchObject({ opacity: 1 });
});

it('a user drag interrupts return-to-today suppression', () => {
  act(() => viewport.listProps.onLoad());
  commitFrame();
  updateVisible(mockToday);
  act(() => viewport.returnToToday());
  act(() => viewport.listProps.onScrollBeginDrag());
  updateVisible('2026-09-25');
  expect(viewport.backToTodayStyle).toMatchObject({ opacity: 1 });
});

it('expands the range on day rollover after a long suspension and returns to the new today', () => {
  act(() => viewport.listProps.onLoad());
  commitFrame();
  updateVisible(mockToday);
  mockToday = '2026-11-12';
  act(() => renderer.update(render()));
  expect(viewport.days.some((day) => day.date === mockToday)).toBe(true);
  act(() => viewport.returnToToday());
  commitFrame();
  expect(scrollToIndex).toHaveBeenLastCalledWith({
    index: viewport.days.findIndex((day) => day.date === mockToday), viewOffset: -90, animated: true,
  });
});

it('waits for Schedule data if native layout becomes ready first', () => {
  mockLoading = true;
  act(() => renderer.update(render()));
  act(() => viewport.listProps.onLoad());
  commitFrame();
  expect(scrollToIndex).not.toHaveBeenCalled();
  mockLoading = false;
  act(() => renderer.update(render()));
  commitFrame();
  expect(scrollToIndex).toHaveBeenCalledTimes(1);
});
