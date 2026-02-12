import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { Link2 } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';

export const LinkInputSheet = (props: SheetProps<'link-input-sheet'>) => {
  const selectedText = props.payload?.selectedText;
  const [url, setUrl] = useState(props.payload?.existingUrl ?? '');

  const handleApply = () => {
    if (!url.trim()) return;
    SheetManager.hide(props.sheetId, { payload: url.trim() });
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    SheetManager.hide(props.sheetId);
    Keyboard.dismiss();
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 24 }}>
        Insert Link
      </Typography>

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

        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            URL
          </Typography>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <View style={{ flex: 1 }}>
          <Button text="Cancel" variant="outlined" onPress={handleCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button text="Apply" variant="primary" onPress={handleApply} />
        </View>
      </View>
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
    marginTop: 24,
  },
});
