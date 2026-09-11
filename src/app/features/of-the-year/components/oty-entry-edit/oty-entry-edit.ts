import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RichEditorComponent } from '../../../../shared/rich-editor/rich-editor';
import { OtyEntry } from '../../of-the-year.model';

export interface EntryFieldChange {
  field: keyof OtyEntry;
  value: string;
}

@Component({
  selector: 'app-oty-entry-edit',
  standalone: true,
  imports: [MatButtonModule, RichEditorComponent],
  templateUrl: './oty-entry-edit.html',
})
export class OtyEntryEditComponent {
  readonly entry = input.required<OtyEntry>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly label = input<string>('Entry');
  readonly initialDesc = input<string>('');

  readonly fieldChange = output<EntryFieldChange>();
  readonly move = output<-1 | 1>();
  readonly remove = output<void>();
}
