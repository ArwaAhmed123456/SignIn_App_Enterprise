$base = "c:\Users\uk354\Downloads\Both Apps\SignInApp_Enterprise\mobile\src\screens\"
$files = @("LoginScreen.js","LandingScreen.js","AdminDashboard.js","GuardDashboard.js","MobileForm.js","ProjectDetails.js","WorkerListScreen.js")
foreach ($name in $files) {
  $f = $base + $name
  if (Test-Path $f) {
    $c = [System.IO.File]::ReadAllText($f)
    $c = $c -replace "import \{ styled \} from 'nativewind';\r?\n", ""
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, "const (\w+) = styled\((\w+)\);", 'const $1 = $2;')
    [System.IO.File]::WriteAllText($f, $c)
    Write-Host "Fixed $name"
  }
}
Write-Host "All done"
