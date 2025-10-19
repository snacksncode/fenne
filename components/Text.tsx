import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[s.text, style]} {...props} />;
}

const s = StyleSheet.create({
  text: {
    includeFontPadding: false,
  },
});
