# U122: the same grids with the model applied in the page and measured (U122_PROTO=1), one Playwright
# at a time on port 5353, each run's log and exit code kept.
$ErrorActionPreference = 'Continue'
$app = "<worktree>\app"
$out = "<worktree>\build\u122"
Set-Location $app
$env:U122_TESTDIR = 'build/u122/probe'
$env:U122_PROTO = '1'
Remove-Item Env:\U122_ONLY -ErrorAction SilentlyContinue
$runs = @(
  @{ name = 'f-paused';  mode = 'paused';  sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'f-refusal'; mode = 'refusal'; sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'f-upright'; mode = 'upright'; sizes = $null; texts = '100,115'; pieces = 'hcb,moon' },
  @{ name = 'f-extra';   mode = 'paused';  sizes = '880x412,1200x360'; texts = '100,115'; pieces = 'hcb,saints' },
  @{ name = 'f-small';   mode = 'paused';  sizes = '568x320,740x342,780x360'; texts = '90'; pieces = 'hcb' },
  @{ name = 'f-smallup'; mode = 'upright'; sizes = '360x780,390x844'; texts = '90'; pieces = 'hcb' }
)
foreach ($r in $runs) {
  $env:U122_LABEL = $r.name
  $env:U122_MODE = $r.mode
  $env:U122_TEXTS = $r.texts
  $env:U122_PIECES = $r.pieces
  if ($null -ne $r.sizes) { $env:U122_SIZES = $r.sizes } else { Remove-Item Env:\U122_SIZES -ErrorAction SilentlyContinue }
  $log = Join-Path $out ("probe-" + $r.name + "-run.txt")
  # Through cmd, so the log is the runner's own bytes (UTF-8), not PowerShell's UTF-16.
  cmd /c "npx playwright test --config build/u122/playwright.u122-5353.config.ts > `"$log`" 2>&1"
  Add-Content -Path $log -Value ("exit " + $LASTEXITCODE) -Encoding UTF8
}
"done" | Out-File -Encoding utf8 (Join-Path $out 'final-done.txt')
