import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'ogromm',
    loadComponent: () =>
      import('./features/home/home')
        .then(m => m.Home),
  },
  {
    path: 'anime',
    title: 'ogromm',
    loadComponent: () =>
      import('./features/anime/anime-list/anime-list')
        .then(m => m.AnimeList),
  },
  {
    path: 'anime/new',
    title: 'ogromm',
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
    title: 'ogromm',
    loadComponent: () =>
      import('./features/games/games-list/games-list')
        .then(m => m.GamesList),
  },
  {
    path: 'games/new',
    title: 'ogromm',
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
    title: 'ogromm',
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
    title: 'ogromm',
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
