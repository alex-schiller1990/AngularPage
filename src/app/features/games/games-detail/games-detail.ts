import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth/auth.service';
import { AdditionalDate } from '../../../core/additional-date.model';
import { GamesService, GameUpdates } from '../games.service';
import { Game } from '../game.model';
import { OpenCriticService } from '../opencritic.service';
import {
  getRatingBadgeClasses as getSharedRatingBadgeClasses,
  getStatusBadgeClasses as getSharedStatusBadgeClasses,
  isPerfectRating as isSharedPerfectRating
} from '../../../shared/badge-styles.utils';
import { RichEditorComponent } from '../../../shared/rich-editor/rich-editor';
import { MigrateLegacyTriviaPipe } from '../../../shared/migrate-legacy-trivia.pipe';

@Component({
  selector: 'app-games-detail',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, RichEditorComponent, MigrateLegacyTriviaPipe],
  templateUrl: './games-detail.html',
  styleUrl: './games-detail.css',
  standalone: true
})
export class GamesDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GamesService);
  private readonly openCriticService = inject(OpenCriticService);

  protected readonly auth = inject(AuthService);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draft = signal<GameUpdates | null>(null);
  protected readonly statusOptions: Game['status'][] = ['playing', 'completed', 'dropped', 'on-hold', 'played'];

  // Frozen initial values passed to <app-rich-editor [value]>.
  // Set once when editing starts and never changed — binding [value] to a
  // live signal would cause the editor component to recreate on every keystroke.
  protected initialDescription = '';
  protected initialOpinion = '';
  protected initialTrivia = '';

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the game title (e.g. /games/abc → title 'abc'). */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly gameSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.gamesService.getGameWithDetailsByTitle(title) : null;
  });

  /** Flattened game with details for the current route id. */
  protected readonly game = computed(() => this.gameSignal()?.() ?? null);

  private readonly openCriticId = computed(() => this.game()?.details.openCriticID?.trim() ?? null);

  private readonly openCriticCache = computed(() => {
    const id = this.openCriticId();
    return id ? this.openCriticService.getByGameId(id) : null;
  });

  constructor() {
    effect(() => {
      const id = this.openCriticId();
      if (id) {
        this.openCriticService.load(id);
      }
    });

    effect(() => {
      this.titleParam();
      this.cancelEdit();
    });
  }

  protected readonly openCritic = computed(() => this.openCriticCache()?.data() ?? null);
  protected readonly openCriticLoading = computed(() => this.openCriticCache()?.loading() ?? false);
  protected readonly openCriticError = computed(() => this.openCriticCache()?.error() ?? null);

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
    const game = this.game();
    if (!game) return;

    this.draft.set({
      status: this.resolveDraftStatus(game.status),
      progress: game.progress ?? '',
      rating: game.rating ?? '',
      startDate: game.startDate ?? '',
      endDate: game.endDate ?? '',
      platform: game.platform ?? '',
      releaseYear: game.releaseYear ?? '',
      alternativeTitles: [...(game.alternativeTitles ?? [])],
      additionalDates: (game.additionalDates ?? []).map(date => ({
        dateComment: date.dateComment ?? '',
        startDate: date.startDate ?? '',
        endDate: date.endDate ?? '',
      })),
      openCriticID: game.details.openCriticID ?? '',
      openCriticURL: game.details.openCriticURL ?? '',
      description: game.details.description ?? '',
      opinion: game.details.opinion ?? '',
      trivia: game.details.trivia ?? '',
    });
    this.initialDescription = game.details.description ?? '';
    this.initialOpinion = game.details.opinion ?? '';
    this.initialTrivia = game.details.trivia ?? '';
    this.editing.set(true);
  }

  private resolveDraftStatus(status: string | null | undefined): Game['status'] {
    const normalized = (status ?? '')
      .trim()
      .toLowerCase()
      .replaceAll('_', '-')
      .replaceAll(' ', '-');

    return this.statusOptions.includes(normalized as Game['status'])
      ? (normalized as Game['status'])
      : 'playing';
  }

  protected cancelEdit(): void {
    this.draft.set(null);
    this.editing.set(false);
    this.saving.set(false);
  }

  protected updateDraftField<K extends keyof GameUpdates>(
    key: K,
    value: GameUpdates[K]
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
    const game = this.game();
    const draft = this.draft();
    if (!game || !draft || this.saving()) return;

    this.saving.set(true);
    try {
      await this.gamesService.updateGame(
        { id: game.id, title: game.title },
        draft
      );
      this.cancelEdit();
    } finally {
      this.saving.set(false);
    }
  }
}
