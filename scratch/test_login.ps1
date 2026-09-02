function Test-Login($email, $password, $role) {
    $body = @{
        email = $email
        password = $password
        role = $role
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body $body
        Write-Host "SUCCESS: Login $email ($role):" $response.role "Token:" ($response.token.Substring(0, 20) + "...")
    } catch {
        Write-Host "ERROR Login $email ($role):" $_.Exception.Message
    }
}

Test-Login "hr@aseuro.com" "Hr@12345" "HR"
Test-Login "manager@aseuro.com" "Manager@12345" "MANAGER"
Test-Login "employee@aseuro.com" "Emp@12345" "EMPLOYEE"
