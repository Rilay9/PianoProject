# Q82, after the change, every clone present: the strict build whole (the Pages flavour) with its validator, then the
# default personal build into app/public/content (the map's content-build) with the validator plain (the map's
# content-validate) and with the personal flags, review.py --check, the whole content suite on that build, and the
# map's two app steps on the rebuilt content (the unit suite and the app build). Every --out is absolute and the
# three build/*-cache.json files are copied again from the main checkout (read only) before each build.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af3e3368f50c0e179"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q82"
$Run = "$Runs\scripts-run.ps1"
$Log = "$Runs\chain-final.txt"
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Caches() {
  foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
}
# -Dir is passed only when set: Windows PowerShell drops an empty-string argument to a native command, which left
# "-Dir" with no value, and every step from the worktree root failed to start in the first attempt
# (chain-final-first-attempt.txt).
function Step($name, $exe, $argStr, $strict = "0", $dir = "") {
  if ($dir -ne "") {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -Exe $exe -ArgStr $argStr -Strict $strict -Dir $dir
  } else {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name $name -Exe $exe -ArgStr $argStr -Strict $strict
  }
  Say "done $name exit $(Get-Content "$Runs\$name.exit" -ErrorAction SilentlyContinue)"
}
"" | Out-File -Encoding utf8 $Log
# The kern builds of the after chain validated before validate.py's sections change (no Joplin row has sections);
# their catalogues validated again here on the final code, with each flavour's flags.
Step "validate-kern-personal-after-final" "python" "tools/content/validate.py|--dir|$W\build\q82-kern-personal-after\content|--allow-nc|--personal"
Step "validate-kern-strict-after-final" "python" "tools/content/validate.py|--dir|$W\build\q82-kern-strict-after\content|--strict-license" "1"
$strictOut = "$W\build\q82-whole-strict-after\content"
Caches; Say "caches copied"
Step "build-whole-strict-after" "python" "tools/content/build.py|--offline|--out|$strictOut" "1"
Step "validate-whole-strict-after" "python" "tools/content/validate.py|--dir|$strictOut|--strict-license" "1"
$out = "$W\app\public\content"
Caches; Say "caches copied"
Step "build-final-personal" "python" "tools/content/build.py|--offline|--out|$out"
Step "validate-final" "python" "tools/content/validate.py"
Step "validate-final-personal" "python" "tools/content/validate.py|--allow-nc|--personal"
Step "review-check" "python" "tools/content/review.py|--check"
Step "content-tests-all" "python" "-m|unittest|discover|-s|tools/content/tests|-t|tools/content"
Step "vitest-all" "npx.cmd" "vitest|run" "0" "app"
Step "build-app" "npm.cmd" "run|build:app" "0" "app"
Say "chain finished"
"0" | Out-File -Encoding ascii "$Runs\chain-final.exit"
