# L120a's fresh-worktree setup (Q24), detached: the copies from the main checkout (read only), npm ci,
# the offline content build with an absolute --out, then the three files the build rewrites restored
# from the snapshot taken before any build (build\l120a-snapshot). The first build
# (content-build-1-no-node-modules.txt) failed at the demands step: no app\node_modules in the worktree.
# The worktree is four folders above this script; the main checkout is three above the worktree.
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$main = (Resolve-Path (Join-Path $work '..\..\..')).Path
$runs = Join-Path $work 'docs\prompts\runs\L120a'
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
cmd /c "npm ci > `"$runs\npm-ci.txt`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 (Join-Path $runs 'npm-ci.txt')
Set-Location $work
$contentOut = Join-Path $work 'app\public\content'
$build = Join-Path $runs 'content-build.txt'
"python tools/content/build.py --offline --out `"$contentOut`"" | Out-File -Encoding utf8 $build
cmd /c "python tools\content\build.py --offline --out `"$contentOut`" >> `"$build`" 2>&1"
"exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $build
$restore = Join-Path $runs 'restore.txt'
"restored from build\l120a-snapshot after the build" | Out-File -Encoding utf8 $restore
Copy-Item (Join-Path $work 'build\l120a-snapshot\SOURCES.md') (Join-Path $work 'content\scores\imported\SOURCES.md') -Force
Copy-Item (Join-Path $work 'build\l120a-snapshot\inventory.md') (Join-Path $work 'docs\prompts\inventory.md') -Force
Copy-Item (Join-Path $work 'build\l120a-snapshot\rung-claims.md') (Join-Path $work 'docs\prompts\rung-claims.md') -Force
"exit=0" | Out-File -Encoding utf8 (Join-Path $runs 'chain-setup-exit.txt')
