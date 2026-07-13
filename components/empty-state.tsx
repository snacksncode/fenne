import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  keyboardAware?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  keyboardAware = true,
  style,
}: EmptyStateProps) => (
  <KeyboardAvoidingView behavior="height" automaticOffset enabled={keyboardAware} style={styles.keyboardContainer}>
    <Animated.View entering={FadeIn} style={[styles.container, style]}>
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${title}. ${description}`}
        style={styles.summary}
      >
        <View accessible={false} style={styles.iconWell}>
          <Icon size={28} color={colors.orange[600]} strokeWidth={2.25} absoluteStrokeWidth />
        </View>
        <View style={styles.copy}>
          <Typography variant="heading-sm" weight="bold" style={styles.title}>
            {title}
          </Typography>
          <Typography variant="body-sm" weight="medium" color={colors.brown[700]} style={styles.description}>
            {description}
          </Typography>
        </View>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </Animated.View>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summary: {
    alignItems: 'center',
    gap: 12,
  },
  iconWell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.orange[100],
  },
  copy: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    maxWidth: 320,
    textAlign: 'center',
  },
  action: {
    paddingTop: 24,
  },
});
