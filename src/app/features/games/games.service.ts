import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, doc, Firestore, limit, query, where } from '@angular/fire/firestore';
import { firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { collectionData$, collectionDataOnce$, docData$ } from '../../core/firestore.utils';
import {
  readListFromStorage,
  removeListFromStorage,
  writeListToStorage,
} from '../../core/list-storage.utils';
import { Game } from './game.model';
import { GameDetail, GameWithDetails } from './game-detail.model';

const COLLECTION_ID = 'Games';
const LIST_STORAGE_KEY = 'angular-page.games.list';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly db = inject(Firestore);
  private readonly col = collection(this.db, COLLECTION_ID);

  private readonly listSignal = signal<Game[]>([]);

  /** List of all games. Hydrated from localStorage when available; otherwise fetched once from Firestore. */
  readonly list = this.listSignal.asReadonly();
  readonly listLoading = signal(false);

  private readonly detailByTitleCache = new Map<string, Signal<GameWithDetails | null>>();

  constructor() {
    const cached = readListFromStorage<Game>(LIST_STORAGE_KEY);
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

  /** Game with details by title. Queries Firebase by title, then loads main doc + Details. Cached per title. */
  getGameWithDetailsByTitle(title: string): Signal<GameWithDetails | null> {
    let cached = this.detailByTitleCache.get(title);
    if (cached) return cached;

    const q = query(this.col, where('title', '==', title), limit(1));
    const stream = collectionData$<Game>(q).pipe(
      switchMap(gameList => {
        if (gameList.length === 0) return of(null);
        const game = gameList[0];
        const detailsRef = doc(this.db, COLLECTION_ID, game.id, 'Details', 'Details');
        return docData$<GameDetail>(detailsRef).pipe(
          map(details => ({ ...game, details }))
        );
      })
    );

    const sig = signal<GameWithDetails | null>(null);
    stream.subscribe(value => sig.set(value));
    this.detailByTitleCache.set(title, sig);
    return sig;
  }

  private async fetchList(): Promise<void> {
    this.listLoading.set(true);
    try {
      const data = await firstValueFrom(collectionDataOnce$<Game>(this.col));
      this.listSignal.set(data);
      writeListToStorage(LIST_STORAGE_KEY, data);
    } finally {
      this.listLoading.set(false);
    }
  }
}
