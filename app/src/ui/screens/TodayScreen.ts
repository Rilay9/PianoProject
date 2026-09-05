import type { Router } from '../../router';
import { renderPlaceholderScreen } from './placeholder';
import { addButton, addParagraph, addSection } from './subScreen';

export function TodayScreen(router: Router): HTMLElement {
  const section = renderPlaceholderScreen(
    'Today',
    'Your practice session for today will appear here: warm-up, review, new material, repertoire, and free play.',
  );

  // The metronome is useful before any of the rest of this screen exists —
  // it is what you want when practising scales or reading from paper — so it
  // has a way in from here rather than waiting for the session card (P7).
  const card = section.querySelector('.card');
  if (card instanceof HTMLElement) {
    const tools = addSection(card, 'Tools');
    addParagraph(tools, 'Available now, before the session builder is built.', 'hint');
    addButton(tools, 'Metronome', () => router.navigate('today', 'metronome'), {
      id: 'today-metronome',
      variant: 'primary',
    });
  }
  return section;
}
