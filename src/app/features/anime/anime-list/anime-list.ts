import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {AnimeService} from '../anime.service';

@Component({
  selector: 'app-anime-list',
  imports: [AsyncPipe],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {

  private readonly animeService = inject(AnimeService);
  anime$ = this.animeService.getAll();
}
