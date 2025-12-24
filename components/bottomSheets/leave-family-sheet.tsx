import { useLeaveFamily } from '@/api/invitations';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LogOut } from 'lucide-react-native';
import { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
};

const Content = ({ ref }: SheetProps) => {
  const leaveFamily = useLeaveFamily();
  return (
    <BaseSheet.Container>
      <Text style={styles.header}>Leave your family?</Text>
      <Text style={styles.label}>
        Are you sure you want to leave your family? You&apos;ll need an invite to re-join
      </Text>
      <View style={{ marginTop: 24 }}>
        <Button
          text="Leave"
          variant="red-outlined"
          rightIcon={{ Icon: LogOut }}
          onPress={() => leaveFamily.mutate(undefined, { onSuccess: () => ref.current?.dismiss() })}
          isLoading={leaveFamily.isPending}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const LeaveFamilySheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet ref={ref}>
      <Content ref={ref} />
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
});
