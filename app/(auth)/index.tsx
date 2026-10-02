import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAppForm } from '@/components/form/app-form';
import { useEffect, useRef, useState } from 'react';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { useLogin, useLoginAsGuest } from '@/api/auth';
import Animated, { FadeIn, LayoutAnimationsValues, LinearTransition, withSpring } from 'react-native-reanimated';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useSession } from '@/contexts/session';
import { z } from 'zod';

type Mode = 'log-in' | 'landing';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const AnimatedTypography = Animated.createAnimatedComponent(Typography);

const TransitionYOnly = (values: LayoutAnimationsValues) => {
  'worklet';

  return {
    initialValues: {
      originX: values.currentOriginX,
      originY: values.currentOriginY,
      width: values.currentWidth,
      height: values.currentHeight,
    },
    animations: {
      originX: values.targetOriginX,
      originY: withSpring(values.targetOriginY),
      width: values.targetWidth,
      height: values.targetHeight,
    },
  };
};

const WelcomeScreen = () => {
  const mounted = useRef(false);
  const isFirstRender = !mounted.current;
  useEffect(() => { mounted.current = true; }, []);
  const { hasEverLoggedIn } = useSession();
  const [mode, setMode] = useState<Mode>(() => (hasEverLoggedIn ? 'log-in' : 'landing'));

  const login = useLogin();
  const guestLogin = useLoginAsGuest();
  const feedback = useFormFeedback(['email', 'password'] as const);
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try { await login.mutateAsync({ email: value.email.trim(), password: value.password }); }
      catch (error) { feedback.reportError(formApi, error, 'Please check your credentials'); }
    },
  });
  const startGuestSession = async () => {
    feedback.setError(null);
    try { await guestLogin.mutateAsync(); }
    catch { feedback.setError('Something went wrong starting guest session'); }
  };
  const switchMode = (next: Mode) => { feedback.clearServerErrors(form); setMode(next); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <KeyboardAwareScrollView ref={feedback.scrollRef} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }} bottomOffset={24}>
        <View ref={feedback.contentRef} style={{ flex: 1 }}>
          <View style={{ zIndex: 1, marginBottom: 12, flex: 1, minHeight: 280 }}>
            <Animated.View
              layout={isFirstRender ? undefined : LinearTransition.springify()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 10,
                borderRadius: 24,
                backgroundColor: '#fee1b9ff',
              }}
            >
              <Animated.Image
                layout={isFirstRender ? undefined : LinearTransition.springify()}
                source={require('@/assets/images/icon_full_transparent.png')}
                style={{ width: 192, height: 192, aspectRatio: 1 / 1 }}
              />
              <Animated.View layout={isFirstRender ? undefined : TransitionYOnly}>
                {mode === 'landing' ? (
                  <AnimatedTypography
                    key="landing"
                    layout={isFirstRender ? undefined : LinearTransition.springify()}
                    entering={FadeIn}
                    variant="heading-lg"
                    weight="black"
                    style={{
                      textAlign: 'center',
                      color: colors.brown[900],
                      marginBottom: 16,
                    }}
                  >
                    Welcome to Fenne
                  </AnimatedTypography>
                ) : null}
                {mode === 'log-in' ? (
                  <AnimatedTypography
                    key="log-in"
                    layout={isFirstRender ? undefined : LinearTransition.springify()}
                    entering={FadeIn}
                    variant="heading-lg"
                    weight="black"
                    style={{
                      textAlign: 'center',
                      color: colors.brown[900],
                      marginBottom: 16,
                    }}
                  >
                    Log in
                  </AnimatedTypography>
                ) : null}
              </Animated.View>
            </Animated.View>
          </View>
          <form.AppForm>
            <View style={{ paddingHorizontal: 24, marginTop: 'auto' }}>
              {mode === 'log-in' && (
                <View style={{ gap: 12 }}>
                  <form.AppField name="email">{(field) => (
                    <field.TextField ref={feedback.inputRef('email')} label="Email" placeholder="you@example.com"
                      keyboardType="email-address" autoComplete="email" autoCapitalize="none" />
                  )}</form.AppField>
                  <form.AppField name="password">{(field) => (
                    <field.TextField ref={feedback.inputRef('password')} label="Password" placeholder="••••••••••••••••"
                      secureTextEntry autoCapitalize="none" />
                  )}</form.AppField>
                </View>
              )}
              <form.Error message={feedback.error} />
              {mode === 'landing' ? (
                <Button style={{ marginTop: 24, marginBottom: 16 }} text="Get Started" variant="primary"
                  onPress={startGuestSession} isLoading={guestLogin.isPending} />
              ) : (
                <form.SubmitButton style={{ marginTop: 24, marginBottom: 16 }} text="Log in!" variant="primary" />
              )}
              <PressableWithHaptics onPress={() => switchMode(mode === 'landing' ? 'log-in' : 'landing')}
                style={{ marginBottom: 8, alignItems: 'center' }}>
                <Typography variant="body-sm" weight="medium">
                  {mode === 'landing' ? 'Already have an account? ' : "Don't have an account? "}
                  <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>
                    {mode === 'landing' ? 'Log in' : 'Get started'}
                  </Typography>
                </Typography>
              </PressableWithHaptics>
            </View>
          </form.AppForm>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
