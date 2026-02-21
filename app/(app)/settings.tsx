import { useCurrentUser, UserDTO } from '@/api/auth';
import {
  InvitationDTO,
  useAcceptInvite,
  useDeclineInvite,
  useInvitations,
  useRemoveSentInvite,
} from '@/api/invitations';
import { SheetManager } from 'react-native-actions-sheet';
import { Button } from '@/components/button';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useLogout } from '@/hooks/use-logout';

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
import { FunctionComponent } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isEmptyish, sort } from 'remeda';

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
      <Typography variant="body-lg" weight="medium">
        {props.text}
      </Typography>
    </PressableWithHaptics>
  );
};

const SentInvitation = (props: { invitation: InvitationDTO }) => {
  const removeSentInvite = useRemoveSentInvite();

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
        <Typography variant="body-lg" weight="medium">
          {props.invitation.to_user.name}
        </Typography>
        <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
          {props.invitation.to_user.email}
        </Typography>
      </View>
      <Button
        onPress={() => removeSentInvite.mutate({ id: props.invitation.id })}
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
        <Typography variant="body-lg" weight="medium">
          {props.user.name}
          {user?.id === props.user.id ? (
            <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
              {' '}
              (You)
            </Typography>
          ) : null}
        </Typography>
        <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
          {props.user.email}
        </Typography>
      </View>
    </View>
  );
};

const ReceivedInvitation = (props: { invitation: InvitationDTO }) => {
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();
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
          <Typography variant="body-lg" weight="medium">
            {props.invitation.from_user.name}
          </Typography>
          <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
            {props.invitation.from_user.email}
          </Typography>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          style={{ flex: 1 }}
          size="small"
          text="Decline"
          variant="red-outlined"
          rightIcon={{ Icon: Trash2 }}
          onPress={() => declineInvite.mutate({ id: props.invitation.id })}
          isLoading={declineInvite.isPending}
        />
        <Button
          style={{ flex: 1 }}
          size="small"
          variant="green"
          text="Accept"
          rightIcon={{ Icon: UserRoundCheck }}
          onPress={() => acceptInvite.mutate({ id: props.invitation.id })}
          isLoading={acceptInvite.isPending}
        />
      </View>
    </View>
  );
};

const Settings = () => {
  const insets = useSafeAreaInsets();
  const invitations = useInvitations();

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
        <Typography variant="heading-sm" weight="bold">
          Settings
        </Typography>
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
            <Typography variant="heading-xl" weight="bold" style={{ textAlign: 'center' }}>
              {user?.name}
            </Typography>
            <Typography variant="body-base" weight="medium" style={{ textAlign: 'center' }}>
              {user?.email}
            </Typography>
          </View>
        </View>
        <View style={{ marginTop: 24 }}>
          <Typography variant="body-base" weight="bold">
            ACCOUNT
          </Typography>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={User} text="Edit profile" onPress={() => SheetManager.show('change-details-sheet')} />
          </View>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={Lock} text="Change password" onPress={() => SheetManager.show('change-password-sheet')} />
          </View>
        </View>

        {invitations.data && !isEmptyish(invitations.data.received) ? (
          <View style={{ marginTop: 24 }}>
            <Typography variant="body-base" weight="bold">
              RECEIVED INVITATIONS
            </Typography>
            <View style={{ gap: 12, marginTop: 12 }}>
              {invitations.data.received.map((invitation) => (
                <ReceivedInvitation key={invitation.id} invitation={invitation} />
              ))}
            </View>
          </View>
        ) : null}

        {invitations.data && !isEmptyish(invitations.data.sent) ? (
          <View style={{ marginTop: 24 }}>
            <Typography variant="body-base" weight="bold">
              SENT INVITATIONS
            </Typography>
            <View style={{ gap: 12, marginTop: 12 }}>
              {invitations.data.sent.map((invitation) => (
                <SentInvitation key={invitation.id} invitation={invitation} />
              ))}
            </View>
          </View>
        ) : null}

        {family ? (
          <View style={{ marginTop: 24 }}>
            <Typography variant="body-base" weight="bold">
              FAMILY
            </Typography>
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
                  onPress={() => SheetManager.show('invite-family-member-sheet')}
                />
                {family.members.length > 1 ? (
                  <Button
                    leftIcon={{ Icon: LogOut }}
                    variant="red-outlined"
                    size="base"
                    onPress={() => SheetManager.show('leave-family-sheet')}
                  />
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Typography variant="body-base" weight="bold">
            ACTIONS
          </Typography>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Action icon={LogOut} text="Log out" onPress={() => logOut()} />
            <Action icon={Trash2} text="Delete account" onPress={() => SheetManager.show('delete-account-sheet')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default Settings;
