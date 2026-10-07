## base
build exit 0; browser exit 1; unit exit 1

ok 2 tests\e2e\score.window-rule.spec.ts:952:1 › mid-run on a phone sideways, the folded chrome leaves the music on the stage (7.1s)
x  3 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (U105c’s layout) (9.2s)
x  1 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (sized by the height) (9.3s)
x  4 tests\e2e\score.window-rule.spec.ts:1178:1 › folded upright after a crossing into the third bar: still below the chip, in reading order (9.6s)
ok 8 tests\e2e\score.window-rule.spec.ts:1289:1 › a tablet folds without a chip: no band, the slots at the top (7.5s)
x  7 tests\e2e\score.window-rule.spec.ts:1272:1 › where every sentence fits one line, the band is one line (8.8s)
x  5 tests\e2e\score.window-rule.spec.ts:1208:1 › a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage (11.9s)
x  6 tests\e2e\score.window-rule.spec.ts:1228:1 › what the chip says changes nothing: the band, the slots and the size stay where they were (9.9s)
6 failed
2 passed (22.9s)

❯ tests/unit/windowRendererStage.test.ts (34 tests | 4 failed | 29 skipped) 1467ms
× placed below the band while it is drawn and back at the top when it goes, with nothing fitted or engraved 67ms
× a band that is not a whole pixel starts the first slot on the pixel below it 30ms
× an ordinary fold during a frozen run: the stage gains the header’s row, the band is placed, and the shape and size hold 250ms
× a size taken while the band is drawn is priced below it: turned back while folded, it draws what a stage short by the band draws, placed under the band 1019ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯
Test Files  1 failed (1)
Tests  4 failed | 1 passed | 29 skipped (34)

## M1
build exit 0; browser exit 1; unit exit 1

ok 1 tests\e2e\score.window-rule.spec.ts:952:1 › mid-run on a phone sideways, the folded chrome leaves the music on the stage (9.0s)
x  2 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (U105c’s layout) (10.6s)
x  3 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (sized by the height) (10.8s)
x  4 tests\e2e\score.window-rule.spec.ts:1178:1 › folded upright after a crossing into the third bar: still below the chip, in reading order (12.9s)
x  6 tests\e2e\score.window-rule.spec.ts:1272:1 › where every sentence fits one line, the band is one line (9.0s)
x  5 tests\e2e\score.window-rule.spec.ts:1208:1 › a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage (12.6s)
ok 8 tests\e2e\score.window-rule.spec.ts:1289:1 › a tablet folds without a chip: no band, the slots at the top (7.5s)
x  7 tests\e2e\score.window-rule.spec.ts:1228:1 › what the chip says changes nothing: the band, the slots and the size stay where they were (10.3s)
6 failed
2 passed (25.9s)

❯ tests/unit/windowRendererStage.test.ts (34 tests | 4 failed | 29 skipped) 1960ms
× placed below the band while it is drawn and back at the top when it goes, with nothing fitted or engraved 66ms
× a band that is not a whole pixel starts the first slot on the pixel below it 14ms
× an ordinary fold during a frozen run: the stage gains the header’s row, the band is placed, and the shape and size hold 294ms
× a size taken while the band is drawn is priced below it: turned back while folded, it draws what a stage short by the band draws, placed under the band 1460ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯
Test Files  1 failed (1)
Tests  4 failed | 1 passed | 29 skipped (34)

## M2
build exit 0; browser exit 1; unit exit 1

ok 3 tests\e2e\score.window-rule.spec.ts:952:1 › mid-run on a phone sideways, the folded chrome leaves the music on the stage (7.0s)
ok 2 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (U105c’s layout) (9.0s)
x  4 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (sized by the height) (9.1s)
ok 1 tests\e2e\score.window-rule.spec.ts:1178:1 › folded upright after a crossing into the third bar: still below the chip, in reading order (9.5s)
ok 7 tests\e2e\score.window-rule.spec.ts:1289:1 › a tablet folds without a chip: no band, the slots at the top (7.3s)
ok 8 tests\e2e\score.window-rule.spec.ts:1272:1 › where every sentence fits one line, the band is one line (8.7s)
ok 6 tests\e2e\score.window-rule.spec.ts:1228:1 › what the chip says changes nothing: the band, the slots and the size stay where they were (9.9s)
ok 5 tests\e2e\score.window-rule.spec.ts:1208:1 › a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage (11.9s)
1 failed
7 passed (21.9s)

❯ tests/unit/windowRendererStage.test.ts (34 tests | 1 failed | 29 skipped) 1885ms
× an ordinary fold during a frozen run: the stage gains the header’s row, the band is placed, and the shape and size hold 269ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
Test Files  1 failed (1)
Tests  1 failed | 4 passed | 29 skipped (34)

## M3
build exit 0; browser exit 1; unit exit 0

ok 1 tests\e2e\score.window-rule.spec.ts:952:1 › mid-run on a phone sideways, the folded chrome leaves the music on the stage (6.8s)
ok 2 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (sized by the height) (9.0s)
ok 3 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (U105c’s layout) (9.0s)
ok 4 tests\e2e\score.window-rule.spec.ts:1178:1 › folded upright after a crossing into the third bar: still below the chip, in reading order (9.3s)
ok 8 tests\e2e\score.window-rule.spec.ts:1289:1 › a tablet folds without a chip: no band, the slots at the top (7.2s)
ok 7 tests\e2e\score.window-rule.spec.ts:1272:1 › where every sentence fits one line, the band is one line (8.5s)
ok 5 tests\e2e\score.window-rule.spec.ts:1208:1 › a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage (11.8s)
x  6 tests\e2e\score.window-rule.spec.ts:1228:1 › what the chip says changes nothing: the band, the slots and the size stay where they were (9.8s)
1 failed
7 passed (21.7s)

Test Files  1 passed (1)
Tests  5 passed | 29 skipped (34)

## M4
build exit 0; browser exit 1; unit exit 0

ok 1 tests\e2e\score.window-rule.spec.ts:952:1 › mid-run on a phone sideways, the folded chrome leaves the music on the stage (6.9s)
ok 2 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (U105c’s layout) (8.9s)
ok 3 tests\e2e\score.window-rule.spec.ts:1152:3 › folded upright, the stacked slots start below the chip and keep the size the run froze (sized by the height) (9.0s)
ok 4 tests\e2e\score.window-rule.spec.ts:1178:1 › folded upright after a crossing into the third bar: still below the chip, in reading order (9.3s)
ok 8 tests\e2e\score.window-rule.spec.ts:1289:1 › a tablet folds without a chip: no band, the slots at the top (7.2s)
x  7 tests\e2e\score.window-rule.spec.ts:1272:1 › where every sentence fits one line, the band is one line (8.5s)
ok 5 tests\e2e\score.window-rule.spec.ts:1208:1 › a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage (11.5s)
ok 6 tests\e2e\score.window-rule.spec.ts:1228:1 › what the chip says changes nothing: the band, the slots and the size stay where they were (9.7s)
1 failed
7 passed (21.6s)

Test Files  1 passed (1)
Tests  5 passed | 29 skipped (34)

source restored byte for byte: True
