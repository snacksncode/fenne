import { useConvertGuest } from '@/api/auth';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { CheckCircle, User } from 'lucide-react-native';
import { View } from 'react-native';
import { colors } from '@/constants/colors';
import { z } from 'zod';

const convertGuestSchema = z.object({
  name: z.string().trim().min(1, 'Display name is required'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export const ConvertGuestSheet = (props: SheetProps<'convert-guest-sheet'>) => {
  const sheets = useSheets();
  const convertGuest = useConvertGuest();
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validators: {
      onSubmit: convertGuestSchema,
    },
    onSubmit: ({ value }) => {
      convertGuest.mutate(
        { name: value.name.trim(), email: value.email.trim(), password: value.password },
        {
          onSuccess: () => {
            sheets.dismiss(props.sheetId);
          },
          onError: (error) =>
            alert(`Failed to convert account (${error instanceof Error ? error.message : 'Unknown error'})`),
        }
      );
    },
  });

  return (
    <BaseSheet
      id={props.sheetId}
      containerStyle={{ paddingTop: 24 }}
      dismissible={false}
      draggable={false}
      footer={sheetFooter.buttonRow(
        <Button
          text="Create account"
          variant="primary"
          leftIcon={{ Icon: User }}
          onPress={() => form.handleSubmit()}
          isLoading={convertGuest.isPending}
        />
      )}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <CheckCircle color="#4A3E36" size={20} strokeWidth={3} />
        <Typography variant="heading-md" weight="bold">
          Finish setting up
        </Typography>
      </View>
      <Typography variant="body-base" weight="regular" style={{ color: colors.brown[800], marginBottom: 16 }}>
        Almost done. Save your work and start collaborating with your household.
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
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                label="Password"
                autoCapitalize="none"
                placeholder="••••••••••••••••"
                secureTextEntry
                enterKeyHint="done"
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};
