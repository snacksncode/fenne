import { useChangePassword } from '@/api/auth';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { RotateCcwKey } from 'lucide-react-native';
import { View } from 'react-native';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
});

export const ChangePasswordSheet = (props: SheetProps<'change-password-sheet'>) => {
  const sheets = useSheets();
  const changePassword = useChangePassword();
  const form = useAppForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
    validators: {
      onSubmit: changePasswordSchema,
    },
    onSubmit: ({ value }) => {
      changePassword.mutate(
        { new_password: value.newPassword, current_password: value.currentPassword },
        {
          onSuccess: () => sheets.dismiss(props.sheetId),
          onError: () => alert('Please check your credentials'),
        }
      );
    },
  });

  return (
    <BaseSheet
      id={props.sheetId}
      footer={sheetFooter.buttonRow(
        <Button
          text="Change password"
          variant="primary"
          rightIcon={{ Icon: RotateCcwKey }}
          onPress={() => form.handleSubmit()}
          isLoading={changePassword.isPending}
        />
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Change password
      </Typography>
      <form.AppForm>
        <View style={{ gap: 16 }}>
          <form.AppField name="currentPassword">
            {(field) => (
              <field.TextField
                label="Current password"
                autoCapitalize="none"
                placeholder="••••••••••••••••"
                secureTextEntry
              />
            )}
          </form.AppField>
          <form.AppField name="newPassword">
            {(field) => (
              <field.TextField
                label="New password"
                autoCapitalize="none"
                placeholder="••••••••••••••••"
                secureTextEntry
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};
