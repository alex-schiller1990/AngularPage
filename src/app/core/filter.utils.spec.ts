import {
  accumulateFacetCounts,
  collectYearsFromMap,
  expandYearRange,
  getCoveredYears,
  getSortedUniqueValues,
  matchesAnySelection,
  removeValueFromSet,
  toggleValueInSet,
} from './filter.utils';

describe('getSortedUniqueValues', () => {
  it('deduplicates values', () => {
    expect(getSortedUniqueValues(['a', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('trims whitespace from values', () => {
    expect(getSortedUniqueValues(['  a  ', 'b '])).toEqual(['a', 'b']);
  });

  it('filters out blank and empty strings', () => {
    expect(getSortedUniqueValues(['a', '', '   ', 'b'])).toEqual(['a', 'b']);
  });

  it('filters out null and undefined values', () => {
    expect(getSortedUniqueValues(['a', null, undefined, 'b'])).toEqual(['a', 'b']);
  });

  it('sorts alphabetically by default', () => {
    expect(getSortedUniqueValues(['banana', 'apple', 'cherry'])).toEqual(['apple', 'banana', 'cherry']);
  });

  it('sorts descending numerically when flag is true', () => {
    expect(getSortedUniqueValues(['2020', '2018', '2019'], true)).toEqual(['2020', '2019', '2018']);
  });

  it('deduplicates after trimming', () => {
    expect(getSortedUniqueValues(['a', ' a'])).toEqual(['a']);
  });

  it('returns empty array for all-blank input', () => {
    expect(getSortedUniqueValues([null, undefined, '', '  '])).toEqual([]);
  });
});

describe('matchesAnySelection', () => {
  it('returns true when selected set is empty', () => {
    expect(matchesAnySelection(new Set(), 'anything')).toBe(true);
  });

  it('returns true when selected set is empty and value is null', () => {
    expect(matchesAnySelection(new Set(), null)).toBe(true);
  });

  it('returns false for null value with non-empty selection', () => {
    expect(matchesAnySelection(new Set(['a']), null)).toBe(false);
  });

  it('returns false for undefined value with non-empty selection', () => {
    expect(matchesAnySelection(new Set(['a']), undefined)).toBe(false);
  });

  it('returns true for matching string value', () => {
    expect(matchesAnySelection(new Set(['foo']), 'foo')).toBe(true);
  });

  it('returns false for non-matching string value', () => {
    expect(matchesAnySelection(new Set(['foo']), 'bar')).toBe(false);
  });

  it('trims string value before matching', () => {
    expect(matchesAnySelection(new Set(['foo']), '  foo  ')).toBe(true);
  });

  it('returns true for matching number value', () => {
    expect(matchesAnySelection(new Set(['42']), 42)).toBe(true);
  });

  it('returns false for non-matching number value', () => {
    expect(matchesAnySelection(new Set(['42']), 99)).toBe(false);
  });

  it('returns true when value Set intersects selected set', () => {
    expect(matchesAnySelection(new Set(['2020', '2021']), new Set(['2019', '2020']))).toBe(true);
  });

  it('returns false when value Set has no intersection with selected set', () => {
    expect(matchesAnySelection(new Set(['2020', '2021']), new Set(['2018', '2019']))).toBe(false);
  });
});

describe('toggleValueInSet', () => {
  it('adds a value that is not in the set', () => {
    const result = toggleValueInSet(new Set(['a', 'b']), 'c');
    expect(result.has('c')).toBe(true);
  });

  it('removes a value that is already in the set', () => {
    const result = toggleValueInSet(new Set(['a', 'b']), 'a');
    expect(result.has('a')).toBe(false);
  });

  it('does not mutate the original set when adding', () => {
    const original = new Set(['a', 'b']);
    toggleValueInSet(original, 'c');
    expect(original.has('c')).toBe(false);
  });

  it('does not mutate the original set when removing', () => {
    const original = new Set(['a', 'b']);
    toggleValueInSet(original, 'a');
    expect(original.has('a')).toBe(true);
  });
});

describe('removeValueFromSet', () => {
  it('removes the specified value', () => {
    const result = removeValueFromSet(new Set(['a', 'b', 'c']), 'b');
    expect(result.has('b')).toBe(false);
    expect(result.size).toBe(2);
  });

  it('is a no-op if value is not present', () => {
    const result = removeValueFromSet(new Set(['a', 'b']), 'z');
    expect(result.size).toBe(2);
  });

  it('does not mutate the original set', () => {
    const original = new Set(['a', 'b']);
    removeValueFromSet(original, 'a');
    expect(original.has('a')).toBe(true);
  });
});

describe('expandYearRange', () => {
  it('expands a single year string into a set with that year', () => {
    expect(expandYearRange('2020')).toEqual(new Set(['2020']));
  });

  it('expands a year range string into all years in the range', () => {
    expect(expandYearRange('2018-2020')).toEqual(new Set(['2018', '2019', '2020']));
  });

  it('returns empty set for null', () => {
    expect(expandYearRange(null)).toEqual(new Set());
  });

  it('returns empty set for undefined', () => {
    expect(expandYearRange(undefined)).toEqual(new Set());
  });

  it('returns empty set for invalid input', () => {
    expect(expandYearRange('abc')).toEqual(new Set());
  });

  it('returns empty set for zero year', () => {
    expect(expandYearRange('0')).toEqual(new Set());
  });

  it('accepts a numeric value as a single year', () => {
    expect(expandYearRange(2021)).toEqual(new Set(['2021']));
  });
});

describe('collectYearsFromMap', () => {
  it('merges years from multiple map entries', () => {
    const map = new Map<string, Set<string>>([
      ['id1', new Set(['2018', '2019'])],
      ['id2', new Set(['2019', '2020'])],
    ]);
    const result = collectYearsFromMap(map);
    expect(result).toEqual(['2020', '2019', '2018']);
  });

  it('deduplicates years across entries', () => {
    const map = new Map<string, Set<string>>([
      ['id1', new Set(['2020'])],
      ['id2', new Set(['2020'])],
    ]);
    const result = collectYearsFromMap(map);
    expect(result).toEqual(['2020']);
  });

  it('returns descending order', () => {
    const map = new Map<string, Set<string>>([
      ['id1', new Set(['2015', '2022', '2018'])],
    ]);
    const result = collectYearsFromMap(map);
    expect(result).toEqual(['2022', '2018', '2015']);
  });

  it('returns empty array for empty map', () => {
    expect(collectYearsFromMap(new Map())).toEqual([]);
  });
});

describe('accumulateFacetCounts', () => {
  it('increments counts for all years in the item year set', () => {
    const yearsByItemId = new Map<string, Set<string>>([
      ['item1', new Set(['2019', '2020'])],
    ]);
    const counts = new Map<string, number>();
    accumulateFacetCounts(yearsByItemId, 'item1', counts);
    expect(counts.get('2019')).toBe(1);
    expect(counts.get('2020')).toBe(1);
  });

  it('initialises counts from zero correctly', () => {
    const yearsByItemId = new Map<string, Set<string>>([
      ['item1', new Set(['2021'])],
    ]);
    const counts = new Map<string, number>();
    accumulateFacetCounts(yearsByItemId, 'item1', counts);
    accumulateFacetCounts(yearsByItemId, 'item1', counts);
    expect(counts.get('2021')).toBe(2);
  });

  it('is a no-op for an item not in the map', () => {
    const yearsByItemId = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    accumulateFacetCounts(yearsByItemId, 'missing', counts);
    expect(counts.size).toBe(0);
  });
});

describe('getCoveredYears', () => {
  it('extracts the year from a single startDate', () => {
    const result = getCoveredYears([{ startDate: '01.01.2020' }]);
    expect(result.has('2020')).toBe(true);
  });

  it('extracts all years in a startDate–endDate range', () => {
    const result = getCoveredYears([{ startDate: '01.01.2018', endDate: '31.12.2020' }]);
    expect(result).toEqual(new Set(['2018', '2019', '2020']));
  });

  it('merges years from multiple date range entries', () => {
    const result = getCoveredYears([
      { startDate: '01.01.2018', endDate: '31.12.2019' },
      { startDate: '01.06.2021' },
    ]);
    expect(result).toEqual(new Set(['2018', '2019', '2021']));
  });

  it('ignores entries with no startDate', () => {
    const result = getCoveredYears([{ endDate: '31.12.2020' }]);
    expect(result.size).toBe(0);
  });

  it('returns empty set for empty input', () => {
    expect(getCoveredYears([])).toEqual(new Set());
  });
});
