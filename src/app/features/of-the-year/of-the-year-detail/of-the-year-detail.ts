import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { OfTheYearService } from '../of-the-year.service';
import { OfTheYearReview, OtyEntry, OtySection } from '../of-the-year.model';
import { RichEditorComponent } from '../../../shared/rich-editor/rich-editor';
import { OtySectionComponent, SectionKey } from '../components/oty-section/oty-section';

export interface DisplayEntry {
  slot: number;
  entry: OtyEntry;
}

const SECTION_KEYS: SectionKey[] = ['disappointments', 'surprises', 'highlights', 'mostWanted'];

@Component({
  selector: 'app-of-the-year-detail',
  imports: [MatCardModule, MatButtonModule, RouterLink, FormsModule, RichEditorComponent, OtySectionComponent],
  templateUrl: './of-the-year-detail.html',
  styleUrl: './of-the-year-detail.css',
  standalone: true,
})
export class OfTheYearDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ofTheYearService = inject(OfTheYearService);
  private readonly titleService = inject(Title);
  protected readonly auth = inject(AuthService);

  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly data = toSignal(this.route.data);

  protected readonly type = computed<'aoty' | 'goty'>(() => {
    const routeData = this.data();
    if (routeData && (routeData['type'] === 'aoty' || routeData['type'] === 'goty')) {
      return routeData['type'];
    }
    const path = this.route.snapshot.routeConfig?.path ?? '';
    return path.startsWith('goty') ? 'goty' : 'aoty';
  });

  protected readonly year = computed(() => this.paramMap()?.get('year') ?? '');

  /** True when this is a new-review creation flow (route param is 'new'). */
  protected readonly isNew = computed(() => this.year() === 'new');

  protected readonly title = computed(() => {
    const t = this.type() === 'aoty' ? 'Anime of the Year' : 'Game of the Year';
    const y = this.year();
    return y ? `${t} ${y}` : t;
  });

  private readonly reviewSignal = computed(() => {
    const t = this.type();
    const y = this.year();
    // Don't query Firestore for 'new' — there is no document yet.
    return t && y && !this.isNew() ? this.ofTheYearService.getReview(t, y) : null;
  });

  protected readonly review = computed<OfTheYearReview | null>(() => this.reviewSignal()?.() ?? null);

  /** True while Firestore has not yet emitted for the current route params. */
  protected readonly loading = computed<boolean>(() => {
    const t = this.type();
    const y = this.year();
    if (this.isNew() || !t || !y) return false;
    return !this.ofTheYearService.isReviewLoaded(t, y)();
  });

  // ── Edit mode ──────────────────────────────────────────────────────────────

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draft = signal<OfTheYearReview | null>(null);

  /** Extra fields for new-review creation only. */
  protected readonly yearInput = signal('');
  protected readonly coverUrlInput = signal('');

  constructor() {
    // When arriving at the 'new' route, immediately enter edit mode with a blank draft.
    effect(() => {
      if (this.isNew() && !this.editing()) {
        this._enterNewDraft();
      }
    });

    effect(() => {
      const isNew = this.isNew();
      const year = this.year();
      const type = this.type();
      if (!isNew && year) {
        this.titleService.setTitle(`${type} ${year}`);
      } else {
        this.titleService.setTitle('ogromm');
      }
    });
  }

  private _enterNewDraft(): void {
    const blankSection = (): OtySection => ({ intro: '', entry: [], honorableMentions: [] });
    const blank: OfTheYearReview = {
      id: '',
      type: this.type(),
      year: '',
      intro: '',
      disappointments: blankSection(),
      surprises: blankSection(),
      highlights: blankSection(),
      mostWanted: blankSection(),
      outro: '',
    };
    this.draft.set(blank);
    this.initialIntro = '';
    this.initialOutro = '';
    for (const key of SECTION_KEYS) {
      this.initialSectionIntro[key] = '';
    }
    this.editing.set(true);
  }

  /**
   * Frozen initial values for RichEditorComponent [value] inputs.
   * RichEditor only reads `value` once (at AfterViewInit), so we capture the
   * strings here when entering edit mode and never mutate them afterward.
   */
  protected initialIntro = '';
  protected initialOutro = '';
  // Per-section intro initial values
  protected readonly initialSectionIntro: Record<SectionKey, string> = {
    disappointments: '',
    surprises: '',
    highlights: '',
    mostWanted: '',
  };
  // Per-section, per-entry description initial values
  // Key: `${sectionKey}:entry:${index}` or `${sectionKey}:hm:${index}`
  protected readonly initialEntryDesc: Record<string, string> = {};

  protected startEdit(): void {
    const r = this.review();
    if (!r) return;

    this.draft.set(structuredClone(r));
    this.initialIntro = r.intro ?? '';
    this.initialOutro = r.outro ?? '';
    for (const key of SECTION_KEYS) {
      const sec = r[key];
      this.initialSectionIntro[key] = sec?.intro ?? '';
      (sec?.entry ?? []).forEach((e, i) => {
        this.initialEntryDesc[`${key}:entry:${i}`] = e.description ?? '';
      });
      (sec?.honorableMentions ?? []).forEach((e, i) => {
        this.initialEntryDesc[`${key}:hm:${i}`] = e.description ?? '';
      });
    }
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.draft.set(null);
    this.editing.set(false);
    this.saving.set(false);
  }

  protected async saveEdit(): Promise<void> {
    const d = this.draft();
    if (!d || this.saving()) return;
    this.saving.set(true);
    try {
      if (this.isNew()) {
        const year = this.yearInput().trim();
        if (!year) {
          this.saving.set(false);
          return;
        }
        const { id, ...data } = d;
        const reviewData: Omit<OfTheYearReview, 'id'> = { ...data, year, type: this.type() };
        await this.ofTheYearService.createReview(reviewData);
        const cover = this.coverUrlInput().trim() || undefined;
        await this.ofTheYearService.updateYearIndex(this.type(), year, cover);
        const prefix = this.type() === 'aoty' ? '/aoty' : '/goty';
        this.router.navigate([prefix, year]);
      } else {
        const { id, ...data } = d;
        await this.ofTheYearService.saveReview(id, data);
        this.editing.set(false);
        this.draft.set(null);
      }
    } finally {
      this.saving.set(false);
    }
  }

  // ── Draft mutation helpers ─────────────────────────────────────────────────

  protected setDraftField<K extends keyof OfTheYearReview>(key: K, value: OfTheYearReview[K]): void {
    this.draft.update(d => d ? { ...d, [key]: value } : d);
  }

  protected setSectionField(sectionKey: SectionKey, field: keyof OtySection, value: string): void {
    this.draft.update(d => {
      if (!d) return d;
      const sec: OtySection = { ...(d[sectionKey] ?? {}), [field]: value };
      return { ...d, [sectionKey]: sec };
    });
  }

  protected setEntryField(
    sectionKey: SectionKey,
    listKey: 'entry' | 'honorableMentions',
    index: number,
    field: keyof OtyEntry,
    value: string
  ): void {
    this.draft.update(d => {
      if (!d) return d;
      const sec = d[sectionKey] ?? {};
      const list = [...(sec[listKey] ?? [])];
      list[index] = { ...list[index], [field]: value };
      return { ...d, [sectionKey]: { ...sec, [listKey]: list } };
    });
  }

  protected addEntry(sectionKey: SectionKey, listKey: 'entry' | 'honorableMentions'): void {
    this.draft.update(d => {
      if (!d) return d;
      const sec = d[sectionKey] ?? {};
      const list = [...(sec[listKey] ?? []), { name: '' }];
      return { ...d, [sectionKey]: { ...sec, [listKey]: list } };
    });
  }

  protected removeEntry(sectionKey: SectionKey, listKey: 'entry' | 'honorableMentions', index: number): void {
    this.draft.update(d => {
      if (!d) return d;
      const sec = d[sectionKey] ?? {};
      const list = (sec[listKey] ?? []).filter((_, i) => i !== index);
      return { ...d, [sectionKey]: { ...sec, [listKey]: list } };
    });
  }

  protected moveEntry(sectionKey: SectionKey, listKey: 'entry' | 'honorableMentions', index: number, direction: -1 | 1): void {
    this.draft.update(d => {
      if (!d) return d;
      const sec = d[sectionKey] ?? {};
      const list = [...(sec[listKey] ?? [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return d;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...d, [sectionKey]: { ...sec, [listKey]: list } };
    });
  }

}
