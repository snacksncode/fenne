import { useCurrentUser, UserDTO } from '@/api/auth';
import {
  InvitationDTO,
  useAcceptInvite,
  useDeclineInvite,
  useInvitations,
  useRemoveSentInvite,
} from '@/api/invitations';
import { ChangePasswordSheet } from '@/components/bottomSheets/change-password-sheet';
import { InviteFamilyMemberSheet } from '@/components/bottomSheets/invite-family-member-sheet';
import { LeaveFamilySheet } from '@/components/bottomSheets/leave-family-sheet';
import { Button } from '@/components/button';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { useLogout } from '@/hooks/use-logout';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Lock,
  LogOut,
  MailQuestionMark,
  Trash2,
  User,
  UserRoundCheck,
  UserRoundPlus,
} from 'lucide-react-native';
import { FunctionComponent, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doNothing, isEmptyish, sort } from 'remeda';

const Action = (props: {
  text: string;
  onPress: () => void;
  icon: FunctionComponent<{ size: number; color: string }>;
}) => {
  return (
    <PressableWithHaptics style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={props.onPress}>
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
        <props.icon color={colors.cream[100]} size={20} />
      </View>
      <Text
        style={{
          color: colors.brown[900],
          fontFamily: 'Satoshi-Medium',
          fontSize: 18,
          lineHeight: 18 * 1.25,
        }}
      >
        {props.text}
      </Text>
    </PressableWithHaptics>
  );
};

const SentInvitation = (props: { invitation: InvitationDTO }) => {
  const removeSentInvite = useRemoveSentInvite(props.invitation.id);

  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View
        style={{
          backgroundColor: colors.orange[500],
          borderRadius: 999,
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 4,
        }}
      >
        <UserRoundPlus color={colors.cream[100]} size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.brown[900],
            fontFamily: 'Satoshi-Medium',
            fontSize: 18,
            lineHeight: 18 * 1.25,
          }}
        >
          {props.invitation.to_user.name}
        </Text>
        <Text
          style={{
            color: colors.brown[700],
            fontFamily: 'Satoshi-Medium',
            fontSize: 14,
          }}
        >
          {props.invitation.to_user.email}
        </Text>
      </View>
      <Button
        onPress={() => removeSentInvite.mutate()}
        isLoading={removeSentInvite.isPending}
        leftIcon={{ Icon: Trash2 }}
        variant="red-outlined"
        size="small"
      />
    </View>
  );
};

const Member = (props: { user: UserDTO }) => {
  const { data: { user } = {} } = useCurrentUser();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View
        style={{
          backgroundColor: colors.green[500],
          borderRadius: 999,
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User color={colors.cream[100]} size={24} />
      </View>
      <View>
        <Text
          style={{
            color: colors.brown[900],
            fontFamily: 'Satoshi-Medium',
            fontSize: 18,
            lineHeight: 18 * 1.25,
          }}
        >
          {props.user.name}
          {user?.id === props.user.id ? <Text style={{ color: colors.brown[700], fontSize: 14 }}> (You)</Text> : null}
        </Text>
        <Text
          style={{
            color: colors.brown[700],
            fontFamily: 'Satoshi-Medium',
            fontSize: 14,
          }}
        >
          {props.user.email}
        </Text>
      </View>
    </View>
  );
};

const ReceivedInvitation = (props: { invitation: InvitationDTO }) => {
  const acceptInvite = useAcceptInvite(props.invitation.id);
  const declineInvite = useDeclineInvite(props.invitation.id);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: colors.orange[500],
            borderRadius: 999,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MailQuestionMark color={colors.cream[100]} size={24} />
        </View>
        <View>
          <Text
            style={{
              color: colors.brown[900],
              fontFamily: 'Satoshi-Medium',
              fontSize: 18,
              lineHeight: 18 * 1.25,
            }}
          >
            {props.invitation.from_user.name}
          </Text>
          <Text
            style={{
              color: colors.brown[700],
              fontFamily: 'Satoshi-Medium',
              fontSize: 14,
            }}
          >
            {props.invitation.from_user.email}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          style={{ flex: 1 }}
          size="small"
          text="Decline"
          variant="red-outlined"
          rightIcon={{ Icon: Trash2 }}
          onPress={() => declineInvite.mutate()}
          isLoading={declineInvite.isPending}
        />
        <Button
          style={{ flex: 1 }}
          size="small"
          variant="green"
          text="Accept"
          rightIcon={{ Icon: UserRoundCheck }}
          onPress={() => acceptInvite.mutate()}
          isLoading={acceptInvite.isPending}
        />
      </View>
    </View>
  );
};

