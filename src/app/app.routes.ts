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
    path: 'anime/new',
    loadComponent: () =>
      import('./features/anime/anime-detail/anime-detail')
        .then(m => m.AnimeDetail),
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
    path: 'games/new',
    loadComponent: () =>
      import('./features/games/games-detail/games-detail')
        .then(m => m.GamesDetail),
  },
  {
    path: 'games/:id',
    loadComponent: () =>
      import('./features/games/games-detail/games-detail')
        .then(m => m.GamesDetail),
  },
  {
    path: 'aoty/new',
    data: { type: 'aoty' },
    loadComponent: () =>
      import('./features/of-the-year/of-the-year-detail/of-the-year-detail')
        .then(m => m.OfTheYearDetail),
  },
  {
    path: 'aoty/:year',
    data: { type: 'aoty' },
    loadComponent: () =>
      import('./features/of-the-year/of-the-year-detail/of-the-year-detail')
        .then(m => m.OfTheYearDetail),
  },
  {
    path: 'goty/new',
    data: { type: 'goty' },
    loadComponent: () =>
      import('./features/of-the-year/of-the-year-detail/of-the-year-detail')
        .then(m => m.OfTheYearDetail),
  },
  {
    path: 'goty/:year',
    data: { type: 'goty' },
    loadComponent: () =>
      import('./features/of-the-year/of-the-year-detail/of-the-year-detail')
        .then(m => m.OfTheYearDetail),
  },
  {
    path: '**',
    redirectTo: '',
  }
];
