# U122a: upright c1 again, both flows, with the row allocated before the resize that measures the bar
# (the first pass's install-time resize measured a wrapped row in 56 upright c1 states). One Playwright at a
# time on port 5383; the files overwrite the first pass's.
$ErrorActionPreference = 'Continue'
$app = "<worktree>\app"
$out = "<worktree>\build\u122a"
Set-Location $app
$env:U122A_TESTDIR = 'build/u122a/probe6'
$env:U122A_MODE = 'upright'
$env:U122A_CANDS = 'c1'
$env:U122A_SHOTS = '342x740 t100 stack hcb'
Remove-Item Env:\U122A_ONLY -ErrorAction SilentlyContinue
Remove-Item Env:\U122A_FACES -ErrorAction SilentlyContinue
$grids = @(
  @{ name = 'up';      sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'smallup'; sizes = '360x780,390x844'; texts = '90'; pieces = 'hcb' }
)
foreach ($g in $grids) {
  foreach ($flow in @('run', 'refusal')) {
    $label = $(if ($flow -eq 'run') { 'r' } else { 'q' }) + '-' + $g.name
    $env:U122A_FLOW = $flow
    $env:U122A_LABEL = $label
    $env:U122A_TEXTS = $g.texts
    $env:U122A_PIECES = $g.pieces
    if ($null -ne $g.sizes) { $env:U122A_SIZES = $g.sizes } else { Remove-Item Env:\U122A_SIZES -ErrorAction SilentlyContinue }
    $log = Join-Path $out ("rerun-upright-c1-" + $label + ".txt")
    cmd /c "npx playwright test --config build/u122a/playwright.u122a-5383.config.ts premise > `"$log`" 2>&1"
    Add-Content -Path $log -Value ("exit " + $LASTEXITCODE) -Encoding UTF8
  }
}
"done" | Out-File -Encoding utf8 (Join-Path $out 'upright-c1-done.txt')
