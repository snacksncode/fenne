import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { colors } from '@/constants/colors';

export type TypographyVariant =
  | 'heading-xl'
  | 'heading-lg'
  | 'heading-md'
  | 'heading-sm'
  | 'body-lg'
  | 'body-base'
  | 'body-sm'
  | 'body-xs';

export type TypographyWeight = 'black' | 'bold' | 'medium' | 'regular';

const variantStyles: Record<TypographyVariant, { fontSize: number; lineHeight: number }> = {
  'heading-xl': { fontSize: 36, lineHeight: 36 * 1.25 },
  'heading-lg': { fontSize: 32, lineHeight: 32 * 1.25 },
  'heading-md': { fontSize: 24, lineHeight: 24 * 1.25 },
  'heading-sm': { fontSize: 20, lineHeight: 20 * 1.25 },
  'body-lg': { fontSize: 18, lineHeight: 18 * 1.5 },
  'body-base': { fontSize: 16, lineHeight: 16 * 1.5 },
  'body-sm': { fontSize: 14, lineHeight: 14 * 1.5 },
  'body-xs': { fontSize: 12, lineHeight: 12 * 1.5 },
};

const weightFontFamily: Record<TypographyWeight, string> = {
  black: 'Satoshi-Black',
  bold: 'Satoshi-Bold',
  medium: 'Satoshi-Medium',
  regular: 'Satoshi-Regular',
};

type TypographyProps = {
  variant: TypographyVariant;
  weight: TypographyWeight;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function Typography({ variant, weight, color, numberOfLines, style, children }: TypographyProps) {
  return (
    <Text
      style={[
        s.base,
        variantStyles[variant],
        { fontFamily: weightFontFamily[weight], color: color ?? colors.brown[900] },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
