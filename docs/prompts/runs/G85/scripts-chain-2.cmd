@echo off
rem G85's second chain, after the badge's kind and the lane's storage state: this tree's build, the map's
rem eleven specs and the pictures on it, then the unit suite. Each capture ends with its exit.
setlocal enabledelayedexpansion
set ROOT=C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af48d71ff71bb2248
set RUNS=%ROOT%\docs\prompts\runs\G85
cd /d "%ROOT%\app"
del /q "%ROOT%\build\g85\chain-2.exit" 2>nul

call npm run build:app > "%RUNS%\build-app-2.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\build-app-2.txt"
set G85_DIST=%ROOT%\app\dist

copy /y "%RUNS%\scripts-zz-g85-pictures.spec.ts" tests\e2e\zz-g85-pictures.spec.ts > nul
set OUT=%RUNS%\e2e-map-min-4433-2.txt
echo specs checked present: > "%OUT%"
set SPECS=tests/e2e/app-shell.spec.ts tests/e2e/doors.spec.ts tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/finder.spec.ts tests/e2e/help-strip.spec.ts tests/e2e/landscape.spec.ts tests/e2e/library.spec.ts tests/e2e/modes-rhythm-only.spec.ts tests/e2e/projects.spec.ts tests/e2e/wide.spec.ts
for %%F in (%SPECS% tests/e2e/zz-g85-pictures.spec.ts) do (
  if exist %%F (echo   %%F >> "%OUT%") else (echo MISSING %%F >> "%OUT%" & goto :fail)
)
call npx playwright test -c playwright.g85-4433.config.ts --workers=2 %SPECS% >> "%OUT%" 2>&1
echo exit !ERRORLEVEL! >> "%OUT%"
set G85_PHASE=after
call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/zz-g85-pictures.spec.ts > "%RUNS%\pictures-after-2.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\pictures-after-2.txt"
del /q tests\e2e\zz-g85-pictures.spec.ts

call npx vitest run > "%RUNS%\vitest-full-2.txt" 2>&1
echo exit !ERRORLEVEL! >> "%RUNS%\vitest-full-2.txt"
cd /d "%ROOT%"
git status --short > "%RUNS%\git-status-after-chain-2.txt" 2>&1
echo done > "%ROOT%\build\g85\chain-2.exit"
exit /b 0

:fail
del /q tests\e2e\zz-g85-pictures.spec.ts 2>nul
echo failed at a missing spec > "%ROOT%\build\g85\chain-2.exit"
exit /b 2
