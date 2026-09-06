/**
 * The "Find more" sheet (docs/04 §3, replan §4.1).
 *
 * A rung knows what it needs; the owner is the one who goes and gets it. This
 * is the handover: the search line, the chat prompt, the pieces that would be
 * about right, and what file format to ask for.
 *
 * Both prompts are generated at build time and shipped in the curriculum, so
 * nothing here composes text — it presents it and copies it. That matters more
 * than it sounds: a sheet that built its own wording would be a second place
 * for the wording to be wrong, and the validator only checks the first.
 */
import { badge, button, el, openSheet, type Sheet } from './widgets';

export interface FinderBlock {
  skill: string;
  levelWords: string;
  constraints: string[];
  avoid: string[];
  examples?: { title: string; composer?: string; note: 'bundled' | 'wanted' }[];
  formats: string;
  searchQuery: string;
  chatPrompt: string;
}

/**
 * Copies text and says so on the button.
 *
 * `navigator.clipboard` needs a secure context and can be refused; the app is
 * served over https and installed as a TWA, so it is normally there, but a
 * button that silently does nothing is the worst outcome. The fallback selects
 * the text instead, which is the thing a person can act on.
 */
export function copyButton(label: string, text: () => string, area?: HTMLTextAreaElement) {
  const control = button(label, () => {
    const value = text();
    const done = (): void => {
      control.textContent = 'Copied';
      window.setTimeout(() => {
        control.textContent = label;
      }, 1500);
    };
    void (async () => {
      try {
        await navigator.clipboard.writeText(value);
        done();
      } catch {
        if (area) {
          area.focus();
          area.select();
          control.textContent = 'Select and copy';
        } else {
          control.textContent = 'Could not copy';
        }
      }
    })();
  });
  return control;
}

function block(heading: string, hint: string, value: string, id: string): {
  node: HTMLElement;
  area: HTMLTextAreaElement;
} {
  const area = el('textarea', {
    id,
    readOnly: true,
    rows: value.length > 200 ? 7 : 2,
    className: 'finder-text',
  }) as HTMLTextAreaElement;
  area.value = value;
  const node = el(
    'section.block',
    {},
    el('h3', { text: heading }),
    el('p.muted', { text: hint }),
    area,
  );
  return { node, area };
}

/**
 * Opens the sheet for one finder.
 *
 * `what` is what the finder is for — a rung's title, or a concept's name — and
 * appears in the heading so a sheet opened from Skills does not look like one
 * opened from a lesson.
 */
export function openFinderSheet(finder: FinderBlock, what: string): Sheet {
  const sheet = openSheet(`Find more for ${what}`, { id: 'finder-sheet' });

  sheet.body.append(
    el('p', { text: `What this needs: ${finder.skill}.` }),
    el('p.muted', { text: `Level: ${finder.levelWords}.` }),
  );

  const search = block(
    'Search for it',
    'Paste this into a search engine.',
    finder.searchQuery,
    'finder-search',
  );
  search.node.append(
    el('div.row', {}, copyButton('Copy search', () => finder.searchQuery, search.area)),
  );
  sheet.body.append(search.node);

  const chat = block(
    'Or ask an assistant',
    'Paste this into a chatbot. It already says what to avoid and where to look.',
    finder.chatPrompt,
    'finder-prompt',
  );
  chat.node.append(el('div.row', {}, copyButton('Copy prompt', () => finder.chatPrompt, chat.area)));
  sheet.body.append(chat.node);

  if (finder.constraints.length || finder.avoid.length) {
    sheet.body.append(
      el(
        'section.block',
        {},
        el('h3', { text: 'What makes a piece right' }),
        el('ul.finder-list', {}, ...finder.constraints.map((c) => el('li', { text: c }))),
        el('h3', { text: 'And what makes one wrong' }),
        el('ul.finder-list', {}, ...finder.avoid.map((a) => el('li', { text: a }))),
      ),
    );
  }

  const examples = finder.examples ?? [];
  if (examples.length) {
    sheet.body.append(
      el(
        'section.block',
        { id: 'finder-examples' },
        el('h3', { text: 'Roughly the right kind' }),
        el(
          'ul.finder-list',
          {},
          ...examples.map((example) =>
            el(
              'li',
              { 'data-note': example.note },
              el('span', {
                text: example.composer ? `${example.title} — ${example.composer}` : example.title,
              }),
              // `bundled` is already in the library and names the sound wanted;
              // `wanted` is a piece no reachable source had (replan §1.5),
              // which is exactly why it is an example and not an option.
              badge(example.note === 'bundled' ? 'already yours' : 'not found yet', example.note),
            ),
          ),
        ),
      ),
    );
  }

  sheet.body.append(
    el('section.block', { id: 'finder-formats' }, el('p.muted', { text: finder.formats })),
  );
  return sheet;
}
