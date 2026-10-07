# L120b's fresh-worktree setup (Q24), detached: the parity reference, the three files the build rewrites
# snapshotted, the copies from the main checkout (read only), npm ci, the offline content build with an
# absolute --out (the "before" build: base tree, nothing changed), the built catalogue and curriculum kept
# under build\l120b-before, then the three files restored from the snapshot with each one's diff kept.
# The worktree is four folders above this script; the main checkout is three above the worktree.
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$main = (Resolve-Path (Join-Path $work '..\..\..')).Path
$runs = Join-Path $work 'docs\prompts\runs\L120b'
Set-Location $work
cmd /c "python tools\midi-cleanup\tests\parity_reference.py > `"$runs\parity-reference.txt`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 (Join-Path $runs 'parity-reference.txt')
$snap = Join-Path $work 'build\l120b-snapshot'
New-Item -ItemType Directory -Force $snap | Out-Null
Copy-Item (Join-Path $work 'content\scores\imported\SOURCES.md') $snap -Force
Copy-Item (Join-Path $work 'docs\prompts\inventory.md') $snap -Force
Copy-Item (Join-Path $work 'docs\prompts\rung-claims.md') $snap -Force
$out = Join-Path $runs 'copy.txt'
"copies from the main checkout (read only): robocopy <main>\<path> <worktree>\<path> for each path below" | Out-File -Encoding utf8 $out
foreach ($file in @('positions-cache.json', 'demands-cache.json', 'notation-cache.json')) {
  robocopy (Join-Path $main 'build') (Join-Path $work 'build') $file /NFL /NDL /NJH /NJS | Out-Null
  "robocopy build\$file exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $out
}
foreach ($dir in @('build\cache', 'build\midi-real', 'content\scores\imported\kern', 'content\scores\imported\musetrainer', 'content\scores\imported\mutopia')) {
  robocopy (Join-Path $main $dir) (Join-Path $work $dir) /E /XD .git /NFL /NDL /NJH /NJS | Out-Null
  "robocopy $dir (/E, without .git) exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $out
}
Set-Location (Join-Path $work 'app')
cmd /c "npm ci > `"$work\build\npm-ci.txt`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 (Join-Path $work 'build\npm-ci.txt')
Set-Location $work
$contentOut = Join-Path $work 'app\public\content'
$build = Join-Path $work 'build\content-build-before.txt'
"python tools/content/build.py --offline --out `"$contentOut`"" | Out-File -Encoding utf8 $build
cmd /c "python tools\content\build.py --offline --out `"$contentOut`" >> `"$build`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $build
$before = Join-Path $work 'build\l120b-before'
New-Item -ItemType Directory -Force $before | Out-Null
Copy-Item (Join-Path $contentOut 'catalog.json') $before -Force
Copy-Item (Join-Path $contentOut 'curriculum.json') $before -Force
Copy-Item (Join-Path $work 'content\curriculum\vocabulary\demands.json') (Join-Path $before 'demands.json') -Force
Copy-Item (Join-Path $work 'build\positions-cache.json') (Join-Path $before 'positions-cache.json') -Force
$restore = Join-Path $runs 'restore-before.txt'
"the three files the build rewrites, diffed against build\l120b-snapshot after the before build, then restored" | Out-File -Encoding utf8 $restore
foreach ($pair in @(@('content\scores\imported\SOURCES.md', 'SOURCES.md'), @('docs\prompts\inventory.md', 'inventory.md'), @('docs\prompts\rung-claims.md', 'rung-claims.md'))) {
  $live = Join-Path $work $pair[0]
  $kept = Join-Path $snap $pair[1]
  "--- $($pair[0])" | Out-File -Append -Encoding utf8 $restore
  cmd /c "git diff --no-index --stat --ignore-cr-at-eol `"$kept`" `"$live`" >> `"$restore`" 2>&1"
  Copy-Item $kept $live -Force
}
cmd /c "git status --short >> `"$restore`" 2>&1"
"exit=0" | Out-File -Encoding utf8 (Join-Path $work 'build\chain-setup-exit.txt')
