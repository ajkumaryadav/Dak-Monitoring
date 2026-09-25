param(
    [string]$OutputDir = "certificates"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$targetDir = Join-Path $projectRoot $OutputDir

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$CertPath = Join-Path $targetDir "localhost.pem"
$PfxPath = Join-Path $targetDir "localhost.pfx"
$Password = ConvertTo-SecureString -String "dak123" -Force -AsPlainText

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " DAK MONITORING SYSTEM - LOCAL SSL CERTIFICATE GENERATOR" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "127.0.0.1", "10.70.230.176" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(5) `
    -KeyExportPolicy Exportable `
    -KeySpec Signature `
    -KeyLength 2048 `
    -HashAlgorithm SHA256

# 1. Export PFX bundle (contains both private key and certificate)
$pfxBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, "dak123")
[System.IO.File]::WriteAllBytes($PfxPath, $pfxBytes)

# 2. Export Cert PEM
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certBase64 = [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem = "-----BEGIN CERTIFICATE-----`r`n$certBase64`r`n-----END CERTIFICATE-----`r`n"
[System.IO.File]::WriteAllText($CertPath, $certPem)

Write-Host "  PFX Bundle:  $PfxPath" -ForegroundColor Green
Write-Host "  Certificate: $CertPath" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] Self-signed certificates ready for local HTTPS!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
