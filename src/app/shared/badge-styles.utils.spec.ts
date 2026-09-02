import {
  formatStatusLabel,
  getRatingBadgeClasses,
  getStatusBadgeClasses,
  isPerfectRating,
  resolveDraftStatus,
} from './badge-styles.utils';

describe('getStatusBadgeClasses', () => {
  it('returns blue classes for "completed"', () => {
    expect(getStatusBadgeClasses('completed')).toBe('bg-blue-100 text-blue-700');
  });

  it('returns green classes for "watching"', () => {
    expect(getStatusBadgeClasses('watching')).toBe('bg-green-100 text-green-700');
  });

  it('returns green classes for "playing"', () => {
    expect(getStatusBadgeClasses('playing')).toBe('bg-green-100 text-green-700');
  });

  it('returns orange classes for "played"', () => {
    expect(getStatusBadgeClasses('played')).toBe('bg-orange-100 text-orange-700');
  });

  it('returns orange classes for "on-hold"', () => {
    expect(getStatusBadgeClasses('on-hold')).toBe('bg-orange-100 text-orange-700');
  });

  it('returns red classes for "dropped"', () => {
    expect(getStatusBadgeClasses('dropped')).toBe('bg-red-100 text-red-700');
  });

  it('returns gray classes for an unknown status', () => {
    expect(getStatusBadgeClasses('unknown-status')).toBe('bg-gray-100 text-gray-700');
  });

  it('returns gray classes for an empty string', () => {
    expect(getStatusBadgeClasses('')).toBe('bg-gray-100 text-gray-700');
  });

  it('normalizes underscore separators (e.g. "on_hold" → orange)', () => {
    expect(getStatusBadgeClasses('on_hold')).toBe('bg-orange-100 text-orange-700');
  });
});

describe('getRatingBadgeClasses', () => {
  it('returns gradient classes for rating 10', () => {
    const result = getRatingBadgeClasses('10');
    expect(result).toContain('bg-gradient-to-r');
    expect(result).toContain('amber');
  });

  it('returns yellow classes for rating 9', () => {
    expect(getRatingBadgeClasses('9')).toBe('bg-yellow-100 text-yellow-700');
  });

  it('returns blue classes for rating 8', () => {
    expect(getRatingBadgeClasses('8')).toBe('bg-blue-100 text-blue-700');
  });

  it('returns green classes for rating 7', () => {
    expect(getRatingBadgeClasses('7')).toBe('bg-green-100 text-green-700');
  });

  it('returns orange classes for rating 6', () => {
    expect(getRatingBadgeClasses('6')).toBe('bg-orange-100 text-orange-700');
  });

  it('returns red classes for rating 5', () => {
    expect(getRatingBadgeClasses('5')).toBe('bg-red-100 text-red-700');
  });

  it('returns red classes for rating 1', () => {
    expect(getRatingBadgeClasses('1')).toBe('bg-red-100 text-red-700');
  });

  it('returns gray classes for null', () => {
    expect(getRatingBadgeClasses(null)).toBe('bg-gray-100 text-gray-600');
  });

  it('returns gray classes for undefined', () => {
    expect(getRatingBadgeClasses(undefined)).toBe('bg-gray-100 text-gray-600');
  });

  it('returns gray classes for a non-numeric string', () => {
    expect(getRatingBadgeClasses('abc')).toBe('bg-gray-100 text-gray-600');
  });

  it('returns gray classes for an empty string', () => {
    expect(getRatingBadgeClasses('')).toBe('bg-gray-100 text-gray-600');
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
