# E57a: the app's reader over every built score of the before build (build/e57a/content-before) and of the final build
# (app/public/content), through E57a's copy of scripts-reader.table.ts, into build/e57a/reader-before.jsonl and
# reader-after.jsonl (temp state; scripts-build-diff.py and scripts-content-items.py read them). Logs and exit codes
# to build/e57a/reader-<which>.log and .exit.
$W = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
Set-Location "$W\app"
foreach ($pair in @(@("before", "$W\build\e57a\content-before"), @("after", "$W\app\public\content"))) {
  $which = $pair[0]
  $env:PIANOPATH_E57_CONTENT = $pair[1]
  $env:PIANOPATH_E57_OUT = "$W\build\e57a\reader-$which.jsonl"
  Remove-Item Env:PIANOPATH_E57_FILES -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath "npx.cmd" -ArgumentList @("vitest", "run", "--config", "../docs/prompts/runs/E57a/scripts-vitest.reader.config.mts") `
    -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$W\build\e57a\reader-$which.log" -RedirectStandardError "$W\build\e57a\reader-$which.stderr.log"
  "$($p.ExitCode)" | Out-File -Encoding ascii "$W\build\e57a\reader-$which.exit"
}
Set-Location $W
