# Q80, after the change: the builds in turn, each to its own log and exit file (scripts-run-build.ps1), moving the
# worktree's own fetched copies aside and back between them. Never the main checkout's copies.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3f4947aae693d7cc"
$Runs = "$W\docs\prompts\runs\Q80"
$Run = "$Runs\scripts-run-build.ps1"
$Aside = "C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\9b647b56-e651-4563-9f4f-ce3e1e36a4a2\scratchpad\q80-mutopia-aside"
$KernAside = "C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\9b647b56-e651-4563-9f4f-ce3e1e36a4a2\scratchpad\q80-kern-aside"
$Muto = "$W\content\scores\imported\mutopia\published"
$Joplin = "$W\content\scores\imported\kern\joplin"
$Log = "$Runs\chain-after.txt"
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Build($name, $buildArgs, $strict) {
  Say "start $name ($buildArgs, strict=$strict)"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -BuildArgs $buildArgs -Strict $strict
  Say "done $name exit $(Get-Content "$Runs\$name.exit")"
}
"" | Out-File -Encoding utf8 $Log
# 1. Mutopia's files back: the strict build with everything fetched (item 3: today's Pages comparison).
Move-Item "$Aside\published" $Muto; Say "mutopia files back: $(Test-Path "$Muto\JoplinS\PineappleRag\PineappleRag.mid")"
Build "build-strict-fetched-after" "--offline --out build/q80-strict/content" "1"
# 2. Mutopia's files aside again: both flavours without them, after the change.
Move-Item $Muto "$Aside\published"; Say "mutopia files aside: $(-not (Test-Path $Muto))"
Build "build-unfetched-after" "--offline --out build/q80-unfetched/content" "0"
Build "build-strict-unfetched-after" "--offline --out build/q80-strict-unfetched/content" "1"
# 3. Mutopia back, the kern joplin clone aside: what an unreachable kern repository does.
Move-Item "$Aside\published" $Muto; Say "mutopia files back: $(Test-Path "$Muto\JoplinS\PineappleRag\PineappleRag.mid")"
New-Item -ItemType Directory -Force $KernAside | Out-Null
Move-Item $Joplin "$KernAside\joplin"; Say "kern/joplin aside: $(-not (Test-Path $Joplin))"
Build "build-kern-joplin-unfetched-after" "--offline --out build/q80-kern-unfetched/content" "0"
Move-Item "$KernAside\joplin" $Joplin; Say "kern/joplin back: $(Test-Path $Joplin)"
# 4. Everything present: the default build, as the map's content-build check runs it.
Build "build-final-personal" "--offline" "0"
Say "chain finished"
"0" | Out-File -Encoding ascii "$Runs\chain-after.exit"
