# AI HR Platform - Windows Setup Script
# Run this script as Administrator in PowerShell

Write-Host "Setting up AI HR Platform on Windows..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Install Chocolatey if not installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install Python
Write-Host "Installing Python 3.9..." -ForegroundColor Yellow
choco install python39 -y
refreshenv

# Install Docker Desktop
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
choco install docker-desktop -y

# Install Git (if not installed)
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Git..." -ForegroundColor Yellow
    choco install git -y
}

# Install VS Code extensions (optional)
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "Installing VS Code extensions..." -ForegroundColor Yellow
    code --install-extension ms-python.python
    code --install-extension ms-vscode.vscode-node-debug2
    code --install-extension bradlc.vscode-tailwindcss
    code --install-extension ms-vscode.vscode-docker
    code --install-extension ms-vscode.vscode-json
}

Write-Host "Setup complete! Please restart your terminal and Docker Desktop." -ForegroundColor Green
Write-Host "Then run: .\run-local.ps1" -ForegroundColor Cyan