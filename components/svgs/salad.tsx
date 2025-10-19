import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const Salad = (props: { size: number; color: string }) => (
  <Svg
    viewBox="0 0 16 16"
    width={props.size}
    height={props.size}
    fill="none"
    stroke={props.color}
  >
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.667 14h6.666M8 14a6 6 0 0 0 6-6H2a6 6 0 0 0 6 6Z"
    />
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.587 8a1.6 1.6 0 0 1-.267-3.18 1.6 1.6 0 0 1 2.133-1.847 1.6 1.6 0 0 1 2.314-.42A1.6 1.6 0 0 1 14.013 4.8a1.598 1.598 0 0 1-.733 2.467c.06.24.068.49.02.733M8.667 8l2.666-2.667"
    />
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.267 4.833a2.66 2.66 0 0 0-4.6 1.834c0 .486.133.94.36 1.333"
    />
  </Svg>
);
