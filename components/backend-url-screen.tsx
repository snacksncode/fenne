import { useLoginAsGuest } from '@/api/auth';
import { useAppForm } from '@/components/form/app-form';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { parseBackendUrl, resetBackendUrl, setBackendUrl, useBackendUrl } from '@/lib/backend-url';
import { signOut } from '@/lib/session';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Server } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** 'onboarding' continues the guest session after saving; 'settings' only saves and goes back. */
  variant: 'onboarding' | 'settings';
};

export const BackendUrlScreen = ({ variant }: Props) => {
  const insets = useSafeAreaInsets();
  const guestLogin = useLoginAsGuest();
  const feedback = useFormFeedback(['url'] as const);
  const { configuredUrl } = useBackendUrl();
  const [isResetting, setIsResetting] = useState(false);
  /** 'login' means the user came from the log-in form, so saving must not start a guest session. */
  const { next } = useLocalSearchParams<{ next: string }>();

  const form = useAppForm({
    defaultValues: { url: configuredUrl ?? '' },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        const previous = configuredUrl;
        const url = await setBackendUrl(value.url);
        if (variant === 'settings') {
          // A different backend invalidates the stored token and the persisted cache.
          if (previous && previous !== url) await signOut();
          else router.back();
          return;
        }
        if (next === 'login') { router.back(); return; }
        await guestLogin.mutateAsync();
      } catch (error) {
        feedback.reportError(formApi, error, 'Could not reach the backend at this address. Check it and try again.');
      }
    },
  });

  const reset = async () => {
    setIsResetting(true);
    try {
      await resetBackendUrl();
      // The default backend is another backend, so the stored session cannot be reused.
      await signOut();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.canvas, paddingTop: insets.top, paddingHorizontal: 20 }}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ marginBottom: 16, marginLeft: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <ChevronLeft />
        <Typography variant="heading-sm" weight="bold">
          {variant === 'settings' ? 'Backend URL' : 'Connect your backend'}
        </Typography>
      </Pressable>
      <form.AppForm>
        <KeyboardAwareScrollView
          ref={feedback.scrollRef}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        >
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: colors.brown[900],
                  borderRadius: 999,
                  width: 42,
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Server color={colors.cream[100]} size={20} />
              </View>
              <Typography variant="body-base" weight="medium" color={colors.brown[700]} style={{ flex: 1 }}>
                Fenne stores your data on a backend you choose. Enter its full address, including the port.
              </Typography>
            </View>
            <form.AppField
              name="url"
              validators={{
                onSubmit: ({ value }) => {
                  const parsed = parseBackendUrl(value);
                  return parsed.ok ? undefined : parsed.message;
                },
              }}
            >
              {(field) => (
                <field.TextField
                  ref={feedback.inputRef('url')}
                  label="Backend URL"
                  placeholder="http://192.168.1.10:4000"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  autoFocus
                />
              )}
            </form.AppField>
            <form.Error message={feedback.error} />
            <View style={{ marginTop: 'auto' }}>
              <form.SubmitButton
                text={variant === 'onboarding' && next !== 'login' ? 'Save and continue' : 'Save'}
                variant="primary"
                isLoading={guestLogin.isPending}
              />
              {variant === 'settings' ? (
                <PressableWithHaptics
                  accessibilityRole="button"
                  accessibilityLabel="Reset to the default backend"
                  disabled={isResetting || !configuredUrl}
                  onPress={reset}
                  style={{ marginTop: 16, alignItems: 'center' }}
                >
                  <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>
                    Reset to api.fenneplanner.com
                  </Typography>
                </PressableWithHaptics>
              ) : null}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </form.AppForm>
    </View>
  );
};
