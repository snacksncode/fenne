import { useChangePassword } from '@/api/auth';
import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { RotateCcwKey } from 'lucide-react-native';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const schema = z.object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword: z.string().min(8, 'Use at least 8 characters') });

export const ChangePasswordSheet = ({ sheetId }: SheetProps<'change-password-sheet'>) => {
  const sheets = useSheets();
  const changePassword = useChangePassword();
  const feedback = useFormFeedback(['currentPassword', 'newPassword'] as const);
  const insets = useSafeAreaInsets();
  const footerHeight = SHEET_FOOTER_HEIGHT + insets.bottom;
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '' },
    validators: { onSubmit: schema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        await changePassword.mutateAsync({ new_password: value.newPassword, current_password: value.currentPassword });
        await sheets.dismiss(sheetId);
      } catch (error) {
        feedback.reportError(formApi, error, 'Please check your credentials', { current_password: 'currentPassword', new_password: 'newPassword', password: 'newPassword' });
      }
    },
  });

  return (
    <form.AppForm>
      <BaseSheet id={sheetId} sizing={{ type: 'scrollable', detents: ['auto', 1] }}
        footer={<form.SubmitButton text="Change password" variant="primary" rightIcon={{ Icon: RotateCcwKey }} />}>
        <KeyboardAwareScrollView ref={feedback.scrollRef} keyboardShouldPersistTaps="handled"
          bottomOffset={footerHeight} contentContainerStyle={{ paddingBottom: footerHeight + 24 }}>
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <Typography variant="heading-sm" weight="bold">Change password</Typography>
            <form.AppField name="currentPassword">{(field) => (
              <field.TextField ref={feedback.inputRef('currentPassword')} label="Current password" autoCapitalize="none" placeholder="••••••••••••••••" secureTextEntry />
            )}</form.AppField>
            <form.AppField name="newPassword">{(field) => (
              <field.TextField ref={feedback.inputRef('newPassword')} label="New password" autoCapitalize="none" placeholder="••••••••••••••••" secureTextEntry />
            )}</form.AppField>
            <form.Error message={feedback.error} />
          </View>
        </KeyboardAwareScrollView>
      </BaseSheet>
    </form.AppForm>
  );
};
