import { APIError } from '@/api/client';
import { usePostInvite } from '@/api/invitations';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { MailPlus } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { isEmpty } from 'remeda';

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
};

const Content = ({ ref }: SheetProps) => {
  const postInvite = usePostInvite();
  const [email, setEmail] = useState('');

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>Expand your family</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Email</Text>
          <SheetTextInput
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
                onSuccess: () => ref.current?.dismiss(),
                onError: (error) => {
                  if (error instanceof APIError) alert(error.data.error);
                },
              }
            );
          }}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const InviteFamilyMemberSheet = ({ ref }: SheetProps) => {
  return (
    <BaseSheet ref={ref}>
      <Content ref={ref} />
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
