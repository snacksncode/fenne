import { Text } from '@/components/Text';
import { Ellipsis } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  text: string;
  footerSlot?: ReactNode;
  onPress?: () => void;
};

export const RouteTitle = ({ text, footerSlot, onPress }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        zIndex: 1,
        paddingTop: insets.top,
        left: 0,
        right: 0,
        paddingBottom: 10,
        position: 'absolute',
        paddingHorizontal: 20,
        borderBottomColor: '#4A3E36',
        borderBottomWidth: 1,
        backgroundColor: '#FEF7EA',
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{text}</Text>
        <Pressable onPress={onPress} style={styles.button}>
          <Ellipsis color="#4A3E36" strokeWidth={2} size={24} />
        </Pressable>
      </View>
      {footerSlot}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Satoshi-Black',
    color: '#4A3E36',
    fontSize: 32,
    lineHeight: 32 * 1.5,
  },
  container: {
    height: 48,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#4A3E36',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderRadius: 999,
  },
});
