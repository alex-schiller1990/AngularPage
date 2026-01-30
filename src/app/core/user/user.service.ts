import { inject, Injectable } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { AppUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);

  async saveUser(user: User) {
    const ref = doc(this.firestore, `users/${user.uid}`);

    const data: AppUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date(),
    };

    await setDoc(ref, data, { merge: true });
  }
}
