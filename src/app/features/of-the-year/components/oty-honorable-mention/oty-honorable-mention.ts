import { Component, input } from '@angular/core';
import { OtyEntry } from '../../of-the-year.model';

@Component({
  selector: 'app-oty-honorable-mention',
  standalone: true,
  templateUrl: './oty-honorable-mention.html',
})
export class OtyHonorableMentionComponent {
  readonly entry = input.required<OtyEntry>();
}
