import { Typography } from '@/components/Typography';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { FunctionComponent } from 'react';
import { View } from 'react-native';

export const SheetAction = (props: {
  onPress: () => void;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
}) => (
  <PressableWithHaptics onPress={props.onPress}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ backgroundColor: colors.brown[900], padding: 8, borderRadius: 8 }}>
        <props.icon color={colors.cream[100]} size={24} />
      </View>
      <Typography variant="body-lg" weight="bold">
        {props.text}
      </Typography>
    </View>
  </PressableWithHaptics>
);
