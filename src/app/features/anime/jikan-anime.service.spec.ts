import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  formatAiredPart,
  formatIsoDate,
  JIKAN_ANIME_URL,
  JikanAnimeService,
  mapJikanAnimeToView,
} from './jikan-anime.service';
import { JikanAnimeApiData } from './jikan-anime.model';

describe('mapJikanAnimeToView', () => {
  it('returns default empty view when data is null or undefined', () => {
    expect(mapJikanAnimeToView(null)).toEqual({
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
    });

    expect(mapJikanAnimeToView(undefined)).toEqual({
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
    });
  });

  it('maps full anime data correctly', () => {
    const data: JikanAnimeApiData = {
      url: 'https://myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood',
      titles: [
        { type: 'Default', title: 'Fullmetal Alchemist: Brotherhood' },
        { type: 'Japanese', title: '鋼の錬金術師 FULLMETAL ALCHEMIST' },
      ],
      score: 9.1,
      scored_by: 2100000,
      rank: 1,
      popularity: 3,
      aired: {
        from: '2009-04-05T00:00:00+00:00',
        to: '2010-07-04T00:00:00+00:00',
        prop: {
          from: { day: 5, month: 4, year: 2009 },
          to: { day: 4, month: 7, year: 2010 },
        },
      },
      duration: '24 min per ep',
      source: 'Manga',
      genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Drama' }],
      studios: [{ name: 'Bones' }],
    };

    const view = mapJikanAnimeToView(data);
    expect(view.malUrl).toBe('https://myanimelist.net/anime/5114/Fullmetal_Alchemist__Brotherhood');
    expect(view.synonyms).toBe(
      'Fullmetal Alchemist: Brotherhood, 鋼の錬金術師 FULLMETAL ALCHEMIST',
    );
    expect(view.score).toBe(9.1);
    expect(view.scoredBy).toBe(2100000);
    expect(view.rank).toBe(1);
    expect(view.popularity).toBe(3);
    expect(view.airedFrom).toBe('Apr 5, 2009');
    expect(view.airedTo).toBe('Jul 4, 2010');
    expect(view.duration).toBe('24 min per ep');
    expect(view.source).toBe('Manga');
    expect(view.genres).toEqual(['Action', 'Adventure', 'Drama']);
    expect(view.studios).toEqual(['Bones']);
  });

  it('falls back to single title string when titles array is empty or missing', () => {
    const data: JikanAnimeApiData = {
      url: 'https://myanimelist.net/anime/1',
      title: 'Cowboy Bebop',
    };

    const view = mapJikanAnimeToView(data);
    expect(view.synonyms).toBe('Cowboy Bebop');
  });

  it('falls back to ISO date formatting when prop date components are incomplete', () => {
    const data: JikanAnimeApiData = {
      aired: {
        from: '2023-01-15T00:00:00.000Z',
        to: null,
        prop: {
          from: { day: null, month: null, year: 2023 },
          to: { day: null, month: null, year: null },
        },
      },
    };

    const view = mapJikanAnimeToView(data);
    expect(view.airedFrom).not.toBeNull();
    expect(view.airedTo).toBeNull();
  });
});

describe('formatAiredPart', () => {
  it('formats full day/month/year accurately', () => {
    expect(formatAiredPart({ year: 2024, month: 10, day: 12 })).toBe('Oct 12, 2024');
  });

  it('returns null if any component is missing or null', () => {
    expect(formatAiredPart(undefined)).toBeNull();
    expect(formatAiredPart({ year: 2024, month: null, day: 12 })).toBeNull();
    expect(formatAiredPart({ year: null, month: 10, day: 12 })).toBeNull();
    expect(formatAiredPart({ year: 2024, month: 10, day: null })).toBeNull();
  });
});

describe('formatIsoDate', () => {
  it('formats valid ISO date string', () => {
    expect(formatIsoDate('2022-05-20T00:00:00Z')).not.toBeNull();
  });

  it('returns null for null, empty or invalid date string', () => {
    expect(formatIsoDate(null)).toBeNull();
    expect(formatIsoDate('')).toBeNull();
    expect(formatIsoDate('invalid-date')).toBeNull();
  });
});

describe('JikanAnimeService', () => {
  let service: JikanAnimeService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JikanAnimeService],
    });

    service = TestBed.inject(JikanAnimeService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('returns cache entry with default signal states', () => {
    const entry = service.getByMalId('123');
    expect(entry.data()).toBeNull();
    expect(entry.loading()).toBe(false);
    expect(entry.error()).toBeNull();
  });

  it('fetches wrapped response and updates signals on load', async () => {
    const entry = service.getByMalId('5114');

    service.load('5114');

    const req = httpTesting.expectOne(`${JIKAN_ANIME_URL}/5114`);
    expect(req.request.method).toBe('GET');

    req.flush({
      data: {
        url: 'https://myanimelist.net/anime/5114',
        titles: [{ type: 'Default', title: 'Fullmetal Alchemist: Brotherhood' }],
        score: 9.1,
      },
    });

    await Promise.resolve();

    expect(entry.loading()).toBe(false);
    expect(entry.error()).toBeNull();
    expect(entry.data()?.synonyms).toBe('Fullmetal Alchemist: Brotherhood');
    expect(entry.data()?.score).toBe(9.1);
  });

  it('fetches unwrapped response correctly', async () => {
    const entry = service.getByMalId('999');

    service.load('999');

    const req = httpTesting.expectOne(`${JIKAN_ANIME_URL}/999`);
    req.flush({
      url: 'https://myanimelist.net/anime/999',
      title: 'Direct Anime Title',
      score: 8.5,
    });

    await Promise.resolve();

    expect(entry.loading()).toBe(false);
    expect(entry.error()).toBeNull();
    expect(entry.data()?.synonyms).toBe('Direct Anime Title');
    expect(entry.data()?.score).toBe(8.5);
  });

  it('handles HTTP error gracefully', async () => {
    const entry = service.getByMalId('error-id');

    service.load('error-id');

    const req = httpTesting.expectOne(`${JIKAN_ANIME_URL}/error-id`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    await Promise.resolve();

    expect(entry.loading()).toBe(false);
    expect(entry.data()).toBeNull();
    expect(entry.error()).toBe('Could not load MyAnimeList data.');
  });

  it('does not make duplicate HTTP requests when load is called multiple times for the same id', () => {
    service.load('100');
    service.load('100');

    const requests = httpTesting.match(`${JIKAN_ANIME_URL}/100`);
    expect(requests.length).toBe(1);
    requests[0].flush({ data: { title: 'Test' } });
  });
});
