import { describe, it, expect } from 'vitest';
import { MigrateLegacyTriviaPipe } from './migrate-legacy-trivia.pipe';

describe('MigrateLegacyTriviaPipe', () => {
  const pipe = new MigrateLegacyTriviaPipe();

  it('should return empty string for null, undefined, or empty string', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should transform standard legacy li pattern without p tags', () => {
    const input = '<ul><li>Momente, die ich cool fand:<ul><li>Item 1</li></ul></li></ul>';
    const output = pipe.transform(input);
    expect(output).toBe('<ul><details><summary>Momente, die ich cool fand:</summary><ul><li>Item 1</li></ul></details></ul>');
  });

  it('should transform legacy li pattern with p tags surrounding the label', () => {
    const input = '<li><p>Momente, die ich cool fand:</p><ul><li>Item 1</li></ul></li>';
    const output = pipe.transform(input);
    expect(output).toBe('<details><summary>Momente, die ich cool fand:</summary><ul><li>Item 1</li></ul></details>');
  });

  it('should not transform other li elements', () => {
    const input = '<li>Normal item</li><li><p>Other topic:</p><ul><li>Item</li></ul></li>';
    const output = pipe.transform(input);
    expect(output).toBe(input);
  });
});
