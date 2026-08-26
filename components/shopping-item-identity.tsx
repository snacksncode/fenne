import { AisleCategory } from '@/api/types';
import { AisleIcon } from '@/components/aisle-header';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type ShoppingItemIdentityProps = {
  name: string;
  aisle: AisleCategory;
  description?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ShoppingItemIdentity = ({
  name,
  aisle,
  description,
  compact = false,
  style,
}: ShoppingItemIdentityProps) => (
  <View style={[styles.container, style]}>
    <AisleIcon type={aisle} />
    <View style={styles.copy}>
      <Typography variant="body-xs" weight="bold" color={colors.brown[700]}>
        Shopping item
      </Typography>
      <Typography variant={compact ? 'body-base' : 'heading-sm'} weight="bold">
        {name}
      </Typography>
      {description ? (
        <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
          {description}
        </Typography>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
