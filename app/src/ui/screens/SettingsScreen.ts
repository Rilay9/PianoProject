import { renderPlaceholderScreen } from './placeholder';
import { getThemePreference, setThemePreference, type ThemePreference } from '../theme';

export function SettingsScreen(): HTMLElement {
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

  section.querySelector('.card')?.appendChild(themeRow);
  return section;
}
