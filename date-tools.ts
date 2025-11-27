import {
  format,
  parse,
  addDays,
  startOfISOWeek,
  startOfMonth,
  endOfMonth,
  endOfISOWeek,
  eachWeekOfInterval,
  formatISO,
  parseISO,
} from 'date-fns';

const YEAR_WEEK = "RRRR-'W'II";

// 2025-05-24 -> Date
export { parseISO } from 'date-fns';

// Date -> 2025-05-24
export const formatDateToISO = (date: Date) => {
  return formatISO(date, { representation: 'date' });
};

export const getISOWeekString = (dateString: string) => {
  return format(parseISO(dateString), YEAR_WEEK);
};

export const getDatesFromISOWeek = (weekString: string) => {
  const startOfWeek = parse(weekString, YEAR_WEEK, new Date());
  return Array.from({ length: 7 }).map((_, index) => formatDateToISO(addDays(startOfWeek, index)));
};

export const getISOWeeksForMonth = (dateString: string) => {
  const date = parseISO(dateString);
  const start = startOfISOWeek(startOfMonth(date));
  const end = endOfISOWeek(endOfMonth(date));
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((w) => format(w, YEAR_WEEK));
};
