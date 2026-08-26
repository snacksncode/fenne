import { colors } from '@/constants/colors';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export const DashedDivider = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View pointerEvents="none" style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  divider: {
    borderColor: colors.brown[900],
    borderStyle: 'dashed',
    borderTopWidth: 1,
    height: 0,
    opacity: 0.25,
    width: '100%',
  },
});
