/// <reference types="jest" />
import { getDefaultGroceryDateRange } from './date-tools';

describe('default grocery date range', () => {
  it.each([
    [new Date(2026, 8, 27), '2026-09-28', '2026-10-04'],
    [new Date(2026, 11, 31), '2027-01-01', '2027-01-07'],
    [new Date(2028, 1, 28), '2028-02-29', '2028-03-06'],
  ])('selects tomorrow through seven calendar days from %s', (today, startDateString, endDateString) => {
    expect(getDefaultGroceryDateRange(today)).toEqual({ startDateString, endDateString });
  });
});
