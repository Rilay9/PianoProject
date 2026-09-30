# Q88: the fresh worktree's setup (Q24) and item 5's two strict builds, detached, one log (chain.txt), one exit
# file (chain.exit). The main checkout is only read (robocopy from it); the worktree's own copy of Mutopia's files is
# moved aside under the worktree's gitignored build/ and back. The three files a build rewrites are snapshotted first
# and copied back last. Every --out is absolute (Q80's follow-up 4), and the three build/*-cache.json files are copied
# from the main checkout before each build, since a strict build leaves the demands cache holding only its own files.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-ac3ecffe01c1d8440"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q88"
$Run = "$Runs\scripts-run-build.ps1"
$Muto = "$W\content\scores\imported\mutopia\published"
$Aside = "$W\build\q88-aside"
$Snap = "$W\build\q88-snapshot"
$Log = "$Runs\chain.txt"
$Kept = @("content\scores\imported\SOURCES.md", "docs\prompts\inventory.md", "docs\prompts\rung-claims.md")
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Caches() {
  foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
  Say "caches copied from the main checkout"
}
function Copy-Tree($from, $to) {
  "robocopy $from" | Out-File -Append -Encoding utf8 "$Runs\copy.txt"
  & robocopy "$M\$from" "$W\$to" /E /XD .git /NFL /NDL /NP /NJH | Out-File -Append -Encoding utf8 "$Runs\copy.txt"
  "robocopy $from exit $LASTEXITCODE" | Out-File -Append -Encoding utf8 "$Runs\copy.txt"
  Say "copied $from (robocopy exit $LASTEXITCODE)"
}
function Build($name, $out, $strict) {
  Caches
  Say "start $name (--offline, out=$out, strict=$strict)"
  if ($out -eq "") {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -BuildArgs "--offline" -Strict $strict
  } else {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -BuildArgs "--offline" -Out $out -Strict $strict
  }
  Say "done $name exit $(Get-Content "$Runs\$name.exit")"
}

"" | Out-File -Encoding utf8 $Log
"" | Out-File -Encoding utf8 "$Runs\copy.txt"
Set-Location $W

# 0. The files a build rewrites, kept.
New-Item -ItemType Directory -Force $Snap | Out-Null
foreach ($f in $Kept) { $dest = "$Snap\$f"; New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null; Copy-Item "$W\$f" $dest -Force }
Say "snapshot taken: $($Kept -join ', ')"

# 1. The main checkout's fetched sources and caches, read only.
Copy-Tree "build\cache" "build\cache"
Copy-Tree "build\midi-real" "build\midi-real"
Copy-Tree "content\scores\imported\kern" "content\scores\imported\kern"
Copy-Tree "content\scores\imported\musetrainer" "content\scores\imported\musetrainer"
Copy-Tree "content\scores\imported\mutopia" "content\scores\imported\mutopia"

# 2. The parity reference (Q24).
$env:PYTHONIOENCODING = "utf-8"
$p = Start-Process -FilePath "python" -ArgumentList "tools/midi-cleanup/tests/parity_reference.py" -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\parity.txt" -RedirectStandardError "$Runs\parity.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\parity.exit"
Say "parity_reference.py exit $($p.ExitCode)"

# 3. The app's dependencies: the build's demands step runs the detectors from app/, and the map names the unit suite
#    and the app build for tools/content/*.py.
$p = Start-Process -FilePath "npm.cmd" -ArgumentList "ci" -WorkingDirectory "$W\app" -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\npm-ci.txt" -RedirectStandardError "$Runs\npm-ci.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\npm-ci.exit"
Say "npm ci exit $($p.ExitCode)"

# 4. Item 5, the full public build: strict, as the Pages job builds it (PIANOPATH_STRICT_LICENSE=1), every file present.
Build "build-strict-full" "$W\build\q88-strict\content" "1"

# 5. Item 5, the public build that could not fetch the rag: Mutopia's files aside (Q80's unfetch path), strict.
New-Item -ItemType Directory -Force $Aside | Out-Null
Move-Item $Muto "$Aside\published"; Say "mutopia files aside: $(-not (Test-Path $Muto))"
Build "build-strict-unfetched" "$W\build\q88-strict-unfetched\content" "1"
Move-Item "$Aside\published" $Muto; Say "mutopia files back: $(Test-Path "$Muto\JoplinS\PineappleRag\PineappleRag.mid")"

# 6. The personal build to the default out, last, so app/public/content and build/ hold CI's flavour for the content
#    tests, the unit suite and the app build (Q24's fresh-worktree build; the map's content-build check).
Build "build-personal" "" "0"

# 7. The kept files back.
foreach ($f in $Kept) { Copy-Item "$Snap\$f" "$W\$f" -Force }
& git -C $W status --short | Out-File -Encoding utf8 "$Runs\restore.txt"
Say "snapshot restored; git status in restore.txt"
Say "chain finished"
"0" | Out-File -Encoding ascii "$Runs\chain.exit"
