import { Injectable } from '@angular/core';
import { getFirestore, collection, getDocs, doc, getDoc} from 'firebase/firestore';
import {from, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import { Anime } from './anime.model';
import { initializeApp } from 'firebase/app';
import {environment} from '../../../environments/environment';
import {AnimeDetail} from './anime-detail.model';

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly app = initializeApp(environment.firebase);
  private readonly db = getFirestore(this.app);

  getAll(): Observable<Anime[]> {
    const col = collection(this.db, 'Anime');
    return from(getDocs(col)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anime))
      )
    );
  }

  getByIdWithDetails(animeId: string): Observable<Anime & { details: AnimeDetail }> {
    const mainDocRef = doc(this.db, 'Anime', animeId);
    const detailsColRef = collection(mainDocRef, 'Details');

    return from(getDoc(mainDocRef)).pipe(
      switchMap(mainSnap => {
        if (!mainSnap.exists()) throw new Error('Anime not found');

        return from(getDocs(detailsColRef)).pipe(
          map(detailsSnap => {
            const detailsData = detailsSnap.docs[0]?.data() as AnimeDetail;
            return { ...mainSnap.data(), details: detailsData } as Anime & { details: AnimeDetail };
          })
        );
      })
    );
  }
}
