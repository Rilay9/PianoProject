# E50a, the second implementation HEAD (the reviewer's required correction, questions-bd7d303e.md §5): the setup
# again (the first run's cleanup deleted it), then one offline build with the final bytes into the absolute
# default place (app/public/content), then the validator and the review check on it. Logs under build/e50a/;
# detached, its end marked by build/e50a/chain-second.exit.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$L = "$W\build\e50a"
$Log = "$L\setup-second.txt"
$Snap = "$L\snapshot"
"" | Out-File -Encoding utf8 $Log
foreach ($rel in "docs\prompts\inventory.md", "docs\prompts\rung-claims.md", "content\scores\imported\SOURCES.md", "docs\generated\ladder.md") {
  New-Item -ItemType Directory -Force (Split-Path "$Snap\$rel") | Out-Null
  Copy-Item "$W\$rel" "$Snap\$rel" -Force
  "snapshotted $rel" | Out-File -Append -Encoding utf8 $Log
}
foreach ($d in "build\cache", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  & robocopy "$M\$d" "$W\$d" /E /XD .git /NFL /NDL /NJH /NP | Out-Null
  "robocopy $d exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 $Log
}
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json", "score-checks.cache.json") {
  Copy-Item "$M\build\$f" "$W\build\$f" -Force
  "copied build\$f" | Out-File -Append -Encoding utf8 $Log
}
Set-Location "$W\app"
$p = Start-Process -FilePath "npm.cmd" -ArgumentList @("ci", "--no-audit", "--no-fund") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$L\npm-ci.txt" -RedirectStandardError "$L\npm-ci.stderr.txt"
"npm ci exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
Set-Location $W
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING = "utf-8"
$p = Start-Process -FilePath "python" -ArgumentList @("tools/content/build.py", "--offline", "--out", "`"$W\app\public\content`"") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$L\build-second.txt" -RedirectStandardError "$L\build-second.stderr.txt"
"build exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
$p = Start-Process -FilePath "python" -ArgumentList @("tools/content/validate.py", "--dir", "`"$W\app\public\content`"", "--allow-nc", "--personal") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$L\validate-second.txt" -RedirectStandardError "$L\validate-second.stderr.txt"
"validate exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
$p = Start-Process -FilePath "python" -ArgumentList @("tools/content/review.py", "--check", "--content", "`"$W\app\public\content`"") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$L\review-check-second.txt" -RedirectStandardError "$L\review-check-second.stderr.txt"
"review check exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
"done" | Out-File -Encoding ascii "$L\chain-second.exit"
