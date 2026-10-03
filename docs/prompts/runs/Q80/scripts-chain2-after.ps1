# Q80, after the change, second chain. The first (scripts-chain-after.ps1) used relative --out paths, and the
# demands step runs the detectors from app/, so a file not in build/demands-cache.json was looked for under
# app/build/... and not found; a strict build also leaves the cache holding only its own files. So here: every --out
# is absolute, and the three build/*-cache.json files are copied again from the main checkout (read only) before
# each build. The worktree's own fetched copies are moved aside and back; never the main checkout's.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3f4947aae693d7cc"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q80"
$Run = "$Runs\scripts-run-build.ps1"
$Scratch = "C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\9b647b56-e651-4563-9f4f-ce3e1e36a4a2\scratchpad"
$Muto = "$W\content\scores\imported\mutopia\published"
$Joplin = "$W\content\scores\imported\kern\joplin"
$Log = "$Runs\chain2-after.txt"
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Caches() {
  foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
  Say "caches copied from the main checkout"
}
function Build($name, $out, $strict) {
  Caches
  Say "start $name (--offline, out=$out, strict=$strict)"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -BuildArgs "--offline" -Out $out -Strict $strict
  Say "done $name exit $(Get-Content "$Runs\$name.exit")"
}
"" | Out-File -Encoding utf8 $Log
# 1. Mutopia's files aside: the owner's build (CI's flavour) without them, after the change.
New-Item -ItemType Directory -Force "$Scratch\q80-mutopia-aside" | Out-Null
Move-Item $Muto "$Scratch\q80-mutopia-aside\published"; Say "mutopia files aside: $(-not (Test-Path $Muto))"
Build "build-unfetched-after" "$W\build\q80-unfetched\content" "0"
# 2. Back: the strict build with everything fetched (item 3).
Move-Item "$Scratch\q80-mutopia-aside\published" $Muto; Say "mutopia files back: $(Test-Path "$Muto\JoplinS\PineappleRag\PineappleRag.mid")"
Build "build-strict-fetched-after" "$W\build\q80-strict\content" "1"
# 3. The kern joplin clone aside: what an unreachable kern repository does.
New-Item -ItemType Directory -Force "$Scratch\q80-kern-aside" | Out-Null
Move-Item $Joplin "$Scratch\q80-kern-aside\joplin"; Say "kern/joplin aside: $(-not (Test-Path $Joplin))"
Build "build-kern-joplin-unfetched-after" "$W\build\q80-kern-unfetched\content" "0"
Move-Item "$Scratch\q80-kern-aside\joplin" $Joplin; Say "kern/joplin back: $(Test-Path $Joplin)"
# 4. Everything present: the default build, as the map's content-build check runs it.
Build "build-final-personal" "$W\app\public\content" "0"
Say "chain finished"
"0" | Out-File -Encoding ascii "$Runs\chain2-after.exit"
