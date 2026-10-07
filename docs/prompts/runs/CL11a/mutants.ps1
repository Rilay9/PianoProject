$ErrorActionPreference = 'Continue'
$wt = '<worktree>'
$out = "$wt\docs\prompts\runs\CL11a\mutants.txt"
"# CL11a mutants: each edits one line of one source file (restored from a byte copy after), runs the named unit files from app/, and records red (a test fails: the mutant is killed) or green (survived)" | Set-Content $out -Encoding utf8

$utf8 = New-Object System.Text.UTF8Encoding($false)
function Read-Text($p) { [System.IO.File]::ReadAllText($p, $utf8) }

$mutants = @(
  @{ id='M1 net accuracy'; file='app/src/engine/Scoring.ts'; from='Math.max(0, input.hits - wrongKeys) / expectedNotes'; to='input.hits / expectedNotes'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M2 rhythm-only is net too'; file='app/src/engine/Scoring.ts'; from='const wrongKeys = input.rhythmOnly === true ? 0 : input.wrongNotesTotal;'; to='const wrongKeys = input.wrongNotesTotal;'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M3 late strike not spent (a second one forgiven)'; file='app/src/engine/PracticeEngine.ts'; from='      spent.add(midi);'; to='      void spent;'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M4 late reach unbounded (a beat or more behind forgiven)'; file='app/src/engine/PracticeEngine.ts'; from='      if (agoMs >= reach) return null;'; to='      void reach;'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M5 late for a note already played (no unplayed check)'; file='app/src/engine/PracticeEngine.ts'; from='      if (unplayed) return { index, agoMs };'; to="      void unplayed;`n      return { index, agoMs };"; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M6 late state kept across laps'; file='app/src/engine/PracticeEngine.ts'; from="    this.missedPitches.clear();`n    this.lateStruck.clear();`n    if (this.mode === 'wait' || this.mode === 'free') {"; to="    if (this.mode === 'wait' || this.mode === 'free') {"; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M7 the early reading always wins a tie of homes (no nearer-in-time)'; file='app/src/engine/PracticeEngine.ts'; from='(earlyHome === null || lateHome.agoMs < (this.session.steps[earlyHome]?.tMs ?? 0) - at)'; to='earlyHome === null'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M8 late forgiven for an uncertain microphone guess'; file='app/src/engine/PracticeEngine.ts'; from='match === null && !this.rhythmOnly && confidence >= this.session.options.wrongNoteConfidence;'; to='match === null && !this.rhythmOnly;'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts') },
  @{ id='M9 late forgiven in a rhythm-only run'; file='app/src/engine/PracticeEngine.ts'; from='match === null && !this.rhythmOnly && confidence >= this.session.options.wrongNoteConfidence;'; to='match === null && confidence >= this.session.options.wrongNoteConfidence;'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts','tests/unit/engineRhythmOnly.test.ts') },
  @{ id='M10 early extra put against the matched step'; file='app/src/engine/PracticeEngine.ts'; from='this.markStep(near?.index ?? match).wrong.push(midi);'; to='this.markStep(match).wrong.push(midi);'; tests=@('tests/unit/keepTempoChargesAWrongKey.test.ts','tests/unit/evidenceByDemand.test.ts') },
  @{ id='M11 definitions 2 does not refuse a charged step on pitch'; file='app/src/evidence/measurement.ts'; from='charged.has(step) ? {'; to='false ? {'; tests=@('tests/unit/definitionsTwoReadsAWrongKey.test.ts') },
  @{ id='M12 the rule also re-judges definitions 1'; file='app/src/evidence/measurement.ts'; from="(observation.definitions ?? 0) >= 2"; to="(observation.definitions ?? 0) >= 1"; tests=@('tests/unit/definitionsTwoReadsAWrongKey.test.ts') },
  @{ id='M13 this build does not read definitions 2'; file='app/src/evidence/measurement.ts'; from='new Set([1, 2])'; to='new Set([1])'; tests=@('tests/unit/definitionsTwoReadsAWrongKey.test.ts','tests/unit/evidenceOnlyMeasured.test.ts') },
  @{ id='M14 the writer still stamps 1'; file='app/src/data/db.ts'; from='export const OBSERVATION_DEFINITIONS = 2;'; to='export const OBSERVATION_DEFINITIONS = 1;'; tests=@('tests/unit/definitionsTwoReadsAWrongKey.test.ts','tests/unit/observationsFromRun.test.ts') },
  @{ id='M15 an estimated pass is still unknown'; file='app/src/data/sessionRun.ts'; from="if (run.accuracyEstimated === true) return run.passed ? 'passed-full' : 'unknown';"; to="if (run.accuracyEstimated === true) return 'unknown';"; tests=@('tests/unit/todayCountsAMicrophonePass.test.ts','tests/unit/sessionAdaptation.test.ts') },
  @{ id='M16 an estimated failure is failed'; file='app/src/data/sessionRun.ts'; from="if (run.accuracyEstimated === true) return run.passed ? 'passed-full' : 'unknown';"; to="if (run.accuracyEstimated === true) return run.passed ? 'passed-full' : 'failed';"; tests=@('tests/unit/todayCountsAMicrophonePass.test.ts') },
  @{ id='M17 Progress counts the learner''s word in N passed'; file='app/src/ui/screens/ProgressScreen.ts'; from="if (row.status === 'passed' && row.selfPassed !== true) counts.passed += 1;"; to="if (row.status === 'passed') counts.passed += 1;"; tests=@('tests/unit/progressKeepsTheLearnersWord.test.ts') },
  @{ id='M18 Progress offers the learner''s word as a piece passed'; file='app/src/ui/screens/ProgressScreen.ts'; from="(row.status === 'passed' && row.selfPassed !== true) || row.status === 'mastered'"; to="row.status === 'passed' || row.status === 'mastered'"; tests=@('tests/unit/progressKeepsTheLearnersWord.test.ts') },
  @{ id='M19 the Keep tempo card does not say what accuracy counts'; file='app/src/ui/help.ts'; from=' Accuracy is the written notes you play right in time; each wrong note costs as much as a note you miss.'; to=''; tests=@('tests/unit/help.test.ts') }
)

