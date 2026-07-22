/// <reference types="jest" />

import { APIError } from '@/api/client';
import { productValidationErrorsFromError } from '@/api/product-validation-errors';

describe('productValidationErrorsFromError', () => {
  it('maps backend unit errors to the product form field', () => {
    const error = new APIError({ unit: ['is invalid'] });

    expect(productValidationErrorsFromError(error)).toEqual({
      fields: { unit: 'Is invalid' },
    });
  });
});
