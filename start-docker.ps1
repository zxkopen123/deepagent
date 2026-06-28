Write-Host "Building DeepAgent container..." -ForegroundColor Cyan
podman build -t deepagent .

Write-Host "Starting container..." -ForegroundColor Cyan
podman run -d -p 8080:8080 -v ${PWD}/data:/app/data --name deepagent deepagent

Write-Host "✅ DeepAgent is running at http://localhost:8080" -ForegroundColor Green
Write-Host "To stop: podman stop deepagent" -ForegroundColor Yellow
Write-Host "To view logs: podman logs -f deepagent" -ForegroundColor Yellow
