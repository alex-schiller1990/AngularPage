import { parseDateToTimestamp, getNewestDateTimestamp, WithSortableDates } from './date-sort.utils';

describe('parseDateToTimestamp', () => {
  it('returns a positive number for a valid DD.MM.YYYY string', () => {
    const result = parseDateToTimestamp('15.06.2021');
    expect(result).toBeGreaterThan(0);
  });

  it('returns the correct timestamp for a known date', () => {
    const expected = new Date(2021, 5, 15).getTime(); // June 15, 2021
    expect(parseDateToTimestamp('15.06.2021')).toBe(expected);
  });

  it('returns 0 for an empty string', () => {
    expect(parseDateToTimestamp('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(parseDateToTimestamp(null as any)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parseDateToTimestamp(undefined)).toBe(0);
  });

  it('returns a non-zero timestamp for all-? placeholder string ??.??.???? (? replaced with 0)', () => {
    // ??.??.???? → 00.00.0000 → matches DD.MM.YYYY pattern, produces valid (edge) Date
    const result = parseDateToTimestamp('??.??.????');
    expect(result).not.toBeNaN();
    // The known value: new Date(0, -1, 0) = Nov 30 of year -1 (valid JS Date)
    const expected = new Date(0, -1, 0).getTime();
    expect(result).toBe(expected);
  });

  it('returns 0 for a non-date string', () => {
    expect(parseDateToTimestamp('not-a-date')).toBe(0);
  });

  it('returns 0 for a string that does not match DD.MM.YYYY format', () => {
    expect(parseDateToTimestamp('2021-06-15')).toBe(0);
  });

  it('handles a date with some ? digits by treating ? as 0', () => {
    // '01.??.2020' → '01.00.2020' → month 0 → December of previous year (JS Date behavior)
    // The function replaces ? with 0 and parses; result is a valid (non-NaN) timestamp
    const result = parseDateToTimestamp('01.??.2020');
    expect(result).not.toBe(0);
    // month 00 → index -1 in JS Date → December 2019
    const expected = new Date(2020, -1, 1).getTime();
    expect(result).toBe(expected);
  });
});

describe('getNewestDateTimestamp', () => {
  it('returns the highest timestamp when startDate is the newest', () => {
    const item: WithSortableDates = {
      startDate: '20.01.2023',
      endDate: '10.01.2022',
    };
    const expected = parseDateToTimestamp('20.01.2023');
    expect(getNewestDateTimestamp(item)).toBe(expected);
  });

  it('returns the highest timestamp when endDate is the newest', () => {
    const item: WithSortableDates = {
      startDate: '10.01.2021',
      endDate: '15.06.2023',
    };
    const expected = parseDateToTimestamp('15.06.2023');
    expect(getNewestDateTimestamp(item)).toBe(expected);
  });

  it('returns the highest timestamp when an additionalDate is the newest', () => {
    const item: WithSortableDates = {
      startDate: '01.01.2020',
      endDate: '01.06.2020',
      additionalDates: [
        { dateComment: 'rewatch', startDate: '05.03.2022', endDate: '10.04.2023' }
      ]
    };
    const expected = parseDateToTimestamp('10.04.2023');
    expect(getNewestDateTimestamp(item)).toBe(expected);
  });

  it('returns 0 when all dates are unknown/empty placeholders', () => {
    const item: WithSortableDates = {
      startDate: '??.??.????',
      endDate: '??.??.????',
    };
    expect(getNewestDateTimestamp(item)).toBe(0);
  });

  it('returns 0 when startDate is empty and there are no other dates', () => {
    const item: WithSortableDates = { startDate: '' };
    expect(getNewestDateTimestamp(item)).toBe(0);
  });

  it('handles missing endDate (undefined) gracefully', () => {
    const item: WithSortableDates = {
      startDate: '12.12.2021',
    };
    const expected = parseDateToTimestamp('12.12.2021');
    expect(getNewestDateTimestamp(item)).toBe(expected);
  });

  it('handles missing additionalDates (undefined) gracefully', () => {
    const item: WithSortableDates = {
      startDate: '01.01.2019',
      endDate: '31.12.2019',
    };
    const expected = parseDateToTimestamp('31.12.2019');
    expect(getNewestDateTimestamp(item)).toBe(expected);
  });
});
