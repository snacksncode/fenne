import * as React from 'react';
import Svg, { G, Path } from 'react-native-svg';

export const Pancake = (props: { size: number; color: string }) => (
  <Svg viewBox="0 0 16 16" width={props.size} height={props.size} fill="none">
    <G
      stroke={props.color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <Path d="M10.667 7.733c2.333-.533 4-1.666 4-3.066 0-1.867-3-3.334-6.667-3.334S1.333 2.8 1.333 4.667c0 1.666 2.467 3.066 5.6 3.333" />
      <Path d="M2.2 6.333C1.667 6.8 1.333 7.4 1.333 8c0 1.867 3 3.333 6.667 3.333h.2M10.6 11.067C13 10.533 14.667 9.4 14.667 8c0-.6-.334-1.2-.867-1.667" />
      <Path d="M2.2 9.667c-.533.466-.867 1.066-.867 1.666 0 1.867 3 3.334 6.667 3.334s6.667-1.467 6.667-3.334c0-.6-.334-1.2-.867-1.666" />
      <Path d="M10.667 10.667a1.333 1.333 0 0 1-2.667 0V9.333C8 8.6 7.4 8 6.667 7.867c-1.2-.334-2-1.067-2-1.867 0-1.133 1.466-2 3.333-2 1.867 0 3.333.867 3.333 2 0 .267-.066.467-.2.733-.2.334-.466.8-.466 1.134v2.8Z" />
    </G>
  </Svg>
);
