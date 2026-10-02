import { useLeaveFamily } from '@/api/invitations';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { LogOut } from 'lucide-react-native';

export const LeaveFamilySheet = (props: SheetProps<'leave-family-sheet'>) => {
  const sheets = useSheets();
  const leaveFamily = useLeaveFamily();

  return (
    <BaseSheet
      id={props.sheetId}
      footer={(
        <Button
          text="Leave"
          variant="red-outlined"
          rightIcon={{ Icon: LogOut }}
          onPress={() => leaveFamily.mutate(undefined, { onSuccess: () => sheets.dismiss(props.sheetId) })}
          isLoading={leaveFamily.isPending}
        />
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Leave your family?
      </Typography>
      <Typography variant="body-base" weight="medium">
        Are you sure you want to leave your family? You&apos;ll need an invite to re-join
      </Typography>
    </BaseSheet>
  );
};
