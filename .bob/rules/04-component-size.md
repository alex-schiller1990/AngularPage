# Component / Template Size Rules

After creating or significantly editing any component template or TypeScript file, run this
two-step check before reporting the task as done.

## Step 1 — Redundancy check

Scan the file for blocks of markup or logic that are **repeated two or more times** with only
minor differences (e.g. a section key or a label string).

- If found: extract into a shared component. Pass the varying parts as `input()` signals and
  emit user actions via `output()`. Do not leave the duplication in place.
- If not found: proceed to Step 2.

## Step 2 — Natural separation-point check

Even with no redundancy, check whether the file contains **logically distinct regions** that
would make sense as standalone components. Indicators:

- A block that maps to a clear concept (e.g. a tab's full content, a card-with-edit-mode, a
  list section with its own state or display logic).
- A block large enough that a future developer would search for it by name, not by scrolling.
- A block that has its own conditional rendering, internal structure, or data shape distinct
  from the rest of the file.

If such a region exists and the resulting component would be at least ~40 lines, extract it.

## Thresholds

| File type | Soft limit | Action |
|---|---|---|
| Component template (`.html`) | 200 lines | Run both checks |
| Component class (`.ts`) | 250 lines | Run both checks |

Files under the soft limit still get the redundancy check; only the separation-point check is
skipped unless it is obviously warranted.

## Output

If an extraction is performed, briefly state:
- What was extracted and why (redundancy or separation point).
- The new component name and location.

If no extraction is needed, a one-line confirmation is sufficient — do not add unsolicited
commentary about the file being "well-structured."
