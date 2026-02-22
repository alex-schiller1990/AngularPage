import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { GamesService } from '../games.service';

@Component({
  selector: 'app-games-detail',
  imports: [MatCardModule],
  templateUrl: './games-detail.html',
  styleUrl: './games-detail.css',
  standalone: true
})
export class GamesDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GamesService);

  private readonly paramMap = toSignal(this.route.paramMap);
  /** URL param is the game title (e.g. /games/abc → title 'abc'). */
  private readonly titleParam = computed(() => this.paramMap()?.get('id') ?? null);
  private readonly gameSignal = computed(() => {
    const title = this.titleParam();
    return typeof title === 'string' ? this.gamesService.getGameWithDetailsByTitle(title) : null;
  });

  /** Flattened game with details for the current route id. */
  protected readonly game = computed(() => this.gameSignal()?.() ?? null);
}
