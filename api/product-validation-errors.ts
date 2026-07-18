import { APIError } from '@/api/client';

export type ProductFormField =
  | 'name'
  | 'aisle'
  | 'pack_count'
  | 'quantity'
  | 'unit'
  | 'reminder_frequency_value'
  | 'reminder_frequency_unit';

type ProductValidationErrors = {
  fields: Partial<Record<ProductFormField, string>>;
  form?: string;
};

const productFormFields: ProductFormField[] = [
  'name',
  'aisle',
  'pack_count',
  'quantity',
  'unit',
  'reminder_frequency_value',
  'reminder_frequency_unit',
];

const firstMessage = (value: unknown) => {
  const message = Array.isArray(value) ? value.find((item): item is string => typeof item === 'string') : value;
  if (typeof message !== 'string' || message.trim() === '') return null;

  const trimmed = message.trim();
  return `${trimmed.charAt(0).toLocaleUpperCase()}${trimmed.slice(1)}`;
};

export const productValidationErrorsFromError = (error: unknown): ProductValidationErrors | null => {
  if (!(error instanceof APIError) || !error.data || typeof error.data !== 'object') return null;

  const data = error.data as Record<string, unknown>;
  const fields = Object.fromEntries(
    productFormFields.flatMap((field) => {
      const message = firstMessage(data[field]);
      return message ? [[field, message]] : [];
    })
  ) as ProductValidationErrors['fields'];
  const form = firstMessage(data.base);

  if (Object.keys(fields).length === 0 && !form) return null;
  return { fields, ...(form && { form }) };
};
