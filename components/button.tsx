import { Text } from '@/components/Text';
import { FunctionComponent } from 'react';
import { StyleProp, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { filter, isTruthy } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';

type Props = {
  onPress: () => void;
  text?: string;
  leftIcon?: {
    Icon: FunctionComponent<{ size: number; color: string; strokeWidth: number }>;
    size?: number;
  };
  rightIcon?: {
    Icon: FunctionComponent<{ size: number; color: string; strokeWidth: number }>;
    size?: number;
  };
  style?: StyleProp<ViewStyle>;
  size?: 'base' | 'small' | 'pill';
  variant: 'primary' | 'secondary' | 'outlined' | 'green' | 'red-outlined';
  isLoading?: boolean;
};

export const Button = ({ onPress, leftIcon, rightIcon, variant, text, style, size, isLoading }: Props) => {
  const textColor =
    variant === 'outlined' ? colors.brown[900] : variant === 'red-outlined' ? colors.red[500] : colors.cream[100];

  return (
    <PressableWithHaptics
      onPress={onPress}
      disabled={isLoading}
      style={filter(
        [
          styles.container,
          (size === 'small' || size === 'pill') && styles.small,
          variant === 'primary' && styles.primaryColors,
          variant === 'secondary' && styles.secondaryColors,
          variant === 'outlined' && styles.outlinedColors,
          variant === 'green' && styles.greenColors,
          variant === 'red-outlined' && styles.redOutlinedColors,
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
        {leftIcon ? (
          <leftIcon.Icon
            {...leftIcon}
            size={leftIcon.size ?? size === 'small' ? 16 : 20}
            color={textColor}
            strokeWidth={2.25}
          />
        ) : null}
        {text ? (
          <Text
            style={[
              styles.text,
              { color: textColor },
              size === 'small' && styles.smallText,
              size === 'pill' && styles.pillText,
            ]}
          >
            {text}
          </Text>
        ) : null}
        {rightIcon ? (
          <rightIcon.Icon
            {...rightIcon}
            size={rightIcon.size ?? size === 'small' ? 16 : 20}
            color={textColor}
            strokeWidth={2.25}
          />
        ) : null}
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
    flexShrink: 0,
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderBottomWidth: 3,
  },
  primaryColors: {
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[600],
  },
  secondaryColors: {
    backgroundColor: '#594B40',
    borderColor: '#493D34',
  },
  greenColors: {
    backgroundColor: colors.green[500],
    borderColor: colors.green[600],
  },
  redOutlinedColors: {
    backgroundColor: 'transparent',
    borderColor: colors.red[500],
  },
  outlinedColors: {
    backgroundColor: 'transparent',
    borderColor: '#493D34',
  },
  small: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  pillText: {
    fontSize: 14,
  },
  text: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
  },
  smallText: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
