# PowerShell Traffic Generator for Lab 8
param (
    [string]$GatewayUrl = "http://localhost:3000",
    [int]$Batches = 5
)

node "$PSScriptRoot/traffic-generator.js" $GatewayUrl $Batches
