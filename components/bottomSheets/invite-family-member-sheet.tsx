import { APIError } from '@/api/client';
import { usePostInvite } from '@/api/invitations';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { MailPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { isEmpty } from 'remeda';

export const InviteFamilyMemberSheet = (props: SheetProps<'invite-family-member-sheet'>) => {
  const postInvite = usePostInvite();
  const [email, setEmail] = useState('');

  return (
    <BaseSheet id={props.sheetId}>
      <Text style={styles.header}>Expand your family</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. partner@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button
          text="Invite"
          variant="primary"
          rightIcon={{ Icon: MailPlus }}
          onPress={() => {
            if (isEmpty(email)) return;
            postInvite.mutate(
              { email },
              {
                onSuccess: () => SheetManager.hide(props.sheetId),
                onError: (error) => {
                  // @ts-expect-error - temporary logging of error instead of custom field error
                  if (error instanceof APIError) alert(error.data.error);
                },
              }
            );
          }}
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
