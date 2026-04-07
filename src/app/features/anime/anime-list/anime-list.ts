import { Component, computed, inject, signal } from '@angular/core';
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
  protected readonly searchQuery = signal('');

  /** Anime sorted by newest date (last watched) descending; unknown dates last. */
  protected readonly sortedAnime = computed(() => {
    const list = this.animeService.list();
    return [...list].sort((a: Anime, b: Anime) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });

  protected readonly filteredAnime = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.sortedAnime();

    return this.sortedAnime().filter((anime: Anime) => {
      const matchesName = anime.name.toLowerCase().includes(query);
      const matchesAlternativeTitle = anime.alternativeTitles?.some((title: string) =>
        title.toLowerCase().includes(query)
      );

      return matchesName || !!matchesAlternativeTitle;
    });
  });
}
