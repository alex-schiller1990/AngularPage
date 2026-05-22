import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  getDocs,
  onSnapshot,
  Query,
} from '@angular/fire/firestore';

export function docData$<T>(ref: DocumentReference): Observable<T> {
  return new Observable<T>(subscriber => {
    const unsubscribe = onSnapshot(
      ref,
      snapshot => {
        if (!snapshot.exists()) {
          subscriber.error('Document does not exist');
          return;
        }

        subscriber.next(snapshot.data() as T);
      },
      error => subscriber.error(error)
    );

    return unsubscribe;
  });
}

export function collectionDataOnce$<T>(
  ref: CollectionReference<DocumentData> | Query<DocumentData>
): Observable<T[]> {
  return from(getDocs(ref)).pipe(
    map(snapshot =>
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]
    )
  );
}

export function collectionData$<T>(
  ref: CollectionReference<DocumentData> | Query<DocumentData>
): Observable<T[]> {
  return new Observable<T[]>(subscriber => {
    const unsubscribe = onSnapshot(
      ref,
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        subscriber.next(data);
      },
      error => subscriber.error(error)
    );

    return unsubscribe;
  });
}