# Q82's builds with a clone moved aside, before (HEAD's code) or after the change: -Phase before|after.
# Every --out is absolute (Q80's follow-up 4), and the three build/*-cache.json files are copied again from the main
# checkout (read only) before each build, since a strict build prunes the demands cache to its own files. Only the
# worktree's own copies are moved aside (see $Aside) and back; the main checkout is never touched. After each
# build the validator runs on its own on that output with the flavour's flags, so its warnings are read (the build
# step keeps only the validator's last line when it passes).
#   kern    the kern/joplin clone aside (Q80's stop finding: 46 rows, 21 of them on rungs)
#   mt      five MuseTrainer files aside: three on rungs 2.3-2.5, one the owner's build carries for its composition
#           (Mariage_dAmour.mxl), one the table excludes for its edition (Canon_in_D_3.mxl, which must stay excluded)
#   mtlib   the whole MuseTrainer clone aside (what a failed clone leaves)
#   chopin  the kern/chopin-first-editions clone aside, after only (the group rows; the stop line)
# -Only mt,mtlib runs just those cases (phase after2: the mt builds again once validate.py's sections change was in,
# since the first after run of mt validated with the code before it).
param([string]$Phase, [string]$Only = "")
function Want($case) { return ($Only -eq "") -or (($Only -split ",") -contains $case) }
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af3e3368f50c0e179"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q82"
$Run = "$Runs\scripts-run.ps1"
# The before phase moved them into the session scratchpad, which other sessions share; the whole MuseTrainer clone
# went missing from there during that phase (copy-musetrainer-again.txt). From the after phase on they go to the
# worktree's own build/ folder, which is gitignored and which no build step reads for scores.
$Aside = if ($Phase -eq "before") { "C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\9b647b56-e651-4563-9f4f-ce3e1e36a4a2\scratchpad\q82-aside-$Phase" } else { "$W\build\q82-aside-$Phase" }
$Imported = "$W\content\scores\imported"
$MtFiles = @("Happy_Birthday_To_You_C_Major.mxl", "Greensleeves_for_Piano_easy_and_beautiful.mxl", "Ode_to_Joy_Easy_variation.mxl", "Mariage_dAmour.mxl", "Canon_in_D_3.mxl")
$Log = "$Runs\chain-$Phase.txt"
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Caches() {
  foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
}
function Build($case, $strict) {
  Caches
  $flavour = if ($strict -eq "1") { "strict" } else { "personal" }
  $name = "build-$case-$flavour-$Phase"
  $out = "$W\build\q82-$case-$flavour-$Phase\content"
  Say "start $name (--offline, out=$out, strict=$strict; caches copied from the main checkout)"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -ArgStr "tools/content/build.py|--offline|--out|$out" -Strict $strict
  Say "done $name exit $(Get-Content "$Runs\$name.exit")"
  $flags = if ($strict -eq "1") { "--strict-license" } else { "--allow-nc|--personal" }
  & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name "validate-$case-$flavour-$Phase" -ArgStr "tools/content/validate.py|--dir|$out|$flags" -Strict $strict
  Say "done validate-$case-$flavour-$Phase exit $(Get-Content "$Runs\validate-$case-$flavour-$Phase.exit")"
}
function MoveAside($from, $to) {
  New-Item -ItemType Directory -Force (Split-Path $to) | Out-Null
  Move-Item $from $to
  Say "aside: $from -> $to (gone from the worktree: $(-not (Test-Path $from)))"
}
function MoveBack($from, $to) {
  Move-Item $from $to
  Say "back: $to (present: $(Test-Path $to))"
}
"" | Out-File -Encoding utf8 $Log
Say "phase $Phase"

# kern/joplin aside
if (Want "kern") {
  MoveAside "$Imported\kern\joplin" "$Aside\kern\joplin"
  Build "kern" "0"
  Build "kern" "1"
  MoveBack "$Aside\kern\joplin" "$Imported\kern\joplin"
}

# five MuseTrainer files aside
if (Want "mt") {
  foreach ($f in $MtFiles) { MoveAside "$Imported\musetrainer\scores\$f" "$Aside\mt\$f" }
  Build "mt" "0"
  Build "mt" "1"
  foreach ($f in $MtFiles) { MoveBack "$Aside\mt\$f" "$Imported\musetrainer\scores\$f" }
}

# the whole MuseTrainer clone aside
if (Want "mtlib") {
  MoveAside "$Imported\musetrainer" "$Aside\musetrainer"
  Build "mtlib" "0"
  Build "mtlib" "1"
  MoveBack "$Aside\musetrainer" "$Imported\musetrainer"
}

if ($Phase -eq "after" -and (Want "chopin")) {
  MoveAside "$Imported\kern\chopin-first-editions" "$Aside\kern\chopin-first-editions"
  Build "chopin" "0"
  MoveBack "$Aside\kern\chopin-first-editions" "$Imported\kern\chopin-first-editions"
}

Say "every clone back: joplin $(Test-Path "$Imported\kern\joplin"), musetrainer $((Get-ChildItem "$Imported\musetrainer\scores" -File).Count) files in scores, chopin-first-editions $(Test-Path "$Imported\kern\chopin-first-editions")"
Say "chain finished"
"0" | Out-File -Encoding ascii "$Runs\chain-$Phase.exit"
