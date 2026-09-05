// Placeholder screen factory. Each of the five tabs gets a card naming the
// screen; later phases (P6/P7/P8) replace the body with the real UI from
// docs/04-ui-spec.md without touching AppShell or the router.

export function renderPlaceholderScreen(title: string, description: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'screen';
  section.setAttribute('data-screen', title.toLowerCase());

  const card = document.createElement('div');
  card.className = 'card';

  const h1 = document.createElement('h1');
  h1.textContent = title;
  card.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = description;
  card.appendChild(p);

  section.appendChild(card);
  return section;
}
