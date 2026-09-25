/**
 * Plays the open score in Keep tempo, in time, from inside the page (T37).
 *
 * A pass is played in Keep tempo now: a Wait for me run measures the notes and
 * not the pulse, and can no longer pass on the tempo slider (`05` §2, `02`
 * Part G). So a spec whose subject is a *pass* — the first day, the lesson
 * flow, a whole run — has to play one in time, and that cannot be done from
 * the test side: a `page.evaluate` per note is a round trip whose length is
 * whatever the machine is doing, and a note late by more than the window is a
 * miss.
 *
 * So the playing happens in the page, on the page's own animation frames,
 * which are what move the cursor: each frame asks `scoreRun()` which step the
 * clock is on, and strikes that step's notes the frame it arrives — a few
 * milliseconds after the beat, well inside the ±150 ms window — then lets
 * them go, so a repeated note is a new strike and not a bounce. A step with
 * nothing in the played hand is passed over. Nothing is struck during the
 * count-in: the run holds for its first note once the count is over (T8), and
 * that note is what starts the clock, so it is struck when the run says it is
 * holding and not a frame before.
 *
 * `via: 'midi'` delivers bytes through the MIDI mock (`fixtures/midiMock.ts`,
 * which must be installed); `via: 'keys'` presses the keyboard strip, the
 * input the screen keys use. Returns how many notes were struck.
 */
import type { Page } from '@playwright/test';

export async function playInTime(
  page: Page,
  via: 'midi' | 'keys',
  timeoutMs = 120_000,
): Promise<number> {
  return page.evaluate(
    async ({ via: source, timeoutMs: budget }) => {
      interface Run {
        step: number;
        expected: number[];
        armed: boolean;
      }
      const hooked = window as unknown as {
        __pianopath?: { scoreRun?: () => Run | null };
        __midiMock?: { deliver(inputId: string | null, bytes: number[]): void };
      };
      const strike = (midi: number, down: boolean): void => {
        if (source === 'midi') {
          hooked.__midiMock?.deliver(null, down ? [0x90, midi, 90] : [0x80, midi, 0]);
          return;
        }
        const key = document.querySelector(`.keyboard-strip [data-midi="${String(midi)}"]`);
        key?.dispatchEvent(
          new PointerEvent(down ? 'pointerdown' : 'pointerup', {
            pointerId: 1,
            button: 0,
            isPrimary: true,
            bubbles: true,
          }),
        );
      };
      const summaryUp = (): boolean => {
        const sheet = document.getElementById('score-summary');
        return sheet !== null && !sheet.hidden;
      };
      const frame = (): Promise<void> =>
        new Promise((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      let fed = -1;
      let started = false;
      let struck = 0;
      const play = (run: Run): void => {
        fed = run.step;
        const notes = [...run.expected];
        for (const midi of notes) strike(midi, true);
        struck += notes.length;
        window.setTimeout(() => {
          for (const midi of notes) strike(midi, false);
        }, 40);
      };
      const until = performance.now() + budget;
      while (performance.now() < until && !summaryUp()) {
        const run = hooked.__pianopath?.scoreRun?.() ?? null;
        if (run?.armed === true && !started) {
          // Holding for the first note: this one starts the clock.
          started = true;
          play(run);
        } else if (run && started && !run.armed && run.step !== fed) {
          play(run);
        }
        await frame();
      }
      return struck;
    },
    { via, timeoutMs },
  );
}
