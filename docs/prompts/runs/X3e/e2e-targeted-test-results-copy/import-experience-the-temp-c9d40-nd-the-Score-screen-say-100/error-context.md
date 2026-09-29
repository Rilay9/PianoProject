# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import-experience.spec.ts >> the tempo a marked file states, played (X3d) >> the learner states 100 on the half-note-marked file: the line and the Score screen say 100
- Location: tests\e2e\import-experience.spec.ts:326:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('#score-tempo-label')
    - locator resolved to <span tabindex="0" role="button" id="score-tempo-label" class="score-tempo-label" title="Tap to set the tempo">70% · 70 bpm</span>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="first-sight__counts">A pass needs both the accuracy and the share of t…</p> from <div class="sheet" id="score-first-sight">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="first-sight__counts">A pass needs both the accuracy and the share of t…</p> from <div class="sheet" id="score-first-sight">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    238 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <p class="first-sight__counts">A pass needs both the accuracy and the share of t…</p> from <div class="sheet" id="score-first-sight">…</div> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation "Main navigation" [ref=e4]:
      - button "Today" [ref=e5] [cursor=pointer]
      - button "Plan" [ref=e11] [cursor=pointer]
      - button "Library" [ref=e18] [cursor=pointer]
      - button "Progress" [ref=e24] [cursor=pointer]
      - button "Settings" [ref=e29] [cursor=pointer]
    - main [ref=e35]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]:
            - button "← Back" [ref=e39] [cursor=pointer]
            - heading "Half note stated" [level=1] [ref=e40]
            - generic [ref=e41]: bar 1 / 4
            - paragraph
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: Keep tempo
              - status [ref=e45]: The count-in clicks, then play along.
            - button "What can I do here, and what else is there" [ref=e46] [cursor=pointer]: "?"
        - generic [ref=e110]:
          - button "Play" [ref=e111] [cursor=pointer]: ▶
          - button "Hear it" [ref=e112] [cursor=pointer]
          - combobox "Practice mode" [ref=e113] [cursor=pointer]:
            - option "Wait for me"
            - option "Keep tempo" [selected]
            - option "Play it to me"
            - option "Free play"
          - generic [ref=e114]:
            - button "Right hand" [ref=e115] [cursor=pointer]: R
            - button "Left hand" [ref=e116] [cursor=pointer]: L
            - button "Both hands" [ref=e117] [cursor=pointer]: Both
          - button "70% · 70 bpm" [ref=e118] [cursor=pointer]
          - button "More controls" [ref=e119] [cursor=pointer]: ⋯
        - group "Piano keyboard" [ref=e121]:
          - generic [ref=e122]:
            - button "C2" [ref=e123]
            - button "D2" [ref=e124]
            - button "E2" [ref=e125]
            - button "F2" [ref=e126]
            - button "G2" [ref=e127]
            - button "A2" [ref=e128]
            - button "B2" [ref=e129]
            - button "C3" [ref=e130]
            - button "D3" [ref=e131]
            - button "E3" [ref=e132]
            - button "F3" [ref=e133]
            - button "G3" [ref=e134]
            - button "A3" [ref=e135]
            - button "B3" [ref=e136]
            - button "C4" [ref=e137]
            - button "D4" [ref=e138]
            - button "E4" [ref=e139]
            - button "F4" [ref=e140]
            - button "G4" [ref=e141]
            - button "A4" [ref=e142]
            - button "B4" [ref=e143]
            - button "C5" [ref=e144]
            - button "D5" [ref=e145]
            - button "E5" [ref=e146]
            - button "F5" [ref=e147]
            - button "G5" [ref=e148]
            - button "A5" [ref=e149]
            - button "B5" [ref=e150]
            - button "C6" [ref=e151]
            - button "C#2" [ref=e152]
            - button "D#2" [ref=e153]
            - button "F#2" [ref=e154]
            - button "G#2" [ref=e155]
            - button "A#2" [ref=e156]
            - button "C#3" [ref=e157]
            - button "D#3" [ref=e158]
            - button "F#3" [ref=e159]
            - button "G#3" [ref=e160]
            - button "A#3" [ref=e161]
            - button "C#4" [ref=e162]
            - button "D#4" [ref=e163]
            - button "F#4" [ref=e164]
            - button "G#4" [ref=e165]
            - button "A#4" [ref=e166]
            - button "C#5" [ref=e167]
            - button "D#5" [ref=e168]
            - button "F#5" [ref=e169]
            - button "G#5" [ref=e170]
            - button "A#5" [ref=e171]
  - dialog "Keep tempo" [ref=e173]:
    - generic [ref=e174]:
      - heading "Keep tempo" [level=2] [ref=e175]
      - button "Close" [ref=e176] [cursor=pointer]
    - generic [ref=e177]:
      - paragraph [ref=e178]: A click and a moving cursor that carry on whether you keep up or not, and mark what you miss.
      - paragraph [ref=e179]: The count-in clicks, then play along.
      - paragraph [ref=e180]: A pass needs both the accuracy and the share of the written tempo set in Settings, in one run.
      - button "Start" [ref=e181] [cursor=pointer]
