# Copies the content build's caches and the imported scores from the main checkout (read only), as G2 did
# (docs/prompts/runs/G2/copy.txt): the offline build in a fresh worktree lacks them and exits 1 with items missing.
# The worktree is four folders above this script (docs/prompts/runs/X1); the main checkout is three above the
# worktree (<main>/<tool folder>/worktrees/<worktree>).
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$main = (Resolve-Path (Join-Path $work '..\..\..')).Path
$out = Join-Path $work 'docs\prompts\runs\X1\copy.txt'
"copies from the main checkout (read only): robocopy <main>\<path> <worktree>\<path> for each path below" | Out-File -Encoding utf8 $out
foreach ($file in @('positions-cache.json', 'demands-cache.json', 'notation-cache.json')) {
  robocopy (Join-Path $main 'build') (Join-Path $work 'build') $file /NFL /NDL /NJH /NJS | Out-Null
  "robocopy build\$file exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $out
}
foreach ($dir in @('build\cache\convert', 'build\midi-real', 'content\scores\imported\kern', 'content\scores\imported\musetrainer')) {
  robocopy (Join-Path $main $dir) (Join-Path $work $dir) /E /XD .git /NFL /NDL /NJH /NJS | Out-Null
  "robocopy $dir (/E, without .git) exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $out
}
"exit=0" | Out-File -Append -Encoding utf8 $out
