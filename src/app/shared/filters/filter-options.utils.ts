import { FilterOption } from './filter.models';

/** Builds dropdown options from a list of values, their facet counts and the current selection. */
export function toFilterOptions(
  values: string[],
  counts: Map<string, number>,
  selected: Set<string>,
  getLabel: (value: string) => string = (value) => value
): FilterOption[] {
  return values.map((value) => ({
    value,
    label: getLabel(value),
    count: counts.get(value) ?? 0,
    selected: selected.has(value)
  }));
}
