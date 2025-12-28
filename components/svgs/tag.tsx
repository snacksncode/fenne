import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const Tag = (props: { size: number; color: string }) => (
  <Svg viewBox="0 0 24 24" width={props.size} height={props.size} fill={props.color}>
    <Path
      d="
        M12.586 2.586
        A2 2 0 0 0 11.172 2
        H4
        a2 2 0 0 0 -2 2
        v7.172
        a2 2 0 0 0 .586 1.414
        l8.704 8.704
        a2.426 2.426 0 0 0 3.42 0
        l6.58 -6.58
        a2.426 2.426 0 0 0 0 -3.42
        z

        M 7.5 5.5
        a 2 2 0 1 1 0 4
        a 2 2 0 1 1 0 -4
        z
      "
      fill={props.color}
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </Svg>
);
