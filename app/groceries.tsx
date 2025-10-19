import { Button } from '@/components/button';
import { RouteTitle } from '@/components/RouteTitle';
import { Plus } from '@/components/svgs/plus';
import { TestBottomSheetModal } from '@/components/TestBottomSheetModal';
import { TestBottomSheetModalTwo } from '@/components/TestBottomSheetModalTwo';
import { Text } from '@/components/Text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ShoppingBasket } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Groceries = () => {
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheetModal>(null);
  const sheetTwo = useRef<BottomSheetModal>(null);
  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA', paddingHorizontal: 20 }}>
      <RouteTitle text="Groceries" />
      <View style={[styles.container, { marginTop: insets.top + 60, marginBottom: insets.bottom + 72 }]}>
        <View style={styles.basket}>
          <ShoppingBasket size={48} color="#FEF7EA" strokeWidth={3} absoluteStrokeWidth />
        </View>
        <Text style={styles.heading}>Your grocery list is empty</Text>
        <Text onPress={() => sheet.current?.present()} style={styles.subheading}>
          Start planning your meals to fill it up,{'\n'}
          or add items directly.
        </Text>
      </View>
      <TestBottomSheetModal ref={sheet} onPress={() => sheetTwo.current?.present()} />
      <TestBottomSheetModalTwo ref={sheetTwo} onPress={() => sheet.current?.present()} />
      <Button
        onPress={() => alert('AAA')}
        text="What's Missing?"
        LeftIcon={Plus}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  basket: {
    backgroundColor: '#493D34',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heading: {
    fontFamily: 'Satoshi-Black',
    fontSize: 24,
    lineHeight: 24 * 1.5,
    color: '#4A3E36',
    marginTop: 10,
  },
  subheading: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 12 * 1.5,
    textAlign: 'center',
    color: '#4A3E36',
    marginTop: 4,
  },
});

export default Groceries;
