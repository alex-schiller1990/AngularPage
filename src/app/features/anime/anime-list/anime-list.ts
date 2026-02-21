import {Component, inject} from '@angular/core';
import {AnimeService} from '../anime.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-anime-list',
  imports: [],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {

  private readonly animeService = inject(AnimeService);
  readonly anime = toSignal(
    this.animeService.getAll(),
    { initialValue: [] }
  );
}
