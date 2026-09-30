# L120c's re-run after a class (item 11), detached, as L120b's: the offline content build with an absolute
# --out (skipped with -NoBuild, for the base, whose build the setup ran), the built catalogue and curriculum
# kept under build\l120c-<class>, the three files the build rewrites diffed against the snapshot taken before
# any build (build\l120c-snapshot) and restored, then the app's probe from the gitignored app\.probe with its
# config copy (never among the tests), then the table.
#   powershell -File scripts-rerun.ps1 -Class base -NoBuild
#   powershell -File scripts-rerun.ps1 -Class after-ownership
#   powershell -File scripts-rerun.ps1 -Class after-placement
param([Parameter(Mandatory = $true)][string]$Class, [switch]$NoBuild)
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$runs = Join-Path $work "docs\prompts\runs\L120c\$Class"
New-Item -ItemType Directory -Force $runs | Out-Null
$kept = Join-Path $work "build\l120c-$Class"
New-Item -ItemType Directory -Force $kept | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $kept 'rerun-exit.txt')
Set-Location $work
$contentOut = Join-Path $work 'app\public\content'
if (-not $NoBuild) {
  $build = Join-Path $runs 'content-build.txt'
  "python tools/content/build.py --offline --out `"$contentOut`"" | Out-File -Encoding utf8 $build
  cmd /c "python tools\content\build.py --offline --out `"$contentOut`" >> `"$build`" 2>&1"
  "exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $build
  $snap = Join-Path $work 'build\l120c-snapshot'
  $restore = Join-Path $runs 'restore.txt'
  "the three files the build rewrites, each diffed against build\l120c-snapshot (line endings ignored), then restored" | Out-File -Encoding utf8 $restore
  foreach ($pair in @(@('content\scores\imported\SOURCES.md', 'SOURCES.md'), @('docs\prompts\inventory.md', 'inventory.md'), @('docs\prompts\rung-claims.md', 'rung-claims.md'))) {
    $live = Join-Path $work $pair[0]
    $old = Join-Path $snap $pair[1]
    $diff = Join-Path $runs ("report-" + $pair[1] + ".diff")
    cmd /c "git diff --no-index --ignore-cr-at-eol `"$old`" `"$live`" > `"$diff`" 2>&1"
    "--- $($pair[0]): exit=$LASTEXITCODE, diff in report-$($pair[1]).diff" | Out-File -Append -Encoding utf8 $restore
    Copy-Item $live (Join-Path $kept $pair[1]) -Force
    Copy-Item $old $live -Force
  }
  cmd /c "git status --short >> `"$restore`" 2>&1"
}
Copy-Item (Join-Path $contentOut 'catalog.json') $kept -Force
Copy-Item (Join-Path $contentOut 'curriculum.json') $kept -Force
Set-Location (Join-Path $work 'app')
$probeOut = "..\docs\prompts\runs\L120c\$Class\probe"
$probeLog = Join-Path $runs 'probe.txt'
"L120C_PROBE_OUT=$probeOut npx vitest run --config .probe/vitest.l120c.config.ts" | Out-File -Encoding utf8 $probeLog
$env:L120C_PROBE_OUT = $probeOut
cmd /c "npx vitest run --config .probe/vitest.l120c.config.ts >> `"$probeLog`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $probeLog
Set-Location $work
$table = Join-Path $runs 'untaught-options-run.txt'
"python tools/content/untaught_options.py --content `"$contentOut`" --out docs/prompts/runs/L120c/$Class/untaught-options.txt --json build/l120c-$Class/untaught-options.json" | Out-File -Encoding utf8 $table
cmd /c "python tools\content\untaught_options.py --content `"$contentOut`" --out `"$runs\untaught-options.txt`" --json `"$kept\untaught-options.json`" >> `"$table`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $table
"exit=0" | Out-File -Encoding utf8 (Join-Path $kept 'rerun-exit.txt')
