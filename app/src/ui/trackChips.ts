/**
 * The active-tracks chips: one per curriculum track the library can offer
 * something for, pressed when the track is on (docs/04 §7 "Content").
 *
 * Shared by Settings and the setup tour. The chips print track *titles*, never
 * ids, and a track the curriculum does not define gets no chip: switching it
 * on would set a preference nothing reads, which is a dead control (`04` §0
 * R4).
 */
import { allItems, loadCurriculum } from '../curriculum/load';
import { activeTracksFor } from '../curriculum/tracks';
import { getPlan, updatePlan } from '../data/planStore';
import { el } from './widgets';

export async function renderTrackChips(row: HTMLElement, idPrefix = 'settings-track'): Promise<void> {
  const [plan, curriculum, items] = await Promise.all([getPlan(), loadCurriculum(), allItems()]);
  const inLibrary = new Set(items.flatMap((item) => item.tracks));
  const tracks = curriculum.tracks.filter((track) => inLibrary.has(track.id));
  // The set Plan and Today work from, not the raw row: on a fresh phone the
  // row says `['core']` and the data says six tracks are on, and a chip that
  // reads as off while Today is recommending from it is a lie.
  const active = activeTracksFor(plan, curriculum);
  row.replaceChildren();
  for (const track of tracks) {
    const on = active.includes(track.id);
    const node = el('button.chip', {
      type: 'button',
      text: track.title,
      'aria-pressed': on,
      id: `${idPrefix}-${track.id}`,
    });
    node.addEventListener('click', () => {
      const pressed = node.getAttribute('aria-pressed') === 'true';
      node.setAttribute('aria-pressed', String(!pressed));
      // Toggling writes the *resolved* set back, so the first tap makes the
      // defaults explicit instead of collapsing them to one track.
      void getPlan().then((current) => {
        const before = activeTracksFor(current, curriculum);
        return updatePlan({
          trackOrder: pressed ? before.filter((id) => id !== track.id) : [...before, track.id],
        });
      });
    });
    row.append(node);
  }
}
