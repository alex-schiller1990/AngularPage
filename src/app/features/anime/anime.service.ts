import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, deleteField, doc, Firestore, getDoc, limit, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';
import { firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Anime } from './anime.model';
import { AnimeDetail, AnimeWithDetails } from './anime-detail.model';
import { collectionData$, collectionDataOnce$, docData$ } from '../../core/firestore.utils';
import { AdditionalDate } from '../../core/additional-date.model';
import { trimField, normalizeAlternativeTitles, normalizeAdditionalDates } from '../../core/update-doc.utils';
import {
  readListFromStorage,
  removeListFromStorage,
  writeListToStorage,
} from '../../core/list-storage.utils';

const COLLECTION_ID = 'Anime';
const LIST_STORAGE_KEY = 'angular-page.anime.list';

export interface AnimeUpdates {
  status: Anime['status'];
  progress: string;
  rating: string;
  startDate: string;
  endDate: string;
  malID: string;
  additionalDates: AdditionalDate[];
  releaseYear: string;
  alternativeTitles: string[];
  description: string;
  opinion: string;
  trivia: string;
  coverURL?: string;
}

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly db = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly col = collection(this.db, COLLECTION_ID);

  private readonly listSignal = signal<Anime[]>([]);

  /** List of all anime. Hydrated from localStorage when fresh; refetched after 2 weeks or on manual refresh. */
  readonly list = this.listSignal.asReadonly();
  readonly listLoading = signal(false);

  private readonly detailByTitleCache = new Map<string, Signal<AnimeWithDetails | null>>();

  constructor() {
    const cached = readListFromStorage<Anime>(LIST_STORAGE_KEY);
    if (cached) {
      this.listSignal.set(cached.data);
      if (cached.expired) {
        void this.fetchList();
      }
    } else {
      void this.fetchList();
    }
  }

  /** Clears persisted list cache and fetches a fresh list from Firestore. */
  refreshList(): void {
    removeListFromStorage(LIST_STORAGE_KEY);
    void this.fetchList();
  }

  async createAnime(name: string, updates: AnimeUpdates): Promise<string> {
    const title = encodeURIComponent(name.trim());
    const mainRef = doc(this.col, title);

    const existing = await getDoc(mainRef);
    if (existing.exists()) {
      throw new Error(`An anime with the title "${name.trim()}" already exists.`);
    }

    await setDoc(mainRef, {
      name: name.trim(),
      title,
      coverURL: updates.coverURL ?? '',
      status: updates.status,
      progress: updates.progress,
      rating: updates.rating,
      startDate: updates.startDate,
      ...(updates.endDate ? { endDate: updates.endDate } : {}),
      releaseYear: updates.releaseYear,
      ...(updates.alternativeTitles.filter(t => t.trim()).length
        ? { alternativeTitles: updates.alternativeTitles.filter(t => t.trim()) }
        : {}),
      ...(updates.additionalDates.length ? { additionalDates: updates.additionalDates } : {}),
    });

    const detailsRef = doc(this.db, COLLECTION_ID, title, 'Details', 'Details');
    await setDoc(detailsRef, {
      malID: updates.malID,
      ...(updates.description ? { description: updates.description } : {}),
      ...(updates.opinion ? { opinion: updates.opinion } : {}),
      ...(updates.trivia ? { trivia: updates.trivia } : {}),
    });

    const newAnime: import('./anime.model').Anime = {
      id: title,
      name: name.trim(),
      title,
      coverURL: updates.coverURL ?? '',
      status: updates.status,
      progress: updates.progress,
      rating: updates.rating,
      startDate: updates.startDate,
      releaseYear: updates.releaseYear,
    };
    this.listSignal.update(list => [newAnime, ...list]);
    writeListToStorage(LIST_STORAGE_KEY, this.listSignal());
    return title;
  }

  async uploadCover(title: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, `anime/${title}/${file.name}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  }

  async updateAnime(
    anime: Pick<Anime, 'id' | 'title'>,
    updates: AnimeUpdates
  ): Promise<void> {
    const mainRef = doc(this.db, COLLECTION_ID, anime.id);
    const detailsRef = doc(this.db, COLLECTION_ID, anime.id, 'Details', 'Details');
    const trimmedEndDate = trimField(updates.endDate);
    const trimmedProgress = trimField(updates.progress);
    const trimmedRating = trimField(updates.rating);
    const trimmedStartDate = trimField(updates.startDate);
    const trimmedMalId = trimField(updates.malID);
    const trimmedReleaseYear = trimField(updates.releaseYear);
    const normalizedAlternativeTitles = normalizeAlternativeTitles(updates.alternativeTitles);
    const normalizedAdditionalDates = normalizeAdditionalDates(updates.additionalDates);

    const mainUpdates: Record<string, unknown> = {
      status: updates.status,
      progress: trimmedProgress,
      rating: trimmedRating,
      startDate: trimmedStartDate,
      releaseYear: trimmedReleaseYear,
      coverURL: trimField(updates.coverURL) ?? '',
      ...(trimmedEndDate ? { endDate: trimmedEndDate } : { endDate: deleteField() }),
      ...(normalizedAlternativeTitles.length
        ? { alternativeTitles: normalizedAlternativeTitles }
        : { alternativeTitles: deleteField() }),
      ...(normalizedAdditionalDates.length
        ? { additionalDates: normalizedAdditionalDates }
        : { additionalDates: deleteField() }),
    };

    const trimmedDescription = trimField(updates.description);
    const trimmedOpinion = trimField(updates.opinion);
    const trimmedTrivia = trimField(updates.trivia);

    await Promise.all([
      updateDoc(mainRef, mainUpdates),
      updateDoc(detailsRef, {
        malID: trimmedMalId,
        ...(trimmedDescription ? { description: trimmedDescription } : { description: deleteField() }),
        ...(trimmedOpinion ? { opinion: trimmedOpinion } : { opinion: deleteField() }),
        ...(trimmedTrivia ? { trivia: trimmedTrivia } : { trivia: deleteField() }),
      }),
    ]);

    this.listSignal.update(list =>
      list.map(item => {
        if (item.id !== anime.id) return item;

        const { endDate: _removedEndDate, additionalDates: _removedAdditionalDates, alternativeTitles: _removedAltTitles, ...rest } = item;
        return {
          ...rest,
          status: updates.status,
          progress: trimmedProgress,
          rating: trimmedRating,
          startDate: trimmedStartDate,
          releaseYear: trimmedReleaseYear,
          coverURL: trimField(updates.coverURL) ?? '',
          ...(trimmedEndDate ? { endDate: trimmedEndDate } : {}),
          ...(normalizedAlternativeTitles.length ? { alternativeTitles: normalizedAlternativeTitles } : {}),
          ...(normalizedAdditionalDates.length ? { additionalDates: normalizedAdditionalDates } : {}),
        };
      })
    );
    writeListToStorage(LIST_STORAGE_KEY, this.listSignal());
  }

  /** Anime with details by title. Queries Firebase by title, then loads main doc + Details. Cached per title. */
  getAnimeWithDetailsByTitle(title: string): Signal<AnimeWithDetails | null> {
    let cached = this.detailByTitleCache.get(title);
    if (cached) return cached;

    const q = query(this.col, where('title', '==', title), limit(1));
    const stream = collectionData$<Anime>(q).pipe(
      switchMap(animeList => {
        if (animeList.length === 0) return of(null);
        const anime = animeList[0];
        const detailsRef = doc(this.db, COLLECTION_ID, anime.id, 'Details', 'Details');
        return docData$<AnimeDetail>(detailsRef).pipe(
          map(details => ({ ...anime, details }))
        );
      })
    );

    const sig = signal<AnimeWithDetails | null>(null);
    stream.subscribe(value => sig.set(value));
    this.detailByTitleCache.set(title, sig);
    return sig;
  }

  private async fetchList(): Promise<void> {
    this.listLoading.set(true);
    try {
      const data = await firstValueFrom(collectionDataOnce$<Anime>(this.col));
      this.listSignal.set(data);
      writeListToStorage(LIST_STORAGE_KEY, data);
    } finally {
      this.listLoading.set(false);
    }
  }
}
