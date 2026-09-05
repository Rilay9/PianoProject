import { renderPlaceholderScreen } from './placeholder';
import { getThemePreference, setThemePreference, type ThemePreference } from '../theme';
import type { Router } from '../../router';

export function SettingsScreen(router: Router): HTMLElement {
  const section = renderPlaceholderScreen(
    'Settings',
    'Practice, display, sound, input, and content settings will live here.',
  );

  const themeRow = document.createElement('div');
  themeRow.className = 'setting-row';

  const label = document.createElement('label');
  label.textContent = 'Theme';
  label.htmlFor = 'theme-select';
  themeRow.appendChild(label);

  const select = document.createElement('select');
  select.id = 'theme-select';
  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  for (const opt of options) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === getThemePreference()) el.selected = true;
    select.appendChild(el);
  }
  select.addEventListener('change', () => {
    setThemePreference(select.value as ThemePreference);
  });
  themeRow.appendChild(select);

  const card = section.querySelector('.card');
  card?.appendChild(themeRow);

  // MIDI and Diagnostics live under Settings until the Score screen's control
  // bar exists to reach them from (docs/04-ui-spec.md §5, "⋯ menu").
  for (const link of [
    { sub: 'midi' as const, label: 'MIDI', hint: 'Connect your piano and pick an input' },
    {
      sub: 'diagnostics' as const,
      label: 'Diagnostics',
      hint: 'Raw message log, latency test, debug report',
    },
  ]) {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const text = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = link.label;
    const hint = document.createElement('div');
    hint.className = 'muted';
    hint.textContent = link.hint;
    text.append(title, hint);
    row.appendChild(text);

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'button button--secondary';
    open.id = `open-${link.sub}`;
    open.textContent = 'Open';
    open.addEventListener('click', () => router.navigate('settings', link.sub));
    row.appendChild(open);

    card?.appendChild(row);
  }

  return section;
}
