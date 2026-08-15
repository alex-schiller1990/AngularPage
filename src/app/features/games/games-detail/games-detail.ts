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
  formatStatusLabel,
  getRatingBadgeClasses as getSharedRatingBadgeClasses,
  getStatusBadgeClasses as getSharedStatusBadgeClasses,
  isPerfectRating as isSharedPerfectRating,
  resolveDraftStatus,
} from '../../../shared/badge-styles.utils';
import {
  addAdditionalDate,
  addAlternativeTitle,
  applyDraftMutation,
  removeAdditionalDate,
  removeAlternativeTitle,
  updateAdditionalDateField,
  updateAlternativeTitle,
} from '../../../shared/detail-draft.utils';
import { CoverUploadState } from '../../../shared/cover-upload.state';
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
  protected readonly router = inject(Router);
  private readonly gamesService = inject(GamesService);
  private readonly openCriticService = inject(OpenCriticService);

  protected readonly auth = inject(AuthService);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draft = signal<GameUpdates | null>(null);
  /** True when we arrived via /games/new — no existing document yet. */
  protected readonly isNew = signal(false);
  /** The name field for a new game (not part of GameUpdates). */
  protected readonly newName = signal('');
  /** Holds a save error message to display in the template (new mode only). */
  protected readonly saveError = signal<string | null>(null);
  protected readonly statusOptions: readonly Game['status'][] = ['playing', 'completed', 'dropped', 'on-hold', 'played'];

  protected readonly coverUpload = new CoverUploadState(
    (title, file) => this.gamesService.uploadCover(title, file)
  );

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
    const preview = this.coverUpload.previewUrl();
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
    return formatStatusLabel(status);
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

  // --- Cover upload (delegated to CoverUploadState) ---

  protected get uploadingCover() { return this.coverUpload.uploading; }
  protected get selectedCoverFileName() { return this.coverUpload.selectedFileName; }
  protected get uploadError() { return this.coverUpload.error; }

  protected onCoverFileSelected(event: Event): void {
    this.coverUpload.onFileSelected(event);
  }

  protected canUploadCover(): boolean {
    const readyCondition = this.isNew() ? !!this.newName().trim() : !!this.game();
    return !this.saving() && this.coverUpload.canUpload(readyCondition);
  }

  protected async uploadCover(): Promise<void> {
    if (!this.canUploadCover()) return;
    const title = this.isNew()
      ? encodeURIComponent(this.newName().trim())
      : this.game()?.title ?? '';
    await this.coverUpload.upload(title);
  }

  // --- Edit lifecycle ---

  protected startNewEdit(): void {
    this.newName.set('');
    this.coverUpload.reset();
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

    this.coverUpload.reset(game.coverURL ?? '');
    this.draft.set({
      status: resolveDraftStatus(game.status, this.statusOptions, 'playing'),
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

  protected cancelEdit(): void {
    this.draft.set(null);
    this.editing.set(false);
    this.saving.set(false);
    this.coverUpload.reset(this.game()?.coverURL ?? '');
  }

  // --- Draft field mutations ---

  protected updateDraftField<K extends keyof GameUpdates>(key: K, value: GameUpdates[K]): void {
    this.draft.update(current => (current ? { ...current, [key]: value } : current));
  }

  protected addAlternativeTitle(): void {
    this.draft.update(applyDraftMutation(addAlternativeTitle));
  }

  protected removeAlternativeTitle(index: number): void {
    this.draft.update(applyDraftMutation(d => removeAlternativeTitle(d, index)));
  }

  protected updateAlternativeTitle(index: number, value: string): void {
    this.draft.update(applyDraftMutation(d => updateAlternativeTitle(d, index, value)));
  }

  protected addAdditionalDate(): void {
    this.draft.update(applyDraftMutation(addAdditionalDate));
  }

  protected removeAdditionalDate(index: number): void {
    this.draft.update(applyDraftMutation(d => removeAdditionalDate(d, index)));
  }

  protected updateAdditionalDateField(index: number, key: keyof AdditionalDate, value: string): void {
    this.draft.update(applyDraftMutation(d => updateAdditionalDateField(d, index, key, value)));
  }

  // --- Save ---

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
            coverURL: this.coverUpload.previewUrl(),
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
