# Q83+Q84, fresh-worktree setup: copies what an offline build needs from the main checkout, read only there
# (robocopy reads the source and writes only the destination). The fetched clones are copied without .git.
# robocopy exit 1 = files copied, 0 = nothing to copy; 8 and above is a failure.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-afba154b2e72a57f9"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Log = "$W\docs\prompts\runs\Q83-Q84\copy.txt"
"" | Out-File -Encoding utf8 $Log
foreach ($d in "build\cache", "build\midi-real", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  robocopy "$M\$d" "$W\$d" /E /XD .git /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
  "robocopy $d exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
}
robocopy "$M\build" "$W\build" "demands-cache.json" "positions-cache.json" "notation-cache.json" /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
"robocopy build\*-cache.json exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
