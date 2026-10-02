# U122c — initial red and device trace

Run on the exact head carrying this request, from `app/`:

```sh
npx playwright test tests/e2e/score.task-chrome.spec.ts --workers=4
```

Expected red: paused direct resume disappears after the current idle-fold timer;
the count-in box crosses drawn notation. Six tests cover one representative cell
for each device. These are real app transitions; no layout or state injection.
Preserve the exact failures, including setup failures that would invalidate red.
The notation count must be positive before the overlap assertion is meaningful.

Capture rest, count-in and paused pictures for these three cells if possible,
using the ordinary screenshot facility without changing app DOM/CSS. These trace
the current upright/tablet surfaces before their designs are chosen. Publish raw
results as `docs/prompts/runs/U122c/checks-<head8>.txt` on the working branch and
pictures under `docs/prompts/pictures/u122c/`. That results push resumes the lane.

This initial discriminating slice is not the final eight-cell acceptance matrix.
No implementation change is present. Please identify any fixture/mechanism error
before interpreting the expected failures as product evidence.