Push-Location "$wt\app"
foreach ($m in $mutants) {
  $path = Join-Path $wt $m.file
  $orig = Join-Path "$wt\build\mine" $m.file
  $text = Read-Text $orig
  $text = $text -replace "`r`n", "`n"
  $from = $m.from -replace "`r`n", "`n"
  if (-not $text.Contains($from)) { "$($m.id): SKIPPED (the line to change was not found)" | Add-Content $out -Encoding utf8; continue }
  $new = $text.Replace($from, ($m.to -replace "`r`n", "`n"))
  [System.IO.File]::WriteAllText($path, $new, $utf8)
  try {
  $res = cmd /c "npx vitest run $($m.tests -join ' ') 2>&1" | Out-String
  $failed = ([regex]::Matches($res, '(?m)^\s*Tests\s+(\d+) failed')).Count -gt 0
  $summary = ($res -split "`n" | Where-Object { $_ -match '^\s+Tests\s' }) -join ' '
  $names = ($res -split "`n" | Where-Object { $_ -match '^ FAIL ' } | ForEach-Object { ($_ -replace '^ FAIL\s+', '') -replace '^tests/unit/', '' } | Select-Object -First 4) -join ' || '
  $verdict = if ($failed) { 'KILLED' } else { 'SURVIVED' }
  "$($m.id): $verdict. $($summary.Trim()). first red: $names" | Add-Content $out -Encoding utf8
  } finally { Copy-Item $orig $path -Force }
}
Pop-Location
# the restore is checked against the byte copy
foreach ($f in (Get-ChildItem "$wt\build\mine" -Recurse -File)) {
  $rel = $f.FullName.Substring("$wt\build\mine\".Length)
  $same = (Get-FileHash $f.FullName).Hash -eq (Get-FileHash (Join-Path $wt $rel)).Hash
  "restored $rel : $(if ($same) {'same'} else {'DIFFERENT'})" | Add-Content $out -Encoding utf8
}
"MUTANTS DONE" | Add-Content $out -Encoding utf8
