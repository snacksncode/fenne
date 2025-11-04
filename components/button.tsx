import { Text } from '@/components/Text';
import { FunctionComponent } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { filter, isTruthy } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';

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
};

export const Button = ({ onPress, leftIcon, rightIcon, variant, text, style, size }: Props) => {
  return (
    <PressableWithHaptics
      onPress={onPress}
      style={filter(
        [
          styles.container,
          size === 'small' && styles.small,
          variant === 'primary' && styles.primaryColors,
          variant === 'secondary' && styles.secondaryColors,
          variant === 'outlined' && styles.outlinedColors,
          style,
        ],
        isTruthy
      )}
    >
      {leftIcon ? (
        <leftIcon.Icon
          {...leftIcon}
          size={leftIcon.size ?? 24}
          color={variant === 'outlined' ? '#493D34' : '#FEF7EA'}
        />
      ) : null}
      <Text style={[styles.text, variant === 'outlined' && styles.darkText]}>{text}</Text>
      {rightIcon ? (
        <rightIcon.Icon
          {...rightIcon}
          size={rightIcon.size ?? 24}
          color={variant === 'outlined' ? '#493D34' : '#FEF7EA'}
        />
      ) : null}
    </PressableWithHaptics>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  primaryColors: {
    backgroundColor: '#F9954D',
    borderColor: '#EC8032',
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
    color: '#FEF7EA',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
  darkText: {
    color: '#493D34',
  },
});
