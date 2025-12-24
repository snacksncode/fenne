import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowRight } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { isEmpty } from 'remeda';

type SheetProps = {
  ref: RefObject<BottomSheetModal | null>;
  onNext: (value: string) => void;
};

const Content = (props: { onNext: (value: string) => void }) => {
  const [value, setValue] = useState('');
  return (
    <BaseSheet.Container>
      <Text style={styles.header}>What&apos;s missing?</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <SheetTextInput value={value} onChangeText={setValue} placeholder="e.g. Avocado Toast" />
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button
          text="Select category"
          variant="primary"
          rightIcon={{ Icon: ArrowRight }}
          onPress={() => {
            if (isEmpty(value)) return;
            Keyboard.dismiss();
            return props.onNext(value);
          }}
        />
      </View>
    </BaseSheet.Container>
  );
};

export const NewGroceryItemSheet = ({ ref, onNext }: SheetProps) => (
  <BaseSheet ref={ref}>
    <Content onNext={onNext} />
  </BaseSheet>
);

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
