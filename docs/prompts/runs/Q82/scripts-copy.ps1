# Q82's fresh-worktree copies, read-only from the main checkout (Q80's copy.txt, the same list):
# the conversion cache, the real MIDI, the three measurement caches, and the kern, MuseTrainer and Mutopia
# clones without their .git. robocopy's exit 1 means "files copied"; 0 "nothing to copy"; 8 and up is a failure.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af3e3368f50c0e179"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Log = "$W\docs\prompts\runs\Q82\copy.txt"
"" | Out-File -Encoding utf8 $Log
foreach ($rel in "build\cache", "build\midi-real", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  & robocopy "$M\$rel" "$W\$rel" /E /XD .git /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
  "robocopy $rel exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
}
& robocopy "$M\build" "$W\build" "demands-cache.json" "positions-cache.json" "notation-cache.json" /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
"robocopy build\*-cache.json exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
