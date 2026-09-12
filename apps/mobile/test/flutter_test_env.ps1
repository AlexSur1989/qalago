# Optional helper for Windows Flutter test when PROGRAMFILES(X86) is missing.
# Usage: . .\test\flutter_test_env.ps1; flutter test
if (-not (Test-Path Env:'PROGRAMFILES(X86)')) {
  Set-Item -Path 'Env:PROGRAMFILES(X86)' -Value 'C:\Program Files'
}
