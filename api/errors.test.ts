/// <reference types="jest" />

import { APIError } from '@/api/client';
import { productValidationErrorsFromError } from '@/api/product-validation-errors';

describe('productValidationErrorsFromError', () => {
  it('maps backend pack_count errors to the product form field', () => {
    const error = new APIError({ pack_count: ['must be greater than or equal to 2'] });

    expect(productValidationErrorsFromError(error)).toEqual({
      fields: { pack_count: 'Must be greater than or equal to 2' },
    });
  });
});
