import { Sortable, SORT_OPTIONS, sortItems } from './sort.utils';

function item(name: string, startDate: string, rating?: string): Sortable {
  return { name, startDate, rating };
}

const names = (items: Sortable[]) => items.map(i => i.name);

describe('SORT_OPTIONS', () => {
  it('lists all six options with newest date first', () => {
    expect(SORT_OPTIONS.map(o => o.value)).toEqual([
      'date-desc', 'date-asc', 'name-asc', 'name-desc', 'rating-desc', 'rating-asc'
    ]);
  });
});

describe('sortItems', () => {
  describe('date-desc', () => {
    it('sorts newest first and unknown dates last', () => {
      const items = [
        item('Unknown', '??.??.????'),
        item('Old', '01.01.2019'),
        item('New', '01.01.2023'),
      ];
      expect(names(sortItems(items, 'date-desc'))).toEqual(['New', 'Old', 'Unknown']);
    });

    it('uses the newest of start, end and additional dates', () => {
      const items: Sortable[] = [
        { name: 'A', startDate: '01.01.2020', endDate: '01.02.2020' },
        { name: 'B', startDate: '01.01.2019', additionalDates: [{ dateComment: 'rewatch', startDate: '01.01.2024' }] },
      ];
      expect(names(sortItems(items, 'date-desc'))).toEqual(['B', 'A']);
    });
  });

  describe('date-asc', () => {
    it('sorts oldest first and unknown dates last', () => {
      const items = [
        item('Unknown', '??.??.????'),
        item('New', '01.01.2023'),
        item('Old', '01.01.2019'),
      ];
      expect(names(sortItems(items, 'date-asc'))).toEqual(['Old', 'New', 'Unknown']);
    });
  });

  describe('name', () => {
    it('sorts A–Z case-insensitively', () => {
      const items = [item('banana', '01.01.2020'), item('Cherry', '01.01.2020'), item('Apple', '01.01.2020')];
      expect(names(sortItems(items, 'name-asc'))).toEqual(['Apple', 'banana', 'Cherry']);
    });

    it('sorts Z–A case-insensitively', () => {
      const items = [item('banana', '01.01.2020'), item('Cherry', '01.01.2020'), item('Apple', '01.01.2020')];
      expect(names(sortItems(items, 'name-desc'))).toEqual(['Cherry', 'banana', 'Apple']);
    });

    it('ignores leading and trailing whitespace in names', () => {
      const items = [item('banana', '01.01.2020'), item(' Apple', '01.01.2020'), item('Cherry ', '01.01.2020')];
      expect(names(sortItems(items, 'name-asc'))).toEqual([' Apple', 'banana', 'Cherry ']);
    });
  });

  describe('rating-desc', () => {
    it('sorts high to low with missing and invalid ratings last', () => {
      const items = [
        item('None', '01.01.2020'),
        item('Low', '01.01.2020', '5'),
        item('Invalid', '01.01.2020', 'abc'),
        item('High', '01.01.2020', '9.5'),
      ];
      expect(names(sortItems(items, 'rating-desc'))).toEqual(['High', 'Low', 'Invalid', 'None']);
    });
  });

  describe('rating-asc', () => {
    it('sorts low to high with missing and invalid ratings still last', () => {
      const items = [
        item('None', '01.01.2020'),
        item('High', '01.01.2020', '9.5'),
        item('Invalid', '01.01.2020', ''),
        item('Low', '01.01.2020', '5'),
      ];
      expect(names(sortItems(items, 'rating-asc'))).toEqual(['Low', 'High', 'Invalid', 'None']);
    });
  });

  describe('tie-break', () => {
    it('falls back to name A–Z for equal ratings in both directions', () => {
      const items = [item('Zed', '01.01.2020', '8'), item('Abe', '01.01.2020', '8'), item('Mid', '01.01.2020', '8')];
      expect(names(sortItems(items, 'rating-desc'))).toEqual(['Abe', 'Mid', 'Zed']);
      expect(names(sortItems(items, 'rating-asc'))).toEqual(['Abe', 'Mid', 'Zed']);
    });

    it('falls back to name A–Z for equal dates', () => {
      const items = [item('Zed', '01.01.2020'), item('Abe', '01.01.2020')];
      expect(names(sortItems(items, 'date-desc'))).toEqual(['Abe', 'Zed']);
      expect(names(sortItems(items, 'date-asc'))).toEqual(['Abe', 'Zed']);
    });

    it('orders multiple unknown dates by name A–Z', () => {
      const items = [item('Zed', '??.??.????'), item('Abe', '??.??.????')];
      expect(names(sortItems(items, 'date-asc'))).toEqual(['Abe', 'Zed']);
    });
  });

  it('does not mutate the input array', () => {
    const items = [item('B', '01.01.2020'), item('A', '01.01.2021')];
    const copy = [...items];
    const result = sortItems(items, 'name-asc');
    expect(items).toEqual(copy);
    expect(result).not.toBe(items);
  });
});
