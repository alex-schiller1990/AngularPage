import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import {UserService} from '../user/user.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly userService = inject(UserService);

  user = toSignal(user(this.auth), { initialValue: null });

  async loginWithGoogle(): Promise<boolean> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    if (!result.user) return false;

    await this.userService.saveUser(result.user);
    return true;
  }

  async logout() {
    await signOut(this.auth);
  }
}
