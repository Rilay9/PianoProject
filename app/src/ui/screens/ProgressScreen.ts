import { renderPlaceholderScreen } from './placeholder';

export function ProgressScreen(): HTMLElement {
  return renderPlaceholderScreen(
    'Progress',
    'Your practice history, streaks, and repertoire will be tracked here.',
  );
}
