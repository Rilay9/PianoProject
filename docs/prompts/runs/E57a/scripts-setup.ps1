# E57a's fresh-worktree setup (E57's scripts-setup.ps1, copied; only the folder names changed, so nothing under runs/E57 or
# build/e57 is written): the fetched libraries and the build's caches copied read-only from the main checkout (robocopy /E,
# never /MIR, .git left out), the four files the builds rewrite snapshotted first, then npm ci. Output to
# build/e57a/setup.txt; robocopy's exit 1 means files were copied, 0 nothing to copy, 8 or more a failure. The PDMX archive
# is not copied: it is read in place.
$W = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
$M = (Resolve-Path "$W\..\..\..").Path
$Log = "$W\build\e57a\setup.txt"
$Snap = "$W\build\e57a\snapshot"
New-Item -ItemType Directory -Force "$W\build\e57a" | Out-Null
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
  if (Test-Path "$M\build\$f") { Copy-Item "$M\build\$f" "$W\build\$f" -Force; "copied build\$f" | Out-File -Append -Encoding utf8 $Log }
  else { "absent in the main checkout: build\$f" | Out-File -Append -Encoding utf8 $Log }
}
Set-Location "$W\app"
$p = Start-Process -FilePath "npm.cmd" -ArgumentList @("ci", "--no-audit", "--no-fund") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$W\build\e57a\npm-ci.txt" -RedirectStandardError "$W\build\e57a\npm-ci.stderr.txt"
"npm ci exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Log
Set-Location $W
"setup finished" | Out-File -Append -Encoding utf8 $Log
"done" | Out-File -Encoding ascii "$W\build\e57a\setup.exit"
