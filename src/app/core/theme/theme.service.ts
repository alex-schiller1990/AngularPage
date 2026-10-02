import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal<boolean>(this.resolveInitialDark());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.applyClass(this._isDark());
  }

  toggle(): void {
    const next = !this._isDark();
    this._isDark.set(next);
    this.applyClass(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  private resolveInitialDark(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored !== null) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
