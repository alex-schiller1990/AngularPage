import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home')
        .then(m => m.Home),
  },
  {
    path: 'anime',
    loadComponent: () =>
      import('./features/anime/anime-list/anime-list')
        .then(m => m.AnimeList),
  },
  {
    path: 'anime/:id',
    loadComponent: () =>
      import('./features/anime/anime-detail/anime-detail')
        .then(m => m.AnimeDetail),
  },
  {
    path: 'games',
    loadComponent: () =>
      import('./features/games/games-list/games-list')
        .then(m => m.GamesList),
  },
  {
    path: 'games/:id',
    loadComponent: () =>
      import('./features/games/games-detail/games-detail')
        .then(m => m.GamesDetail),
  },
  {
    path: '**',
    redirectTo: '',
  }
];
