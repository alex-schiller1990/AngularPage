import { Injectable, signal, Signal } from '@angular/core';
import { getFirestore, collection, doc, query, where, limit } from 'firebase/firestore';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Anime } from './anime.model';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { AnimeDetail, AnimeWithDetails } from './anime-detail.model';
import { collectionData$, docData$ } from '../../core/firestore.utils';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly app = initializeApp(environment.firebase);
  private readonly db = getFirestore(this.app);
  private readonly col = collection(this.db, 'Anime');

  /** List of all anime. Cached in-memory; single Firestore listener. */
  readonly list = toSignal(collectionData$<Anime>(this.col), { initialValue: [] as Anime[] });

  private readonly detailByTitleCache = new Map<string, Signal<AnimeWithDetails>>();

  /** Anime with details by title. Queries Firebase by title, then loads main doc + Details. Cached per title. */
  getAnimeWithDetailsByTitle(title: string): Signal<AnimeWithDetails> {
    let cached = this.detailByTitleCache.get(title);
    if (cached) return cached;

    const q = query(this.col, where('title', '==', title), limit(1));
    const stream = collectionData$<Anime>(q).pipe(
      switchMap(animeList => {
        if (animeList.length === 0) return of(null);
        const anime = animeList[0];
        const detailsRef = doc(this.db, 'Anime', anime.id, 'Details', 'Details');
        return docData$<AnimeDetail>(detailsRef).pipe(
          map(details => ({ ...anime, details }))
        );
      })
    );

    const sig = signal<AnimeWithDetails>(null);
    stream.subscribe(value => sig.set(value));
    this.detailByTitleCache.set(title, sig);
    return sig;
  }
}
