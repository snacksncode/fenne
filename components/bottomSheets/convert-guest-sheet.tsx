import { useConvertGuest } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { CheckCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

export const ConvertGuestSheet = (props: SheetProps<'convert-guest-sheet'>) => {
  const convertGuest = useConvertGuest();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    convertGuest.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          SheetManager.hide(props.sheetId);
        },
        onError: (error) => alert(`Failed to convert account (${error?.data?.error})`),
      }
    );
  };

  return (
    <BaseSheet id={props.sheetId} containerStyle={{ paddingTop: 24 }} closable={false} gestureEnabled={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <CheckCircle color="#4A3E36" size={20} strokeWidth={3} />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Bold',
            fontSize: 24,
          }}
        >
          Finish setting up
        </Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Almost done. Save your work and start collaborating with your household.
      </Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Display name</Text>
          <TextInput value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your name" />
        </View>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="your@email.com"
            keyboardType="email-address"
          />
        </View>
        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            placeholder="••••••••••••••••"
            secureTextEntry
            enterKeyHint="done"
          />
        </View>
      </View>
      <View style={{ marginTop: 24 }}>
        <Button
          text="Create account"
          variant="primary"
          leftIcon={{ Icon: User }}
          onPress={handleSubmit}
          isLoading={convertGuest.isPending}
        />
      </View>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  headerSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    color: colors.brown[800],
    lineHeight: 16 * 1.3,
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
