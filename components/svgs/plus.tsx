import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const Plus = (props: { size: number; color: string; strokeWidth?: number }) => (
  <Svg viewBox="0 0 24 24" width={props.size} height={props.size} stroke={props.color}>
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.strokeWidth ?? 1.75} d="M6 12h12M12 18V6" />
  </Svg>
);
