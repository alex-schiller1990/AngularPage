import { Injectable } from '@angular/core';
import { getFirestore, collection, doc} from 'firebase/firestore';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import { Anime } from './anime.model';
import { initializeApp } from 'firebase/app';
import {environment} from '../../../environments/environment';
import {AnimeDetail} from './anime-detail.model';
import { collectionData$, docData$ } from '../../core/firestore.utils';

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly app = initializeApp(environment.firebase);
  private readonly db = getFirestore(this.app);

  getAll(): Observable<Anime[]> {
    const col = collection(this.db, 'Anime');
    return collectionData$<Anime>(col);
  }

  getByIdWithDetails(animeId: string): Observable<Anime & { details: AnimeDetail }> {
    const mainDocRef = doc(this.db, 'Anime', animeId);
    const detailsRef = doc(this.db, 'Anime', animeId, 'Details', 'Details');

    return combineLatest([
      docData$<Anime>(mainDocRef),
      docData$<AnimeDetail>(detailsRef)
    ]).pipe(
      map(([anime, details]) => ({
        ...anime,
        details
      }))
    );
  }
}
