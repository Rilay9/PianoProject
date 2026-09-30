# E50b's cleanup: app/node_modules, app/dist, the built content under app/public/content (its two tracked audio files
# kept), the copied libraries under content/scores/imported and the whole gitignored build/ (the copied caches, the
# before build, the run's temp state). Output to runs/E50b/cleanup.txt.
$W = "<worktree>"
$Log = "$W\docs\prompts\runs\E50b\cleanup.txt"
Set-Location $W
"" | Out-File -Encoding utf8 $Log
$tracked = @(git ls-files app/public/content | ForEach-Object { ($_ -replace '/', '\') })
foreach ($d in "app\node_modules", "app\dist", "app\test-results", "build", "content\scores\imported\kern", "content\scores\imported\musetrainer", "content\scores\imported\mutopia") {
  if (Test-Path "$W\$d") {
    try { Remove-Item -LiteralPath "$W\$d" -Recurse -Force -ErrorAction Stop; "removed $d" | Out-File -Append -Encoding utf8 $Log }
    catch { "FAILED $d : $($_.Exception.Message)" | Out-File -Append -Encoding utf8 $Log }
  }
}
Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($W.Length + 1)
  if ($tracked -notcontains $rel) { Remove-Item -LiteralPath $_.FullName -Force }
}
Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
  if (-not (Get-ChildItem -LiteralPath $_.FullName -Force)) { Remove-Item -LiteralPath $_.FullName -Force }
}
"app\public\content left: $((Get-ChildItem -LiteralPath "$W\app\public\content" -Recurse -File | ForEach-Object { $_.FullName.Substring($W.Length + 1) }) -join ', ')" | Out-File -Append -Encoding utf8 $Log
"done" | Out-File -Append -Encoding utf8 $Log
