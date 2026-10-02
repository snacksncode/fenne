/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { ListAnimationContext, AnimatedListCell } from './cells';
import { AnimatedFlashList } from './index';
import { colors } from '@/constants/colors';

let mockFocused = true;
let mockReducedMotion = false;
const mockEvents: string[] = [];
let mockListProps: any;
const mockCommits: any[] = [];
let mockAnimationContext: any;
const mockPrepare = jest.fn(() => mockEvents.push('prepare'));

jest.mock('expo-router/react-navigation', () => ({ useIsFocused: () => mockFocused }));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn: any, ...args: any[]) => fn(...args) }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    createAnimatedComponent: (component: any) => {
      const React = jest.requireActual('react');
      return React.forwardRef(function MockAnimatedComponent(props: any, ref: any) {
        return React.createElement(component, { ...props, ref, style: [props.style, {}] });
      });
    },
    View: 'AnimatedView',
  },
  FadeIn: { duration: () => 'fade-in' },
  LayoutAnimationConfig: ({ children }: any) => children,
  useReducedMotion: () => mockReducedMotion,
  useAnimatedScrollHandler: (handlers: any) => handlers,
  useSharedValue: (initial: any) => {
    const React = jest.requireActual('react');
    return React.useRef({ value: initial, set(value: any) { this.value = value; } }).current;
  },
  withTiming: (to: number, config: any) => ({ to, ...config }),
  withSpring: (to: number) => ({ spring: to, onFrame: () => false }),
}));
jest.mock('@shopify/flash-list', () => ({
  FlashList: (props: any) => {
    const React = jest.requireActual('react');
    React.useImperativeHandle(props.ref, () => ({ prepareForLayoutAnimationRender: mockPrepare }));
    mockListProps = props;
    mockCommits.push({ data: props.data, style: props.contentContainerStyle });
    mockAnimationContext = React.useContext(jest.requireActual('./cells').ListAnimationContext);
    mockEvents.push(`render:${props.data?.map((row: any) => row.id).join(',')}`);
    return null;
  },
}));

type Row = { id: string; meals: string[] };
const first = { id: 'a', meals: ['breakfast'] };
const second = { id: 'b', meals: ['dinner'] };
const keyExtractor = (row: Row) => row.id;

describe('list data animation transactions', () => {
  let renderer: ReactTestRenderer;

  const render = (data: Row[] | undefined) => {
    act(() => {
      const element = <AnimatedFlashList data={data} keyExtractor={keyExtractor} renderItem={() => null} />;
      if (renderer) renderer.update(element);
      else renderer = create(element);
    });
  };
  beforeEach(() => {
    jest.useFakeTimers();
    mockFocused = true;
    mockReducedMotion = false;
    mockEvents.length = 0;
    mockCommits.length = 0;
    mockPrepare.mockClear();
  });
  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined as unknown as ReactTestRenderer;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('preserves background and sizing when Reanimated supplies a style array', () => {
    act(() => {
      renderer = create(
        <AnimatedFlashList
          data={[first]}
          keyExtractor={keyExtractor}
          renderItem={() => null}
          style={{ backgroundColor: colors.surface.canvas, flex: 1 }}
        />
      );
    });
    // FlashList 2.0.2 spreads this value into a View style object.
    expect({ ...mockListProps.style }).toEqual({ backgroundColor: colors.surface.canvas, flex: 1 });
  });

  it('keeps empty-state sizing with the data during the preparation commit', () => {
    const emptyStyle = { flexGrow: 1, paddingBottom: 106 };
    const filledStyle = { paddingBottom: 186 };
    act(() => {
      renderer = create(<AnimatedFlashList data={[]} keyExtractor={keyExtractor}
        renderItem={() => null} contentContainerStyle={emptyStyle} />);
    });
    mockCommits.length = 0;
    act(() => renderer.update(<AnimatedFlashList data={[first]} keyExtractor={keyExtractor}
      renderItem={() => null} contentContainerStyle={filledStyle} />));
    expect(mockCommits).toEqual([
      { data: [], style: emptyStyle },
      { data: [first], style: filledStyle },
    ]);
    mockCommits.length = 0;
    act(() => renderer.update(<AnimatedFlashList data={[]} keyExtractor={keyExtractor}
      renderItem={() => null} contentContainerStyle={emptyStyle} />));
    expect(mockCommits).toEqual([
      { data: [first], style: filledStyle },
      { data: [], style: emptyStyle },
    ]);
  });

  it('applies inset changes without preparing a data animation', () => {
    act(() => { renderer = create(<AnimatedFlashList data={[]} keyExtractor={keyExtractor}
      renderItem={() => null} contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }} />); });
    act(() => renderer.update(<AnimatedFlashList data={[]} keyExtractor={keyExtractor}
      renderItem={() => null} contentContainerStyle={{ flexGrow: 1, paddingTop: 120 }} />));
    expect(mockListProps.contentContainerStyle).toEqual({ flexGrow: 1, paddingTop: 120 });
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it('does not animate initial loading, equal refetches, or scrolling', () => {
    render(undefined);
    render([first, second]);
    render([{ ...first, meals: [...first.meals] }, { ...second }]);
    act(() => { mockListProps.onScroll.onBeginDrag({}); mockListProps.onScroll.onScroll({ contentOffset: { x: 0, y: 10 } }); mockListProps.onScroll.onEndDrag({}); });
    render([first, second]);
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockListProps.maxItemsInRecyclePool).toBeUndefined();
  });

  it('prepares the old data before committing an insertion or deletion', () => {
    render([first]);
    mockEvents.length = 0;
    render([first, second]);
    expect(mockEvents).toEqual(['render:a', 'prepare', 'render:a,b']);
    mockEvents.length = 0;
    render([second]);
    expect(mockEvents).toEqual(['render:a,b', 'prepare', 'render:b']);
  });

  it('animates nested additions, removals, and height changes with unchanged list keys', () => {
    render([first]);
    render([{ ...first, meals: ['breakfast', 'a lunch whose title wraps'] }]);
    render([{ ...first, meals: [] }]);
    expect(mockPrepare).toHaveBeenCalledTimes(2);
    expect(mockListProps.data).toEqual([{ ...first, meals: [] }]);
  });

  it('commits updates during dragging and momentum immediately, then animates after settling', () => {
    render([first]);
    act(() => mockListProps.onScroll.onBeginDrag({}));
    render([first, second]);
    expect(mockListProps.data).toEqual([first, second]);
    act(() => { mockListProps.onScroll.onEndDrag({}); jest.advanceTimersByTime(100); mockListProps.onScroll.onScroll({ contentOffset: { x: 0, y: 10 } }); });
    render([second]);
    expect(mockPrepare).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(200));
    render([first, second]);
    expect(mockPrepare).toHaveBeenCalledTimes(1);
  });

  it('ignores remeasurement scroll events but disarms transitions when the viewport moves', () => {
    render([first]);
    render([first, second]);
    act(() => mockListProps.onScroll.onScroll({ contentOffset: { x: 0, y: 0 } }));
    expect(mockAnimationContext.phase.value.until).toBeGreaterThan(Date.now());
    act(() => mockListProps.onScroll.onScroll({ contentOffset: { x: 0, y: 10 } }));
    expect(mockAnimationContext.phase.value.until).toBe(0);
    expect(mockAnimationContext.animate).toBe(false);
  });

  it('keeps recycling active for bulk replacements', () => {
    render([first]);
    const bulk = Array.from({ length: 30 }, (_, i) => ({ id: String(i), meals: [] }));
    render(bulk);
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockListProps.data).toEqual(bulk);
  });

  it('animates the first insertion into a loaded empty list', () => {
    render([]);
    render([first]);
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockListProps.data).toEqual([first]);
  });

  it('animates deleting the final item into an empty list', () => {
    render([first]);
    render([]);
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockListProps.data).toEqual([]);
  });

  it('respects reduced motion and suppresses hidden-screen updates', () => {
    render([first]);
    mockReducedMotion = true;
    render([first, second]);
    mockReducedMotion = false;
    mockFocused = false;
    render([second]);
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockListProps.data).toEqual([second]);
  });
});

