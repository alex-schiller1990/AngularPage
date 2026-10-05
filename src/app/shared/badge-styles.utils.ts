function normalizeBadgeValue(value: string): string {
  return value.trim().toLowerCase().replace('_', '-').replace(' ', '-');
}

export function getStatusBadgeClasses(status: string): string {
  const normalizedStatus = normalizeBadgeValue(status);

  if (normalizedStatus === 'completed') {
    return 'badge badge-status badge-status--completed';
  }

  if (normalizedStatus === 'watching' || normalizedStatus === 'playing') {
    return 'badge badge-status badge-status--watching';
  }

  if (normalizedStatus === 'played' || normalizedStatus === 'on-hold') {
    return 'badge badge-status badge-status--on-hold';
  }

  if (normalizedStatus === 'dropped') {
    return 'badge badge-status badge-status--dropped';
  }

  return 'badge badge-status badge-status--default';
}

export function getRatingBadgeClasses(rating: string | null | undefined): string {
  if (typeof rating !== 'string') {
    return 'badge badge-rating badge-rating--none';
  }

  const normalizedRatingText = rating.trim();
  const normalizedRating = Number(normalizedRatingText);
  if (!normalizedRatingText || Number.isNaN(normalizedRating)) {
    return 'badge badge-rating badge-rating--none';
  }

  if (normalizedRating === 10) {
    return 'badge badge-rating badge-rating--perfect';
  }

  if (normalizedRating >= 9) {
    return 'badge badge-rating badge-rating--high';
  }

  if (normalizedRating >= 8) {
    return 'badge badge-rating badge-rating--good';
  }

  if (normalizedRating >= 7) {
    return 'badge badge-rating badge-rating--mid';
  }

  if (normalizedRating >= 6) {
    return 'badge badge-rating badge-rating--low';
  }

  return 'badge badge-rating badge-rating--poor';
}

export function isPerfectRating(rating: string | null | undefined): boolean {
  if (typeof rating !== 'string') {
    return false;
  }

  return Number(rating) === 10;
}

/** Converts a kebab-case status string to a display label, e.g. "on-hold" → "on hold". */
export function formatStatusLabel(status: string): string {
  return status.replaceAll('-', ' ');
}

/**
 * Normalises a raw status value to the nearest valid option, falling back to
 * `defaultStatus` if none matches.
 */
export function resolveDraftStatus<T extends string>(
  status: string | null | undefined,
  validOptions: readonly T[],
  defaultStatus: T
): T {
  const normalized = (status ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');

  return (validOptions as readonly string[]).includes(normalized)
    ? (normalized as T)
    : defaultStatus;
}