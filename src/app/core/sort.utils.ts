import { getNewestDateTimestamp, WithSortableDates } from './date-sort.utils';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'rating-desc'
  | 'rating-asc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest date' },
  { value: 'date-asc', label: 'Oldest date' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'rating-desc', label: 'Rating high–low' },
  { value: 'rating-asc', label: 'Rating low–high' },
];

export interface Sortable extends WithSortableDates {
  name: string;
  rating?: string;
}

function compareNames(a: Sortable, b: Sortable): number {
  return a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: 'base' });
}

/** Parses the rating; returns undefined when missing or not a number. */
function parseRating(item: Sortable): number | undefined {
  const value = parseFloat(item.rating ?? '');
  return isNaN(value) ? undefined : value;
}

/** Compares two optional numbers; undefined values always sort last, regardless of direction. */
function compareWithMissingLast(a: number | undefined, b: number | undefined, direction: 1 | -1): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return (a - b) * direction;
}

/**
 * Returns a new array sorted by the given option. The input array is not modified.
 * Unknown dates (timestamp 0) and missing/invalid ratings always sort last.
 * Ties fall back to name A–Z.
 */
export function sortItems<T extends Sortable>(items: readonly T[], option: SortOption): T[] {
  return [...items].sort((a, b) => {
    const result = compareBy(a, b, option);
    return result !== 0 ? result : compareNames(a, b);
  });
}

function compareBy(a: Sortable, b: Sortable, option: SortOption): number {
  switch (option) {
    case 'date-desc':
      return compareWithMissingLast(toKnownDate(a), toKnownDate(b), -1);
    case 'date-asc':
      return compareWithMissingLast(toKnownDate(a), toKnownDate(b), 1);
    case 'name-asc':
      return compareNames(a, b);
    case 'name-desc':
      return compareNames(b, a);
    case 'rating-desc':
      return compareWithMissingLast(parseRating(a), parseRating(b), -1);
    case 'rating-asc':
      return compareWithMissingLast(parseRating(a), parseRating(b), 1);
  }
}

/** Newest date timestamp, or undefined when all dates are unknown (timestamp 0). */
function toKnownDate(item: Sortable): number | undefined {
  const timestamp = getNewestDateTimestamp(item);
  return timestamp === 0 ? undefined : timestamp;
}
