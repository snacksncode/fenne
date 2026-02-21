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

  const handlePress = () => {
    deleteAccount.mutate();
    SheetManager.hide(props.sheetId);
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
        Delete your account?
      </Typography>
      <Typography variant="body-base" weight="medium">
        Are you sure? This cannot be undone. All your data will be permanently deleted.
      </Typography>
      <View style={{ marginTop: 24 }}>
        <Button
          text="Delete account"
          variant="red-outlined"
          rightIcon={{ Icon: Trash2 }}
          onPress={handlePress}
          isLoading={deleteAccount.isPending}
        />
      </View>
    </BaseSheet>
  );
};
