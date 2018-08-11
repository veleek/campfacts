param([Switch]$Restart, [Switch]$RestartNgrok, [Switch]$RestartNode)
function Start-JobIfNotRunning([string]$Name, [ScriptBlock]$ScriptBlock, $ArgumentList, [Switch]$Restart)
{
    $existingJob = Get-Job -Name $Name -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Running"}

    if($existingJob)
    {
        if(!$Restart)
        {
            Write-Host "Job $Name is already running."
            return $existingJob
        }

        Write-Host "Stopping existing $Name job."
        Stop-Job $existingJob
    }

    Write-Host "Starting $Name job..."
    Start-Job -Name $Name -ScriptBlock $ScriptBlock -ArgumentList $ArgumentList | Out-Null
}

Start-JobIfNotRunning -Name "Catfacts Node Service" -ScriptBlock { param([string]$path); Set-Location $path; nodemon index.js } -ArgumentList $pwd -Restart:($Restart -or $RestartNode) | Out-Null
#Start-JobIfNotRunning -Name "CampFacts Node Service" -ScriptBlock { param([string]$path); Set-Location $path; nodemon --experimental-modules index.mjs } -ArgumentList $pwd -Restart:($Restart -or $RestartNode) | Out-Null
#Start-JobIfNotRunning -Name "NGrok Tunnel" -ScriptBlock { ngrok http 1337 } -Restart:($Restart -or $RestartNgrok) | Out-Null
#.\UpdateNgrokTunnel.ps1 

Write-Host "Done." -ForegroundColor Green
