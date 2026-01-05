import { useChangePassword } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { RotateCcwKey } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export const ChangePasswordSheet = (props: SheetProps<'change-password-sheet'>) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <BaseSheet id={props.sheetId}>
      <Text style={styles.header}>Change password</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            placeholder="••••••••••••••••"
            secureTextEntry
          />
        </View>
        <View>
          <Text style={styles.label}>New password</Text>
          <TextInput
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
              {
                onSuccess: () => SheetManager.hide(props.sheetId),
                onError: () => alert('Please check your credentials'),
              }
            )
          }
          isLoading={changePassword.isPending}
        />
      </View>
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
