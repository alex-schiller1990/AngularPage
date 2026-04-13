import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { AnimeService } from '../anime.service';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  getRatingBadgeClasses as getSharedRatingBadgeClasses,
  getStatusBadgeClasses as getSharedStatusBadgeClasses,
  isPerfectRating as isSharedPerfectRating
} from '../../../shared/badge-styles.utils';

@Component({
  selector: 'app-anime-detail',
  imports: [MatCardModule],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
  standalone: true
})
export class AnimeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly animeService = inject(AnimeService);

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the anime title (e.g. /anime/abc → title 'abc'). */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly animeSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.animeService.getAnimeWithDetailsByTitle(title) : null;
  });

  /** Flattened anime with details for the current route id. */
  protected readonly anime = computed(() => this.animeSignal()?.() ?? null);

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
}
