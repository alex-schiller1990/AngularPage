export interface DateRangeValue {
  startDate?: string;
  endDate?: string;
}

export function getSortedUniqueValues(
  values: Array<string | undefined | null>,
  sortDescendingAsNumber = false
): string[] {
  const uniqueValues = Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value: string) => value.trim())
        .filter((value: string) => value !== '')
    )
  );

  if (sortDescendingAsNumber) {
    return uniqueValues.sort((a: string, b: string) => Number(b) - Number(a));
  }
  return uniqueValues.sort((a: string, b: string) => a.localeCompare(b));
}

export function matchesAnySelection(
  selectedValues: Set<string>,
  value: string | number | Set<string> | undefined | null
): boolean {
  if (selectedValues.size === 0) return true;
  if (value == null) return false;

  if (typeof value === 'string' || typeof value === 'number') {
    return selectedValues.has(String(value).trim());
  }

  if (!(value instanceof Set)) return false;

  for (const selected of selectedValues) {
    if (value.has(selected)) return true;
  }
  return false;
}

export function toggleValueInSet(currentSet: Set<string>, value: string): Set<string> {
  const nextSet = new Set(currentSet);
  if (nextSet.has(value)) {
    nextSet.delete(value);
  } else {
    nextSet.add(value);
  }
  return nextSet;
}

export function removeValueFromSet(currentSet: Set<string>, value: string): Set<string> {
  const nextSet = new Set(currentSet);
  nextSet.delete(value);
  return nextSet;
}

/**
 * Expands a "YYYY" or "YYYY-YYYY" release year string into the full set of
 * individual year strings it covers. Accepts numeric values as well as strings.
 */
export function expandYearRange(value: string | number | undefined | null): Set<string> {
  const years = new Set<string>();
  if (value == null) return years;

  const parts = String(value).split('-').map((p) => p.trim());
  const start = Number(parts[0]);
  const end = parts.length > 1 ? Number(parts[parts.length - 1]) : start;

  if (!Number.isFinite(start) || start <= 0) return years;
  const min = Math.min(start, end);
  const max = Number.isFinite(end) && end > 0 ? Math.max(start, end) : start;

  for (let year = min; year <= max; year++) {
    years.add(String(year));
  }
  return years;
}

/**
 * Collects all year strings from a map of id → year sets into a single sorted
 * unique array, descending by numeric value.
 */
export function collectYearsFromMap(map: Map<string, Set<string>>): string[] {
  const years = new Set<string>();
  for (const yearSet of map.values()) {
    for (const year of yearSet) {
      years.add(year);
    }
  }
  return getSortedUniqueValues(Array.from(years), true);
}

/**
 * Increments facet counts for every year in the per-item year set retrieved
 * from `yearsByItemId` using `itemId`.
 */
export function accumulateFacetCounts(
  yearsByItemId: Map<string, Set<string>>,
  itemId: string,
  counts: Map<string, number>
): void {
  const yearSet = yearsByItemId.get(itemId) ?? new Set<string>();
  for (const year of yearSet) {
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
}

export function getCoveredYears(ranges: DateRangeValue[]): Set<string> {
  const years = new Set<string>();

  for (const range of ranges) {
    addYearsFromRange(range.startDate, range.endDate, years);
  }

  return years;
}

function addYearsFromRange(startDate: string | undefined, endDate: string | undefined, years: Set<string>): void {
  const startYear = getYearFromDate(startDate);
  if (startYear == null) return;

  const endYear = getYearFromDate(endDate) ?? startYear;
  const minYear = Math.min(startYear, endYear);
  const maxYear = Math.max(startYear, endYear);

  for (let year = minYear; year <= maxYear; year++) {
    years.add(String(year));
  }
}

function getYearFromDate(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return null;

  const normalized = value.replaceAll('?', '0').trim();
  const parts = normalized.split('.');
  if (parts.length !== 3) return null;

  const year = Number(parts[2]);
  return Number.isFinite(year) && year > 0 ? year : null;
}
