# U122a, after the chain: (1) c4 again on the grids it ran before Back was held to one line in its top
# zone (side, both flows; extra, the run flow); (2) c2's refusal flow at the two cells whose stage answered
# a transient two-row bar before the tempo label was held at its priced width; (3) the freeze's own spread:
# the three cells where one candidate's clean run froze smaller, every candidate, three times each;
# (4) the history finding: the five runs that froze smaller after the at-rest refusals on the same page,
# three times each, with the first pass's probe (probe/, one page for both). One Playwright at a time.
$ErrorActionPreference = 'Continue'
$app = "<worktree>\app"
$out = "<worktree>\build\u122a"
Set-Location $app
Remove-Item Env:\U122A_SHOTS -ErrorAction SilentlyContinue
Remove-Item Env:\U122A_FACES -ErrorAction SilentlyContinue
function Run($label, $flow, $mode, $sizes, $texts, $pieces, $cands, $only, $dir) {
  $env:U122A_TESTDIR = $dir
  $env:U122A_LABEL = $label
  $env:U122A_FLOW = $flow
  $env:U122A_MODE = $mode
  $env:U122A_TEXTS = $texts
  $env:U122A_PIECES = $pieces
  $env:U122A_CANDS = $cands
  if ($null -ne $sizes) { $env:U122A_SIZES = $sizes } else { Remove-Item Env:\U122A_SIZES -ErrorAction SilentlyContinue }
  if ($null -ne $only) { $env:U122A_ONLY = $only } else { Remove-Item Env:\U122A_ONLY -ErrorAction SilentlyContinue }
  $log = Join-Path $out ("rerun-" + $label + "-" + $flow + "-" + ($cands -replace ',', '') + ".txt")
  cmd /c "npx playwright test --config build/u122a/playwright.u122a-5383.config.ts premise > `"$log`" 2>&1"
  Add-Content -Path $log -Value ("exit " + $LASTEXITCODE) -Encoding UTF8
}
$p6 = 'build/u122a/probe6'
# (1)
Run 'r-side' 'run' 'sideways' $null '100,115' 'hcb,moon' 'c4' $null $p6
Run 'q-side' 'refusal' 'sideways' $null '100,115' 'hcb,moon' 'c4' $null $p6
Run 'r-extra' 'run' 'sideways' '880x412,1200x360' '100,115' 'hcb,saints' 'c4' $null $p6
# (2)
Run 'q-side' 'refusal' 'sideways' '568x320' '115' 'hcb,moon' 'c2' 'wider' $p6
# (3)
$spread = '(667x375 t100 stack moon|700x350 t100 wider moon|780x360 t100 stack moon)'
foreach ($i in 1..3) { Run ("v" + $i) 'run' 'sideways' '667x375,700x350,780x360' '100' 'moon' 'c1,c2,c3,c4,c5,c6' $spread $p6 }
# (4) the first pass's probe ran the refusals and then the run on one page
$hist = '(c4 568x320 t100 wider moon|c5 568x320 t100 wider moon|c1 568x320 t115 stack moon|c5 568x320 t115 wider moon|c5 640x360 t115 stack moon)'
foreach ($i in 1..3) { Run ("h" + $i) 'all' 'sideways' '568x320,640x360' '100,115' 'moon' 'c1,c4,c5' $hist 'build/u122a/probe' }
"done" | Out-File -Encoding utf8 (Join-Path $out 'reruns-done.txt')
