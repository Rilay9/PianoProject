param([string]$Name, [string]$Command)
# Runs $Command in app/, writes its output to build/g86/$Name.log and its exit code to build/g86/$Name.exit.
Set-Location "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-acd6e29192cd7c002\app"
$log = "..\build\g86\$Name.log"
$exitFile = "..\build\g86\$Name.exit"
Remove-Item $exitFile -ErrorAction SilentlyContinue
cmd.exe /c "$Command > $log 2>&1"
$code = $LASTEXITCODE
Set-Content -Path $exitFile -Value $code -Encoding ascii
