import { AdditionalDate } from './additional-date.model';

/** Trims a string value, treating null/undefined as empty string. */
export function trimField(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/** Trims each title and filters out blank entries. */
export function normalizeAlternativeTitles(titles: string[]): string[] {
  return (titles ?? []).map(t => t.trim()).filter(t => t.length > 0);
}

/** Trims each date's fields, omits empty endDate, and filters out fully blank entries. */
export function normalizeAdditionalDates(
  dates: AdditionalDate[]
): { dateComment: string; startDate: string; endDate?: string }[] {
  return (dates ?? [])
    .map(date => {
      const dateComment = trimField(date.dateComment);
      const startDate = trimField(date.startDate);
      const endDate = trimField(date.endDate);
      return {
        dateComment,
        startDate,
        ...(endDate ? { endDate } : {}),
      };
    })
    .filter(date => date.dateComment || date.startDate || date.endDate);
}
