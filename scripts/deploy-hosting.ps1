param(
  [string]$ConfigPath = (Join-Path $env:USERPROFILE ".liquid-prnc-glass\hosting.ftp.json"),
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distRoot = Join-Path $repoRoot "dist"

if (!(Test-Path -LiteralPath $ConfigPath)) {
  throw "Hosting config not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$requiredFields = @("host", "username", "password", "remoteRoot")

foreach ($field in $requiredFields) {
  if ([string]::IsNullOrWhiteSpace([string]$config.$field)) {
    throw "Hosting config is missing required field: $field"
  }
}

if (!$SkipBuild) {
  Push-Location $repoRoot
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

if (!(Test-Path -LiteralPath $distRoot)) {
  throw "Build output not found: $distRoot"
}

$credential = New-Object System.Net.NetworkCredential($config.username, $config.password)

function Convert-ToFtpPath([string]$path) {
  return ($path -replace "\\", "/").Trim("/")
}

function New-FtpRequest([string]$remotePath, [string]$method) {
  $cleanPath = Convert-ToFtpPath $remotePath
  $request = [System.Net.FtpWebRequest]::Create("ftp://$($config.host)/$cleanPath")
  $request.Method = $method
  $request.Credentials = $credential
  $request.UsePassive = $true
  $request.UseBinary = $true
  $request.KeepAlive = $false

  return $request
}

function New-FtpDirectoryIfMissing([string]$remotePath) {
  $request = New-FtpRequest $remotePath ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)

  try {
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "created $remotePath"
  } catch [System.Net.WebException] {
    Write-Host "exists $remotePath"
  }
}

function Send-FtpFile([string]$localPath, [string]$remotePath) {
  $request = New-FtpRequest $remotePath ([System.Net.WebRequestMethods+Ftp]::UploadFile)
  $bytes = [System.IO.File]::ReadAllBytes($localPath)
  $request.ContentLength = $bytes.Length

  $stream = $request.GetRequestStream()
  try {
    $stream.Write($bytes, 0, $bytes.Length)
  } finally {
    $stream.Close()
  }

  $response = $request.GetResponse()
  $response.Close()
  Write-Host "uploaded $remotePath ($($bytes.Length) bytes)"
}

$remoteRoot = Convert-ToFtpPath $config.remoteRoot
$directories = Get-ChildItem -LiteralPath $distRoot -Recurse -Directory | ForEach-Object {
  $relativePath = [System.IO.Path]::GetRelativePath($distRoot, $_.FullName) -replace "\\", "/"
  "$remoteRoot/$relativePath"
}

foreach ($directory in $directories) {
  New-FtpDirectoryIfMissing $directory
}

$files = Get-ChildItem -LiteralPath $distRoot -Recurse -File

foreach ($file in $files) {
  $relativePath = [System.IO.Path]::GetRelativePath($distRoot, $file.FullName) -replace "\\", "/"
  Send-FtpFile $file.FullName "$remoteRoot/$relativePath"
}

Write-Host "uploaded $($files.Count) files"

if (![string]::IsNullOrWhiteSpace([string]$config.publicUrl)) {
  Write-Host "public url: $($config.publicUrl)"
}
