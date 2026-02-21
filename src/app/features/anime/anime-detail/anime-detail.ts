import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {AnimeService} from '../anime.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';

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

  readonly anime = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => !!id),
      switchMap(id => this.animeService.getByIdWithDetails(id))
    ),
    { initialValue: null }
  );
}
