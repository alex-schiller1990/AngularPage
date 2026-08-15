import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
  private coverUploadInput: HTMLInputElement | null = null;
  private readonly allowedCoverMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/bmp',
    'image/svg+xml',
  ]);
  private readonly allowedCoverExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'];
  protected readonly router = inject(Router);
  private readonly gamesService = inject(GamesService);
  private readonly openCriticService = inject(OpenCriticService);

  protected readonly auth = inject(AuthService);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploadingCover = signal(false);
  protected readonly draft = signal<GameUpdates | null>(null);
  /** True when we arrived via /games/new — no existing document yet. */
  protected readonly isNew = signal(false);
  /** The name field for a new game (not part of GameUpdates). */
  protected readonly newName = signal('');
  protected readonly coverPreviewUrl = signal('');
  protected readonly selectedCoverFileName = signal('');
  /** Holds a save error message to display in the template (new mode only). */
  protected readonly saveError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly statusOptions: Game['status'][] = ['playing', 'completed', 'dropped', 'on-hold', 'played'];

  // Frozen initial values passed to <app-rich-editor [value]>.
  // Set once when editing starts and never changed — binding [value] to a
  // live signal would cause the editor component to recreate on every keystroke.
  protected initialDescription = '';
  protected initialOpinion = '';
  protected initialTrivia = '';

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the game title (e.g. /games/abc → title 'abc'). Null for /games/new. */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly gameSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.gamesService.getGameWithDetailsByTitle(title) : null;
  });

  /** Flattened game with details for the current route id. */
  protected readonly game = computed(() => this.gameSignal()?.() ?? null);

  /**
   * Returns the real game when loaded, or an empty shell in new mode so the
   * full detail template can render without a separate `@if` block.
   */
  protected readonly displayGame = computed(() => {
    const preview = this.coverPreviewUrl();
    const g = this.game();
    if (g) {
      return preview ? { ...g, coverURL: preview } : g;
    }
    if (this.isNew()) {
      return {
        id: '',
        name: '',
        title: '',
        coverURL: preview,
        status: 'playing' as Game['status'],
        progress: '',
        startDate: '',
        rating: '',
        releaseYear: '',
        platform: '',
        details: { id: '', description: '', opinion: '', trivia: '', openCriticID: '', openCriticURL: '' },
      };
    }
    return null;
  });

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
      const title = this.titleParam();
      // /games/new has no :id param → title is null
      if (title === null) {
        this.isNew.set(true);
        this.startNewEdit();
      } else {
        this.isNew.set(false);
        this.cancelEdit();
      }
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

  protected startNewEdit(): void {
    this.newName.set('');
    this.coverPreviewUrl.set('');
    this.selectedCoverFileName.set('');
    this.uploadError.set(null);
    this.draft.set({
      status: 'playing',
      progress: '',
      rating: '',
      startDate: '',
      endDate: '',
      platform: '',
      releaseYear: '',
      alternativeTitles: [],
      additionalDates: [],
      openCriticID: '',
      openCriticURL: '',
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
    this.uploadingCover.set(false);
    this.selectedCoverFileName.set('');
    this.uploadError.set(null);
    this.coverPreviewUrl.set(this.game()?.coverURL ?? '');
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

  protected onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.coverUploadInput = input;
    const file = input.files?.[0] ?? null;
    this.selectedCoverFileName.set(file?.name ?? '');
    this.uploadError.set(null);
    if (!file) {
      return;
    }

    const lowerCaseName = file.name.toLowerCase();
    const hasAllowedMimeType = !file.type || this.allowedCoverMimeTypes.has(file.type);
    const hasAllowedExtension = this.allowedCoverExtensions.some(extension => lowerCaseName.endsWith(extension));
    if (!hasAllowedMimeType || !hasAllowedExtension) {
      this.selectedCoverFileName.set('');
      this.uploadError.set('Please select a supported image file.');
      input.value = '';
    }
  }

  protected canUploadCover(): boolean {
    if (this.uploadingCover() || this.saving()) {
      return false;
    }

    if (!this.selectedCoverFileName()) {
      return false;
    }

    return this.isNew() ? !!this.newName().trim() : !!this.game();
  }

  protected async uploadCover(): Promise<void> {
    if (!this.canUploadCover()) {
      return;
    }

    const input = this.coverUploadInput;
    const file = input?.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const uploadTitle = this.isNew()
      ? encodeURIComponent(this.newName().trim())
      : this.game()?.title ?? '';
    if (!uploadTitle) {
      return;
    }

    this.uploadingCover.set(true);
    this.uploadError.set(null);
    try {
      const coverURL = await this.gamesService.uploadCover(uploadTitle, file);
      this.coverPreviewUrl.set(coverURL);
      this.selectedCoverFileName.set(file.name);
    } catch (err) {
      this.uploadError.set(err instanceof Error ? err.message : 'Failed to upload cover image.');
    } finally {
      this.uploadingCover.set(false);
    }
  }

  protected async saveEdit(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      if (this.isNew()) {
        try {
          const title = await this.gamesService.createGame(this.newName(), {
            ...draft,
            coverURL: this.coverPreviewUrl(),
          });
          this.cancelEdit();
          await this.router.navigate(['/games', title]);
        } catch (err) {
          this.saveError.set(err instanceof Error ? err.message : 'Failed to create game.');
        }
      } else {
        const game = this.game();
        if (!game) return;
        await this.gamesService.updateGame(
          { id: game.id, title: game.title },
          draft
        );
        this.cancelEdit();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
