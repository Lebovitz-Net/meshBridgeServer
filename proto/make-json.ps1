# Collect all .proto files
$protoDir = ".\protobufs\meshtastic"
$protoFiles = Get-ChildItem -Path $protoDir -Filter *.proto | ForEach-Object { $protodir + '\' + $_ }
$outputPath = "..\src\assets\proto.json"
# $outputPath = "proto.json"
if ($protoFiles.Count -eq 0) {
    Write-Host "No .proto files found in $protoDir"
    exit 1
}

# Build pbjs command
$pbjsArgs = @("-p", ".\protobufs", "-t", "json", "-o", $outputPath) + $protoFiles

Write-Host "Generating proto.json from:"
$protoFiles | ForEach-Object { Write-Host "  - $_" }

# Run pbjs
Write-Host "`Running pbjs..."
npx pbjs @pbjsArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "proto.json generated at $outputPath"
} else {
    Write-Host "pbjs failed. Check your .proto files and installation."
}
