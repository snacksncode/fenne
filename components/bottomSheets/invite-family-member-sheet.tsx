import { APIError } from '@/api/client';
import { usePostInvite } from '@/api/invitations';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { MailPlus } from 'lucide-react-native';
import { View } from 'react-native';
import { z } from 'zod';

const inviteFamilyMemberSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export const InviteFamilyMemberSheet = (props: SheetProps<'invite-family-member-sheet'>) => {
  const sheets = useSheets();
  const postInvite = usePostInvite();
  const form = useAppForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onSubmit: inviteFamilyMemberSchema,
    },
    onSubmit: ({ value }) => {
      postInvite.mutate(
        { email: value.email.trim() },
        {
          onSuccess: () => sheets.dismiss(props.sheetId),
          onError: (error) => {
            // @ts-expect-error - temporary logging of error instead of custom field error
            if (error instanceof APIError) alert(error.data.error);
          },
        }
      );
    },
  });

  return (
    <BaseSheet
      id={props.sheetId}
      footer={sheetFooter.buttonRow(
        <Button text="Invite" variant="primary" rightIcon={{ Icon: MailPlus }} onPress={() => form.handleSubmit()} />
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Expand your family
      </Typography>
      <form.AppForm>
        <View style={{ gap: 16 }}>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                placeholder="e.g. partner@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};
