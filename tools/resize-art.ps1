# Downscale the fetched 1000px sleeves to the two sizes the UI actually uses.
# System.Drawing ships with Windows, so this stays dependency-free like the
# rest of the app. Originals stay in art/_full and are never served.
#   art/512/<group>.jpg  - the big plate (hero, now-playing, detail)
#   art/128/<group>.jpg  - the row thumbnail
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)
Add-Type -AssemblyName System.Drawing

$src = Join-Path $Root 'art\_full'
$sizes = @(512, 128)
foreach ($s in $sizes) {
  $d = Join-Path $Root "art\$s"
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L

$total = 0
foreach ($f in Get-ChildItem -Path $src -Filter *.jpg) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $s, $s)
    $out = Join-Path $Root "art\$s\$($f.Name)"
    $bmp.Save($out, $codec, $params)
    $g.Dispose(); $bmp.Dispose()
    $total += (Get-Item $out).Length
  }
  $img.Dispose()
}
Write-Output "resized $((Get-ChildItem -Path $src -Filter *.jpg).Count) sleeves; shipped bytes = $([math]::Round($total/1KB)) KB"
