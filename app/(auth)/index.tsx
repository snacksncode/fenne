import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAppForm } from '@/components/form/app-form';
import { useState } from 'react';
import { useLogin, useLoginAsGuest } from '@/api/auth';
import { APIError } from '@/api/client';
import Animated, { FadeIn, LayoutAnimationsValues, LinearTransition, withSpring } from 'react-native-reanimated';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useSession } from '@/contexts/session';
import { useIsFirstRender } from '@/hooks/use-is-first-render';
import { z } from 'zod';

type Mode = 'log-in' | 'landing';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Form = ({ mode, setMode }: { mode: Mode; setMode: React.Dispatch<React.SetStateAction<Mode>> }) => {
  const login = useLogin();
  const guestLogin = useLoginAsGuest();
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: ({ value }) => {
      login.mutate(
        { email: value.email.trim(), password: value.password },
        {
          onError: (error) => {
            return alert(error instanceof APIError ? 'Please check your credentials' : 'Something went wrong');
          },
        }
      );
    },
  });

  const handleAction = () => {
    if (mode === 'landing') {
      return guestLogin.mutate(undefined, {
        onError: () => alert('Something went wrong starting guest session'),
      });
    }

    if (mode === 'log-in') {
      form.handleSubmit();
    }
  };

  if (mode === 'landing') {
    return (
      <View style={{ paddingHorizontal: 24, marginTop: 'auto' }}>
        <Button
          style={{ marginTop: 24, marginBottom: 16 }}
          text="Get Started"
          onPress={handleAction}
          variant="primary"
          isLoading={guestLogin.isPending}
        />
        <PressableWithHaptics onPress={() => setMode('log-in')} style={{ marginBottom: 8, alignItems: 'center' }}>
          <Typography variant="body-sm" weight="medium">
            Already have an account?{' '}
            <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>
              Log in
            </Typography>
          </Typography>
        </PressableWithHaptics>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 24, marginTop: 'auto' }}>
      <form.AppForm>
        <View style={{ gap: 12 }}>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                label="Password"
                placeholder="••••••••••••••••"
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
      <Button
        style={{ marginTop: 24, marginBottom: 16 }}
        text="Log in!"
        onPress={handleAction}
        variant="primary"
        isLoading={login.isPending}
      />
      <PressableWithHaptics onPress={() => setMode('landing')} style={{ marginBottom: 8, alignItems: 'center' }}>
        <Typography variant="body-sm" weight="medium">
          Don&apos;t have an account?{' '}
          <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>
            Get started
          </Typography>
        </Typography>
      </PressableWithHaptics>
    </View>
  );
};

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
  const { isFirstRender } = useIsFirstRender();
  const { hasEverLoggedIn } = useSession();
  const [mode, setMode] = useState<Mode>(() => (hasEverLoggedIn ? 'log-in' : 'landing'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <KeyboardAvoidingView contentContainerStyle={{ flex: 1 }} style={{ flex: 1 }} behavior="position">
        <View style={{ zIndex: 1, marginBottom: 12, flex: 1 }}>
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
        <Form mode={mode} setMode={setMode} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
