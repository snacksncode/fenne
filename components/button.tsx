import { Text } from '@/components/Text';
import { FunctionComponent } from 'react';
import { StyleProp, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { filter, isTruthy } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

type Props = {
  onPress: () => void;
  text: string;
  leftIcon?: {
    Icon: FunctionComponent<{ size: number; color: string }>;
    size?: number;
  };
  rightIcon?: {
    Icon: FunctionComponent<{ size: number; color: string }>;
    size?: number;
  };
  style?: StyleProp<ViewStyle>;
  size?: 'base' | 'small';
  variant: 'primary' | 'secondary' | 'outlined';
  isLoading?: boolean;
};

export const Button = ({ onPress, leftIcon, rightIcon, variant, text, style, size, isLoading }: Props) => {
  const textColor = variant === 'outlined' ? colors.brown[900] : colors.cream[100];

  return (
    <PressableWithHaptics
      onPress={onPress}
      disabled={isLoading}
      style={filter(
        [
          styles.container,
          size === 'small' && styles.small,
          variant === 'primary' && styles.primaryColors,
          variant === 'secondary' && styles.secondaryColors,
          variant === 'outlined' && styles.outlinedColors,
          isLoading && styles.disabled,
          style,
        ],
        isTruthy
      )}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          gap: 6,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading ? 0 : 1,
        }}
      >
        {leftIcon ? <leftIcon.Icon {...leftIcon} size={leftIcon.size ?? 20} color={textColor} /> : null}
        <Text style={[styles.text, { color: textColor }, size === 'small' && styles.smallText]}>{text}</Text>
        {rightIcon ? <rightIcon.Icon {...rightIcon} size={rightIcon.size ?? 20} color={textColor} /> : null}
      </View>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading ? 1 : 0,
        }}
      >
        <ActivityIndicator size="small" color={textColor} />
      </View>
    </PressableWithHaptics>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  primaryColors: {
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[600],
  },
  secondaryColors: {
    backgroundColor: '#594B40',
    borderColor: '#493D34',
  },
  outlinedColors: {
    backgroundColor: 'transparent',
    borderColor: '#493D34',
  },
  small: {
    height: 36,
    paddingHorizontal: 16,
  },
  text: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
  smallText: {
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
  disabled: {
    opacity: 0.6,
  },
});