// Exercise the actual worklets, not just whether an animation request was made.
describe('cell layout transitions', () => {
  const values = { currentOriginX: 0, currentOriginY: 100, currentWidth: 300, currentHeight: 60,
    targetOriginX: 0, targetOriginY: 40, targetWidth: 300, targetHeight: 100 };
  let renderer: ReactTestRenderer;
  let phase: any;
  const renderCell = (key: string) => {
    act(() => {
      const element = <ListAnimationContext value={{ phase, keys: [key], animate: true }}>
        <AnimatedListCell index={0}><></></AnimatedListCell>
      </ListAnimationContext>;
      if (renderer) renderer.update(element); else renderer = create(element);
    });
    return renderer.root.findAllByType('AnimatedView' as any)[0].props;
  };
  beforeEach(() => { phase = { value: { until: 0, added: [], removed: [] } }; });
  afterEach(() => { act(() => renderer.unmount()); renderer = undefined as any; });

  it('springs the position and size only during a prepared data change', () => {
    const cell = renderCell('a');
    expect(cell.layout(values).initialValues.originY).toBe(40);
    phase.value = { until: Date.now() + 500, added: [], removed: [] };
    expect(cell.layout(values)).toMatchObject({ initialValues: { originY: 100, height: 60 },
      animations: { originY: { spring: 40 }, height: { spring: 100 } } });
    phase.value.until = 0; // The UI-thread scroll handler closes the transaction.
    expect(cell.layout(values)).toMatchObject({ initialValues: { originY: 40, height: 100 },
      animations: { originY: { to: 40, duration: 1 }, height: { to: 100, duration: 1 } } });
  });

  it('stops an already-running spring as soon as scrolling starts', () => {
    phase.value = { until: Date.now() + 500, added: [], removed: [] };
    const animation = renderCell('a').layout(values).animations.originY;
    const state = { current: 85 };
    expect(animation.onFrame(state, 100)).toBe(false);
    phase.value.until = 0;
    expect(animation.onFrame(state, 116)).toBe(true);
    expect(state.current).toBe(40);
  });

  it('snaps a recycled cell to its new identity even inside the animation window', () => {
    renderCell('a').layout(values);
    phase.value = { until: Date.now() + 500, added: ['b'], removed: [] };
    expect(renderCell('b').layout(values).initialValues.originY).toBe(40);
  });

  it('animates later edits to an item that was recycled while idle', () => {
    renderCell('a');
    const cell = renderCell('b');
    phase.value = { until: Date.now() + 500, added: [], removed: [] };
    expect(cell.layout(values).animations.originY).toMatchObject({ spring: 40 });
  });

  it('fades real removals but immediately hides cells evicted by scrolling', () => {
    const cell = renderCell('a');
    phase.value = { until: Date.now() + 500, added: [], removed: ['a'] };
    expect(cell.exiting({}).animations.opacity).toEqual({ to: 0, duration: 180 });
    phase.value.removed = [];
    expect(cell.exiting({}).animations.opacity).toEqual({ to: 0, duration: 1 });
    // FlashList owns root opacity during measurement; entering belongs to its content.
    expect(cell.entering).toBeUndefined();
  });
});
