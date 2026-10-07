# E50a's cleanup (the brief's disk rule): the worktree's app/node_modules, app/dist and test results, the caches
# copied from the main checkout, the two build outputs (their comparison tables are in the run folder) and the
# lane's scratch under build/e50a (the item 5 raw file and conversions, the probes, the full logs). The committed
# soundfont under app/public/content/audio stays. Output: cleanup.txt.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$Log = "$W\docs\prompts\runs\E50a\cleanup.txt"
"" | Out-File -Encoding utf8 $Log
$targets = @(
  "$W\app\node_modules", "$W\app\dist", "$W\app\test-results", "$W\test-results",
  "$W\build\cache", "$W\content\scores\imported\kern", "$W\content\scores\imported\musetrainer", "$W\content\scores\imported\mutopia",
  "$W\content\scores\generated", "$W\build\e50a"
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    try { Remove-Item -Recurse -Force $t -ErrorAction Stop -Confirm:$false; "deleted $t" | Out-File -Append -Encoding utf8 $Log }
    catch { "COULD NOT delete ${t}: $($_.Exception.Message)" | Out-File -Append -Encoding utf8 $Log }
  } else { "absent $t" | Out-File -Append -Encoding utf8 $Log }
}
Get-ChildItem "$W\build" -Filter *.json -File -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item -Force $_.FullName -Confirm:$false; "deleted build\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
Get-ChildItem "$W\app\public\content" -Force | Where-Object { $_.Name -ne "audio" } | ForEach-Object {
  Remove-Item -Recurse -Force $_.FullName -Confirm:$false; "deleted app\public\content\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
Get-ChildItem "$W\app\public\dev" -Force -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item -Recurse -Force $_.FullName -Confirm:$false; "deleted app\public\dev\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
"left under build: $((Get-ChildItem "$W\build" -Force -ErrorAction SilentlyContinue | ForEach-Object Name) -join ', ')" | Out-File -Append -Encoding utf8 $Log
