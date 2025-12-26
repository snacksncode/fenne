import { Button } from '@/components/button';
import { Text } from '@/components/Text';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { TextInput } from '@/components/input';
import { useState } from 'react';
import { useLogin, useSignup } from '@/api/auth';
import { APIError } from '@/api/client';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationsValues,
  LinearTransition,
  withSpring,
} from 'react-native-reanimated';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useSession } from '@/contexts/session';
import { useIsFirstRender } from '@/hooks/use-is-first-render';

type Mode = 'sign-up' | 'log-in';

const Form = ({ mode, setMode }: { mode: Mode; setMode: React.Dispatch<React.SetStateAction<Mode>> }) => {
  const login = useLogin();
  const signup = useSignup();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAction = () => {
    if (!email || !password || (mode === 'sign-up' && !name)) return alert('Fill in the details');
    if (mode === 'log-in') {
      login.mutate(
        { email, password },
        {
          onError: (error) => {
            if (error instanceof APIError) console.log('API Error: ', error.data);
            return alert('Please check your credentials');
          },
        }
      );
    }
    if (mode === 'sign-up') {
      signup.mutate({ email, password, name }, { onError: () => alert('Something went wrong') });
    }
  };

  return (
    <View style={{ paddingHorizontal: 24, marginTop: 'auto' }}>
      {mode === 'sign-up' && (
        <Animated.View entering={FadeIn.springify()} exiting={FadeOut.springify()} style={{ marginBottom: 12, gap: 8 }}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="John" />
        </Animated.View>
      )}
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
        />
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <Button
        style={{ marginTop: 24, marginBottom: 16 }}
        text={mode === 'log-in' ? 'Log in!' : 'Start planning!'}
        onPress={handleAction}
        variant="primary"
      />
      <PressableWithHaptics
        onPress={() => setMode((p) => (p === 'log-in' ? 'sign-up' : 'log-in'))}
        style={{ marginBottom: 8, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 14, lineHeight: 14 * 1.5 }}>
          {mode === 'log-in' ? (
            <>
              Don&apos;t have an account? <Text style={{ color: colors.orange[600] }}>Create one</Text>
            </>
          ) : (
            <>
              Already have an account? <Text style={{ color: colors.orange[600] }}>Log in</Text>
            </>
          )}
        </Text>
      </PressableWithHaptics>
    </View>
  );
};

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
  const [mode, setMode] = useState<Mode>(() => (hasEverLoggedIn ? 'log-in' : 'sign-up'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream[100] }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="position" contentContainerStyle={{ flex: 1 }}>
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
              {mode === 'log-in' ? (
                <Animated.Text
                  key="log-in"
                  layout={isFirstRender ? undefined : LinearTransition.springify()}
                  entering={FadeIn}
                  style={styles.heading}
                >
                  Log in
                </Animated.Text>
              ) : null}
              {mode === 'sign-up' ? (
                <Animated.Text
                  key={mode}
                  layout={isFirstRender ? undefined : LinearTransition.springify()}
                  entering={FadeIn}
                  style={styles.heading}
                >
                  Create an account
                </Animated.Text>
              ) : null}
            </Animated.View>
          </Animated.View>
        </View>
        <Form mode={mode} setMode={setMode} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontFamily: 'Satoshi-Black',
    fontSize: 32,
    lineHeight: 32 * 1.5,
    color: colors.brown[900],
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.5,
    color: colors.brown[900],
  },
});

export default WelcomeScreen;
