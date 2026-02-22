import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimeService } from '../anime.service';

@Component({
  selector: 'app-anime-list',
  imports: [RouterLink],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {
  protected readonly animeService = inject(AnimeService);
}
