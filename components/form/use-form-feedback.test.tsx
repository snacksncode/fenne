/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AnyFormApi, useForm } from '@tanstack/react-form';
import { AccessibilityInfo, View } from 'react-native';
import { TextInputRef } from '@/components/input';
import { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useFormFeedback } from './use-form-feedback';

describe('native form feedback', () => {
  let renderer: ReactTestRenderer;
  let feedback: ReturnType<typeof useFormFeedback<'name' | 'unit'>>;
  let form: AnyFormApi;
  const focus = jest.fn();
  const assureFocusedInputVisible = jest.fn();
  const scrollTo = jest.fn();
  const Harness = () => {
    feedback = useFormFeedback(['name', 'unit']);
    const instance = useForm({ defaultValues: { name: '', unit: '' } });
    form = instance;
    return <><instance.Field name="name">{() => null}</instance.Field><instance.Field name="unit">{() => null}</instance.Field></>;
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    await act(async () => { renderer = create(<Harness />); });
    feedback.inputRef('name')({ focus } as unknown as TextInputRef);
    feedback.scrollRef.current = { assureFocusedInputVisible, scrollTo } as unknown as KeyboardAwareScrollViewRef;
  });

  afterEach(async () => {
    await act(async () => renderer.unmount());
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('maps server errors to touched fields, retains the form message, and reveals the first invalid input', async () => {
    act(() => feedback.applyServerErrors(form, { fields: { unit: 'Choose a unit', name: 'Name is taken' }, form: 'Could not save' }));
    expect(form.getFieldMeta('name')?.errorMap.onServer).toBe('Name is taken');
    expect(form.getFieldMeta('name')?.isTouched).toBe(true);
    expect(feedback.error).toBe('Could not save');
    expect(focus).not.toHaveBeenCalled();
    await act(async () => { jest.runAllTimers(); });
    expect(focus).toHaveBeenCalledTimes(1);
    expect(assureFocusedInputVisible).toHaveBeenCalledTimes(1);
  });

  it('clears only server feedback when trying again', () => {
    act(() => {
      feedback.applyServerErrors(form, { fields: { name: 'Name is taken' }, form: 'Could not save' });
      form.setFieldMeta('name', (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onSubmit: 'Name required' } }));
    });
    act(() => feedback.clearServerErrors(form));
    expect(form.getFieldMeta('name')?.errorMap.onServer).toBeUndefined();
    expect(form.getFieldMeta('name')?.errorMap.onSubmit).toBe('Name required');
    expect(feedback.error).toBeNull();
  });

  it('scrolls a non-input control after its error layout commits', async () => {
    const content = {} as View;
    const measureLayout = jest.fn((_relative, success) => success(0, 120));
    feedback.contentRef.current = content;
    feedback.controlRef('unit')({ measureLayout, _nativeTag: 42 } as unknown as View);
    jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => {});
    act(() => feedback.applyServerErrors(form, { fields: { unit: 'Choose a unit' } }));
    await act(async () => { jest.runAllTimers(); });
    expect(measureLayout).toHaveBeenCalledWith(content, expect.any(Function));
    expect(scrollTo).toHaveBeenCalledWith({ y: 104, animated: true });
    expect(focus).not.toHaveBeenCalled();
    expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(42);
  });
});
