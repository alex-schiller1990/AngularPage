function normalizeBadgeValue(value: string): string {
  return value.trim().toLowerCase().replace('_', '-').replace(' ', '-');
}

export function getStatusBadgeClasses(status: string): string {
  const normalizedStatus = normalizeBadgeValue(status);

  if (normalizedStatus === 'completed') {
    return 'bg-blue-100 text-blue-700';
  }

  if (normalizedStatus === 'watching' || normalizedStatus === 'playing') {
    return 'bg-green-100 text-green-700';
  }

  if (normalizedStatus === 'played' || normalizedStatus === 'on-hold') {
    return 'bg-orange-100 text-orange-700';
  }

  if (normalizedStatus === 'dropped') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
}

export function getRatingBadgeClasses(rating: string | null | undefined): string {
  if (typeof rating !== 'string') {
    return 'bg-gray-100 text-gray-600';
  }

  const normalizedRatingText = rating.trim();
  const normalizedRating = Number(normalizedRatingText);
  if (!normalizedRatingText || Number.isNaN(normalizedRating)) {
    return 'bg-gray-100 text-gray-600';
  }

  if (normalizedRating === 10) {
    return 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-900 ring-2 ring-amber-300 shadow-sm';
  }

  if (normalizedRating >= 9) {
    return 'bg-yellow-100 text-yellow-700';
  }

  if (normalizedRating >= 8) {
    return 'bg-blue-100 text-blue-700';
  }

  if (normalizedRating >= 7) {
    return 'bg-green-100 text-green-700';
  }

  if (normalizedRating >= 6) {
    return 'bg-orange-100 text-orange-700';
  }

  return 'bg-red-100 text-red-700';
}

export function isPerfectRating(rating: string | null | undefined): boolean {
  if (typeof rating !== 'string') {
    return false;
  }

  return Number(rating) === 10;
}
