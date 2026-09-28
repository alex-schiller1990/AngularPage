import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AdditionalDate } from '../../core/additional-date.model';
import { todayString } from '../detail-draft.utils';

export interface AdditionalDateFieldChange {
  index: number;
  key: keyof AdditionalDate;
  value: string;
}

@Component({
  selector: 'app-additional-dates-editor',
  imports: [MatButtonModule],
  templateUrl: './additional-dates-editor.html',
  standalone: true,
})
export class AdditionalDatesEditorComponent {
  readonly additionalDates = input.required<AdditionalDate[]>();
  readonly commentPlaceholder = input('Comment');

  readonly addDate = output<void>();
  readonly removeDate = output<number>();
  readonly fieldChange = output<AdditionalDateFieldChange>();

  protected readonly todayString = todayString;

  protected onFieldInput(index: number, key: keyof AdditionalDate, value: string): void {
    this.fieldChange.emit({ index, key, value });
  }
}
