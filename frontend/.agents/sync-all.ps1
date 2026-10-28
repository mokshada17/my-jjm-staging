# Master sync - runs all CLI sync scripts
# Usage: .\.agents\sync-all.ps1

$scriptDir = Split-Path $MyInvocation.MyCommand.Path

Write-Host "=== Syncing Universal Agent Registry to all CLIs ===" -ForegroundColor Cyan

& "$scriptDir\sync-to-opencode.ps1"
& "$scriptDir\sync-to-antigravity.ps1"
& "$scriptDir\sync-to-codex.ps1"

Write-Host "=== All syncs complete ===" -ForegroundColor Green
