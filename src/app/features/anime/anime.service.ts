import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, deleteField, doc, Firestore, limit, query, updateDoc, where } from '@angular/fire/firestore';
import { firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Anime } from './anime.model';
import { AnimeDetail, AnimeWithDetails } from './anime-detail.model';
import { collectionData$, collectionDataOnce$, docData$ } from '../../core/firestore.utils';
import {
  readListFromStorage,
  removeListFromStorage,
  writeListToStorage,
} from '../../core/list-storage.utils';

const COLLECTION_ID = 'Anime';
const LIST_STORAGE_KEY = 'angular-page.anime.list';

export interface AnimeLeftPanelUpdates {
  status: Anime['status'];
  progress: string;
  rating: string;
  startDate: string;
  endDate: string;
  malID: string;
}

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly db = inject(Firestore);
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

  async updateAnimeLeftPanel(
    anime: Pick<Anime, 'id' | 'title'>,
    updates: AnimeLeftPanelUpdates
  ): Promise<void> {
    const mainRef = doc(this.db, COLLECTION_ID, anime.id);
    const detailsRef = doc(this.db, COLLECTION_ID, anime.id, 'Details', 'Details');
    const trim = (value: string | null | undefined) => (value ?? '').trim();
    const trimmedEndDate = trim(updates.endDate);
    const trimmedProgress = trim(updates.progress);
    const trimmedRating = trim(updates.rating);
    const trimmedStartDate = trim(updates.startDate);
    const trimmedMalId = trim(updates.malID);

    const mainUpdates: Record<string, unknown> = {
      status: updates.status,
      progress: trimmedProgress,
      rating: trimmedRating,
      startDate: trimmedStartDate,
      ...(trimmedEndDate ? { endDate: trimmedEndDate } : { endDate: deleteField() }),
    };

    await Promise.all([
      updateDoc(mainRef, mainUpdates),
      updateDoc(detailsRef, { malID: trimmedMalId }),
    ]);

    this.listSignal.update(list =>
      list.map(item => {
        if (item.id !== anime.id) return item;

        const { endDate: _removedEndDate, ...rest } = item;
        return {
          ...rest,
          status: updates.status,
          progress: trimmedProgress,
          rating: trimmedRating,
          startDate: trimmedStartDate,
          ...(trimmedEndDate ? { endDate: trimmedEndDate } : {}),
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
