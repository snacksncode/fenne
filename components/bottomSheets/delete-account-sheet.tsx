import { useDeleteAccount } from '@/api/auth';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

export const DeleteAccountSheet = (props: SheetProps<'delete-account-sheet'>) => {
  const deleteAccount = useDeleteAccount();
  const variant = props.payload?.variant ?? 'account';

  const title = variant === 'guest' ? 'Exit tutorial?' : 'Delete your account?';
  const body =
    variant === 'guest'
      ? 'This will delete your guest account and erase all your progress. You can always try again later.'
      : 'Are you sure? This cannot be undone. All your data will be permanently deleted.';
  const buttonText = variant === 'guest' ? 'Exit tutorial' : 'Delete account';

  const handlePress = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => SheetManager.hide(props.sheetId, { payload: true }),
    });
  };

  return (
    <BaseSheet id={props.sheetId}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            backgroundColor: colors.red[500],
            borderRadius: 999,
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle color={colors.cream[100]} size={28} />
        </View>
      </View>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        {title}
      </Typography>
      <Typography variant="body-base" weight="medium">
        {body}
      </Typography>
      <View style={{ marginTop: 24 }}>
        <Button
          text={buttonText}
          variant="red-outlined"
          rightIcon={{ Icon: Trash2 }}
          onPress={handlePress}
          isLoading={deleteAccount.isPending}
        />
      </View>
    </BaseSheet>
  );
};
