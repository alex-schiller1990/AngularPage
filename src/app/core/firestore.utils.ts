import { Observable } from 'rxjs';
import { DocumentReference, onSnapshot } from 'firebase/firestore';

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