/// <reference types="jest" />
import React, { memo } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import { useToday } from './use-today';

const Day = memo(function Day({ date }: { date: string }) {
  const today = useToday();
  return <>{date === today ? `${date}: Today` : date}</>;
});

describe('today indicators', () => {
  let renderer: ReactTestRenderer;
  let onAppStateChange: (state: AppStateStatus) => void;
  let remove: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 5, 23, 59, 59));
    remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      onAppStateChange = listener;
      return { remove };
    });
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const mountDays = () => {
    act(() => {
      renderer = create(<><Day date="2026-09-05" /><Day date="2026-09-06" /></>);
    });
    expect(renderer.toJSON()).toEqual(['2026-09-05: Today', '2026-09-06']);
  };

  it('moves Today to Sunday on resume without changing row props', () => {
    mountDays();
    act(() => onAppStateChange('background'));
    jest.setSystemTime(new Date(2026, 8, 6, 18, 48));
    act(() => onAppStateChange('active'));
    expect(renderer.toJSON()).toEqual(['2026-09-05', '2026-09-06: Today']);
  });

  it('shares and cleans up the clock when the indicators unmount', () => {
    mountDays();
    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
    act(() => onAppStateChange('background'));
    expect(jest.getTimerCount()).toBe(0);
    act(() => onAppStateChange('active'));
    expect(jest.getTimerCount()).toBe(1);
    act(() => renderer.unmount());
    expect(remove).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('moves Today at local midnight while the app stays open', () => {
    mountDays();
    act(() => jest.advanceTimersByTime(1000));
    expect(renderer.toJSON()).toEqual(['2026-09-05', '2026-09-06: Today']);
  });
});
