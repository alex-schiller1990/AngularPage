import { Injectable } from '@angular/core';
import { getFirestore, collection, getDocs} from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Anime } from './anime.model';
import { initializeApp } from 'firebase/app';
import {environment} from '../../../environments/environment';

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
}
