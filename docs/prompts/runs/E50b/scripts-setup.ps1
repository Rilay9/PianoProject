# E50b's fresh-worktree setup (E50's script, paths changed): the fetched libraries and the build's caches copied
# read-only from the main checkout (robocopy /E, never /MIR, .git left out), the four files the builds rewrite
# snapshotted first, then npm ci. Output to runs/E50b/setup.txt; robocopy's exit 1 means files were copied,
# 0 nothing to copy, 8 or more a failure.
$W = "<worktree>"
$M = "<home>\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\E50b"
$Log = "$Runs\setup.txt"
$Snap = "$W\build\e50b\snapshot"
"" | Out-File -Encoding utf8 $Log
foreach ($rel in "docs\prompts\inventory.md", "docs\prompts\rung-claims.md", "content\scores\imported\SOURCES.md", "docs\generated\ladder.md") {
  New-Item -ItemType Directory -Force (Split-Path "$Snap\$rel") | Out-Null
  Copy-Item "$W\$rel" "$Snap\$rel" -Force
  "snapshotted $rel" | Out-File -Append -Encoding utf8 $Log
}
foreach ($d in "build\cache", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  & robocopy "$M\$d" "$W\$d" /E /XD .git /NFL /NDL /NJH /NP | Out-File -Append -Encoding utf8 $Log
  "robocopy $d exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
}
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json", "score-checks.cache.json") {
  Copy-Item "$M\build\$f" "$W\build\$f" -Force
  "copied build\$f" | Out-File -Append -Encoding utf8 $Log
}
Set-Location "$W\app"
$p = Start-Process -FilePath "npm.cmd" -ArgumentList @("ci", "--no-audit", "--no-fund") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$W\build\e50b\npm-ci.txt" -RedirectStandardError "$W\build\e50b\npm-ci.stderr.txt"
"npm ci exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
Set-Location $W
"setup finished" | Out-File -Append -Encoding utf8 $Log
"done" | Out-File -Encoding ascii "$W\build\e50b\setup.exit"
