import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth/auth.service';
import { AnimeLeftPanelUpdates, AnimeService } from '../anime.service';
import { Anime } from '../anime.model';
import { JikanAnimeService } from '../jikan-anime.service';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  getRatingBadgeClasses as getSharedRatingBadgeClasses,
  getStatusBadgeClasses as getSharedStatusBadgeClasses,
  isPerfectRating as isSharedPerfectRating
} from '../../../shared/badge-styles.utils';

@Component({
  selector: 'app-anime-detail',
  imports: [DecimalPipe, MatButtonModule, MatCardModule],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
  standalone: true
})
export class AnimeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly animeService = inject(AnimeService);
  private readonly jikanService = inject(JikanAnimeService);

  protected readonly auth = inject(AuthService);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draft = signal<AnimeLeftPanelUpdates | null>(null);
  protected readonly statusOptions: Anime['status'][] = ['watching', 'completed', 'dropped', 'on-hold'];

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the anime title (e.g. /anime/abc → title 'abc'). */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly animeSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.animeService.getAnimeWithDetailsByTitle(title) : null;
  });

  /** Flattened anime with details for the current route id. */
  protected readonly anime = computed(() => this.animeSignal()?.() ?? null);

  private readonly malId = computed(() => this.anime()?.details.malID?.trim() ?? null);

  private readonly jikanCache = computed(() => {
    const malId = this.malId();
    return malId ? this.jikanService.getByMalId(malId) : null;
  });

  constructor() {
    effect(() => {
      const malId = this.malId();
      if (malId) {
        this.jikanService.load(malId);
      }
    });

    effect(() => {
      this.titleParam();
      this.cancelEdit();
    });
  }

  protected readonly jikanAnime = computed(() => this.jikanCache()?.data() ?? null);
  protected readonly jikanLoading = computed(() => this.jikanCache()?.loading() ?? false);
  protected readonly jikanError = computed(() => this.jikanCache()?.error() ?? null);

  protected formatStatusLabel(status: string): string {
    return status.replaceAll('-', ' ');
  }

  protected getStatusBadgeClasses(status: string): string {
    return getSharedStatusBadgeClasses(status);
  }

  protected getRatingBadgeClasses(rating: string | null | undefined): string {
    return getSharedRatingBadgeClasses(rating);
  }

  protected isPerfectRating(rating: string | null | undefined): boolean {
    return isSharedPerfectRating(rating);
  }

  protected startEdit(): void {
    const anime = this.anime();
    if (!anime) return;

    this.draft.set({
      status: this.resolveDraftStatus(anime.status),
      progress: anime.progress ?? '',
      rating: anime.rating ?? '',
      startDate: anime.startDate ?? '',
      endDate: anime.endDate ?? '',
      malID: anime.details.malID ?? '',
    });
    this.editing.set(true);
  }

  private resolveDraftStatus(status: string | null | undefined): Anime['status'] {
    const normalized = (status ?? '')
      .trim()
      .toLowerCase()
      .replaceAll('_', '-')
      .replaceAll(' ', '-');

    return this.statusOptions.includes(normalized as Anime['status'])
      ? (normalized as Anime['status'])
      : 'watching';
  }

  protected cancelEdit(): void {
    this.draft.set(null);
    this.editing.set(false);
    this.saving.set(false);
  }

  protected updateDraftField<K extends keyof AnimeLeftPanelUpdates>(
    key: K,
    value: AnimeLeftPanelUpdates[K]
  ): void {
    this.draft.update(current => (current ? { ...current, [key]: value } : current));
  }

  protected async saveEdit(): Promise<void> {
    const anime = this.anime();
    const draft = this.draft();
    if (!anime || !draft || this.saving()) return;

    this.saving.set(true);
    try {
      await this.animeService.updateAnimeLeftPanel(
        { id: anime.id, title: anime.title },
        draft
      );
      this.cancelEdit();
    } finally {
      this.saving.set(false);
    }
  }
}
