# Publishing helper for Tab Relay (PowerShell version)

Write-Host "Tab Relay - Publishing Helper" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check icon exists
if (-not (Test-Path "icons/icon-128.png")) {
    Write-Host "Warning: icons/icon-128.png not found" -ForegroundColor Yellow
    $reply = Read-Host "Continue anyway? (y/n)"
    if ($reply -ne "y" -and $reply -ne "Y") {
        exit 1
    }
}

# Run tests
Write-Host "Running tests..." -ForegroundColor Green
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Tests passed" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "Building extension..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful" -ForegroundColor Green
Write-Host ""

# Package
Write-Host "Packaging extension..." -ForegroundColor Green
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed!" -ForegroundColor Red
    exit 1
}

$version = (Get-Content package.json | ConvertFrom-Json).version
Write-Host ""
Write-Host "Created: tab-relay.zip (v$version)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Test locally:"
Write-Host "     - Open chrome://extensions"
Write-Host "     - Enable Developer mode"
Write-Host "     - Click 'Load unpacked' and select this directory"
Write-Host ""
Write-Host "  2. Publish to Chrome Web Store:"
Write-Host "     - Go to https://chrome.google.com/webstore/devconsole"
Write-Host "     - Click 'New item' (or update existing)"
Write-Host "     - Upload tab-relay.zip"
Write-Host "     - Fill in listing details and submit for review"
Write-Host ""
Write-Host "  3. Create a GitHub release:"
Write-Host "     git tag -a v$version -m `"v$version`""
Write-Host "     git push origin v$version"
Write-Host "     # GitHub Actions will create the release automatically"
