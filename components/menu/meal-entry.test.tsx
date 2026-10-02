/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { MealEntry } from './meal-entry';

const mockEnters: string[] = [];
const mockExits: string[] = [];
// Model Reanimated's mount-scoped suppression. Recycling changes props without
// remounting the MealEntry, just as FlashList does when it reassigns a cell.
const mockSkipContext = React.createContext({ entering: false, exiting: false });
jest.mock('react-native-reanimated', () => ({
  LayoutAnimationConfig: ({ children, skipEntering, skipExiting }: any) => {
    const React = jest.requireActual('react');
    const value = React.useRef({ entering: skipEntering, exiting: false });
    React.useEffect(() => { value.current.entering = false; }, []);
    React.useLayoutEffect(() => () => { value.current.exiting = skipExiting; }, [skipExiting]);
    return <mockSkipContext.Provider value={value.current}>{children}</mockSkipContext.Provider>;
  },
}));
jest.mock('@/components/animated-list', () => ({
  ListLayoutView: ({ children }: any) => {
    const React = jest.requireActual('react');
    const skip = React.useContext(mockSkipContext);
    const mounted = React.useRef(false);
    const name = children.props.children[1].props.children;
    if (!mounted.current) { mounted.current = true; if (!skip.entering) mockEnters.push(name); }
    React.useEffect(() => () => { if (!skip.exiting) mockExits.push(name); }, [name, skip]);
    return children;
  },
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/sheet-context', () => ({ useSheets: () => ({ present: jest.fn() }) }));
jest.mock('@/components/pressable-with-feedback', () => ({ PressableWithHaptics: 'Pressable' }));
jest.mock('@/components/Typography', () => ({ Typography: 'Text' }));
jest.mock('@/components/menu/meal-type-kicker', () => ({ MealTypeKicker: 'Kicker' }));

describe('meal slot identity', () => {
  let renderer: ReactTestRenderer;
  const render = (date: string, recipeId: string, entryId = 'saved-id') => act(() => {
    const element = <MealEntry dateString={date} entry={{ id: entryId, type: 'recipe', mealType: 'lunch',
      recipe: { id: recipeId, name: recipeId } as any }} />;
    if (renderer) renderer.update(element); else renderer = create(element);
  });
  beforeEach(() => { mockEnters.length = 0; mockExits.length = 0; });
  afterEach(() => { act(() => renderer.unmount()); renderer = undefined as any; });

  it('shows a newly mounted recipe immediately', () => {
    render('2026-10-06', 'bowl');
    expect(mockEnters).toEqual([]);
  });

  it('suppresses initial fades when a cell is reused for another day', () => {
    render('2026-10-05', 'noodles');
    render('2026-10-06', 'bowl');
    expect(mockEnters).toEqual([]);
    expect(mockExits).toEqual([]);
  });

  it('mounts a fading replacement only within the same day and meal slot', () => {
    render('2026-10-06', 'bowl');
    render('2026-10-06', 'noodles');
    expect(mockEnters).toEqual(['noodles']);
    expect(mockExits).toEqual(['bowl']);
  });

  it('does not remount a recipe when its optimistic entry id is confirmed', () => {
    render('2026-10-06', 'bowl', 'optimistic-id');
    render('2026-10-06', 'bowl', 'server-id');
    expect(mockEnters).toEqual([]);
  });
});
