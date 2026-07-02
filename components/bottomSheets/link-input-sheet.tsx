import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { Link2 } from 'lucide-react-native';
import { Keyboard, StyleSheet, View } from 'react-native';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { z } from 'zod';

const linkInputSchema = z.object({
  url: z.url('Enter a valid URL'),
});

export const LinkInputSheet = (props: SheetProps<'link-input-sheet'>) => {
  const sheets = useSheets();
  const selectedText = props.data?.selectedText;
  const form = useAppForm({
    defaultValues: {
      url: props.data?.existingUrl ?? '',
    },
    validators: {
      onSubmit: linkInputSchema,
    },
    onSubmit: ({ value }) => {
      sheets.dismiss(props.sheetId, value.url.trim());
      Keyboard.dismiss();
    },
  });

  const handleApply = () => {
    form.handleSubmit();
  };

  const handleCancel = () => {
    sheets.dismiss(props.sheetId, null);
    Keyboard.dismiss();
  };

  return (
    <BaseSheet
      id={props.sheetId}
      footer={sheetFooter.buttonRow(
        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <Button text="Cancel" variant="outlined" onPress={handleCancel} />
          </View>
          <View style={{ flex: 1 }}>
            <Button text="Apply" variant="primary" onPress={handleApply} />
          </View>
        </View>
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 24 }}>
        Insert Link
      </Typography>

      <form.AppForm>
        <View style={{ gap: 16 }}>
          {selectedText ? (
            <View>
              <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                Selected Text
              </Typography>
              <View style={styles.selectedTextContainer}>
                <Link2 size={16} color={colors.brown[700]} strokeWidth={2.5} />
                <Typography variant="body-sm" weight="medium" color={colors.brown[800]} numberOfLines={1}>
                  {selectedText}
                </Typography>
              </View>
            </View>
          ) : null}

          <form.AppField name="url">
            {(field) => (
              <field.TextField
                label="URL"
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
                autoFocus
              />
            )}
          </form.AppField>
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  selectedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#F5E6CC',
    borderWidth: 1,
    borderColor: colors.brown[700],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
