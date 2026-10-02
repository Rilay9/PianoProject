# U122c — test-only baseline and discriminating red

Base: `ba00c579`. This checkpoint changes no application implementation.

Run at this branch head, from `app/`, using the normal isolated-port harness:

```sh
npx playwright test tests/e2e/score.moment-chrome.spec.ts --workers=4
```

Expected **red**: the count-in crosses real entrance ink, and the direct pause/resume is hidden/inert after the start/paused fold timers. Three representative devices, 115 % text, wider face, Hot Cross Buns. The JSON and PNG attachments capture rest, count-in, holding and paused even when assertions are red (soft assertions).

Then obtain the minimum device-design trace, using the same spec at the same head:

```sh
U122C_SIZES=568x320,780x360,342x740,360x780,1024x768,768x1024,1366x1024,1024x1366 U122C_TEXTS=115 U122C_FACES=wider U122C_PIECES=hcb,moon npx playwright test tests/e2e/score.moment-chrome.spec.ts --workers=4
```

Expected **red**; 16 cells (8 sizes × 1 text × 1 face × 2 pieces). Publish exit codes, assertion failures and counts in `checks-<head8>.txt`, and retain the JSON attachments and representative pictures beside it. These are the real screen, with no c6 injection, and are needed before deciding upright/tablet surfaces. Please distinguish a test/harness failure from an observed product failure. No green or completion claim is made yet.

The full 96-cell acceptance and playing/refusal/finished coverage follow the baseline design trace; this checkpoint does not claim that coverage. U110a remains independent, waiting on its existing request.
