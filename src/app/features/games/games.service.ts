import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, deleteField, doc, Firestore, limit, query, updateDoc, where } from '@angular/fire/firestore';
import { firstValueFrom, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { collectionData$, collectionDataOnce$, docData$ } from '../../core/firestore.utils';
import {
  readListFromStorage,
  removeListFromStorage,
  writeListToStorage,
} from '../../core/list-storage.utils';
import { AdditionalDate } from '../../core/additional-date.model';
import { trimField, normalizeAlternativeTitles, normalizeAdditionalDates } from '../../core/update-doc.utils';
import { Game } from './game.model';
import { GameDetail, GameWithDetails } from './game-detail.model';

export interface GameUpdates {
  status: Game['status'];
  progress: string;
  rating: string;
  startDate: string;
  endDate: string;
  platform: string;
  additionalDates: AdditionalDate[];
  releaseYear: string;
  alternativeTitles: string[];
  openCriticID: string;
  openCriticURL: string;
  description: string;
  opinion: string;
  trivia: string;
}

const COLLECTION_ID = 'Games';
const LIST_STORAGE_KEY = 'angular-page.games.list';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly db = inject(Firestore);
  private readonly col = collection(this.db, COLLECTION_ID);

  private readonly listSignal = signal<Game[]>([]);

  /** List of all games. Hydrated from localStorage when fresh; refetched after 2 weeks or on manual refresh. */
  readonly list = this.listSignal.asReadonly();
  readonly listLoading = signal(false);

  private readonly detailByTitleCache = new Map<string, Signal<GameWithDetails | null>>();

  constructor() {
    const cached = readListFromStorage<Game>(LIST_STORAGE_KEY);
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

  async updateGame(
    game: Pick<Game, 'id' | 'title'>,
    updates: GameUpdates
  ): Promise<void> {
    const mainRef = doc(this.db, COLLECTION_ID, game.id);
    const detailsRef = doc(this.db, COLLECTION_ID, game.id, 'Details', 'Details');
    const trimmedEndDate = trimField(updates.endDate);
    const trimmedProgress = trimField(updates.progress);
    const trimmedRating = trimField(updates.rating);
    const trimmedStartDate = trimField(updates.startDate);
    const trimmedPlatform = trimField(updates.platform);
    const trimmedReleaseYear = trimField(updates.releaseYear);
    const trimmedOpenCriticID = trimField(updates.openCriticID);
    const trimmedOpenCriticURL = trimField(updates.openCriticURL);
    const normalizedAlternativeTitles = normalizeAlternativeTitles(updates.alternativeTitles);
    const normalizedAdditionalDates = normalizeAdditionalDates(updates.additionalDates);

    const mainUpdates: Record<string, unknown> = {
      status: updates.status,
      progress: trimmedProgress,
      rating: trimmedRating,
      startDate: trimmedStartDate,
      releaseYear: trimmedReleaseYear,
      platform: trimmedPlatform,
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
        ...(trimmedOpenCriticID ? { openCriticID: trimmedOpenCriticID } : { openCriticID: deleteField() }),
        ...(trimmedOpenCriticURL ? { openCriticURL: trimmedOpenCriticURL } : { openCriticURL: deleteField() }),
        ...(trimmedDescription ? { description: trimmedDescription } : { description: deleteField() }),
        ...(trimmedOpinion ? { opinion: trimmedOpinion } : { opinion: deleteField() }),
        ...(trimmedTrivia ? { trivia: trimmedTrivia } : { trivia: deleteField() }),
      }),
    ]);

    this.listSignal.update(list =>
      list.map(item => {
        if (item.id !== game.id) return item;

        const { endDate: _removedEndDate, additionalDates: _removedAdditionalDates, alternativeTitles: _removedAltTitles, ...rest } = item;
        return {
          ...rest,
          status: updates.status,
          progress: trimmedProgress,
          rating: trimmedRating,
          startDate: trimmedStartDate,
          releaseYear: trimmedReleaseYear,
          platform: trimmedPlatform,
          ...(trimmedEndDate ? { endDate: trimmedEndDate } : {}),
          ...(normalizedAlternativeTitles.length ? { alternativeTitles: normalizedAlternativeTitles } : {}),
          ...(normalizedAdditionalDates.length ? { additionalDates: normalizedAdditionalDates } : {}),
        };
      })
    );
    writeListToStorage(LIST_STORAGE_KEY, this.listSignal());
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
