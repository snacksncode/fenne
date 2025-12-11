import { BottomSheetTextInput as _BottomSheetTextInput, useBottomSheet } from '@gorhom/bottom-sheet';
import { ComponentProps, useEffect } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { TextInput as _TextInput } from 'react-native-gesture-handler';

export const TextInput = ({ style, ...props }: ComponentProps<typeof _TextInput>) => {
  return <_TextInput style={[styles.input, style]} placeholderTextColor="#958270" {...props} />;
};

export const SheetTextInput = ({ style, ...props }: ComponentProps<typeof _BottomSheetTextInput>) => {
  const { collapse } = useBottomSheet();

  useEffect(() => {
    const listener = Keyboard.addListener('keyboardWillHide', () => collapse());
    return () => listener.remove();
  }, [collapse]);

  return <_BottomSheetTextInput style={[styles.input, style]} placeholderTextColor="#958270" {...props} />;
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
    lineHeight: 16 * 1.25,
  },
});
