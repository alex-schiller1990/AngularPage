import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RichEditorComponent } from '../../../../shared/rich-editor/rich-editor';
import { OtyEntry, OtySection } from '../../of-the-year.model';
import { DisplayEntry } from '../../of-the-year-detail/of-the-year-detail';
import { OtyEntryEditComponent, EntryFieldChange } from '../oty-entry-edit/oty-entry-edit';
import { OtyHonorableMentionComponent } from '../oty-honorable-mention/oty-honorable-mention';
import { OtyRankedEntryComponent, BadgeColor } from '../oty-ranked-entry/oty-ranked-entry';

export type SectionKey = 'disappointments' | 'surprises' | 'highlights' | 'mostWanted';

export interface SectionEntryEvent {
  listKey: 'entry' | 'honorableMentions';
  index: number;
  change: EntryFieldChange;
}

export interface SectionListEvent {
  listKey: 'entry' | 'honorableMentions';
  index: number;
}

export interface SectionMoveEvent extends SectionListEvent {
  direction: -1 | 1;
}

const SECTION_BADGE_COLOR: Record<SectionKey, BadgeColor> = {
  disappointments: 'red',
  surprises: 'yellow',
  highlights: 'green',
  mostWanted: 'purple',
};

@Component({
  selector: 'app-oty-section',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    RichEditorComponent,
    OtyEntryEditComponent,
    OtyHonorableMentionComponent,
    OtyRankedEntryComponent,
  ],
  templateUrl: './oty-section.html',
})
export class OtySectionComponent {
  readonly sectionKey = input.required<SectionKey>();
  readonly title = input.required<string>();
  readonly section = input<OtySection | undefined>(undefined);
  readonly editing = input<boolean>(false);
  readonly draft = input<OtySection | undefined>(undefined);
  readonly initialSectionIntro = input<string>('');
  readonly initialEntryDesc = input<Record<string, string>>({});

  readonly sectionIntroChange = output<string>();
  readonly entryChange = output<SectionEntryEvent>();
  readonly add = output<{ listKey: 'entry' | 'honorableMentions' }>();
  readonly remove = output<SectionListEvent>();
  readonly move = output<SectionMoveEvent>();

  protected readonly badgeColor = computed(() => SECTION_BADGE_COLOR[this.sectionKey()]);

  protected readonly sortedEntries = computed<DisplayEntry[]>(() => {
    const entries = this.section()?.entry;
    if (!entries || entries.length === 0) return [];

    const totalSlots = entries.length;
    const takenSlots = new Set<number>();
    const placed: DisplayEntry[] = [];
    const unplaced: OtyEntry[] = [];

    for (const item of entries) {
      const p = item.placement ? parseInt(item.placement, 10) : NaN;
      if (!isNaN(p) && p >= 1 && p <= totalSlots && !takenSlots.has(p)) {
        takenSlots.add(p);
        placed.push({ slot: p, entry: item });
      } else {
        unplaced.push(item);
      }
    }

    const availableSlots: number[] = [];
    for (let s = 1; s <= totalSlots; s++) {
      if (!takenSlots.has(s)) availableSlots.push(s);
    }
    availableSlots.reverse();

    const result: DisplayEntry[] = [...placed];
    for (let i = 0; i < unplaced.length; i++) {
      result.push({ slot: availableSlots[i] ?? (i + 1), entry: unplaced[i] });
    }
    result.sort((a, b) => b.slot - a.slot);
    return result;
  });

  protected hmInitialDesc(i: number): string {
    return this.initialEntryDesc()[`${this.sectionKey()}:hm:${i}`] ?? '';
  }

  protected entryInitialDesc(i: number): string {
    return this.initialEntryDesc()[`${this.sectionKey()}:entry:${i}`] ?? '';
  }
}
