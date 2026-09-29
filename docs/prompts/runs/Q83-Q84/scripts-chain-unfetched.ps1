# Q83+Q84: the two offline builds without Mutopia's files, the Pages flavour (strict) and CI's (personal), each to an
# absolute --out, with the three build/*-cache.json files copied fresh before each (scripts-run-build.ps1). The
# worktree's own mutopia/published is moved aside to the scratchpad and back; never the main checkout's.
# Usage: powershell -File scripts-chain-unfetched.ps1 -Phase before|after
param([string]$Phase)
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-afba154b2e72a57f9"
$Runs = "$W\docs\prompts\runs\Q83-Q84"
$Run = "$Runs\scripts-run-build.ps1"
$Scratch = "C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\9b647b56-e651-4563-9f4f-ce3e1e36a4a2\scratchpad"
$Muto = "$W\content\scores\imported\mutopia\published"
$Log = "$Runs\chain-unfetched-$Phase.txt"
Remove-Item "$Runs\chain-unfetched-$Phase.exit" -ErrorAction SilentlyContinue
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Build($name, $out, $strict) {
  Say "start $name (--offline, out=$out, strict=$strict)"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -BuildArgs "--offline" -Out $out -Strict $strict
  Say "done $name exit $(Get-Content "$Runs\$name.exit")"
}
"" | Out-File -Encoding utf8 $Log
New-Item -ItemType Directory -Force "$Scratch\q83-mutopia-aside" | Out-Null
Move-Item $Muto "$Scratch\q83-mutopia-aside\published"
Say "mutopia files aside: $(-not (Test-Path $Muto))"
Build "build-strict-unfetched-$Phase" "$W\build\q83-strict-unfetched\content" "1"
Build "build-unfetched-$Phase" "$W\build\q83-unfetched\content" "0"
Move-Item "$Scratch\q83-mutopia-aside\published" $Muto
Say "mutopia files back: $(Test-Path "$Muto\JoplinS\PineappleRag\PineappleRag.mid")"
"0" | Out-File -Encoding ascii "$Runs\chain-unfetched-$Phase.exit"
