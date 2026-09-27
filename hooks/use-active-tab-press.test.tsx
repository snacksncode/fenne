/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useActiveTabPress } from './use-active-tab-press';

let mockFocused = true;
let mockListener: ((event: { preventDefault: () => void }) => void) | undefined;
const mockNavigation = {
  isFocused: () => mockFocused,
  addListener: jest.fn((_type, listener) => {
    mockListener = listener;
    return () => { mockListener = undefined; };
  }),
};
jest.mock('expo-router/react-navigation', () => ({ useNavigation: () => mockNavigation }));

it('only handles presses on the active tab and cleans up its listener', () => {
  const onPress = jest.fn();
  const preventDefault = jest.fn();
  const Harness = () => { useActiveTabPress(onPress); return null; };
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<Harness />); });
  expect(mockNavigation.addListener).toHaveBeenCalledWith('tabPress', expect.any(Function));

  mockFocused = false;
  act(() => mockListener?.({ preventDefault }));
  expect(onPress).not.toHaveBeenCalled();
  expect(preventDefault).not.toHaveBeenCalled();

  mockFocused = true;
  act(() => mockListener?.({ preventDefault }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(preventDefault).toHaveBeenCalledTimes(1);
  act(() => renderer.unmount());
  expect(mockListener).toBeUndefined();
});
