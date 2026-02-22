import { Component, inject } from '@angular/core';
import { AnimeService } from '../anime.service';

@Component({
  selector: 'app-anime-list',
  imports: [],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {
  protected readonly animeService = inject(AnimeService);
}
