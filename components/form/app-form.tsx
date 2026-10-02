import { AisleCategory } from '@/api/types';
import { AisleHeader } from '@/components/aisle-header';
import { Unit, UNITS, parseLocaleFloat } from '@/lib/quantity';
import { DateSelectInput } from '@/components/date-select-input';
import { Button } from '@/components/button';
import { NumberInput, TextInput } from '@/components/input';
import { InlineQuantityInput } from '@/components/inline-quantity-input';
import { PackSizeFields } from '@/components/pack-size-fields';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ProductBehavior, ProductBehaviorSelector, TrackingUnitSelect } from '@/components/product-behavior-selector';
import { ReminderFrequencyFields } from '@/components/reminder-frequency-fields';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { ComponentProps, ReactNode, Ref } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export const formErrorMessage = (error: unknown) => {
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
  controlRef?: Ref<View>;
};

const FieldError = ({ ref }: { ref?: Ref<View> }) => {
  const field = useFieldContext<unknown>();
  const errors = field.state.meta.errors.map(formErrorMessage).filter((message) => message != null);
  const showErrors = field.state.meta.isTouched && errors.length > 0;

  return showErrors ? (
    <View ref={ref} accessible accessibilityLabel={errors[0]} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <Typography variant="body-xs" weight="medium" color={colors.red[500]} style={styles.error}>
        {errors[0]}
      </Typography>
    </View>
  ) : null;
};

const FieldFrame = ({ label, children, style, controlRef }: FieldFrameProps) => {
  const field = useFieldContext<unknown>();
  const hasError = field.state.meta.isTouched && field.state.meta.errors.some(formErrorMessage);
  return (
    <View style={style} ref={hasError ? undefined : controlRef}>
      {label ? <Typography variant="body-sm" weight="bold" style={styles.label}>{label}</Typography> : null}
      {children}
      <FieldError ref={hasError ? controlRef : undefined} />
    </View>
  );
};

type TextFieldProps = Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const TextField = ({ label, containerStyle, accessibilityLabel, ref, ...props }: TextFieldProps) => {
  const field = useFieldContext<string | null | undefined>();

  return (
    <FieldFrame label={label} style={containerStyle}>
      <TextInput
        ref={ref}
        value={field.state.value ?? ''}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
      />
    </FieldFrame>
  );
};

type NumberFieldProps = Omit<ComponentProps<typeof NumberInput>, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const NumberField = ({ label, containerStyle, accessibilityLabel, ref, ...props }: NumberFieldProps) => {
  const field = useFieldContext<string>();

  return (
    <FieldFrame label={label} style={containerStyle}>
      <NumberInput
        ref={ref}
        value={field.state.value}
        onChangeText={field.handleChange}
        onBlur={field.handleBlur}
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
      />
    </FieldFrame>
  );
};

type InlineQuantityFieldProps = Omit<ComponentProps<typeof InlineQuantityInput>, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  fieldStyle?: StyleProp<ViewStyle>;
  /** A derived quantity can be displayed while null still means automatic in the draft. */
  displayValue?: string;
  onValueChange?: (value: string) => void;
};

const InlineQuantityField = ({ label, fieldStyle, displayValue, onValueChange, unit, ...props }: InlineQuantityFieldProps) => {
  const field = useFieldContext<string | null | undefined>();
  const value = displayValue ?? field.state.value ?? '';
  return (
    <FieldFrame label={label} style={fieldStyle}>
      <InlineQuantityInput
        {...props}
        value={value}
        unit={unit === 'count' ? (parseLocaleFloat(value) === 1 ? 'item' : 'items') : unit}
        onBlur={field.handleBlur}
        onChangeText={(next) => { field.handleChange(next); onValueChange?.(next); }}
      />
    </FieldFrame>
  );
};

type ControlFieldProps = { ref?: Ref<View> };

const PackSizesField = ({ unit, ref }: ControlFieldProps & { unit: Unit }) => {
  const field = useFieldContext<string[]>();
  return (
    <FieldFrame controlRef={ref}>
      <PackSizeFields
        unit={unit}
        values={field.state.value}
        onChange={(values) => { field.handleChange(values); field.handleBlur(); }}
      />
    </FieldFrame>
  );
};

const AisleField = ({ onPress, ref }: ControlFieldProps & { onPress: () => void }) => {
  const field = useFieldContext<AisleCategory>();
  return (
    <FieldFrame label="Category" controlRef={ref}>
      <PressableWithHaptics onPress={() => { field.handleBlur(); onPress(); }}>
        <AisleHeader type={field.state.value} showEditIndicator />
      </PressableWithHaptics>
    </FieldFrame>
  );
};

const DateField = ({ label, onPress, ref }: ControlFieldProps & { label: string; onPress: () => void }) => {
  const field = useFieldContext<string>();
  return (
    <FieldFrame controlRef={ref}>
      <DateSelectInput label={label} value={field.state.value} onPress={() => { field.handleBlur(); onPress(); }} />
    </FieldFrame>
  );
};

const UnitField = ({ onPress, quantity = 1, label = 'Unit', disabled, ref }: ControlFieldProps & {
  onPress: () => void;
  quantity?: number;
  label?: string;
  disabled?: boolean;
}) => {
  const field = useFieldContext<Unit>();
  return (
    <FieldFrame label={label} controlRef={ref}>
      <Button variant="outlined" disabled={disabled} style={{ height: 48 }}
        text={UNITS.find((unit) => unit.value === field.state.value)?.label({ count: quantity })}
        onPress={() => { field.handleBlur(); onPress(); }} />
    </FieldFrame>
  );
};

const TrackingUnitField = ({ onPress, ref }: ControlFieldProps & { onPress: () => void }) => {
  const field = useFieldContext<Unit>();
  return (
    <FieldFrame controlRef={ref}>
      <TrackingUnitSelect unit={field.state.value} onPress={() => { field.handleBlur(); onPress(); }} />
    </FieldFrame>
  );
};

const ProductBehaviorField = () => {
  const field = useFieldContext<ProductBehavior>();
  return (
    <FieldFrame>
      <ProductBehaviorSelector value={field.state.value}
        onChange={(value) => { field.handleChange(value); field.handleBlur(); }} />
    </FieldFrame>
  );
};

const ReminderFrequencyField = ({ ref, ...props }: ControlFieldProps & Omit<ComponentProps<typeof ReminderFrequencyFields>, 'value' | 'onValueChange'>) => {
  const field = useFieldContext<string>();
  return (
    <FieldFrame controlRef={ref}>
      <ReminderFrequencyFields
        {...props}
        value={field.state.value}
        onValueChange={(value) => { field.handleChange(value); field.handleBlur(); }}
      />
    </FieldFrame>
  );
};

const FormError = ({ message }: { message?: string | null }) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        const text = message ?? errors.map(formErrorMessage).find(Boolean);
        return text ? (
          <View accessible accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Typography variant="body-sm" weight="bold" color={colors.red[500]}>{text}</Typography>
          </View>
        ) : null;
      }}
    </form.Subscribe>
  );
};

const SubmitButton = (props: Omit<ComponentProps<typeof Button>, 'onPress'>) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button {...props} isLoading={props.isLoading || isSubmitting} onPress={() => form.handleSubmit()} />}
    </form.Subscribe>
  );
};

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    NumberField,
    TextField,
    InlineQuantityField,
    PackSizesField,
    AisleField,
    DateField,
    TrackingUnitField,
    UnitField,
    ProductBehaviorField,
    ReminderFrequencyField,
    Error: FieldError,
  },
  fieldContext,
  formComponents: { Error: FormError, SubmitButton },
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
