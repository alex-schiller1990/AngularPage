import {
  formatStatusLabel,
  getRatingBadgeClasses,
  getStatusBadgeClasses,
  isPerfectRating,
  resolveDraftStatus,
} from './badge-styles.utils';

describe('getStatusBadgeClasses', () => {
  it('returns completed badge classes for "completed"', () => {
    expect(getStatusBadgeClasses('completed')).toBe('badge badge-status badge-status--completed');
  });

  it('returns watching badge classes for "watching"', () => {
    expect(getStatusBadgeClasses('watching')).toBe('badge badge-status badge-status--watching');
  });

  it('returns watching badge classes for "playing"', () => {
    expect(getStatusBadgeClasses('playing')).toBe('badge badge-status badge-status--watching');
  });

  it('returns on-hold badge classes for "played"', () => {
    expect(getStatusBadgeClasses('played')).toBe('badge badge-status badge-status--on-hold');
  });

  it('returns on-hold badge classes for "on-hold"', () => {
    expect(getStatusBadgeClasses('on-hold')).toBe('badge badge-status badge-status--on-hold');
  });

  it('returns dropped badge classes for "dropped"', () => {
    expect(getStatusBadgeClasses('dropped')).toBe('badge badge-status badge-status--dropped');
  });

  it('returns default badge classes for an unknown status', () => {
    expect(getStatusBadgeClasses('unknown-status')).toBe('badge badge-status badge-status--default');
  });

  it('returns default badge classes for an empty string', () => {
    expect(getStatusBadgeClasses('')).toBe('badge badge-status badge-status--default');
  });

  it('normalizes underscore separators (e.g. "on_hold" → on-hold badge)', () => {
    expect(getStatusBadgeClasses('on_hold')).toBe('badge badge-status badge-status--on-hold');
  });
});

describe('getRatingBadgeClasses', () => {
  it('returns perfect badge classes for rating 10', () => {
    expect(getRatingBadgeClasses('10')).toBe('badge badge-rating badge-rating--perfect');
  });

  it('returns high badge classes for rating 9', () => {
    expect(getRatingBadgeClasses('9')).toBe('badge badge-rating badge-rating--high');
  });

  it('returns good badge classes for rating 8', () => {
    expect(getRatingBadgeClasses('8')).toBe('badge badge-rating badge-rating--good');
  });

  it('returns mid badge classes for rating 7', () => {
    expect(getRatingBadgeClasses('7')).toBe('badge badge-rating badge-rating--mid');
  });

  it('returns low badge classes for rating 6', () => {
    expect(getRatingBadgeClasses('6')).toBe('badge badge-rating badge-rating--low');
  });

  it('returns poor badge classes for rating 5', () => {
    expect(getRatingBadgeClasses('5')).toBe('badge badge-rating badge-rating--poor');
  });

  it('returns poor badge classes for rating 1', () => {
    expect(getRatingBadgeClasses('1')).toBe('badge badge-rating badge-rating--poor');
  });

  it('returns none badge classes for null', () => {
    expect(getRatingBadgeClasses(null)).toBe('badge badge-rating badge-rating--none');
  });

  it('returns none badge classes for undefined', () => {
    expect(getRatingBadgeClasses(undefined)).toBe('badge badge-rating badge-rating--none');
  });

  it('returns none badge classes for a non-numeric string', () => {
    expect(getRatingBadgeClasses('abc')).toBe('badge badge-rating badge-rating--none');
  });

  it('returns none badge classes for an empty string', () => {
    expect(getRatingBadgeClasses('')).toBe('badge badge-rating badge-rating--none');
  });
});

describe('isPerfectRating', () => {
  it('returns true for the string "10"', () => {
    expect(isPerfectRating('10')).toBe(true);
  });

  it('returns false for "9"', () => {
    expect(isPerfectRating('9')).toBe(false);
  });

  it('returns false for "10.0"', () => {
    expect(isPerfectRating('10.0')).toBe(true);
  });

  it('returns false for null', () => {
    expect(isPerfectRating(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPerfectRating(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isPerfectRating('')).toBe(false);
  });
});

describe('formatStatusLabel', () => {
  it('replaces a single hyphen with a space', () => {
    expect(formatStatusLabel('on-hold')).toBe('on hold');
  });

  it('replaces multiple hyphens with spaces', () => {
    expect(formatStatusLabel('not-yet-started')).toBe('not yet started');
  });

  it('returns a string without hyphens unchanged', () => {
    expect(formatStatusLabel('completed')).toBe('completed');
  });

  it('returns an empty string unchanged', () => {
    expect(formatStatusLabel('')).toBe('');
  });
});

describe('resolveDraftStatus', () => {
  const validOptions = ['watching', 'completed', 'on-hold', 'dropped'] as const;
  type Status = (typeof validOptions)[number];

  it('returns the matching valid option when the value is recognized', () => {
    expect(resolveDraftStatus('completed', validOptions, 'watching')).toBe('completed');
  });

  it('normalizes underscores before matching', () => {
    expect(resolveDraftStatus('on_hold', validOptions, 'watching')).toBe('on-hold');
  });

  it('normalizes leading/trailing whitespace before matching', () => {
    expect(resolveDraftStatus('  dropped  ', validOptions, 'watching')).toBe('dropped');
  });

  it('normalizes to lowercase before matching', () => {
    expect(resolveDraftStatus('COMPLETED', validOptions, 'watching')).toBe('completed');
  });

  it('falls back to defaultStatus for an unrecognized value', () => {
    expect(resolveDraftStatus('unknown', validOptions, 'watching')).toBe('watching');
  });

  it('falls back to defaultStatus for null', () => {
    expect(resolveDraftStatus(null, validOptions, 'watching')).toBe('watching');
  });

  it('falls back to defaultStatus for undefined', () => {
    expect(resolveDraftStatus(undefined, validOptions, 'watching')).toBe('watching');
  });

  it('falls back to defaultStatus for an empty string', () => {
    expect(resolveDraftStatus('', validOptions, 'watching')).toBe('watching');
  });
});
