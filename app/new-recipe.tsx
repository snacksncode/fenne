import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { SegmentedSelect } from '@/components/Select';
import { Plus } from '@/components/svgs/plus';
import { useNavigation } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginBottom: 16,
          marginLeft: -8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ChevronLeft />
        <Text style={styles.header}>New Recipe</Text>
      </Pressable>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <TextInput placeholder="e.g. Avocado Toast" />
        </View>
        <View>
          <Text style={styles.label}>Ingredients</Text>
          <TextInput placeholder="e.g. Bread, Avocado, Salt, Pepper" />
        </View>
        <View>
          <Text style={styles.label}>Meal type (pills)</Text>
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button text="Add new recipe" variant="primary" leftIcon={{ Icon: Plus }} onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
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
