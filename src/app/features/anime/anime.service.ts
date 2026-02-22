import { Injectable, signal, Signal } from '@angular/core';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
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

  private readonly detailCache = new Map<string, Signal<AnimeWithDetails>>();

  /** Anime with details by id. Cached per document ID; one listener per id. */
  getAnimeWithDetails(animeId: string): Signal<AnimeWithDetails> {
    let cached = this.detailCache.get(animeId);
    if (cached) return cached;

    const mainDocRef = doc(this.db, 'Anime', animeId);
    const detailsRef = doc(this.db, 'Anime', animeId, 'Details', 'Details');

    const stream = combineLatest([
      docData$<Anime>(mainDocRef),
      docData$<AnimeDetail>(detailsRef),
    ]).pipe(
      map(([anime, details]) => ({ ...anime, details }))
    );

    const sig = signal<AnimeWithDetails>(null);
    stream.subscribe(value => sig.set(value));
    this.detailCache.set(animeId, sig);
    return sig;
  }
}
