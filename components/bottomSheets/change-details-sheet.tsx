import { useCurrentUser, useChangeDetails } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

export const ChangeDetailsSheet = (props: SheetProps<'change-details-sheet'>) => {
  const changeDetails = useChangeDetails();
  const { data } = useCurrentUser();
  const [name, setName] = useState(() => data?.user.name ?? '');
  const [email, setEmail] = useState(() => data?.user.email ?? '');

  const handleSubmit = () => {
    changeDetails.mutate(
      { email: email.trim(), name: name.trim() },
      {
        onSuccess: () => SheetManager.hide(props.sheetId),
        onError: () => alert('Failed to update account details'),
      }
    );
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Edit profile
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
      </View>
      <View style={{ marginTop: 24 }}>
        <Button
          text="Save changes"
          variant="primary"
          rightIcon={{ Icon: User }}
          onPress={handleSubmit}
          isLoading={changeDetails.isPending}
        />
      </View>
    </BaseSheet>
  );
};
