import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { AnimeService } from '../anime.service';
import { toSignal } from '@angular/core/rxjs-interop';

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
  private readonly id = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly animeSignal = computed(() => {
    const id = this.id();
    return typeof id === 'string' ? this.animeService.getAnimeWithDetails(id) : null;
  });

  /** Flattened anime with details for the current route id. */
  protected readonly anime = computed(() => this.animeSignal()?.() ?? null);
}
