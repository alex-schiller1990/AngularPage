import { inject, Injectable, signal, Signal } from '@angular/core';
import { collection, doc, Firestore, limit, query, where } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Anime } from './anime.model';
import { AnimeDetail, AnimeWithDetails } from './anime-detail.model';
import { collectionData$, docData$ } from '../../core/firestore.utils';
import { toSignal } from '@angular/core/rxjs-interop';

const COLLECTION_ID = 'Anime';

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly db = inject(Firestore);
  private readonly col = collection(this.db, COLLECTION_ID);

  /** List of all anime. Cached in-memory; single Firestore listener. */
  readonly list = toSignal(collectionData$<Anime>(this.col), { initialValue: [] as Anime[] });

  private readonly detailByTitleCache = new Map<string, Signal<AnimeWithDetails | null>>();

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
}
