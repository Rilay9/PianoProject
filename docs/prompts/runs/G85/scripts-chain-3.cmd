@echo off
rem G85's draw timing: the committed build and this tree's, alternately, three rounds each, on 4433.
setlocal enabledelayedexpansion
set ROOT=C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af48d71ff71bb2248
set RUNS=%ROOT%\docs\prompts\runs\G85
cd /d "%ROOT%\app"
del /q "%ROOT%\build\g85\chain-3.exit" 2>nul
copy /y "%RUNS%\scripts-zz-g85-draw-timing.spec.ts" tests\e2e\zz-g85-draw-timing.spec.ts > nul
set OUT=%RUNS%\draw-timing.txt
echo alternating builds, three rounds > "%OUT%"
for %%R in (1 2 3) do (
  set G85_ROUND=%%R
  set G85_PHASE=before
  set G85_DIST=%ROOT%\build\g85\dist-head
  echo --- round %%R before >> "%OUT%"
  call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/zz-g85-draw-timing.spec.ts >> "%OUT%" 2>&1
  echo exit !ERRORLEVEL! >> "%OUT%"
  set G85_PHASE=after
  set G85_DIST=%ROOT%\app\dist
  echo --- round %%R after >> "%OUT%"
  call npx playwright test -c playwright.g85-4433.config.ts --workers=1 tests/e2e/zz-g85-draw-timing.spec.ts >> "%OUT%" 2>&1
  echo exit !ERRORLEVEL! >> "%OUT%"
)
del /q tests\e2e\zz-g85-draw-timing.spec.ts
echo done > "%ROOT%\build\g85\chain-3.exit"
