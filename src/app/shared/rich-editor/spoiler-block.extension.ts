import { Node, mergeAttributes } from '@tiptap/core';

/**
 * SpoilerTitle — editable label row.
 * Editor DOM: <div data-type="spoiler-title">
 * Storage HTML: <summary>
 */
export const SpoilerTitle = Node.create({
  name: 'spoilerTitle',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="spoiler-title"]' },
      { tag: 'summary' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'spoiler-title' }), 0];
  },
});

/**
 * SpoilerBlock — container node.
 * Editor DOM: <div data-type="spoiler">
 * Storage HTML: <details>
 *
 * Nesting is allowed (block+ content), but nesting spoilers is fine since
 * the editor renders everything as plain divs — no browser collapse behaviour.
 */
export const SpoilerBlock = Node.create({
  name: 'spoilerBlock',
  group: 'block',
  content: 'spoilerTitle block+',
  defining: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="spoiler"]' },
      { tag: 'details' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'spoiler' }), 0];
  },

  addCommands() {
    return {
      insertSpoilerBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'spoilerBlock',
            content: [
              {
                type: 'spoilerTitle',
                content: [{ type: 'text', text: 'Spoiler' }],
              },
              {
                type: 'paragraph',
                content: [],
              },
            ],
          });
        },
      deleteSpoilerBlock:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          let depth = selection.$anchor.depth;
          while (depth > 0) {
            const node = selection.$anchor.node(depth);
            if (node.type.name === 'spoilerBlock') {
              const pos = selection.$anchor.before(depth);
              if (dispatch) {
                dispatch(state.tr.delete(pos, pos + node.nodeSize));
              }
              return true;
            }
            depth--;
          }
          return false;
        },
    };
  },
});

/**
 * Convert editor HTML (div[data-type="spoiler"]) → storage HTML (<details><summary>).
 * Call this before saving to Firestore.
 */
export function toStorageHTML(editorHtml: string): string {
  const doc = new DOMParser().parseFromString(editorHtml, 'text/html');

  doc.querySelectorAll('div[data-type="spoiler"]').forEach(spoilerDiv => {
    const details = doc.createElement('details');

    const titleDiv = spoilerDiv.querySelector(':scope > div[data-type="spoiler-title"]');
    if (titleDiv) {
      const summary = doc.createElement('summary');
      summary.innerHTML = titleDiv.innerHTML;
      details.appendChild(summary);
      titleDiv.remove();
    }

    // Remaining children become the body of <details>
    while (spoilerDiv.firstChild) {
      details.appendChild(spoilerDiv.firstChild);
    }

    spoilerDiv.replaceWith(details);
  });

  return doc.body.innerHTML;
}

/**
 * Convert storage HTML (<details><summary>) → editor HTML (div[data-type="spoiler"]).
 * Call this before passing content to Tiptap.
 */
export function fromStorageHTML(storedHtml: string): string {
  const doc = new DOMParser().parseFromString(storedHtml, 'text/html');

  doc.querySelectorAll('details').forEach(details => {
    const spoilerDiv = doc.createElement('div');
    spoilerDiv.setAttribute('data-type', 'spoiler');

    const summary = details.querySelector(':scope > summary');
    if (summary) {
      const titleDiv = doc.createElement('div');
      titleDiv.setAttribute('data-type', 'spoiler-title');
      titleDiv.innerHTML = summary.innerHTML;
      spoilerDiv.appendChild(titleDiv);
      summary.remove();
    }

    while (details.firstChild) {
      spoilerDiv.appendChild(details.firstChild);
    }

    details.replaceWith(spoilerDiv);
  });

  return doc.body.innerHTML;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoilerBlock: {
      insertSpoilerBlock: () => ReturnType;
      deleteSpoilerBlock: () => ReturnType;
    };
  }
}
