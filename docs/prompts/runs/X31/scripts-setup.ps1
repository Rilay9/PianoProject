# X31's fresh-worktree setup (Q24; Q80's precedent): the fetched libraries and the build's caches copied
# read-only from the main checkout (robocopy /E, never /MIR, .git left out). Output to runs/X31/setup-copy.txt;
# robocopy's exit 1 means files were copied, 0 nothing to copy, 8 or more a failure.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-ad68f7e71fb77280b"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\X31"
$Log = "$Runs\setup-copy.txt"
"" | Out-File -Encoding utf8 $Log
foreach ($d in "build\cache", "build\midi-real", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  & robocopy "$M\$d" "$W\$d" /E /XD .git /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
  "robocopy $d exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
}
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json", "score-checks.cache.json") {
  Copy-Item "$M\build\$f" "$W\build\$f" -Force
  "copied build\$f" | Out-File -Append -Encoding utf8 $Log
}
"setup finished" | Out-File -Append -Encoding utf8 $Log
