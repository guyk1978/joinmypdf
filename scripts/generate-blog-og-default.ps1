# Generates assets/images/blog/og-default.jpg (1200x630) for universal blog OG previews.
# Requires Windows PowerShell with System.Drawing (GDI+).

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path (Join-Path (Join-Path $root "assets") "images") "blog"
$outPath = Join-Path $outDir "og-default.jpg"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing

$W = 1200
$H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background gradient (dark slate -> deep blue)
$rectAll = [System.Drawing.Rectangle]::new(0, 0, $W, $H)
$c1 = [System.Drawing.Color]::FromArgb(255, 11, 18, 32)
$c2 = [System.Drawing.Color]::FromArgb(255, 22, 55, 95)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rectAll, $c1, $c2, 38.0
$g.FillRectangle($gradBrush, $rectAll)
$gradBrush.Dispose()

# Soft geometric accents (low-opacity ellipses)
function Fill-EllipseBrush($cx, $cy, $rx, $ry, $color) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($cx - $rx, $cy - $ry, $rx * 2, $ry * 2)
  $br = New-Object System.Drawing.SolidBrush $color
  $g.FillPath($br, $path)
  $br.Dispose()
  $path.Dispose()
}
Fill-EllipseBrush 1050 80 420 280 ([System.Drawing.Color]::FromArgb(40, 56, 189, 248))
Fill-EllipseBrush -40 520 380 340 ([System.Drawing.Color]::FromArgb(35, 37, 99, 235))
Fill-EllipseBrush 600 640 500 300 ([System.Drawing.Color]::FromArgb(28, 15, 118, 110))

# Brand mark (gradient circle — geometric stand-in; no SVG)
$markSize = 88
$markX = [int](($W - $markSize) / 2)
$markY = 118
$pathMark = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathMark.AddEllipse($markX, $markY, $markSize, $markSize)
$lgRect = [System.Drawing.Rectangle]::new($markX - 30, $markY - 30, $markSize + 60, $markSize + 60)
$markGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $lgRect, `
  ([System.Drawing.Color]::FromArgb(255, 56, 189, 248)), ([System.Drawing.Color]::FromArgb(255, 37, 99, 235)), 45.0
$g.FillPath($markGrad, $pathMark)
$markGrad.Dispose()
$pathMark.Dispose()

# Typography — safe horizontal margins ~140px each side
$marginX = 140
$textWidth = $W - (2 * $marginX)

$unitPx = [System.Drawing.GraphicsUnit]::Pixel
$styleBold = [System.Drawing.FontStyle]::Bold
$styleRegular = [System.Drawing.FontStyle]::Regular
try {
  $fontTitle = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 56, $styleBold, $unitPx)
}
catch {
  $fontTitle = New-Object System.Drawing.Font -ArgumentList @("Arial", 56, $styleBold, $unitPx)
}
try {
  $fontSub = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 30, $styleRegular, $unitPx)
}
catch {
  $fontSub = New-Object System.Drawing.Font -ArgumentList @("Arial", 30, $styleRegular, $unitPx)
}

$brushTitle = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
$brushSub = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Near

$title = "JoinMyPDF Blog"
$sub = "Tips, Tools & PDF Guides"

$sizeTitle = $g.MeasureString($title, $fontTitle)
$sizeSub = $g.MeasureString($sub, $fontSub)
$gap = 18
$blockH = $sizeTitle.Height + $gap + $sizeSub.Height
$startY = 248 + ((380 - 248) - $blockH) / 2 + 35
if ($startY -lt 230) { $startY = 230 }

$titleRect = [System.Drawing.RectangleF]::new([float]$marginX, [float]$startY, [float]$textWidth, $sizeTitle.Height)
$subRect = [System.Drawing.RectangleF]::new([float]$marginX, [float]($startY + $sizeTitle.Height + $gap), [float]$textWidth, $sizeSub.Height)

$g.DrawString($title, $fontTitle, $brushTitle, $titleRect, $sf)
$g.DrawString($sub, $fontSub, $brushSub, $subRect, $sf)

$fontTitle.Dispose()
$fontSub.Dispose()
$brushTitle.Dispose()
$brushSub.Dispose()
$sf.Dispose()

$g.Dispose()

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]92)
$bmp.Save($outPath, $jpegCodec, $encParams)
$encParams.Dispose()
$bmp.Dispose()

Write-Host "Wrote $outPath"
