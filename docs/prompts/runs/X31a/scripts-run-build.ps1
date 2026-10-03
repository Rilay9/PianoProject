# Runs one offline content build with an absolute --out (Q80's follow-up 4), its output to runs/X31a/<Name>.txt,
# stderr to <Name>.stderr.txt and its exit code to <Name>.exit. The three build/*-cache.json files are copied
# again from the main checkout (read only) first, as Q80's second chain did.
# Usage: powershell -File scripts-run-build.ps1 -Name build-before -Out <absolute dir>
param([string]$Name, [string]$Out)
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a0640d9cf113db364"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\X31a"
Set-Location $W
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING = "utf-8"
$argList = @("tools/content/build.py", "--offline", "--out", "`"$Out`"")
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$Name.exit"
