import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpenCriticApiGame, OpenCriticGameView } from './opencritic.model';

const OPENCRITIC_GAME_URL = 'https://opencritic-api.p.rapidapi.com/game';
const RAPIDAPI_HOST = 'opencritic-api.p.rapidapi.com';

export interface OpenCriticCacheEntry {
  data: Signal<OpenCriticGameView | null>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
}

interface OpenCriticCacheItem {
  entry: OpenCriticCacheEntry;
  data: ReturnType<typeof signal<OpenCriticGameView | null>>;
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  fetchStarted: boolean;
}

@Injectable({ providedIn: 'root' })
export class OpenCriticService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, OpenCriticCacheItem>();

  /** Read-only cache entry for an OpenCritic game id (safe inside `computed`). */
  getByGameId(gameId: string): OpenCriticCacheEntry {
    return this.getOrCreate(gameId).entry;
  }

  /** Starts the HTTP fetch once per id. Call from an `effect`, not from `computed`. */
  load(gameId: string): void {
    const item = this.getOrCreate(gameId);
    if (item.fetchStarted) return;
    item.fetchStarted = true;
    void this.fetch(gameId, item);
  }

  private getOrCreate(gameId: string): OpenCriticCacheItem {
    const existing = this.cache.get(gameId);
    if (existing) return existing;

    const data = signal<OpenCriticGameView | null>(null);
    const loading = signal(false);
    const error = signal<string | null>(null);
    const item: OpenCriticCacheItem = {
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
    this.cache.set(gameId, item);
    return item;
  }

  private async fetch(gameId: string, item: OpenCriticCacheItem): Promise<void> {
    const apiKey = environment.rapidApiKey?.trim();
    if (!apiKey) {
      item.error.set('OpenCritic API key is not configured.');
      return;
    }

    item.loading.set(true);
    item.error.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<OpenCriticApiGame>(`${OPENCRITIC_GAME_URL}/${gameId}`, {
          headers: new HttpHeaders({
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          }),
        }),
      );
      item.data.set(mapOpenCriticToView(response));
    } catch {
      item.data.set(null);
      item.error.set('Could not load OpenCritic data.');
    } finally {
      item.loading.set(false);
    }
  }
}

function mapOpenCriticToView(data: OpenCriticApiGame): OpenCriticGameView {
  const developer = data.Companies.find(c => c.type === 'DEVELOPER')?.name ?? null;
  const publisher = data.Companies.find(c => c.type === 'PUBLISHER')?.name ?? null;

  return {
    topCriticScore:
      data.topCriticScore != null ? Math.round(data.topCriticScore * 100) / 100 : null,
    numReviews: data.numReviews,
    firstReleaseDate: formatIsoDate(data.firstReleaseDate),
    platforms: data.Platforms.map(p => p.name),
    genres: data.Genres.map(g => g.name),
    developer,
    publisher,
  };
}

function formatIsoDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
