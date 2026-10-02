import {
  format,
  parse,
  addDays,
  startOfISOWeek,
  startOfMonth,
  startOfDay,
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

export const formatFriendlyDate = (dateString: string) => {
  return format(parseISO(dateString), 'EEEE, MMMM do, yyyy');
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

// Use local calendar midnight so daylight-saving days may be 23 or 25 hours.
export const millisecondsUntilNextDay = (now: Date) => {
  return startOfDay(addDays(now, 1)).getTime() - now.getTime();
};

// Seven calendar days, starting tomorrow, independent of the visible month.
export const getDefaultGroceryDateRange = (today: Date) => ({
  startDateString: formatDateToISO(addDays(today, 1)),
  endDateString: formatDateToISO(addDays(today, 7)),
});

// Calendar selections represent a date, not a local instant. Reject rollover dates.
export const calendarDateToTimestamp = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date.toISOString();
};

export type ScheduleDateRange = { start: string; end: string };

export const getScheduleDateRange = (today: string): ScheduleDateRange => ({
  start: formatDateToISO(addDays(startOfISOWeek(parseISO(today)), -7)),
  end: formatDateToISO(addDays(endOfISOWeek(parseISO(today)), 7)),
});

export const getWeeksInDateRange = (range: ScheduleDateRange) =>
  eachWeekOfInterval(range, { weekStartsOn: 1 }).map((week) => format(week, YEAR_WEEK));

export const expandScheduleDateRange = (range: ScheduleDateRange, direction: 'past' | 'future'): ScheduleDateRange =>
  direction === 'past'
    ? { ...range, start: formatDateToISO(addDays(parseISO(range.start), -7)) }
    : { ...range, end: formatDateToISO(addDays(parseISO(range.end), 7)) };

export const includeDateInScheduleRange = (range: ScheduleDateRange, date: string): ScheduleDateRange => {
  if (date >= range.start && date <= range.end) return range;
  const surrounding = getScheduleDateRange(date);
  return {
    start: range.start < surrounding.start ? range.start : surrounding.start,
    end: range.end > surrounding.end ? range.end : surrounding.end,
  };
};
