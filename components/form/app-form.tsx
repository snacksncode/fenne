import { NumberInput, TextInput } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { ComponentProps, ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const errorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return null;
};

type FieldFrameProps = {
  label?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const FieldFrame = ({ label, children, style }: FieldFrameProps) => {
  const field = useFieldContext<unknown>();
  const errors = field.state.meta.errors.map(errorMessage).filter((message) => message != null);
  const showErrors = field.state.meta.isTouched && errors.length > 0;

  return (
    <View style={style}>
      {label ? (
        <Typography variant="body-sm" weight="bold" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      {children}
      {showErrors ? (
        <Typography variant="body-xs" weight="medium" color={colors.red[500]} style={styles.error}>
          {errors[0]}
        </Typography>
      ) : null}
    </View>
  );
};

type TextFieldProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const TextField = ({ label, containerStyle, ...props }: TextFieldProps) => {
  const field = useFieldContext<string | null | undefined>();

  return (
    <FieldFrame label={label} style={containerStyle}>
      <TextInput
        value={field.state.value ?? ''}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        {...props}
      />
    </FieldFrame>
  );
};

type NumberFieldProps = Omit<ComponentProps<typeof NumberInput>, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const NumberField = ({ label, containerStyle, ...props }: NumberFieldProps) => {
  const field = useFieldContext<string>();

  return (
    <FieldFrame label={label} style={containerStyle}>
      <NumberInput value={field.state.value} onChangeText={field.handleChange} onBlur={field.handleBlur} {...props} />
    </FieldFrame>
  );
};

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    NumberField,
    TextField,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

export { useFormContext };

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  error: {
    marginTop: 4,
  },
});
