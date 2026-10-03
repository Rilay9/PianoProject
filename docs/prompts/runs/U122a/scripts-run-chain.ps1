# U122a: the chrome candidates on U122's grids, two flows per cell (run, refusal), one Playwright at a
# time on port 5383, each run's log and exit code kept. Started detached (Start-Process) so the chain
# outlives a shell's limit. The probe is probe6/premise.spec.ts.
$ErrorActionPreference = 'Continue'
$app = "<worktree>\app"
$out = "<worktree>\build\u122a"
Set-Location $app
$env:U122A_TESTDIR = 'build/u122a/probe6'
$env:U122A_SHOTS = '(568x320 t115 (stack|wider) hcb|568x320 t100 wider moon|667x375 t115 wider moon|780x360 t100 stack (hcb|moon)|740x342 t100 wider hcb|342x740 t100 stack hcb)'
Remove-Item Env:\U122A_ONLY -ErrorAction SilentlyContinue
Remove-Item Env:\U122A_CANDS -ErrorAction SilentlyContinue
Remove-Item Env:\U122A_FACES -ErrorAction SilentlyContinue
$grids = @(
  @{ name = 'side';    mode = 'sideways'; sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'extra';   mode = 'sideways'; sizes = '880x412,1200x360'; texts = '100,115'; pieces = 'hcb,saints' },
  @{ name = 'small';   mode = 'sideways'; sizes = '568x320,740x342,780x360'; texts = '90'; pieces = 'hcb' },
  @{ name = 'up';      mode = 'upright';  sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'smallup'; mode = 'upright';  sizes = '360x780,390x844'; texts = '90'; pieces = 'hcb' }
)
foreach ($g in $grids) {
  foreach ($flow in @('run', 'refusal')) {
    $label = $(if ($flow -eq 'run') { 'r' } else { 'q' }) + '-' + $g.name
    $env:U122A_FLOW = $flow
    $env:U122A_LABEL = $label
    $env:U122A_MODE = $g.mode
    $env:U122A_TEXTS = $g.texts
    $env:U122A_PIECES = $g.pieces
    if ($null -ne $g.sizes) { $env:U122A_SIZES = $g.sizes } else { Remove-Item Env:\U122A_SIZES -ErrorAction SilentlyContinue }
    $log = Join-Path $out ("run-" + $label + ".txt")
    cmd /c "npx playwright test --config build/u122a/playwright.u122a-5383.config.ts premise > `"$log`" 2>&1"
    Add-Content -Path $log -Value ("exit " + $LASTEXITCODE) -Encoding UTF8
  }
}
"done" | Out-File -Encoding utf8 (Join-Path $out 'chain-done.txt')
