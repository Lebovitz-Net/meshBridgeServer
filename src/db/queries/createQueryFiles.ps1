# Define base path for query handlers
$basePath = "src/db/queries"

# Define query module filenames
$modules = @(
    "nodesQuery.js",
    "packetsQuery.js",
    "devicesQuery.js",
    "metricsQuery.js",
    "diagnosticsQuery.js"
)

# Create base directory if missing
if (-not (Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath | Out-Null
    Write-Host "Created directory: $basePath"
}

# Create each query file if missing
foreach ($file in $modules) {
    $filePath = Join-Path $basePath $file
    if (-not (Test-Path $filePath)) {
        New-Item -ItemType File -Path $filePath | Out-Null
        Write-Host "Created file: $filePath"

        # Add placeholder export
        Add-Content -Path $filePath -Value "// --- $file ---`nexport const placeholderQuery = () => 'Query handler ready';"
    } else {
        Write-Host "Skipped existing file: $filePath"
    }
}
