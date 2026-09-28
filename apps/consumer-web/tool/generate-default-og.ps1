# One-off generator for F.8.1 default OG asset (1200x630). Re-run only when branding changes.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$consumerWebRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path (Split-Path $consumerWebRoot -Parent) -Parent
$wordmarkPath = Join-Path $repoRoot 'apps/mobile/assets/branding/qalago_wordmark.png'
$outDir = Join-Path $consumerWebRoot 'public/og'
$outPath = Join-Path $outDir 'qalago-default.png'

$w = 1200
$h = 630
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::FromArgb(255, 0, 168, 214))

$wm = [System.Drawing.Image]::FromFile((Resolve-Path $wordmarkPath))
$maxW = 720
$scale = [Math]::Min($maxW / $wm.Width, ($h * 0.35) / $wm.Height)
$nw = [int]($wm.Width * $scale)
$nh = [int]($wm.Height * $scale)
$x = [int](($w - $nw) / 2)
$y = [int](($h - $nh) / 2 - 40)
$g.DrawImage($wm, $x, $y, $nw, $nh)

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$wm.Dispose()
$g.Dispose()
$bmp.Dispose()

$verify = New-Object System.Drawing.Bitmap($outPath)
if ($verify.Width -ne 1200 -or $verify.Height -ne 630) {
  $verify.Dispose()
  throw "Unexpected dimensions: $($verify.Width)x$($verify.Height)"
}
$verify.Dispose()
Write-Host "Wrote $outPath (1200x630)"
