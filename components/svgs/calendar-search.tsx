import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const CalendarSearch = (props: { size: number; color: string }) => (
  <Svg viewBox="0 0 20 20" width={props.size} height={props.size} stroke={props.color} fill="transparent">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M13.333 1.667V5M17.5 9.792V5a1.667 1.667 0 0 0-1.667-1.667H4.167A1.667 1.667 0 0 0 2.5 5v11.667a1.667 1.667 0 0 0 1.667 1.666h6.041M18.333 18.333l-1.562-1.562M2.5 8.333h15M6.667 1.667V5"
    />
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
    />
  </Svg>
);
