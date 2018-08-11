param([Switch]$Wait, [Switch]$NoTouch, [Switch]$Force)

if($Wait)
{
  $fsw = New-Object IO.FileSystemWatcher $PSScriptRoot, "*.handlebars" -Property @{IncludeSubdirectories = $true;NotifyFilter = [IO.NotifyFilters]'LastWrite'}

  # Here, all three events are registerd.  You need only subscribe to events that you need:

  $global:lastProcessed = Get-Date

  $onFileChanged =
  {
    try
    {
      $timeStamp = $Event.TimeGenerated
      if($lastProcessed -lt $timeStamp.AddSeconds(-3))
      {
        $global:lastProcessed = $timeStamp
        Write-Host "==================================="
        Write-Host "$($timeStamp): Template $($Event.SourceEventArgs.Name) changed so reprocessing templates."
        # Doing this on another thread fails because everything is garbage!
        #$fsw.EnableRaisingEvents = $false

        # Sleep for a bit so that all templates can be processed together... just in case.
        Start-Sleep -Milliseconds 250

        . (Join-Path $PSScriptRoot "Process-Templates.ps1") -NoTouch
      }
    }
    finally
    {
      #$fsw.EnableRaisingEvents = $true
    }
  }

  Register-ObjectEvent $fsw Changed -SourceIdentifier FileChanged -Action $onFileChanged

  try
  {
    Write-Host "Waiting for changes to .handlebars files..."
    $fsw.EnableRaisingEvents = $true
    while($true)
    {
      Start-Sleep -Seconds 1
    }
  }
  finally
  {
    Write-Host "Stopping listening to events.";
    $fsw.EnableRaisingEvents = $false
    Unregister-Event FileChanged
    Write-Host "Done."
  }
  return;
}

function ProcessTemplates($extension, $exclude)
{
  $extraArgs = $args
  Write-Verbose "Processing all .$extension templates"
  Get-ChildItem $PSScriptRoot -Recurse "*.$extension" -Exclude $exclude | ForEach-Object {
    $input = $_.FullName
    $dir = Split-Path $input
    $fileName = Split-Path -Leaf $input
    $output = Join-Path $dir ("_" + $fileName.Replace(".$extension",".js"))
    $outputItem = Get-Item $output -ea SilentlyContinue

    if(!$outputItem -or ($_.LastWriteTime -gt $outputItem.LastWriteTime))
    {
      Write-Host "Processing Template $_..." -NoNewline
      handlebars "$input" -f "$output" --knownOnly --known json --known select --known array --known stateSelect --known equals --known file --extension $extension @extraArgs
      Write-Host " written to $output"
    }
  }
}

ProcessTemplates handlebars *.partial.handlebars,*.partialserver.handlebars -c handlebars/runtime --partial
ProcessTemplates partial.handlebars "X" --partial
ProcessTemplates partialserver.handlebars "X" --partial -c handlebars/runtime
<#
dir $PSScriptRoot -Recurse *.handlebars -exclude *.partial.handlebars | % {
  $input = $_.FullName
  $dir = Split-Path $input
  $fileName = Split-Path -Leaf $input
  $output = Join-Path $dir ("_" + $fileName.Replace(".handlebars",".js"))
  Write-Host "Processing Template $_..."
  handlebars "$input" -f "$output" -c handlebars/runtime --knownOnly --known select --known array --known stateSelect --known equals
}

dir $PSScriptRoot -Recurse *.partial.handlebars | % {
  $input = $_.FullName
  $dir = Split-Path $input
  $fileName = Split-Path -Leaf $input
  $output = Join-Path $dir ("_" + $fileName.Replace(".partial.handlebars",".js"))
  Write-Host "Processing Partial Template $input -> $output"
  handlebars "$input" -f "$output" --partial --extension partial.handlebars
}
#>

function Touch-Files
{
  # Touch index.js so it gets reloaded.
  Write-Host "Touching index.js"
  touch (Join-Path $PSScriptRoot /routes/dashboard/get.js)
  #touch (Join-Path $PSScriptRoot /routes/messages/send.js)
}

if(!$NoTouch)
{
  Touch-Files
}
