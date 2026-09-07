// @vitest-environment jsdom
/**
 * `el()`'s selector (P19 §B).
 *
 * It understood `div.row.wide` and not `input#folder-search`, so the second
 * created an element whose *tag name* was the whole string. The folder
 * screen's search box, style select, level boxes and rated checkbox were
 * therefore not form controls: nothing to type into, `.value` undefined, and
 * `readFilters()` reading it every keystroke. It looked right because an
 * unknown element with a placeholder attribute renders as an empty inline box,
 * and the screen had no end-to-end test to notice.
 */
import { describe, expect, it } from 'vitest';
import { el } from '../../src/ui/widgets';

describe('el', () => {
  it('makes a plain element', () => {
    expect(el('span').tagName).toBe('SPAN');
    expect(el('div').tagName).toBe('DIV');
  });

  it('reads classes off the spec', () => {
    const node = el('div.row.wide');
    expect(node.tagName).toBe('DIV');
    expect(node.className).toBe('row wide');
  });

  it('reads an id off the spec, and really makes the element it names', () => {
    const node = el('input#folder-search', { type: 'search' });
    expect(node.tagName).toBe('INPUT');
    expect(node.id).toBe('folder-search');
    expect(node).toBeInstanceOf(HTMLInputElement);
    // The property that was silently missing: an unknown element has no value.
    (node as HTMLInputElement).value = 'ragtime';
    expect((node as HTMLInputElement).value).toBe('ragtime');
  });

  it('takes an id and classes together', () => {
    const node = el('p#folder-count.muted');
    expect(node.tagName).toBe('P');
    expect(node.id).toBe('folder-count');
    expect(node.className).toBe('muted');
  });

  it('still lets an id come through the attributes instead', () => {
    expect(el('div', { id: 'from-attrs' }).id).toBe('from-attrs');
  });

  it('makes a real select, whose value is one of its options', () => {
    const select = el('select#folder-style') as HTMLSelectElement;
    expect(select).toBeInstanceOf(HTMLSelectElement);
    const option = document.createElement('option');
    option.value = 'ragtime';
    select.append(option);
    select.value = 'ragtime';
    expect(select.value).toBe('ragtime');
  });

  it('makes a real checkbox', () => {
    const box = el('input#folder-rated', { type: 'checkbox' }) as HTMLInputElement;
    box.checked = true;
    expect(box.checked).toBe(true);
  });
});
