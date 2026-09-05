/**
 * The lesson-page markdown renderer (docs/04 §3).
 *
 * It builds DOM nodes rather than an HTML string, so the tests check the tree
 * — and one of them checks that markup in the source stays *text*, which is
 * the property that makes it safe to point at a note the owner typed.
 */
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseFrontMatter, renderMarkdown } from '../../src/ui/markdown';

function html(markdown: string): string {
  const holder = document.createElement('div');
  holder.append(renderMarkdown(markdown));
  return holder.innerHTML;
}

describe('parseFrontMatter', () => {
  it('splits the --- block off the top', () => {
    const { data, body } = parseFrontMatter('---\ntitle: Hello\nstage: 1\n---\nBody text.\n');
    expect(data.title).toBe('Hello');
    expect(data.stage).toBe(1);
    expect(body.trim()).toBe('Body text.');
  });

  it('reads a flow list', () => {
    const { data } = parseFrontMatter('---\nconcepts: [C-position, 4/4, "middle-C"]\n---\nx');
    expect(data.concepts).toEqual(['C-position', '4/4', 'middle-C']);
  });

  it('reads the block list the lesson files use for videos', () => {
    const { data } = parseFrontMatter(
      '---\nvideos:\n  - label: "First tune"\n    url: "https://example.test/a"\n' +
        '    teacher: "Someone"\n  - label: "Second"\n    url: "https://example.test/b"\n---\nx',
    );
    expect(data.videos).toEqual([
      { label: 'First tune', url: 'https://example.test/a', teacher: 'Someone' },
      { label: 'Second', url: 'https://example.test/b' },
    ]);
  });

  it('leaves a file with no front matter alone', () => {
    const { data, body } = parseFrontMatter('Just a paragraph.');
    expect(data).toEqual({});
    expect(body).toBe('Just a paragraph.');
  });
});

describe('renderMarkdown', () => {
  it('renders paragraphs, headings and both list kinds', () => {
    expect(html('# Title\n\nA paragraph.')).toBe('<h2>Title</h2><p>A paragraph.</p>');
    expect(html('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(html('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
  });

  it('renders bold, italic, code and links', () => {
    expect(html('**C position** is *one* `finger` per key.')).toBe(
      '<p><strong>C position</strong> is <em>one</em> <code>finger</code> per key.</p>',
    );
    expect(html('See [the video](https://example.test/v).')).toContain(
      '<a href="https://example.test/v" target="_blank" rel="noreferrer">the video</a>',
    );
  });

  it('joins the lines of a wrapped paragraph', () => {
    expect(html('one\ntwo\nthree')).toBe('<p>one two three</p>');
  });

  it('treats markup in the source as text, not as markup', () => {
    expect(html('A <script>alert(1)</script> tag.')).toBe(
      '<p>A &lt;script&gt;alert(1)&lt;/script&gt; tag.</p>',
    );
  });
});
