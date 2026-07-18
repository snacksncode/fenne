import { Typography } from '@/components/Typography';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { FunctionComponent } from 'react';
import { StyleSheet, View } from 'react-native';

export const SheetAction = (props: {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
  tone?: 'default' | 'danger';
}) => (
  <PressableWithHaptics onPress={props.onPress} accessibilityLabel={props.text}>
    <View style={styles.row}>
      <View style={[styles.icon, props.tone === 'danger' && styles.dangerIcon]}>
        <props.icon color={props.tone === 'danger' ? colors.red[600] : colors.cream[100]} size={22} />
      </View>
      <Typography
        variant="body-base"
        weight="bold"
        color={props.tone === 'danger' ? colors.red[600] : colors.brown[900]}
      >
        {props.text}
      </Typography>
    </View>
  </PressableWithHaptics>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brown[900],
    borderRadius: 8,
  },
  dangerIcon: {
    backgroundColor: colors.red[50],
  },
});
