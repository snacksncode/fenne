import { usePostInvite } from '@/api/invitations';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { MailPlus } from 'lucide-react-native';
import { View } from 'react-native';
import { z } from 'zod';

const schema = z.object({ email: z.email('Enter a valid email address') });

export const InviteFamilyMemberSheet = ({ sheetId }: SheetProps<'invite-family-member-sheet'>) => {
  const sheets = useSheets();
  const postInvite = usePostInvite();
  const feedback = useFormFeedback(['email'] as const);
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: schema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        await postInvite.mutateAsync({ email: value.email.trim() });
        await sheets.dismiss(sheetId);
      } catch (error) {
        feedback.reportError(formApi, error, 'Could not send invitation');
      }
    },
  });

  return (
    <form.AppForm>
      <BaseSheet id={sheetId}
        footer={<form.SubmitButton text="Invite" variant="primary" rightIcon={{ Icon: MailPlus }} />}>
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <Typography variant="heading-sm" weight="bold">Expand your family</Typography>
            <form.AppField name="email">{(field) => (
              <field.TextField ref={feedback.inputRef('email')} label="Email" placeholder="e.g. partner@example.com" keyboardType="email-address" autoComplete="email" autoCapitalize="none" />
            )}</form.AppField>
            <form.Error message={feedback.error} />
          </View>
      </BaseSheet>
    </form.AppForm>
  );
};
