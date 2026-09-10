// @vitest-environment jsdom
/**
 * The miniature has to stand for a phone even when it is not running on one.
 *
 * The tour's previews were drawn at a fifth of real size on a laptop and were
 * unreadable. The cause was not the card they sit in: `deviceSides` took the
 * window literally, so a 1512 x 850 laptop was a 850 x 1512 "device", and a
 * card a few hundred pixels wide can only draw that tiny. A tablet did the
 * same thing for the same reason. Clamping what the miniature stands for costs
 * the layout nothing, which a floor on the drawn size does not — that one
 * overflowed the step it was in.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { deviceSides } from '../../src/ui/devicePreview';

function windowOf(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('deviceSides', () => {
  const realW = window.innerWidth;
  const realH = window.innerHeight;
  afterEach(() => {
    windowOf(realW, realH);
  });

  it('takes a phone at its word', () => {
    windowOf(342, 740);
    expect(deviceSides()).toEqual({ short: 342, long: 740 });
  });

  it('reads a phone the same way round when it is held sideways', () => {
    windowOf(740, 342);
    expect(deviceSides()).toEqual({ short: 342, long: 740 });
  });

  it('holds a laptop down to the size of a large phone', () => {
    windowOf(1512, 850);
    const { short, long } = deviceSides();
    expect(short).toBeLessThanOrEqual(430);
    expect(long).toBeLessThanOrEqual(950);
    // The whole point: a laptop must not end up standing for a device *larger*
    // than the phone does, which is what made its miniature the smaller of the
    // two.
    windowOf(342, 740);
    const phone = deviceSides();
    expect(long).toBeLessThan(phone.long * 1.5);
  });

  it('holds a tablet down too — it had the same fault for the same reason', () => {
    windowOf(900, 1200);
    const { short, long } = deviceSides();
    expect(short).toBeLessThanOrEqual(430);
    expect(long).toBeLessThanOrEqual(950);
  });

  it('brings a tiny window up, rather than standing for a sliver', () => {
    windowOf(200, 380);
    const { short, long } = deviceSides();
    expect(short).toBeGreaterThanOrEqual(320);
    expect(long).toBeGreaterThanOrEqual(640);
  });

  it('keeps the long side long, whatever the clamps do to each side', () => {
    for (const [w, h] of [
      [342, 740],
      [740, 342],
      [1512, 850],
      [900, 1200],
      [200, 380],
      [2000, 100],
    ]) {
      windowOf(w!, h!);
      const { short, long } = deviceSides();
      expect(long).toBeGreaterThanOrEqual(short);
    }
  });
});
