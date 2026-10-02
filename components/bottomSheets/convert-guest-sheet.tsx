import { useConvertGuest } from '@/api/auth';
import { BaseSheet, SHEET_FOOTER_HEIGHT } from '@/components/bottomSheets/base-sheet';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const feedback = useFormFeedback(['name', 'email', 'password'] as const);
  const insets = useSafeAreaInsets();
  const footerHeight = SHEET_FOOTER_HEIGHT + insets.bottom;
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validators: {
      onSubmit: convertGuestSchema,
    },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        await convertGuest.mutateAsync({ name: value.name.trim(), email: value.email.trim(), password: value.password });
        await sheets.dismiss(props.sheetId);
      } catch (error) {
        feedback.reportError(formApi, error, 'Failed to create account');
      }
    },
  });

  return (
    <form.AppForm>
      <BaseSheet
        id={props.sheetId}
        containerStyle={{ paddingTop: 24 }}
        sizing={{ type: 'scrollable', detents: [0.8, 1] }}
        dismissible={false}
        draggable={false}
        footer={<form.SubmitButton text="Create account" variant="primary" leftIcon={{ Icon: User }} />}
      >
        <KeyboardAwareScrollView
          ref={feedback.scrollRef}
          keyboardShouldPersistTaps="handled"
          bottomOffset={footerHeight}
          contentContainerStyle={{ paddingBottom: footerHeight + 24 }}
        >
          <View ref={feedback.contentRef}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle color={colors.brown[900]} size={20} strokeWidth={3} />
              <Typography variant="heading-md" weight="bold">Finish setting up</Typography>
            </View>
            <Typography variant="body-base" weight="regular" style={{ color: colors.brown[800], marginBottom: 16 }}>
              Almost done. Save your work and start collaborating with your household.
            </Typography>
            <View style={{ gap: 16 }}>
              <form.AppField name="name">{(field) => (
                <field.TextField ref={feedback.inputRef('name')} label="Display name"
                  autoCapitalize="words" placeholder="Your name" />
              )}</form.AppField>
              <form.AppField name="email">{(field) => (
                <field.TextField ref={feedback.inputRef('email')} label="Email"
                  autoCapitalize="none" placeholder="your@email.com" keyboardType="email-address" />
              )}</form.AppField>
              <form.AppField name="password">{(field) => (
                <field.TextField ref={feedback.inputRef('password')} label="Password"
                  autoCapitalize="none" placeholder="••••••••••••••••" secureTextEntry enterKeyHint="done" />
              )}</form.AppField>
              <form.Error message={feedback.error} />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </BaseSheet>
    </form.AppForm>
  );
};
