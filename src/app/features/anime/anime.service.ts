import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, doc, Firestore, limit, query, where } from '@angular/fire/firestore';
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

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly db = inject(Firestore);
  private readonly col = collection(this.db, COLLECTION_ID);

  private readonly listSignal = signal<Anime[]>([]);

  /** List of all anime. Hydrated from localStorage when available; otherwise fetched once from Firestore. */
  readonly list = this.listSignal.asReadonly();
  readonly listLoading = signal(false);

  private readonly detailByTitleCache = new Map<string, Signal<AnimeWithDetails | null>>();

  constructor() {
    const cached = readListFromStorage<Anime>(LIST_STORAGE_KEY);
    if (cached) {
      this.listSignal.set(cached);
    } else {
      void this.fetchList();
    }
  }

  /** Clears persisted list cache and fetches a fresh list from Firestore. */
  refreshList(): void {
    removeListFromStorage(LIST_STORAGE_KEY);
    void this.fetchList();
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
