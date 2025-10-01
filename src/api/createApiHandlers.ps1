# Define base path
$basePath = "src/api"

# Define modular handler files to scaffold
$modules = @(
    "nodes.js",
    "packets.js",
    "metrics.js",
    "devices.js",
    "system.js",
    "control.js",
    "diagnostics.js"
)

# Create base directory if it doesn't exist
if (-not (Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath | Out-Null
    Write-Host "Created directory: $basePath"
}

# Create each module file if missing
foreach ($file in $modules) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) {
        New-Item -ItemType File -Path $filePath | Out-Null
        Write-Host "Created file: $filePath"

        # Add placeholder export
        Add-Content -Path $filePath -Value "// --- $file ---`nexport const placeholder = (req, res) => res.send('$file ready');"
    } else {
        Write-Host "Skipped existing file: $filePath"
    }
}