const Settings = () => {
  const insets = useSafeAreaInsets();
  const invitations = useInvitations();
  const inviteFamilyMemberSheetRef = useRef<BottomSheetModal>(null);
  const leaveFamilySheetRef = useRef<BottomSheetModal>(null);
  const changePasswordSheet = useRef<BottomSheetModal>(null);
  const { logOut } = useLogout();
  const { data: { user, family } = {} } = useCurrentUser();

  const sortMembers = (members: UserDTO[]) => {
    return sort(members, (a) => (a.id === user?.id ? -1 : 1));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.back()}
        style={{
          marginBottom: 16,
          marginLeft: -8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ChevronLeft />
        <Text style={styles.header}>Settings</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View
            style={{
              backgroundColor: colors.green[500],
              borderRadius: 999,
              width: 96,
              height: 96,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User color={colors.cream[100]} size={48} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                textAlign: 'center',
                color: colors.brown[900],
                fontFamily: 'Satoshi-Bold',
                fontSize: 36,
                lineHeight: 36 * 1.25,
              }}
            >
              {user?.name}
            </Text>
            <Text
              style={{
                textAlign: 'center',
                color: colors.brown[900],
                fontFamily: 'Satoshi-Medium',
                fontSize: 16,
                lineHeight: 16 * 1.25,
              }}
            >
              {user?.email}
            </Text>
          </View>
        </View>
        {/* <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>ACCOUNT</Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={User} text="Edit profile" onPress={doNothing} />
          </View>
        </View> */}

        {invitations.data && !isEmptyish(invitations.data.received) ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>RECEIVED INVITATIONS</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {invitations.data.received.map((invitation) => (
                <ReceivedInvitation key={invitation.id} invitation={invitation} />
              ))}
            </View>
          </View>
        ) : null}

        {invitations.data && !isEmptyish(invitations.data.sent) ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>SENT INVITATIONS</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {invitations.data.sent.map((invitation) => (
                <SentInvitation key={invitation.id} invitation={invitation} />
              ))}
            </View>
          </View>
        ) : null}

        {family ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>FAMILY</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {sortMembers(family.members).map((member) => (
                <Member key={member.id} user={member} />
              ))}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  style={{ flex: 1 }}
                  text="Invite member"
                  leftIcon={{ Icon: UserRoundPlus }}
                  variant="outlined"
                  size="base"
                  onPress={() => inviteFamilyMemberSheetRef.current?.present()}
                />
                {family.members.length > 1 ? (
                  <Button
                    leftIcon={{ Icon: LogOut }}
                    variant="red-outlined"
                    size="base"
                    onPress={() => leaveFamilySheetRef.current?.present()}
                  />
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>ACTIONS</Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={Lock} text="Change password" onPress={() => changePasswordSheet.current?.present()} />
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={LogOut} text="Log out" onPress={() => logOut()} />
          </View>
        </View>
      </ScrollView>
      <InviteFamilyMemberSheet ref={inviteFamilyMemberSheetRef} />
      <LeaveFamilySheet ref={leaveFamilySheetRef} />
      <ChangePasswordSheet ref={changePasswordSheet} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    color: colors.brown[900],
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    color: colors.brown[900],
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
});

export default Settings;
