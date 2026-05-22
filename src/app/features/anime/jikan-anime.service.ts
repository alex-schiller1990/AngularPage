import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  JikanAiredDatePart,
  JikanAnimeApiData,
  JikanAnimeApiResponse,
  JikanAnimeView,
} from './jikan-anime.model';

const JIKAN_ANIME_URL = 'https://api.jikan.moe/v4/anime';

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
        this.http.get<JikanAnimeApiResponse>(`${JIKAN_ANIME_URL}/${malId}`),
      );
      item.data.set(mapJikanAnimeToView(response.data));
    } catch {
      item.data.set(null);
      item.error.set('Could not load MyAnimeList data.');
    } finally {
      item.loading.set(false);
    }
  }
}

function mapJikanAnimeToView(data: JikanAnimeApiData): JikanAnimeView {
  return {
    malUrl: data.url,
    synonyms: data.titles.map(t => t.title).join(', '),
    score: data.score,
    scoredBy: data.scored_by,
    rank: data.rank,
    popularity: data.popularity,
    airedFrom: formatAiredPart(data.aired.prop.from) ?? formatIsoDate(data.aired.from),
    airedTo: formatAiredPart(data.aired.prop.to) ?? formatIsoDate(data.aired.to),
    duration: data.duration,
    source: data.source,
    genres: data.genres.map(g => g.name),
    studios: data.studios.map(s => s.name),
  };
}

function formatAiredPart(part: JikanAiredDatePart | undefined): string | null {
  if (!part?.year || !part.month || !part.day) return null;
  return new Date(part.year, part.month - 1, part.day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatIsoDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
