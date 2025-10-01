# Define base path for insert handlers
$basePath = "src/db/inserts"

# Define insert module filenames
$modules = @(
    "nodesInsert.js",
    "packetsInsert.js",
    "devicesInsert.js",
    "metricsInsert.js",
    "diagnosticsInsert.js"
)

# Create base directory if missing
if (-not (Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath | Out-Null
    Write-Host "Created directory: $basePath"
}

# Create each insert file if missing
foreach ($file in $modules) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) {
        New-Item -ItemType File -Path $filePath | Out-Null
        Write-Host "Created file: $filePath"

        # Add placeholder export
        Add-Content -Path $filePath -Value "// --- $file ---`nexport const placeholderInsert = () => 'Insert handler ready';"
    } else {
        Write-Host "Skipped existing file: $filePath"
    }
}
