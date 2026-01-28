import { ComponentProps, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { IngredientOption, useIngredientSearch, useDeleteCustomIngredient } from '@/api/search';
import { colors } from '@/constants/colors';
import { AisleIcon } from '@/components/aisle-header';
import { FlashList, FlashListRef } from '@shopify/flash-list';
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
        onBlur={() => setForceHidePopup(true)}
        {...props}
      />
      {showDropdown && (
        <FlashList
          ref={listRef}
          indicatorStyle="black"
          data={options}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.option} onPress={() => handleSelect(item)}>
                <AisleIcon type={item.aisle} />
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{item.name}</Text>
                  <Text style={styles.optionMeta}>{item.aisle.replace('_', ' ')}</Text>
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
          contentContainerStyle={{ ...styles.list }}
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
    fontFamily: 'Satoshi-Bold',
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
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    color: '#493D34',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 18,
  },
  optionMeta: {
    color: '#958270',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 14,
  },
});

export type { IngredientOption };
