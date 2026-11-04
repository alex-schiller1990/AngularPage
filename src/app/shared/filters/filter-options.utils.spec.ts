import { toFilterOptions } from './filter-options.utils';

describe('toFilterOptions', () => {
  it('maps values to options with counts and selection state', () => {
    const counts = new Map([['a', 3], ['b', 1]]);
    expect(toFilterOptions(['a', 'b'], counts, new Set(['b']))).toEqual([
      { value: 'a', label: 'a', count: 3, selected: false },
      { value: 'b', label: 'b', count: 1, selected: true }
    ]);
  });

  it('uses 0 when a value has no count', () => {
    expect(toFilterOptions(['a'], new Map(), new Set())[0].count).toBe(0);
  });

  it('uses the label formatter when provided', () => {
    const options = toFilterOptions(['on-hold'], new Map(), new Set(), (v) => v.toUpperCase());
    expect(options[0].label).toBe('ON-HOLD');
  });

  it('returns an empty array for no values', () => {
    expect(toFilterOptions([], new Map(), new Set())).toEqual([]);
  });
});
