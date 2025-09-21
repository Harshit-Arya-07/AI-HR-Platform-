# AI HR Platform - Local Development Runner for Windows
# This script starts all services locally without Docker (for development)

param(
    [switch]$UseDocker,
    [switch]$StopServices
)

$ErrorActionPreference = "Stop"

Write-Host "AI HR Platform - Local Development" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

if ($StopServices) {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    
    # Kill processes on common ports
    $ports = @(3000, 5000, 8000, 27017)
    foreach ($port in $ports) {
        $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($process) {
            $pid = $process.OwningProcess
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped service on port $port" -ForegroundColor Yellow
        }
    }
    
    if ($UseDocker) {
        docker-compose -f docker/docker-compose.yml down
    }
    
    Write-Host "All services stopped." -ForegroundColor Green
    exit 0
}

# Function to check if port is available
function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return -not $connection
}

# Function to start a service in a new PowerShell window
function Start-ServiceWindow {
    param($Title, $Command, $WorkingDirectory)
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; Write-Host '$Title' -ForegroundColor Cyan; $Command"
}

if ($UseDocker) {
    Write-Host "Starting with Docker Compose..." -ForegroundColor Cyan
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    } catch {
        Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    
    # Start with Docker Compose
    Set-Location "docker"
    docker-compose up --build
    
} else {
    Write-Host "Starting services manually (recommended for development)..." -ForegroundColor Cyan
    
    # Check prerequisites
    $hasNode = Get-Command node -ErrorAction SilentlyContinue
    $hasPython = Get-Command py -ErrorAction SilentlyContinue
    
    if (-not $hasNode) {
        Write-Host "Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
        exit 1
    }
    
    if (-not $hasPython) {
        Write-Host "Python not found. Please install Python 3.9+ first." -ForegroundColor Red
        exit 1
    }
    
    # Create environment files if they don't exist
    if (-not (Test-Path "ml-service\.env")) {
        Copy-Item "ml-service\.env.example" "ml-service\.env"
        Write-Host "Created ml-service/.env from example" -ForegroundColor Yellow
    }
    
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "Created backend/.env from example" -ForegroundColor Yellow
    }
    
    if (-not (Test-Path "frontend\.env")) {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "Created frontend/.env from example" -ForegroundColor Yellow
    }
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    
    # Install Python dependencies
    if (-not (Test-Path "ml-service\venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        Set-Location "ml-service"
        py -m venv venv
        .\venv\Scripts\Activate.ps1
        pip install -r requirements.txt
        # Try to download spaCy model
        try {
            py -m spacy download en_core_web_sm
        } catch {
            Write-Host "Could not download spaCy model. ML service will use basic NLP." -ForegroundColor Yellow
        }
        deactivate
        Set-Location ".."
    }
    
    # Install Node.js dependencies
    if (-not (Test-Path "backend\node_modules")) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location "backend"
        npm install
        Set-Location ".."
    }
    
    if (-not (Test-Path "frontend\node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        Set-Location "frontend"
        npm install
        Set-Location ".."
    }
    
    Write-Host "`nStarting services..." -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    # Start MongoDB (if available) or use MongoDB Atlas
    Write-Host "Note: Using MongoDB connection from .env files" -ForegroundColor Yellow
    Write-Host "Make sure your MongoDB is running or update MONGODB_URI in .env files" -ForegroundColor Yellow
    
    # Start ML Service
    Write-Host "Starting ML Service on http://localhost:8000" -ForegroundColor Cyan
    Start-ServiceWindow "ML Service (FastAPI)" "cd ml-service; .\venv\Scripts\Activate.ps1; py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" (Get-Location).Path
    Start-Sleep -Seconds 3
    
    # Start Backend Service  
    Write-Host "Starting Backend Service on http://localhost:5000" -ForegroundColor Cyan
    Start-ServiceWindow "Backend Service (Node.js)" "cd backend; npm run dev" (Get-Location).Path
    Start-Sleep -Seconds 3
    
    # Start Frontend Service
    Write-Host "Starting Frontend Service on http://localhost:3000" -ForegroundColor Cyan
    Start-ServiceWindow "Frontend Service (React)" "cd frontend; npm start" (Get-Location).Path
    
    Write-Host "`nServices Starting..." -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend:   http://localhost:5000" -ForegroundColor Cyan  
    Write-Host "ML API:    http://localhost:8000" -ForegroundColor Cyan
    Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Wait a few seconds for all services to start, then open:" -ForegroundColor Yellow
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "To stop all services, run:" -ForegroundColor Yellow
    Write-Host ".\run-local.ps1 -StopServices" -ForegroundColor Cyan
    
    # Wait a bit then try to open browser
    Start-Sleep -Seconds 10
    Start-Process "http://localhost:3000"
}