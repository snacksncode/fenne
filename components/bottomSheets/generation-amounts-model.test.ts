/// <reference types="jest" />

import { generationAmountsSchema, generationBuyingText } from './generation-amounts-model';

const projection = { needed: 200, pantry: 50, shortage: 150, suggested_quantity: 190,
  packs: [{ size: 190, count: 1 }] };

describe('generation amount drafts', () => {
  it('buys zero when pantry covers or exceeds need, even before a new projection arrives', () => {
    for (const pantry of ['200', '1000']) {
      expect(generationBuyingText({ quantity: null, pantry, needed: 200, projection })).toBe('0');
    }
  });

  it('uses the pack-rounded purchase and ignores calculations for an older pantry value or need', () => {
    expect(generationBuyingText({ quantity: null, pantry: '50', needed: 200, projection })).toBe('190');
    expect(generationBuyingText({ quantity: null, pantry: '100', needed: 200, projection })).toBeUndefined();
    expect(generationBuyingText({ quantity: null, pantry: '50', needed: 300, projection })).toBeUndefined();
  });

  it('keeps manual buying amounts, including zero and unfinished input, through pantry changes', () => {
    for (const quantity of ['75', '0', '']) {
      for (const pantry of ['50', '1000']) {
        expect(generationBuyingText({ quantity, pantry, needed: 200, projection })).toBe(quantity);
      }
    }
  });

  it('accepts decimal commas and prevents negative or empty amounts from being saved', () => {
    expect(generationAmountsSchema.safeParse({ pantry: '1,5', quantity: null }).success).toBe(true);
    expect(generationAmountsSchema.safeParse({ pantry: '0', quantity: '0' }).success).toBe(true);
    for (const invalid of ['', '-', '-1', 'NaN', 'Infinity', '1.2.3', '1000000001']) {
      expect(generationAmountsSchema.safeParse({ pantry: invalid, quantity: null }).success).toBe(false);
      expect(generationAmountsSchema.safeParse({ pantry: '1', quantity: invalid }).success).toBe(false);
      expect(generationBuyingText({ quantity: null, pantry: invalid, needed: 200, projection })).toBeUndefined();
    }
  });

  it('does not expose a negative calculated buying amount', () => {
    expect(generationBuyingText({ quantity: null, pantry: '50', needed: 200,
      projection: { ...projection, suggested_quantity: -150 } })).toBe('0');
  });
});
