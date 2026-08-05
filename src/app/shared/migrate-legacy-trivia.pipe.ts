import { Pipe, PipeTransform } from '@angular/core';

/**
 * Migrates legacy trivia HTML that used a list item pattern into a spoiler block.
 *
 * Converts:
 *   <li>Momente, die ich cool fand:<ul>...</ul></li>
 * To:
 *   <details><summary>Momente, die ich cool fand:</summary><ul>...</ul></details>
 *
 * The match is case-insensitive and tolerates whitespace variations.
 * Applied in the read-only view so legacy data displays correctly without
 * needing a database migration.
 */
@Pipe({ name: 'migrateLegacyTrivia', pure: true, standalone: true })
export class MigrateLegacyTriviaPipe implements PipeTransform {
  transform(html: string | null | undefined): string {
    if (!html) return '';

    const doc = new DOMParser().parseFromString(html, 'text/html');

    doc.querySelectorAll('li').forEach(li => {
      // Collect all child nodes: expect text node(s) followed by a <ul> or <ol>
      const childNodes = Array.from(li.childNodes);
      const listEl = childNodes.find(
        n => n.nodeName === 'UL' || n.nodeName === 'OL'
      ) as HTMLElement | undefined;

      if (!listEl) return;

      const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);
      const labelText = textNodes.map(n => n.textContent ?? '').join('').trim();

      if (labelText !== 'Momente, die ich cool fand:') return;

      const details = doc.createElement('details');
      const summary = doc.createElement('summary');
      summary.textContent = labelText;
      details.appendChild(summary);
      details.appendChild(listEl.cloneNode(true));

      li.replaceWith(details);
    });

    return doc.body.innerHTML;
  }
}