```

# Test source

```ts
  17  |  * its whole four-minute budget being told that `#score-stage` intercepts
  18  |  * pointer events.
  19  |  */
  20  | export async function revealBar(page: Page): Promise<void> {
  21  |   if ((await page.locator('#score-bar[data-visible="false"]').count()) === 0) return;
  22  |   await page.locator('#score-stage').click({ position: { x: 20, y: 20 } });
  23  |   await page.waitForTimeout(150);
  24  | }
  25  | 
  26  | /**
  27  |  * Presses a control on the bar the way a person does: reveal, then click.
  28  |  *
  29  |  * Twice, because the fold's timer is three seconds and a run can hide the bar
  30  |  * again between the reveal and the click. One tap always brings it back
  31  |  * (`08` §9.34), so a second attempt is the whole recovery; a third would be
  32  |  * hiding a real fault behind a retry loop. The timeouts are short on purpose:
  33  |  * a control that cannot be pressed should say so in seconds, not in minutes.
  34  |  */
  35  | export async function pressControl(page: Page, selector: string): Promise<void> {
  36  |   await revealBar(page);
  37  |   try {
  38  |     await page.locator(selector).click({ timeout: 1_500 });
  39  |   } catch {
  40  |     await revealBar(page);
  41  |     await page.locator(selector).click({ timeout: 3_000 });
  42  |   }
  43  | }
  44  | 
  45  | /** Opens the `⋯` sheet, or does nothing if it is already open. */
  46  | export async function openScoreMenu(page: Page): Promise<void> {
  47  |   const sheet = page.locator('#score-more-sheet');
  48  |   if (await sheet.isVisible()) return;
  49  |   // Reveal first. The bar fades after three seconds of a run whatever it is
  50  |   // covering, so mid-run `⋯` is behind a stage that takes the tap — the fuzz
  51  |   // walk spent its whole four-minute budget being told so.
  52  |   await revealBar(page);
  53  |   // **Revised 2026-09-25 (test class: revise).** The bar fades again three
  54  |   // seconds after a reveal while a run is going, and on a slow runner the
  55  |   // click can arrive as it fades: Playwright then waits for a stable target
  56  |   // until the test's own timeout (five minutes in the state probe, on CI,
  57  |   // twice today). The old helper assumed the reveal outlasts the click. Now
  58  |   // the click has its own short timeout and a failed one reveals and tries
  59  |   // once more, so a stall costs seconds and says what it was.
  60  |   try {
  61  |     await page.locator('#score-more').click({ timeout: 8_000 });
  62  |   } catch {
  63  |     await revealBar(page);
  64  |     await page.locator('#score-more').click({ timeout: 8_000 });
  65  |   }
  66  |   await expect(sheet).toBeVisible();
  67  | }
  68  | 
  69  | export async function closeScoreMenu(page: Page): Promise<void> {
  70  |   const sheet = page.locator('#score-more-sheet');
  71  |   if (!(await sheet.isVisible())) return;
  72  |   await page.locator('#score-more-sheet-close').click();
  73  |   await expect(sheet).toBeHidden();
  74  | }
  75  | 
  76  | /** Opens the `⋯` sheet, runs `body`, and closes it again. */
  77  | export async function withScoreMenu(page: Page, body: () => Promise<void>): Promise<void> {
  78  |   await openScoreMenu(page);
  79  |   await body();
  80  |   await closeScoreMenu(page);
  81  | }
  82  | 
  83  | /**
  84  |  * The engraved music's box on screen — the ink, not the page it sits on.
  85  |  *
  86  |  * OSMD lays a window out on a page the full width of the container and inks
  87  |  * part of it, and since the fit grew the sheet to fill the width with *ink*
  88  |  * the page itself deliberately runs off the right of the stage. So a test
  89  |  * asking "does the music fit" has to ask about the drawn extent; the SVG
  90  |  * element's own box stopped being that number.
  91  |  */
  92  | export async function inkBox(
  93  |   page: Page,
  94  | ): Promise<{ left: number; right: number; top: number; bottom: number; width: number; height: number }> {
  95  |   return page.evaluate(() => {
  96  |     let left = Infinity;
  97  |     let right = -Infinity;
  98  |     let top = Infinity;
  99  |     let bottom = -Infinity;
  100 |     for (const el of document.querySelectorAll('#score-stage .is-front svg *')) {
  101 |       const box = el.getBoundingClientRect();
  102 |       if (box.width === 0 && box.height === 0) continue;
  103 |       left = Math.min(left, box.left);
  104 |       right = Math.max(right, box.right);
  105 |       top = Math.min(top, box.top);
  106 |       bottom = Math.max(bottom, box.bottom);
  107 |     }
  108 |     return { left, right, top, bottom, width: right - left, height: bottom - top };
  109 |   });
  110 | }
  111 | 
  112 | /** The tempo sheet, behind the bar's tempo label. */
  113 | export async function openTempoSheet(page: Page): Promise<void> {
  114 |   await revealBar(page);
  115 |   const sheet = page.locator('#score-tempo-sheet');
  116 |   if (await sheet.isVisible()) return;
> 117 |   await page.locator('#score-tempo-label').click();
      |                                            ^ Error: locator.click: Test timeout of 120000ms exceeded.
  118 |   await expect(sheet).toBeVisible();
  119 | }
  120 | 
  121 | export async function closeTempoSheet(page: Page): Promise<void> {
  122 |   const sheet = page.locator('#score-tempo-sheet');
  123 |   if (!(await sheet.isVisible())) return;
  124 |   await page.locator('#score-tempo-sheet-close').click();
  125 |   await expect(sheet).toBeHidden();
  126 | }
  127 | 
  128 | /** Sets the tempo percentage through the sheet the slider now lives in. */
  129 | export async function setTempoPercent(page: Page, percent: number): Promise<void> {
  130 |   await openTempoSheet(page);
  131 |   await page.locator('#score-tempo').fill(String(percent));
  132 |   await closeTempoSheet(page);
  133 | }
  134 | 
  135 | /**
  136 |  * Presses a control wherever the bar has decided to put it.
  137 |  *
  138 |  * The bar holds what it can and sends the rest behind `⋯` (`04` §5), and which
  139 |  * controls those are is **measured, not fixed**: `barIsOverfull` asks whether
  140 |  * the bar's children have wrapped to a second row, so the same width answers
  141 |  * differently on two machines with different font metrics. Hands is first in
  142 |  * `OVERFLOW_ORDER` — *"chosen once for a piece, so it is the first thing to
  143 |  * leave the bar when the screen is narrow"* — and `Hear it` is second.
  144 |  *
  145 |  * `score.head-height.spec.ts` clicked `#score-hands-L` on the bar and CI
  146 |  * answered *element is not visible* at 342 px on both tries while passing at
  147 |  * 390 px and passing at 342 px here (run 35861337702). The control was not
  148 |  * hidden and not dead: it was in the `⋯` sheet, which is where the spec says
  149 |  * the bar's overflow goes, and `⋯` was on the bar and live. So the app is
  150 |  * right and a test that assumes the bar is wrong — this asks the screen where
  151 |  * the control is instead of assuming.
  152 |  */
  153 | export async function pressAnywhere(page: Page, selector: string): Promise<void> {
  154 |   await revealBar(page);
  155 |   if (await page.locator(selector).isVisible()) {
  156 |     await pressControl(page, selector);
  157 |     return;
  158 |   }
  159 |   await withScoreMenu(page, async () => {
  160 |     await page.locator(selector).click();
  161 |   });
  162 | }
  163 | 
```