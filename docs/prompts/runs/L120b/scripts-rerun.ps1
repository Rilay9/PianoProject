# L120b's re-run after a class (item 6), detached: the offline content build with an absolute --out, the
# built catalogue and curriculum kept under build\l120b-<class>, the three files the build rewrites diffed
# against the snapshot taken before any build (build\l120b-snapshot) and restored, then the app's probe from
# the gitignored app\.probe with its config copy (never among the tests), then the table.
#   powershell -File scripts-rerun.ps1 -Class after-reading -Probe l120a
#   powershell -File scripts-rerun.ps1 -Class after-gate -Probe l120b
param([Parameter(Mandatory = $true)][string]$Class, [Parameter(Mandatory = $true)][string]$Probe)
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$runs = Join-Path $work "docs\prompts\runs\L120b\$Class"
New-Item -ItemType Directory -Force $runs | Out-Null
$kept = Join-Path $work "build\l120b-$Class"
New-Item -ItemType Directory -Force $kept | Out-Null
Set-Location $work
$contentOut = Join-Path $work 'app\public\content'
$build = Join-Path $runs 'content-build.txt'
"python tools/content/build.py --offline --out `"$contentOut`"" | Out-File -Encoding utf8 $build
cmd /c "python tools\content\build.py --offline --out `"$contentOut`" >> `"$build`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $build
Copy-Item (Join-Path $contentOut 'catalog.json') $kept -Force
Copy-Item (Join-Path $contentOut 'curriculum.json') $kept -Force
Copy-Item (Join-Path $work 'build\positions-cache.json') $kept -Force
$snap = Join-Path $work 'build\l120b-snapshot'
$restore = Join-Path $runs 'restore.txt'
"the three files the build rewrites, each diffed against build\l120b-snapshot (line endings ignored), then restored" | Out-File -Encoding utf8 $restore
foreach ($pair in @(@('content\scores\imported\SOURCES.md', 'SOURCES.md'), @('docs\prompts\inventory.md', 'inventory.md'), @('docs\prompts\rung-claims.md', 'rung-claims.md'))) {
  $live = Join-Path $work $pair[0]
  $old = Join-Path $snap $pair[1]
  $diff = Join-Path $runs ("report-" + $pair[1] + ".diff")
  cmd /c "git diff --no-index --ignore-cr-at-eol `"$old`" `"$live`" > `"$diff`" 2>&1"
  "--- $($pair[0]): exit=$LASTEXITCODE, diff in report-$($pair[1]).diff" | Out-File -Append -Encoding utf8 $restore
  Copy-Item $old $live -Force
}
cmd /c "git status --short >> `"$restore`" 2>&1"
Set-Location (Join-Path $work 'app')
$probeOut = "..\docs\prompts\runs\L120b\$Class\probe"
$probeLog = Join-Path $runs 'probe.txt'
"L120_PROBE_OUT=$probeOut npx vitest run --config .probe/vitest.$Probe.config.ts" | Out-File -Encoding utf8 $probeLog
$env:L120A_PROBE_OUT = $probeOut
$env:L120B_PROBE_OUT = $probeOut
cmd /c "npx vitest run --config .probe/vitest.$Probe.config.ts >> `"$probeLog`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $probeLog
Set-Location $work
$table = Join-Path $runs 'untaught-options-run.txt'
"python tools/content/untaught_options.py --content `"$contentOut`" --out docs/prompts/runs/L120b/$Class/untaught-options.txt --json build/l120b-$Class/untaught-options.json" | Out-File -Encoding utf8 $table
cmd /c "python tools\content\untaught_options.py --content `"$contentOut`" --out `"$runs\untaught-options.txt`" --json `"$kept\untaught-options.json`" >> `"$table`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $table
"exit=0" | Out-File -Encoding utf8 (Join-Path $kept 'rerun-exit.txt')
