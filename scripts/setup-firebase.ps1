param(
  [Parameter(Mandatory = $false)]
  [string]$ProjectId
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example.'
}

if (-not $ProjectId) {
  $ProjectId = Read-Host 'Firebase project ID (leave empty to only prepare .env)'
}

if (-not $ProjectId) {
  Write-Host 'Fill Firebase web-app values in .env, then rerun with -ProjectId your-project-id.'
  exit 0
}

$env:PROJECT_ID = $ProjectId
npx --yes firebase-tools login
npx --yes firebase-tools use $ProjectId

@{
  firestore = @{
    rules = 'firestore.rules'
    indexes = 'firestore.indexes.json'
  }
} | ConvertTo-Json | Set-Content 'firebase.json'

Write-Host ''
Write-Host 'Paste the Firebase Web App config values into .env:'
Write-Host '  EXPO_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET,'
Write-Host '  MESSAGING_SENDER_ID, APP_ID'

$confirm = Read-Host 'Deploy Firestore rules and indexes now? (y/N)'
if ($confirm -match '^(y|yes)$') {
  npx --yes firebase-tools deploy --only firestore --project $ProjectId
}

Write-Host 'Firebase setup helper finished. Never commit .env.'
