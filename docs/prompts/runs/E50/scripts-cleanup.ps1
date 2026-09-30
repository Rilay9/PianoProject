# E50's cleanup (E50a's script, paths changed, the brief's disk rule): the worktree's app/node_modules, app/dist, the
# Playwright config copy and its results (app/build), the caches and fetched sources copied from the main checkout,
# the two build outputs and the lane's scratch under build/e50 (raw uploads, conversions, probes, full logs; their
# summaries are in the run folder), the copied content under app/public/content (the committed soundfont under
# audio stays), the microscope data under app/public/dev, and what build:app generated (icons, tsbuildinfo).
# Output: runs/E50/cleanup.txt.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3647139d9ceabd16"
$Log = "$W\docs\prompts\runs\E50\cleanup.txt"
"" | Out-File -Encoding utf8 $Log
$targets = @(
  "$W\app\node_modules", "$W\app\dist", "$W\app\build", "$W\app\test-results", "$W\test-results",
  "$W\build\cache", "$W\content\scores\imported\kern", "$W\content\scores\imported\musetrainer", "$W\content\scores\imported\mutopia",
  "$W\content\scores\generated", "$W\build\e50", "$W\app\public\icons", "$W\app\tsconfig.app.tsbuildinfo", "$W\app\tsconfig.node.tsbuildinfo"
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    try { Remove-Item -Recurse -Force $t -ErrorAction Stop -Confirm:$false; "deleted $t" | Out-File -Append -Encoding utf8 $Log }
    catch { "COULD NOT delete ${t}: $($_.Exception.Message)" | Out-File -Append -Encoding utf8 $Log }
  } else { "absent $t" | Out-File -Append -Encoding utf8 $Log }
}
Get-ChildItem "$W\build" -File -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item -Force $_.FullName -Confirm:$false; "deleted build\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
Get-ChildItem "$W\app\public\content" -Force | Where-Object { $_.Name -ne "audio" } | ForEach-Object {
  Remove-Item -Recurse -Force $_.FullName -Confirm:$false; "deleted app\public\content\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
Get-ChildItem "$W\app\public\dev" -Force -ErrorAction SilentlyContinue | ForEach-Object {
  Remove-Item -Recurse -Force $_.FullName -Confirm:$false; "deleted app\public\dev\$($_.Name)" | Out-File -Append -Encoding utf8 $Log
}
"left under build: $((Get-ChildItem "$W\build" -Force -ErrorAction SilentlyContinue | ForEach-Object Name) -join ', ')" | Out-File -Append -Encoding utf8 $Log
"left under app\public\content: $((Get-ChildItem "$W\app\public\content" -Force | ForEach-Object Name) -join ', ')" | Out-File -Append -Encoding utf8 $Log
