import { Component, computed, inject } from '@angular/core';
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

  /** Games sorted by newest date (last played) descending; unknown dates last. */
  protected readonly sortedGames = computed(() => {
    const list = this.gamesService.list();
    return [...list].sort((a: Game, b: Game) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });
}
