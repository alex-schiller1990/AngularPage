import {
  addAlternativeTitle,
  removeAlternativeTitle,
  updateAlternativeTitle,
  addAdditionalDate,
  removeAdditionalDate,
  updateAdditionalDateField,
  applyDraftMutation,
  DraftWithLists,
} from './detail-draft.utils';
import { AdditionalDate } from '../core/additional-date.model';

function makeDraft(overrides: Partial<DraftWithLists> = {}): DraftWithLists {
  return {
    alternativeTitles: [],
    additionalDates: [],
    ...overrides,
  };
}

describe('addAlternativeTitle', () => {
  it('appends an empty string to alternativeTitles', () => {
    const draft = makeDraft({ alternativeTitles: ['Title A'] });
    const result = addAlternativeTitle(draft);
    expect(result.alternativeTitles).toEqual(['Title A', '']);
  });

  it('works on an empty alternativeTitles array', () => {
    const draft = makeDraft();
    const result = addAlternativeTitle(draft);
    expect(result.alternativeTitles).toEqual(['']);
  });

  it('does not mutate the original draft', () => {
    const draft = makeDraft({ alternativeTitles: ['Title A'] });
    addAlternativeTitle(draft);
    expect(draft.alternativeTitles).toEqual(['Title A']);
  });
});

describe('removeAlternativeTitle', () => {
  it('removes the entry at the given index', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B', 'C'] });
    const result = removeAlternativeTitle(draft, 1);
    expect(result.alternativeTitles).toEqual(['A', 'C']);
  });

  it('removes the first entry', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B', 'C'] });
    const result = removeAlternativeTitle(draft, 0);
    expect(result.alternativeTitles).toEqual(['B', 'C']);
  });

  it('removes the last entry', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B', 'C'] });
    const result = removeAlternativeTitle(draft, 2);
    expect(result.alternativeTitles).toEqual(['A', 'B']);
  });

  it('does not mutate the original draft', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B'] });
    removeAlternativeTitle(draft, 0);
    expect(draft.alternativeTitles).toEqual(['A', 'B']);
  });
});

describe('updateAlternativeTitle', () => {
  it('updates the value at the given index', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B', 'C'] });
    const result = updateAlternativeTitle(draft, 1, 'Updated');
    expect(result.alternativeTitles).toEqual(['A', 'Updated', 'C']);
  });

  it('leaves other entries unchanged', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B', 'C'] });
    const result = updateAlternativeTitle(draft, 0, 'New');
    expect(result.alternativeTitles[1]).toBe('B');
    expect(result.alternativeTitles[2]).toBe('C');
  });

  it('does not mutate the original draft', () => {
    const draft = makeDraft({ alternativeTitles: ['A', 'B'] });
    updateAlternativeTitle(draft, 0, 'New');
    expect(draft.alternativeTitles).toEqual(['A', 'B']);
  });
});

describe('addAdditionalDate', () => {
  it('appends a blank AdditionalDate entry', () => {
    const draft = makeDraft();
    const result = addAdditionalDate(draft);
    expect(result.additionalDates.length).toBe(1);
    expect(result.additionalDates[0]).toEqual({ dateComment: '', startDate: '', endDate: '' });
  });

  it('appends to existing entries', () => {
    const existing: AdditionalDate = { dateComment: 'Rewatch', startDate: '01.01.2020', endDate: '05.01.2020' };
    const draft = makeDraft({ additionalDates: [existing] });
    const result = addAdditionalDate(draft);
    expect(result.additionalDates.length).toBe(2);
    expect(result.additionalDates[0]).toEqual(existing);
    expect(result.additionalDates[1]).toEqual({ dateComment: '', startDate: '', endDate: '' });
  });

  it('does not mutate the original draft', () => {
    const draft = makeDraft();
    addAdditionalDate(draft);
    expect(draft.additionalDates).toEqual([]);
  });
});

describe('removeAdditionalDate', () => {
  it('removes the entry at the given index', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'First', startDate: '01.01.2020' },
      { dateComment: 'Second', startDate: '01.01.2021' },
      { dateComment: 'Third', startDate: '01.01.2022' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    const result = removeAdditionalDate(draft, 1);
    expect(result.additionalDates.length).toBe(2);
    expect(result.additionalDates[0].dateComment).toBe('First');
    expect(result.additionalDates[1].dateComment).toBe('Third');
  });

  it('removes the first entry', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'A', startDate: '01.01.2020' },
      { dateComment: 'B', startDate: '01.01.2021' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    const result = removeAdditionalDate(draft, 0);
    expect(result.additionalDates).toEqual([{ dateComment: 'B', startDate: '01.01.2021' }]);
  });

  it('does not mutate the original draft', () => {
    const dates: AdditionalDate[] = [{ dateComment: 'X', startDate: '01.01.2020' }];
    const draft = makeDraft({ additionalDates: dates });
    removeAdditionalDate(draft, 0);
    expect(draft.additionalDates.length).toBe(1);
  });
});

describe('updateAdditionalDateField', () => {
  it('updates the specified field on the entry at the given index', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'Old', startDate: '01.01.2020' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    const result = updateAdditionalDateField(draft, 0, 'dateComment', 'New');
    expect(result.additionalDates[0].dateComment).toBe('New');
  });

  it('updates startDate without affecting other fields', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'Rewatch', startDate: '01.01.2020', endDate: '10.01.2020' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    const result = updateAdditionalDateField(draft, 0, 'startDate', '15.06.2021');
    expect(result.additionalDates[0].startDate).toBe('15.06.2021');
    expect(result.additionalDates[0].dateComment).toBe('Rewatch');
    expect(result.additionalDates[0].endDate).toBe('10.01.2020');
  });

  it('leaves other entries unchanged', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'First', startDate: '01.01.2020' },
      { dateComment: 'Second', startDate: '01.01.2021' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    const result = updateAdditionalDateField(draft, 0, 'dateComment', 'Updated');
    expect(result.additionalDates[1].dateComment).toBe('Second');
  });

  it('does not mutate the original draft', () => {
    const dates: AdditionalDate[] = [
      { dateComment: 'Original', startDate: '01.01.2020' },
    ];
    const draft = makeDraft({ additionalDates: dates });
    updateAdditionalDateField(draft, 0, 'dateComment', 'Changed');
    expect(draft.additionalDates[0].dateComment).toBe('Original');
  });
});

describe('applyDraftMutation', () => {
  it('returns a function', () => {
    const updater = applyDraftMutation((d: DraftWithLists) => d);
    expect(typeof updater).toBe('function');
  });

  it('passes through null unchanged', () => {
    const updater = applyDraftMutation(addAlternativeTitle);
    const result = updater(null);
    expect(result).toBeNull();
  });

  it('applies the mutation function when current is non-null', () => {
    const draft = makeDraft({ alternativeTitles: ['A'] });
    const updater = applyDraftMutation(addAlternativeTitle);
    const result = updater(draft);
    expect(result?.alternativeTitles).toEqual(['A', '']);
  });

  it('does not mutate the original draft when applied', () => {
    const draft = makeDraft({ alternativeTitles: ['A'] });
    const updater = applyDraftMutation(addAlternativeTitle);
    updater(draft);
    expect(draft.alternativeTitles).toEqual(['A']);
  });
});
