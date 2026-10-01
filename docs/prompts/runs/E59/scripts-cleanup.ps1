# E59's cleanup (E57's, its paths moved): app/dist, app/test-results, the e2e config copy (app/build), the built content under
# app/public/content (its tracked files kept) and the build's other generated folders (app/public/dev, app/public/icons),
# tsc's build info, the copied libraries under content/scores/imported, the whole gitignored build/ (the copied caches,
# the before and after1 builds, the raw PDMX uploads and every temp file) and the __pycache__ folders the runs left.
# app/node_modules stays (operating-procedure §14). The snapshotted files the builds rewrite are restored first.
# Output to runs/E59/cleanup.txt.
$W = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
$Log = "$W\docs\prompts\runs\E59\cleanup.txt"
Set-Location $W
"" | Out-File -Encoding utf8 $Log
foreach ($rel in "docs\prompts\inventory.md", "docs\prompts\rung-claims.md", "content\scores\imported\SOURCES.md", "docs\generated\ladder.md") {
  if (Test-Path "$W\build\e59\snapshot\$rel") { Copy-Item "$W\build\e59\snapshot\$rel" "$W\$rel" -Force; "restored $rel" | Out-File -Append -Encoding utf8 $Log }
}
$tracked = @(git ls-files app/public | ForEach-Object { ($_ -replace '/', '\') })
foreach ($d in "app\dist", "app\test-results", "app\build", "app\public\dev", "app\public\icons", "build", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  if (Test-Path "$W\$d") {
    $inside = @($tracked | Where-Object { $_.StartsWith("$d\") })
    if ($inside.Count -gt 0) { "kept $d (tracked files inside)" | Out-File -Append -Encoding utf8 $Log; continue }
    try { Remove-Item -LiteralPath "$W\$d" -Recurse -Force -ErrorAction Stop; "removed $d" | Out-File -Append -Encoding utf8 $Log }
    catch { "FAILED $d : $($_.Exception.Message)" | Out-File -Append -Encoding utf8 $Log }
  }
}
foreach ($f in "app\tsconfig.app.tsbuildinfo", "app\tsconfig.node.tsbuildinfo") {
  if (Test-Path "$W\$f") { Remove-Item -LiteralPath "$W\$f" -Force; "removed $f" | Out-File -Append -Encoding utf8 $Log }
}
Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($W.Length + 1)
  if ($tracked -notcontains $rel) { Remove-Item -LiteralPath $_.FullName -Force }
}
Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
  if (-not (Get-ChildItem -LiteralPath $_.FullName -Force)) { Remove-Item -LiteralPath $_.FullName -Force }
}
"app\public\content left: $((Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -File | ForEach-Object { $_.FullName.Substring($W.Length + 1) }) -join ', ')" | Out-File -Append -Encoding utf8 $Log
foreach ($root in "tools", "content", "packaging", "docs\prompts\runs\E59") {
  Get-ChildItem -LiteralPath "$W\$root" -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Recurse -Force; "removed $($_.FullName.Substring($W.Length + 1))" | Out-File -Append -Encoding utf8 $Log
  }
}
"app\node_modules kept: $(Test-Path "$W\app\node_modules")" | Out-File -Append -Encoding utf8 $Log
"done" | Out-File -Append -Encoding utf8 $Log
