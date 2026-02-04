import { useCurrentUser, useChangeDetails } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
      <Text style={styles.header}>Edit profile</Text>
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

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
