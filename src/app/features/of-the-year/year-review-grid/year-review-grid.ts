import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OfTheYearService } from '../of-the-year.service';

@Component({
  selector: 'app-year-review-grid',
  imports: [RouterLink],
  templateUrl: './year-review-grid.html',
  standalone: true
})
export class YearReviewGrid {
  readonly indexKey = input.required<'aoty' | 'goty'>();
  readonly newRoute = input.required<string>();
  readonly aspectRatio = input.required<string>();
  readonly placeholderColor = input.required<string>();
  readonly description = input.required<string>();

  protected readonly authService = inject(AuthService);
  private readonly ofTheYearService = inject(OfTheYearService);

  protected readonly yearIndex = computed(() =>
    this.ofTheYearService.getYearIndex(this.indexKey())()
  );
  protected readonly years = computed(() =>
    [...(this.yearIndex()?.years ?? [])].sort((a, b) => Number(b) - Number(a))
  );
  protected readonly editingYear = signal<string | null>(null);
  protected readonly coverUrl = signal('');

  protected startCoverEdit(year: string): void {
    this.editingYear.set(year);
    this.coverUrl.set(this.yearIndex()?.covers?.[year] ?? '');
  }

  protected cancelCoverEdit(): void {
    this.editingYear.set(null);
  }

  protected async saveCover(year: string): Promise<void> {
    await this.ofTheYearService.updateYearIndex(this.indexKey(), year, this.coverUrl().trim());
    this.editingYear.set(null);
  }
}
