import { APIError } from '@/api/client';
import { TextInputRef } from '@/components/input';
import { AnyFormApi } from '@tanstack/react-form';
import { useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

export type FormFeedbackErrors<Field extends string> = {
  fields: Partial<Record<Field, string>>;
  form?: string;
};

/** Owns server feedback and focus/scroll after the error UI commits; callers supply field order. */
export const useFormFeedback = <Field extends string>(fields: readonly Field[]) => {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const contentRef = useRef<View>(null);
  const inputs = useRef<Partial<Record<Field, TextInputRef | null>>>({});
  const controls = useRef<Partial<Record<Field, View | null>>>({});
  const [error, setError] = useState<string | null>(null);

  const focus = (field: Field | undefined) => {
    if (!field) return;
    requestAnimationFrame(() => {
      const input = inputs.current[field];
      if (input) {
        input.focus();
        requestAnimationFrame(() => scrollRef.current?.assureFocusedInputVisible());
        return;
      }
      // Error labels must finish layout before measuring a non-input control.
      requestAnimationFrame(() => {
        const node = controls.current[field];
        const content = contentRef.current;
        if (node && content) {
          node.measureLayout(content, (_x, y) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
          });
        }
        const handle = node ? findNodeHandle(node) : null;
        if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      });
    });
  };

  const focusInvalid = (form: AnyFormApi) => {
    focus(fields.find((field) => (form.getFieldMeta(field)?.errors.length ?? 0) > 0));
  };

  const clearServerErrors = (form: AnyFormApi) => {
    setError(null);
    fields.forEach((field) => {
      if (form.getFieldMeta(field)?.errorMap.onServer == null) return;
      form.setFieldMeta(field, (meta) => ({
        ...meta,
        errorMap: { ...meta.errorMap, onServer: undefined },
      }));
    });
  };

  const applyServerErrors = (form: AnyFormApi, errors: FormFeedbackErrors<Field>) => {
    const unmountedErrors: string[] = [];
    fields.forEach((field) => {
      const message = errors.fields[field];
      if (!message) return;
      if (!form.getFieldMeta(field)) {
        unmountedErrors.push(message);
        return;
      }
      form.setFieldMeta(field, (meta) => ({
        ...meta,
        isTouched: true,
        errorMap: { ...meta.errorMap, onServer: message },
      }));
    });
    setError([errors.form, ...unmountedErrors].filter(Boolean).join('\n') || null);
    focus(fields.find((field) => errors.fields[field] != null));
  };

  const reportError = (
    form: AnyFormApi,
    requestError: unknown,
    fallback: string,
    fieldAliases: Record<string, Field> = {},
  ) => {
    const data = requestError instanceof APIError ? requestError.data : null;
    const errors: FormFeedbackErrors<Field> = { fields: {} };
    const general: string[] = [];
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        const messages = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string')
          : typeof value === 'string' ? [value] : [];
        const message = messages.filter(Boolean).join('\n');
        if (!message) return;
        const field = fieldAliases[key] ?? fields.find((name) => name === key);
        if (field) errors.fields[field] = message;
        else general.push(message);
      });
    }
    errors.form = general.join('\n') || (Object.keys(errors.fields).length ? undefined : fallback);
    applyServerErrors(form, errors);
  };

  return {
    scrollRef,
    contentRef,
    inputRef: (field: Field) => (input: TextInputRef | null) => { inputs.current[field] = input; },
    controlRef: (field: Field) => (node: View | null) => { controls.current[field] = node; },
    focus,
    focusInvalid,
    clearServerErrors,
    applyServerErrors,
    reportError,
    error,
    setError,
  };
};
