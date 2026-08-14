import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth/auth.service';
import { AdditionalDate } from '../../../core/additional-date.model';
import { AnimeUpdates, AnimeService } from '../anime.service';
import { Anime } from '../anime.model';
import { JikanAnimeService } from '../jikan-anime.service';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  getRatingBadgeClasses as getSharedRatingBadgeClasses,
  getStatusBadgeClasses as getSharedStatusBadgeClasses,
  isPerfectRating as isSharedPerfectRating
} from '../../../shared/badge-styles.utils';
import { RichEditorComponent } from '../../../shared/rich-editor/rich-editor';
import { MigrateLegacyTriviaPipe } from '../../../shared/migrate-legacy-trivia.pipe';

@Component({
  selector: 'app-anime-detail',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, RichEditorComponent, MigrateLegacyTriviaPipe],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
  standalone: true
})
export class AnimeDetail {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly animeService = inject(AnimeService);
  private readonly jikanService = inject(JikanAnimeService);

  protected readonly auth = inject(AuthService);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draft = signal<AnimeUpdates | null>(null);
  /** True when we arrived via /anime/new — no existing document yet. */
  protected readonly isNew = signal(false);
  /** The name field for a new anime (not part of AnimeUpdates). */
  protected readonly newName = signal('');
  /** Holds a save error message to display in the template (new mode only). */
  protected readonly saveError = signal<string | null>(null);
  protected readonly statusOptions: Anime['status'][] = ['watching', 'completed', 'dropped', 'on-hold'];

  // Frozen initial values passed to <app-rich-editor [value]>.
  // Set once when editing starts and never changed — binding [value] to a
  // live signal would cause the editor component to recreate on every keystroke.
  protected initialDescription = '';
  protected initialOpinion = '';
  protected initialTrivia = '';

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the anime title (e.g. /anime/abc → title 'abc'). Null for /anime/new. */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly animeSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.animeService.getAnimeWithDetailsByTitle(title) : null;
  });

  /** Flattened anime with details for the current route id. */
  protected readonly anime = computed(() => this.animeSignal()?.() ?? null);

  /**
   * Returns the real anime when loaded, or an empty shell in new mode so the
   * full detail template can render without a separate `@if` block.
   */
  protected readonly displayAnime = computed(() => {
    const a = this.anime();
    if (a) return a;
    if (this.isNew()) {
      return {
        id: '',
        name: '',
        title: '',
        coverURL: '',
        status: 'watching' as Anime['status'],
        progress: '',
        startDate: '',
        rating: '',
        releaseYear: '',
        details: { description: '', opinion: '', trivia: '', malID: '' },
      };
    }
    return null;
  });

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
      const title = this.titleParam();
      // /anime/new has no :id param → title is null
      if (title === null) {
        this.isNew.set(true);
        this.startNewEdit();
      } else {
        this.isNew.set(false);
        this.cancelEdit();
      }
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

  protected startNewEdit(): void {
    this.newName.set('');
    this.draft.set({
      status: 'watching',
      progress: '',
      rating: '',
      startDate: '',
      endDate: '',
      malID: '',
      releaseYear: '',
      alternativeTitles: [],
      additionalDates: [],
      description: '',
      opinion: '',
      trivia: '',
    });
    this.initialDescription = '';
    this.initialOpinion = '';
    this.initialTrivia = '';
    this.editing.set(true);
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
      releaseYear: anime.releaseYear ?? '',
      alternativeTitles: [...(anime.alternativeTitles ?? [])],
      additionalDates: (anime.additionalDates ?? []).map(date => ({
        dateComment: date.dateComment ?? '',
        startDate: date.startDate ?? '',
        endDate: date.endDate ?? '',
      })),
      description: anime.details.description ?? '',
      opinion: anime.details.opinion ?? '',
      trivia: anime.details.trivia ?? '',
    });
    this.initialDescription = anime.details.description ?? '';
    this.initialOpinion = anime.details.opinion ?? '';
    this.initialTrivia = anime.details.trivia ?? '';
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

  protected updateDraftField<K extends keyof AnimeUpdates>(
    key: K,
    value: AnimeUpdates[K]
  ): void {
    this.draft.update(current => (current ? { ...current, [key]: value } : current));
  }

  protected addAlternativeTitle(): void {
    this.draft.update(current =>
      current
        ? { ...current, alternativeTitles: [...current.alternativeTitles, ''] }
        : current
    );
  }

  protected removeAlternativeTitle(index: number): void {
    this.draft.update(current =>
      current
        ? { ...current, alternativeTitles: current.alternativeTitles.filter((_, i) => i !== index) }
        : current
    );
  }

  protected updateAlternativeTitle(index: number, value: string): void {
    this.draft.update(current => {
      if (!current) return current;
      return {
        ...current,
        alternativeTitles: current.alternativeTitles.map((t, i) => (i === index ? value : t)),
      };
    });
  }

  protected addAdditionalDate(): void {
    this.draft.update(current =>
      current
        ? {
            ...current,
            additionalDates: [
              ...current.additionalDates,
              { dateComment: '', startDate: '', endDate: '' },
            ],
          }
        : current
    );
  }

  protected removeAdditionalDate(index: number): void {
    this.draft.update(current =>
      current
        ? {
            ...current,
            additionalDates: current.additionalDates.filter((_, i) => i !== index),
          }
        : current
    );
  }

  protected updateAdditionalDateField(
    index: number,
    key: keyof AdditionalDate,
    value: string
  ): void {
    this.draft.update(current => {
      if (!current) return current;

      return {
        ...current,
        additionalDates: current.additionalDates.map((date, i) =>
          i === index ? { ...date, [key]: value } : date
        ),
      };
    });
  }

  protected async saveEdit(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      if (this.isNew()) {
        try {
          const title = await this.animeService.createAnime(this.newName(), draft);
          await this.router.navigate(['/anime', title]);
        } catch (err) {
          this.saveError.set(err instanceof Error ? err.message : 'Failed to create anime.');
        }
      } else {
        const anime = this.anime();
        if (!anime) return;
        await this.animeService.updateAnime(
          { id: anime.id, title: anime.title },
          draft
        );
        this.cancelEdit();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
