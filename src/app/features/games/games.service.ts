import { Injectable, signal, Signal } from '@angular/core';
import { getFirestore, collection, doc, query, where, limit } from 'firebase/firestore';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { collectionData$, docData$ } from '../../core/firestore.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { Game } from './game.model';
import { GameDetail, GameWithDetails } from './game-detail.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly app = initializeApp(environment.firebase);
  private readonly db = getFirestore(this.app);
  private readonly col = collection(this.db, 'Games');

  /** List of all games. Cached in-memory; single Firestore listener. */
  readonly list = toSignal(collectionData$<Game>(this.col), { initialValue: [] as Game[] });

  private readonly detailByTitleCache = new Map<string, Signal<GameWithDetails>>();

  /** Game with details by title. Queries Firebase by title, then loads main doc + Details. Cached per title. */
  getGameWithDetailsByTitle(title: string): Signal<GameWithDetails> {
    let cached = this.detailByTitleCache.get(title);
    if (cached) return cached;

    const q = query(this.col, where('title', '==', title), limit(1));
    const stream = collectionData$<Game>(q).pipe(
      switchMap(gameList => {
        if (gameList.length === 0) return of(null);
        const game = gameList[0];
        const detailsRef = doc(this.db, 'Games', game.id, 'Details', 'Details');
        return docData$<GameDetail>(detailsRef).pipe(
          map(details => ({ ...game, details }))
        );
      })
    );

    const sig = signal<GameWithDetails>(null);
    stream.subscribe(value => sig.set(value));
    this.detailByTitleCache.set(title, sig);
    return sig;
  }
}
