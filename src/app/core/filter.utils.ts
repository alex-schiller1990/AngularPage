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
