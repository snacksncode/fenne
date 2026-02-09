import { View, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { connectionStatusAtom, ConnectionStatus as Status } from '@/hooks/useInvalidationChannel';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNetworkState } from 'expo-network';

const statusConfig: Record<Status, { color: string; label: string }> = {
  connected: { color: colors.green[500], label: 'Connected' },
  connecting: { color: colors.orange[500], label: 'Connecting' },
  disconnected: { color: colors.red[500], label: 'Disconnected' },
};

export const ConnectionStatus = () => {
  const status = useAtomValue(connectionStatusAtom);
  const config = statusConfig[status];
  const isFetching = useIsFetching();
  const isMutating = useIsMutating() > 0;
  const { isConnected } = useNetworkState();
  const isUpdating = isFetching || isMutating;

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <View style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: statusConfig.disconnected.color }]} />
          <Typography variant="body-xs" weight="black" color={colors.cream[100]} style={{ fontSize: 10 }}>
            Offline
          </Typography>
        </View>
      ) : (
        <View style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          <Typography variant="body-xs" weight="black" color={colors.cream[100]} style={{ fontSize: 10 }}>
            Sync
          </Typography>
          <View style={{ width: 1, marginHorizontal: 4, backgroundColor: colors.brown[700], height: 12 }} />
          <View
            style={[
              styles.dot,
              { backgroundColor: (isUpdating ? statusConfig.connecting : statusConfig.connected).color },
            ]}
          />
          <Typography variant="body-xs" weight="black" color={colors.cream[100]} style={{ fontSize: 10 }}>
            Up to date
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brown[900],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
