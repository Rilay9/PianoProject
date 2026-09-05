import { renderPlaceholderScreen } from './placeholder';

export function TodayScreen(): HTMLElement {
  return renderPlaceholderScreen(
    'Today',
    'Your practice session for today will appear here: warm-up, review, new material, repertoire, and free play.',
  );
}
