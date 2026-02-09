import { useChangePassword } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { RotateCcwKey } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

export const ChangePasswordSheet = (props: SheetProps<'change-password-sheet'>) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Change password
      </Typography>
      <View style={{ gap: 16 }}>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Current password
          </Typography>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            placeholder="••••••••••••••••"
            secureTextEntry
          />
        </View>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            New password
          </Typography>
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
