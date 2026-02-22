import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getNewestDateTimestamp } from '../../../core/date-sort.utils';
import { AnimeService } from '../anime.service';
import { Anime } from '../anime.model';

@Component({
  selector: 'app-anime-list',
  imports: [RouterLink],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {
  protected readonly animeService = inject(AnimeService);

  /** Anime sorted by newest date (last watched) descending; unknown dates last. */
  protected readonly sortedAnime = computed(() => {
    const list = this.animeService.list();
    return [...list].sort((a: Anime, b: Anime) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });
}
