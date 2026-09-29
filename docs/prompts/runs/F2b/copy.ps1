$main = 'C:\Users\yalir\repos\Piano Stuff\PianoProject'
$wt = 'C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a0b4282eb6ab6fcc3'
$out = Join-Path $wt 'docs\prompts\runs\F2b\copy.txt'
$lines = @('copies from the main checkout (read only): powershell -File copy.ps1 (robocopy /E /NFL /NDL /NJH /NJS /NP per input)')
$dirs = @('content\scores\imported\kern', 'content\scores\imported\musetrainer', 'build\cache\convert', 'build\midi-real')
foreach ($d in $dirs) {
  robocopy (Join-Path $main $d) (Join-Path $wt $d) /E /NFL /NDL /NJH /NJS /NP | Out-Null
  $lines += "robocopy $d exit=$LASTEXITCODE"
}
foreach ($f in @('positions-cache.json', 'demands-cache.json', 'notation-cache.json')) {
  robocopy (Join-Path $main 'build') (Join-Path $wt 'build') $f /NFL /NDL /NJH /NJS /NP | Out-Null
  $lines += "robocopy build\$f exit=$LASTEXITCODE"
}
$lines += 'exit=0'
$lines | Out-File -FilePath $out -Encoding utf8
$lines
