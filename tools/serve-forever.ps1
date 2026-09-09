# Keeps the Keys local server (serve.mjs on :4180) alive no matter how node dies.
#
# Why this exists (Mark, 2026-09-09: "keys app isnt launching?"). The Desktop
# Keys shortcut is an Edge app window on localhost:4180. The KeysPianoServer
# scheduled task ran node directly, and Task Scheduler's "restart on failure"
# only covers a LAUNCH that fails, never a process that exits later: the server
# died at 13:53 on the 8th and again at 18:4x on the 9th with exit code 1 (the
# code a taskkill /F leaves behind, which is what other sessions' build scripts
# do to node.exe by name), and each time it stayed dead until a human noticed.
# This loop restarts it within two seconds of any exit. The task's action is
# now this script; serve.mjs itself is unchanged.
$root = Split-Path -Parent $PSScriptRoot
$node = 'C:\Program Files\nodejs\node.exe'
$log = Join-Path $root 'serve-forever.log'
while ($true) {
  $started = Get-Date
  Add-Content -Path $log -Value ("{0:yyyy-MM-dd HH:mm:ss} start" -f $started)
  & $node (Join-Path $root 'serve.mjs')
  $code = $LASTEXITCODE
  Add-Content -Path $log -Value ("{0:yyyy-MM-dd HH:mm:ss} exit {1} after {2:N0}s" -f (Get-Date), $code, ((Get-Date) - $started).TotalSeconds)
  Start-Sleep -Seconds 2
}
