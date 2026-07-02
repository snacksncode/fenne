import { useCurrentUser, useChangeDetails } from '@/api/auth';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { User } from 'lucide-react-native';
import { View } from 'react-native';
import { z } from 'zod';

const changeDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Display name is required'),
  email: z.email('Enter a valid email address'),
});

export const ChangeDetailsSheet = (props: SheetProps<'change-details-sheet'>) => {
  const sheets = useSheets();
  const changeDetails = useChangeDetails();
  const { data } = useCurrentUser();
  const form = useAppForm({
    defaultValues: {
      name: data?.user.name ?? '',
      email: data?.user.email ?? '',
    },
    validators: {
      onSubmit: changeDetailsSchema,
    },
    onSubmit: ({ value }) => {
      changeDetails.mutate(
        { email: value.email.trim(), name: value.name.trim() },
        {
          onSuccess: () => sheets.dismiss(props.sheetId),
          onError: () => alert('Failed to update account details'),
        }
      );
    },
  });

  return (
    <BaseSheet
      id={props.sheetId}
      footer={sheetFooter.buttonRow(
        <Button
          text="Save changes"
          variant="primary"
          rightIcon={{ Icon: User }}
          onPress={() => form.handleSubmit()}
          isLoading={changeDetails.isPending}
        />
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Edit profile
      </Typography>
      <form.AppForm>
        <View style={{ gap: 16 }}>
          <form.AppField name="name">
            {(field) => <field.TextField label="Display name" autoCapitalize="words" placeholder="Your name" />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                autoCapitalize="none"
                placeholder="your@email.com"
                keyboardType="email-address"
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};
