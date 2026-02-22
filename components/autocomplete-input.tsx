import { ComponentProps, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/components/Typography';
import { IngredientOption, useIngredientSearch, useDeleteCustomIngredient } from '@/api/food-items';
import { colors } from '@/constants/colors';
import { AisleIcon } from '@/components/aisle-header';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { ScrollView } from 'react-native-actions-sheet';
import { X } from 'lucide-react-native';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface AutocompleteInputProps extends Omit<ComponentProps<typeof TextInput>, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (ingredient: IngredientOption) => void;
}

export const AutocompleteInput = ({ value, onChangeText, onSelect, ...props }: AutocompleteInputProps) => {
  const listRef = useRef<FlashListRef<IngredientOption>>(null);
  const [inputWidth, setInputWidth] = useState(0);
  const [forceHidePopup, setForceHidePopup] = useState(true);

  const debouncedValue = useDebouncedValue(value, 250);
  const { data: options = [] } = useIngredientSearch(debouncedValue);
  const deleteCustomIngredient = useDeleteCustomIngredient();

  const handleTextChange = (text: string) => {
    setForceHidePopup(false);
    onChangeText(text);
    listRef.current?.scrollToTop({ animated: false });
  };

  const handleSelect = (option: IngredientOption) => {
    setForceHidePopup(true);
    onChangeText(option.name);
    onSelect(option);
  };

  const showDropdown = value.length > 0 && options.length > 0 && !forceHidePopup;

  return (
    <View>
      <TextInput
        value={value}
        onLayout={(e) => setInputWidth(e.nativeEvent.layout.width)}
        onChangeText={handleTextChange}
        style={styles.input}
        placeholderTextColor="#958270"
        autoCorrect={false}
        spellCheck={false}
        onBlur={() => setForceHidePopup(true)}
        {...props}
      />
      {showDropdown && (
        <FlashList
          ref={listRef}
          indicatorStyle="black"
          data={options}
          renderScrollComponent={ScrollView}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.option} onPress={() => handleSelect(item)}>
                <AisleIcon type={item.aisle} />
                <View style={styles.optionContent}>
                  <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
                    {item.name}
                  </Typography>
                  <Typography variant="body-xs" weight="regular" color={colors.brown[700]} style={{ marginTop: -4 }}>
                    {item.aisle.replace('_', ' ')}
                  </Typography>
                </View>
              </Pressable>
              {item.custom && (
                <Pressable
                  style={{ paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => deleteCustomIngredient.mutate(item.id)}
                >
                  <X size={20} color={colors.brown[900]} />
                </Pressable>
              )}
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          style={{ ...styles.dropdown, width: inputWidth + 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#493D34',
    color: '#493D34',
    height: 48,
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: -8,
    backgroundColor: colors.cream[50],
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    borderRadius: 8,
    zIndex: 9999999,
    maxHeight: 200,
  },
  list: {
    flexGrow: 0,
    paddingVertical: 6,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 16,
  },
  optionContent: {
    flex: 1,
  },
});

export type { IngredientOption };
