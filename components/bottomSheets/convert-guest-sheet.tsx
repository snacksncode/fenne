import { useConvertGuest } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { CheckCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
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
        onError: (error) =>
          alert(`Failed to convert account (${error instanceof Error ? error.message : 'Unknown error'})`),
      }
    );
  };

  return (
    <BaseSheet id={props.sheetId} containerStyle={{ paddingTop: 24 }} closable={false} gestureEnabled={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <CheckCircle color="#4A3E36" size={20} strokeWidth={3} />
        <Typography variant="heading-md" weight="bold">
          Finish setting up
        </Typography>
      </View>
      <Typography variant="body-base" weight="regular" style={{ color: colors.brown[800], marginBottom: 16 }}>
        Almost done. Save your work and start collaborating with your household.
      </Typography>
      <View style={{ gap: 16 }}>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Display name
          </Typography>
          <TextInput value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your name" />
        </View>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Email
          </Typography>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="your@email.com"
            keyboardType="email-address"
          />
        </View>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Password
          </Typography>
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
