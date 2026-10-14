import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  JikanAiredDatePart,
  JikanAnimeApiData,
  JikanAnimeApiResponse,
  JikanAnimeView,
} from './jikan-anime.model';

export const JIKAN_ANIME_URL = 'https://jikan.lucashdo.com/v1/anime';

export interface JikanAnimeCacheEntry {
  data: Signal<JikanAnimeView | null>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
}

interface JikanAnimeCacheItem {
  entry: JikanAnimeCacheEntry;
  data: ReturnType<typeof signal<JikanAnimeView | null>>;
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  fetchStarted: boolean;
}

@Injectable({ providedIn: 'root' })
export class JikanAnimeService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, JikanAnimeCacheItem>();

  /** Read-only cache entry for a MAL id (safe inside `computed`). */
  getByMalId(malId: string): JikanAnimeCacheEntry {
    return this.getOrCreate(malId).entry;
  }

  /** Starts the HTTP fetch once per id. Call from an `effect`, not from `computed`. */
  load(malId: string): void {
    const item = this.getOrCreate(malId);
    if (item.fetchStarted) return;
    item.fetchStarted = true;
    void this.fetch(malId, item);
  }

  private getOrCreate(malId: string): JikanAnimeCacheItem {
    const existing = this.cache.get(malId);
    if (existing) return existing;

    const data = signal<JikanAnimeView | null>(null);
    const loading = signal(false);
    const error = signal<string | null>(null);
    const item: JikanAnimeCacheItem = {
      data,
      loading,
      error,
      fetchStarted: false,
      entry: {
        data: data.asReadonly(),
        loading: loading.asReadonly(),
        error: error.asReadonly(),
      },
    };
    this.cache.set(malId, item);
    return item;
  }

  private async fetch(malId: string, item: JikanAnimeCacheItem): Promise<void> {
    item.loading.set(true);
    item.error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<JikanAnimeApiResponse | JikanAnimeApiData>(`${JIKAN_ANIME_URL}/${malId}`),
      );
      const rawData =
        response && typeof response === 'object' && 'data' in response && response.data
          ? response.data
          : (response as JikanAnimeApiData);
      item.data.set(mapJikanAnimeToView(rawData));
    } catch {
      item.data.set(null);
      item.error.set('Could not load MyAnimeList data.');
    } finally {
      item.loading.set(false);
    }
  }
}

export function mapJikanAnimeToView(data: JikanAnimeApiData | null | undefined): JikanAnimeView {
  if (!data) {
    return {
      malUrl: '',
      synonyms: '',
      score: null,
      scoredBy: null,
      rank: null,
      popularity: null,
      airedFrom: null,
      airedTo: null,
      duration: null,
      source: null,
      genres: [],
      studios: [],
    };
  }

  const titles =
    data.titles && data.titles.length > 0
      ? data.titles
          .map(t => t.title)
          .filter((t): t is string => Boolean(t))
          .join(', ')
      : (data.title ?? '');

  return {
    malUrl: data.url ?? '',
    synonyms: titles,
    score: data.score ?? null,
    scoredBy: data.scored_by ?? null,
    rank: data.rank ?? null,
    popularity: data.popularity ?? null,
    airedFrom: formatAiredPart(data.aired?.prop?.from) ?? formatIsoDate(data.aired?.from ?? null),
    airedTo: formatAiredPart(data.aired?.prop?.to) ?? formatIsoDate(data.aired?.to ?? null),
    duration: data.duration ?? null,
    source: data.source ?? null,
    genres: (data.genres ?? []).map(g => g.name).filter((n): n is string => Boolean(n)),
    studios: (data.studios ?? []).map(s => s.name).filter((n): n is string => Boolean(n)),
  };
}

export function formatAiredPart(part: JikanAiredDatePart | undefined): string | null {
  if (!part?.year || !part.month || !part.day) return null;
  return new Date(part.year, part.month - 1, part.day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatIsoDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
