$login = Invoke-RestMethod -Uri "https://tripod-signin-app.onrender.com/api/auth/login" -Method POST -Body '{"email":"ian.hoskin@ibvogt.com","password":"IBVogt@2026"}' -ContentType "application/json" -TimeoutSec 60
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
$sites = Invoke-RestMethod -Uri "https://tripod-signin-app.onrender.com/api/projects" -Headers $headers -TimeoutSec 30
Write-Host "Ian sees $($sites.Count) site(s):"
$sites | ForEach-Object { Write-Host "  - $($_.name)" }
