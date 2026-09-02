import { trimField, normalizeAlternativeTitles, normalizeAdditionalDates } from './update-doc.utils';

describe('trimField', () => {
  it('trims leading whitespace', () => {
    expect(trimField('  hello')).toBe('hello');
  });

  it('trims trailing whitespace', () => {
    expect(trimField('hello  ')).toBe('hello');
  });

  it('trims both sides', () => {
    expect(trimField('  hello  ')).toBe('hello');
  });

  it('returns empty string for null', () => {
    expect(trimField(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(trimField(undefined)).toBe('');
  });

  it('returns empty string for already-empty string', () => {
    expect(trimField('')).toBe('');
  });

  it('returns empty string for whitespace-only string', () => {
    expect(trimField('   ')).toBe('');
  });
});

describe('normalizeAlternativeTitles', () => {
  it('trims each title', () => {
    expect(normalizeAlternativeTitles(['  Foo  ', ' Bar '])).toEqual(['Foo', 'Bar']);
  });

  it('filters out blank-after-trim entries', () => {
    expect(normalizeAlternativeTitles(['  ', '', 'Valid'])).toEqual(['Valid']);
  });

  it('handles empty array', () => {
    expect(normalizeAlternativeTitles([])).toEqual([]);
  });

  it('handles array with only blank entries', () => {
    expect(normalizeAlternativeTitles(['  ', '   ', ''])).toEqual([]);
  });

  it('preserves non-blank titles in order', () => {
    expect(normalizeAlternativeTitles(['Alpha', 'Beta', 'Gamma'])).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});

describe('normalizeAdditionalDates', () => {
  it('trims all fields on a valid entry', () => {
    const result = normalizeAdditionalDates([
      { dateComment: '  Rewatch  ', startDate: ' 01.01.2020 ', endDate: ' 31.12.2020 ' },
    ]);
    expect(result[0].dateComment).toBe('Rewatch');
    expect(result[0].startDate).toBe('01.01.2020');
    expect(result[0].endDate).toBe('31.12.2020');
  });

  it('omits endDate key entirely when blank after trimming', () => {
    const result = normalizeAdditionalDates([
      { dateComment: 'Note', startDate: '01.01.2020', endDate: '   ' },
    ]);
    expect(Object.prototype.hasOwnProperty.call(result[0], 'endDate')).toBe(false);
  });

  it('omits endDate key when undefined', () => {
    const result = normalizeAdditionalDates([
      { dateComment: 'Note', startDate: '01.01.2020' },
    ]);
    expect(Object.prototype.hasOwnProperty.call(result[0], 'endDate')).toBe(false);
  });

  it('filters out fully-blank entries (all fields empty after trimming)', () => {
    const result = normalizeAdditionalDates([
      { dateComment: '  ', startDate: '', endDate: '   ' },
    ]);
    expect(result.length).toBe(0);
  });

  it('preserves entry with comment only', () => {
    const result = normalizeAdditionalDates([
      { dateComment: 'Note', startDate: '', endDate: '' },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].dateComment).toBe('Note');
  });

  it('preserves entry with startDate only', () => {
    const result = normalizeAdditionalDates([
      { dateComment: '', startDate: '01.01.2020', endDate: '' },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].startDate).toBe('01.01.2020');
  });

  it('handles empty input array', () => {
    expect(normalizeAdditionalDates([])).toEqual([]);
  });
});
