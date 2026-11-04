import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import {
  accumulateFacetCounts,
  collectYearsFromMap,
  expandYearRange,
  getCoveredYears,
  getSortedUniqueValues,
  matchesAnySelection,
  removeValueFromSet,
  toggleValueInSet
} from '../../../core/filter.utils';
import { SORT_OPTIONS, SortOption, sortItems } from '../../../core/sort.utils';
import { formatStatusLabel } from '../../../shared/badge-styles.utils';
import { FilterBarComponent } from '../../../shared/filters/filter-bar/filter-bar';
import { FilterDropdownComponent } from '../../../shared/filters/filter-dropdown/filter-dropdown';
import { toFilterOptions } from '../../../shared/filters/filter-options.utils';
import { ActiveFilterChip } from '../../../shared/filters/filter.models';
import { SortSelectComponent } from '../../../shared/filters/sort-select/sort-select';
import { ListItemCardComponent } from '../../../shared/list-item-card/list-item-card';
import { AnimeService } from '../anime.service';
import { Anime } from '../anime.model';
import { AnimeYearReview } from '../anime-year-review/anime-year-review';

@Component({
  selector: 'app-anime-list',
  imports: [
    RouterLink,
    FilterBarComponent,
    FilterDropdownComponent,
    SortSelectComponent,
    ListItemCardComponent,
    AnimeYearReview
  ],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {
  protected readonly animeService = inject(AnimeService);
  protected readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });
  protected readonly activeTab = computed(() =>
    this.queryParamMap().get('tab') === 'year-review' ? 'year-review' : 'list'
  );
  protected readonly searchQuery = signal('');
  protected readonly selectedStatuses = signal<Set<string>>(new Set());
  protected readonly selectedRatings = signal<Set<string>>(new Set());
  protected readonly selectedReleaseYears = signal<Set<string>>(new Set());
  protected readonly selectedWatchedYears = signal<Set<string>>(new Set());
  protected readonly sortOption = signal<SortOption>('date-desc');
  protected readonly sortOptions = SORT_OPTIONS;

  /** Anime sorted by the selected sort option (default: newest date first). */
  protected readonly sortedAnime = computed(() => sortItems(this.animeService.list(), this.sortOption()));

  private readonly watchedYearsByAnimeId = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const anime of this.sortedAnime()) {
      map.set(anime.id, this.getWatchedYears(anime));
    }
    return map;
  });

  private readonly releaseYearsByAnimeId = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const anime of this.sortedAnime()) {
      map.set(anime.id, expandYearRange(anime.releaseYear));
    }
    return map;
  });

  private readonly statusOptions = computed(() =>
    getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.status))
  );
  private readonly ratingOptions = computed(() =>
    getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.rating), true)
  );
  private readonly releaseYearOptions = computed(() => collectYearsFromMap(this.releaseYearsByAnimeId()));
  private readonly watchedYearOptions = computed(() => collectYearsFromMap(this.watchedYearsByAnimeId()));

  protected readonly statusFilterOptions = computed(() =>
    toFilterOptions(
      this.statusOptions(),
      this.getFacetCounts('status'),
      this.selectedStatuses(),
      formatStatusLabel
    )
  );
  protected readonly ratingFilterOptions = computed(() =>
    toFilterOptions(this.ratingOptions(), this.getFacetCounts('rating'), this.selectedRatings())
  );
  protected readonly releaseYearFilterOptions = computed(() =>
    toFilterOptions(this.releaseYearOptions(), this.getFacetCounts('releaseYear'), this.selectedReleaseYears())
  );
  protected readonly watchedYearFilterOptions = computed(() =>
    toFilterOptions(this.watchedYearOptions(), this.getFacetCounts('watchedYear'), this.selectedWatchedYears())
  );

  protected readonly activeFilterChips = computed<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const query = this.searchQuery().trim();
    if (query) {
      chips.push({ type: 'search', value: query, label: `Search: ${query}` });
    }

    for (const status of Array.from(this.selectedStatuses()).sort((a, b) => a.localeCompare(b))) {
      chips.push({ type: 'status', value: status, label: `Status: ${formatStatusLabel(status)}` });
    }
    for (const rating of Array.from(this.selectedRatings()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'rating', value: rating, label: `Rating: ${rating}` });
    }
    for (const releaseYear of Array.from(this.selectedReleaseYears()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'releaseYear', value: releaseYear, label: `Release: ${releaseYear}` });
    }
    for (const watchedYear of Array.from(this.selectedWatchedYears()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'watchedYear', value: watchedYear, label: `Watched: ${watchedYear}` });
    }

    return chips;
  });

  protected readonly filteredAnime = computed(() => {
    return this.sortedAnime().filter((anime: Anime) => this.matchesAllFilters(anime));
  });

  protected switchTab(tab: 'list' | 'year-review'): void {
    this.router.navigate([], { queryParams: { tab } });
  }

  protected toggleStatus(value: string): void {
    this.selectedStatuses.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleRating(value: string): void {
    this.selectedRatings.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleReleaseYear(value: string): void {
    this.selectedReleaseYears.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleWatchedYear(value: string): void {
    this.selectedWatchedYears.update((selected) => toggleValueInSet(selected, value));
  }

  protected refreshList(): void {
    this.animeService.refreshList();
  }

  protected clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedStatuses.set(new Set());
    this.selectedRatings.set(new Set());
    this.selectedReleaseYears.set(new Set());
    this.selectedWatchedYears.set(new Set());
  }

  protected removeFilterChip(chip: ActiveFilterChip): void {
    if (chip.type === 'search') {
      this.searchQuery.set('');
      return;
    }

    if (chip.type === 'status') {
      this.selectedStatuses.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'rating') {
      this.selectedRatings.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'releaseYear') {
      this.selectedReleaseYears.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    this.selectedWatchedYears.update((selected) => removeValueFromSet(selected, chip.value));
  }

  private getFacetCounts(
    facet: 'status' | 'rating' | 'releaseYear' | 'watchedYear'
  ): Map<string, number> {
    const counts = new Map<string, number>();

    for (const anime of this.sortedAnime()) {
      if (!this.matchesAllFilters(anime, facet)) continue;

      if (facet === 'watchedYear') {
        accumulateFacetCounts(this.watchedYearsByAnimeId(), anime.id, counts);
        continue;
      }

      if (facet === 'releaseYear') {
        accumulateFacetCounts(this.releaseYearsByAnimeId(), anime.id, counts);
        continue;
      }

      const value = facet === 'status' ? anime.status : anime.rating;

      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (!normalized) continue;

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    return counts;
  }

  private matchesAllFilters(
    anime: Anime,
    ignoreFilter?: 'status' | 'rating' | 'releaseYear' | 'watchedYear'
  ): boolean {
    const query = this.searchQuery().trim().toLowerCase();
    const matchesName = anime.name.toLowerCase().includes(query);
    const matchesAlternativeTitle = anime.alternativeTitles?.some((title: string) =>
      title.toLowerCase().includes(query)
    );
    const matchesSearch = !query || matchesName || !!matchesAlternativeTitle;
    if (!matchesSearch) return false;

    const matchesStatus =
      ignoreFilter === 'status' || matchesAnySelection(this.selectedStatuses(), anime.status);
    if (!matchesStatus) return false;

    const matchesRating =
      ignoreFilter === 'rating' || matchesAnySelection(this.selectedRatings(), anime.rating);
    if (!matchesRating) return false;

    const releaseYears = this.releaseYearsByAnimeId().get(anime.id) ?? new Set<string>();
    const matchesReleaseYear =
      ignoreFilter === 'releaseYear' ||
      matchesAnySelection(this.selectedReleaseYears(), releaseYears);
    if (!matchesReleaseYear) return false;

    if (ignoreFilter === 'watchedYear') return true;
    const watchedYears = this.watchedYearsByAnimeId().get(anime.id) ?? new Set<string>();
    return matchesAnySelection(this.selectedWatchedYears(), watchedYears);
  }

  private getWatchedYears(anime: Anime): Set<string> {
    return getCoveredYears([
      { startDate: anime.startDate, endDate: anime.endDate },
      ...(anime.additionalDates ?? []).map((additionalDate) => ({
        startDate: additionalDate.startDate,
        endDate: additionalDate.endDate
      }))
    ]);
  }
}
