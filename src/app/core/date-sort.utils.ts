import { AdditionalDate } from './additional-date.model';

const DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/**
 * Parses a date string in DD.MM.YYYY format to a timestamp for sorting.
 * Returns 0 for unknown dates (??.??.????) or invalid strings so they sort last when ordering by newest first.
 */
export function parseDateToTimestamp(value: string | undefined): number {
  if (value == null || value === '') {
    return 0;
  }
  value = value.replaceAll('?', '0');
  const m = value.trim().match(DATE_PATTERN);
  if (!m) return 0;
  const [, day, month, year] = m;
  const d = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Item that has main dates and optional additional date ranges (e.g. Anime, Game). */
export interface WithSortableDates {
  startDate: string;
  endDate?: string;
  additionalDates?: AdditionalDate[];
}

/**
 * Returns the newest date timestamp from an item's start/end and additional dates.
 * Use for sorting by "most recent" (e.g. last watched). Unknown dates (??.??.????) yield 0 and sort last.
 */
export function getNewestDateTimestamp(item: WithSortableDates): number {
  const dates = [
    item.startDate,
    item.endDate,
    ...(item.additionalDates ?? []).flatMap(ad => [ad.startDate, ad.endDate])
  ];
  return Math.max(0, ...dates.map(parseDateToTimestamp));
}
