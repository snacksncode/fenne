import { format, parse } from 'date-fns';

const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * @description "yyyy-MM-dd" -> Date
 */
export const parseDateString = (dateString: string) => {
  return parse(dateString, DATE_FORMAT, new Date());
};

/**
 * @description Date -> "yyyy-MM-dd"
 */
export const dateToString = (date: Date) => {
  return format(date, DATE_FORMAT);
};
