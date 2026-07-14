$base = "c:\Users\uk354\Downloads\Both Apps\SignInApp_Enterprise\mobile\src\screens"

$tabScreens = @(
  "TodayScreen.js","SecurityGuardScreen.js","ManagerScreen.js",
  "MessagesScreen.js","ProfileScreen.js","CalendarScreen.js",
  "SignInFlowScreen.js","PreregisterScreen.js","EvacuationScreen.js"
)
$modalScreens = @("InviteCodeScreen.js","OnboardingScreen.js","QRCodeScreen.js")
$allScreens = $tabScreens + $modalScreens

foreach ($f in $allScreens) {
  $p = Join-Path $base $f
  if (-not (Test-Path $p)) { Write-Host "SKIP (not found): $f"; continue }
  $c = [System.IO.File]::ReadAllText($p)

  # Skip if already correct
  if ($c -match "SafeAreaView.*from 'react-native-safe-area-context'") {
    Write-Host "SKIP (already correct): $f"
    continue
  }

  # Remove SafeAreaView from react-native import
  $c = $c -replace ",\s*SafeAreaView\b", ""
  $c = $c -replace "\bSafeAreaView,\s*", ""

  # Add correct import after first React import line
  $c = $c -replace "(?m)(^import React[^\r\n]*)", "`$1`nimport { SafeAreaView } from 'react-native-safe-area-context';"

  [System.IO.File]::WriteAllText($p, $c)
  Write-Host "FIXED imports: $f"
}

# Now add edges={['top']} to root SafeAreaView in tab screens
foreach ($f in $tabScreens) {
  $p = Join-Path $base $f
  if (-not (Test-Path $p)) { continue }
  $c = [System.IO.File]::ReadAllText($p)

  # Replace <SafeAreaView style={...}> with <SafeAreaView style={...} edges={['top']}>
  # Only if edges not already set
  if ($c -notmatch "edges=\{\[") {
    $c = $c -replace "<SafeAreaView (style=\{[^}]+\})>", "<SafeAreaView `$1 edges={['top']}>"
    [System.IO.File]::WriteAllText($p, $c)
    Write-Host "FIXED edges: $f"
  } else {
    Write-Host "SKIP edges (already set): $f"
  }
}

Write-Host "All done."
