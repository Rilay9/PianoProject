@echo off
rem G85's chain, run detached: the committed build's red and pictures, this tree's build, the map's
rem specs and pictures on it, the unit suite, the fallback's Python checks. Each capture ends with its exit.
setlocal enabledelayedexpansion
set ROOT=C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af48d71ff71bb2248
set RUNS=%ROOT%\docs\prompts\runs\G85
cd /d "%ROOT%\app"
del /q "%ROOT%\build\g85\chain.exit" 2>nul

rem --- A. the committed code's app (built before any source change) ---------------------------------
set G85_DIST=%ROOT%\build\g85\dist-head
copy /y "%RUNS%\scripts-zz-g85-pictures.spec.ts" tests\e2e\zz-g85-pictures.spec.ts > nul
set OUT=%RUNS%\red\red-e2e-committed-app.txt
echo specs checked present: > "%OUT%"
for %%F in (tests\e2e\library.spec.ts tests\e2e\projects.spec.ts tests\e2e\zz-g85-pictures.spec.ts) do (
  if exist %%F (echo   %%F >> "%OUT%") else (echo MISSING %%F >> "%OUT%" & goto :fail)
)
call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/library.spec.ts tests/e2e/projects.spec.ts -g "G85|paused on its sheet" >> "%OUT%" 2>&1
echo exit !ERRORLEVEL! >> "%OUT%"
set G85_PHASE=before
call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/zz-g85-pictures.spec.ts > "%RUNS%\pictures-before.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\pictures-before.txt"

rem --- B. this tree's app ----------------------------------------------------------------------------
call npm run build:app > "%RUNS%\build-app.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\build-app.txt"
set G85_DIST=%ROOT%\app\dist

rem --- C. the map's eleven specs, then the pictures, on this tree's build ------------------------------
set OUT=%RUNS%\e2e-map-min-4433.txt
echo specs checked present: > "%OUT%"
set SPECS=tests/e2e/app-shell.spec.ts tests/e2e/doors.spec.ts tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/finder.spec.ts tests/e2e/help-strip.spec.ts tests/e2e/landscape.spec.ts tests/e2e/library.spec.ts tests/e2e/modes-rhythm-only.spec.ts tests/e2e/projects.spec.ts tests/e2e/wide.spec.ts
for %%F in (%SPECS%) do (
  if exist %%F (echo   %%F >> "%OUT%") else (echo MISSING %%F >> "%OUT%" & goto :fail)
)
call npx playwright test -c playwright.g85-4433.config.ts --workers=2 %SPECS% >> "%OUT%" 2>&1
echo exit !ERRORLEVEL! >> "%OUT%"
set G85_PHASE=after
call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/zz-g85-pictures.spec.ts > "%RUNS%\pictures-after.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\pictures-after.txt"
del /q tests\e2e\zz-g85-pictures.spec.ts

rem --- D. the unit suite -----------------------------------------------------------------------------
call npx vitest run > "%RUNS%\vitest-full.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\vitest-full.txt"

rem --- E. the fallback's Python checks (the lane config matches no pattern) -------------------------
cd /d "%ROOT%"
python -m unittest discover -s tools/midi-cleanup/tests -v > "%RUNS%\fallback-converter-harness.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\fallback-converter-harness.txt"
python tools/content/validate.py > "%RUNS%\fallback-content-validate.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\fallback-content-validate.txt"
python tools/content/review.py --check > "%RUNS%\fallback-review-check.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\fallback-review-check.txt"
python -m unittest discover -s tools/content/tests -t tools/content > "%RUNS%\fallback-content-tests.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\fallback-content-tests.txt"
git status --short > "%RUNS%\git-status-after-chain.txt" 2>&1
echo done > "%ROOT%\build\g85\chain.exit"
exit /b 0

:fail
del /q tests\e2e\zz-g85-pictures.spec.ts 2>nul
echo failed at a missing spec > "%ROOT%\build\g85\chain.exit"
exit /b 2
