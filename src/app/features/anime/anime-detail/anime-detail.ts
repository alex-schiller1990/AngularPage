import {Component, effect, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {AnimeService} from '../anime.service';
import {Anime} from '../anime.model';
import {AnimeDetail as AnimeDetailModel} from '../anime-detail.model';

@Component({
  selector: 'app-anime-detail',
  imports: [CommonModule, MatCardModule],
  templateUrl: './anime-detail.html',
  styleUrl: './anime-detail.css',
  standalone: true
})
export class AnimeDetail {

  private readonly route = inject(ActivatedRoute);
  private readonly animeService = inject(AnimeService);

  anime$ = signal<Anime & { details: AnimeDetailModel } | null>(null);

  private readonly animeEffect = effect(() => {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.animeService.getByIdWithDetails(id).subscribe(anime => {
      this.anime$.set(anime);
    });
  });
}
