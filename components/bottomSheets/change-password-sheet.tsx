import { useChangePassword } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RotateCcwKey } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
};

const Content = ({ ref }: SheetProps) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>Change password</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Current password</Text>
          <SheetTextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            placeholder="••••••••••••••••"
            secureTextEntry
          />
        </View>
        <View>
          <Text style={styles.label}>New password</Text>
          <SheetTextInput
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            placeholder="••••••••••••••••"
            secureTextEntry
          />
        </View>
      </View>
      <View style={{ marginTop: 24 }}>
        <Button
          text="Change password"
          variant="primary"
          rightIcon={{ Icon: RotateCcwKey }}
          onPress={() =>
            changePassword.mutate(
              { new_password: newPassword, current_password: currentPassword },
              { onSuccess: () => ref.current?.dismiss(), onError: () => alert('Please check your credentials') }
            )
          }
          isLoading={changePassword.isPending}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const ChangePasswordSheet = ({ ref }: SheetProps) => {
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
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
