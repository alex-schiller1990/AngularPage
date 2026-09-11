import { inject, Injectable, signal, Signal } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  Firestore,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { OfTheYearIndex, OfTheYearReview } from './of-the-year.model';
import { collectionData$, docData$ } from '../../core/firestore.utils';

const COLLECTION_ID = 'OfTheYear';
const INDEX_DOC: Record<'aoty' | 'goty', string> = {
  aoty: '_index_aoty',
  goty: '_index_goty',
};

@Injectable({ providedIn: 'root' })
export class OfTheYearService {
  private readonly db = inject(Firestore);
  private readonly col = collection(this.db, COLLECTION_ID);

  private readonly indexCache = new Map<'aoty' | 'goty', Signal<OfTheYearIndex | null>>();
  private readonly reviewCache = new Map<string, Signal<OfTheYearReview | null>>();

  /**
   * Returns a live signal of the year-index document for the given type.
   * Cached per type so only one Firestore subscription is created.
   */
  getYearIndex(type: 'aoty' | 'goty'): Signal<OfTheYearIndex | null> {
    const cached = this.indexCache.get(type);
    if (cached) return cached;

    const ref = doc(this.col, INDEX_DOC[type]);
    const sig = signal<OfTheYearIndex | null>(null);
    docData$<OfTheYearIndex>(ref).subscribe(value => sig.set(value));
    this.indexCache.set(type, sig);
    return sig;
  }

  /**
   * Returns a live signal for the single review document matching type + year.
   * Cached per `type:year` key.
   */
  getReview(type: 'aoty' | 'goty', year: string): Signal<OfTheYearReview | null> {
    const cacheKey = `${type}:${year}`;
    const cached = this.reviewCache.get(cacheKey);
    if (cached) return cached;

    const q = query(this.col, where('type', '==', type), where('year', '==', year), limit(1));
    const sig = signal<OfTheYearReview | null>(null);
    collectionData$<OfTheYearReview>(q).subscribe(docs => sig.set(docs[0] ?? null));
    this.reviewCache.set(cacheKey, sig);
    return sig;
  }

  /**
   * Overwrites the full review document (used for both create-with-known-ID and update).
   */
  async saveReview(id: string, data: Omit<OfTheYearReview, 'id'>): Promise<void> {
    const ref = doc(this.col, id);
    await setDoc(ref, data);
  }

  /**
   * Creates a new review document with an auto-generated ID and returns the new ID.
   */
  async createReview(data: Omit<OfTheYearReview, 'id'>): Promise<string> {
    const ref = await addDoc(this.col, data);
    return ref.id;
  }

  /**
   * Appends `year` to the index document's `years` array via arrayUnion.
   * When `coverUrl` is provided, also writes it to `covers.<year>` in the same call.
   */
  async updateYearIndex(
    type: 'aoty' | 'goty',
    year: string,
    coverUrl?: string
  ): Promise<void> {
    const ref = doc(this.col, INDEX_DOC[type]);
    const updates: Record<string, unknown> = {
      years: arrayUnion(year),
    };
    if (coverUrl) {
      updates[`covers.${year}`] = coverUrl;
    }
    await updateDoc(ref, updates);
  }
}
