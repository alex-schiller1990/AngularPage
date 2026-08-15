import { AdditionalDate } from '../core/additional-date.model';

/** Minimal shape required by the draft mutation helpers. */
export interface DraftWithLists {
  alternativeTitles: string[];
  additionalDates: AdditionalDate[];
}

export function addAlternativeTitle<T extends DraftWithLists>(draft: T): T {
  return { ...draft, alternativeTitles: [...draft.alternativeTitles, ''] };
}

export function removeAlternativeTitle<T extends DraftWithLists>(draft: T, index: number): T {
  return { ...draft, alternativeTitles: draft.alternativeTitles.filter((_, i) => i !== index) };
}

export function updateAlternativeTitle<T extends DraftWithLists>(draft: T, index: number, value: string): T {
  return {
    ...draft,
    alternativeTitles: draft.alternativeTitles.map((t, i) => (i === index ? value : t)),
  };
}

export function addAdditionalDate<T extends DraftWithLists>(draft: T): T {
  return {
    ...draft,
    additionalDates: [...draft.additionalDates, { dateComment: '', startDate: '', endDate: '' }],
  };
}

export function removeAdditionalDate<T extends DraftWithLists>(draft: T, index: number): T {
  return { ...draft, additionalDates: draft.additionalDates.filter((_, i) => i !== index) };
}

export function updateAdditionalDateField<T extends DraftWithLists>(
  draft: T,
  index: number,
  key: keyof AdditionalDate,
  value: string
): T {
  return {
    ...draft,
    additionalDates: draft.additionalDates.map((date, i) =>
      i === index ? { ...date, [key]: value } : date
    ),
  };
}

/**
 * Returns a Signal updater that applies a draft mutation function.
 * Usage: `this.draft.update(applyDraftMutation(draft => addAlternativeTitle(draft)))`
 * Or inline: `this.draft.update(applyDraftMutation(addAlternativeTitle))`
 */
export function applyDraftMutation<T extends DraftWithLists>(
  fn: (draft: T) => T
): (current: T | null) => T | null {
  return (current) => (current ? fn(current) : current);
}
