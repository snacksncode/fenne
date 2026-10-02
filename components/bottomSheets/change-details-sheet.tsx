import { useChangeDetails, useCurrentUser } from '@/api/auth';
import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { User } from 'lucide-react-native';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const schema = z.object({ name: z.string().trim().min(1, 'Display name is required'), email: z.email('Enter a valid email address') });

export const ChangeDetailsSheet = ({ sheetId }: SheetProps<'change-details-sheet'>) => {
  const sheets = useSheets();
  const changeDetails = useChangeDetails();
  const feedback = useFormFeedback(['name', 'email'] as const);
  const { data } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const footerHeight = SHEET_FOOTER_HEIGHT + insets.bottom;
  const form = useAppForm({
    defaultValues: { name: data?.user.name ?? '', email: data?.user.email ?? '' },
    validators: { onSubmit: schema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        await changeDetails.mutateAsync({ email: value.email.trim(), name: value.name.trim() });
        await sheets.dismiss(sheetId);
      } catch (error) {
        feedback.reportError(formApi, error, 'Failed to update account details');
      }
    },
  });

  return (
    <form.AppForm>
      <BaseSheet id={sheetId} sizing={{ type: 'scrollable', detents: ['auto', 1] }}
        footer={<form.SubmitButton text="Save changes" variant="primary" rightIcon={{ Icon: User }} />}>
        <KeyboardAwareScrollView ref={feedback.scrollRef} keyboardShouldPersistTaps="handled"
          bottomOffset={footerHeight} contentContainerStyle={{ paddingBottom: footerHeight + 24 }}>
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <Typography variant="heading-sm" weight="bold">Edit profile</Typography>
            <form.AppField name="name">{(field) => (
              <field.TextField ref={feedback.inputRef('name')} label="Display name" autoCapitalize="words" placeholder="Your name" />
            )}</form.AppField>
            <form.AppField name="email">{(field) => (
              <field.TextField ref={feedback.inputRef('email')} label="Email" autoCapitalize="none" placeholder="your@email.com" keyboardType="email-address" />
            )}</form.AppField>
            <form.Error message={feedback.error} />
          </View>
        </KeyboardAwareScrollView>
      </BaseSheet>
    </form.AppForm>
  );
};
