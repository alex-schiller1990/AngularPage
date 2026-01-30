import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import {UserService} from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private userService: UserService
  ) {}


  private auth = inject(Auth);

  user$ = user(this.auth);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    if (result.user) {
      await this.userService.saveUser(result.user);
    }
  }

  async logout() {
    await signOut(this.auth);
  }
}
