import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getNewestDateTimestamp } from '../../../core/date-sort.utils';
import { GamesService } from '../games.service';
import { Game } from '../game.model';

@Component({
  selector: 'app-games-list',
  imports: [RouterLink],
  templateUrl: './games-list.html',
  styleUrl: './games-list.css',
  standalone: true
})
export class GamesList {
  protected readonly gamesService = inject(GamesService);
  protected readonly searchQuery = signal('');

  /** Games sorted by newest date (last played) descending; unknown dates last. */
  protected readonly sortedGames = computed(() => {
    const list = this.gamesService.list();
    return [...list].sort((a: Game, b: Game) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });

  protected readonly filteredGames = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.sortedGames();

    return this.sortedGames().filter((game: Game) => {
      const matchesName = game.name.toLowerCase().includes(query);
      const matchesAlternativeTitle = game.alternativeTitles?.some((title: string) =>
        title.toLowerCase().includes(query)
      );

      return matchesName || !!matchesAlternativeTitle;
    });
  });
}
