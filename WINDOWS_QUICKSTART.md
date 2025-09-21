# 🚀 AI HR Platform - Windows Quick Start Guide

## Option 1: Manual Setup (Recommended for Development)

### Step 1: Install Prerequisites
You need Python and optionally Docker. Node.js is already installed ✅

**Install Python:**
1. Go to https://python.org/downloads/
2. Download Python 3.9+ for Windows
3. ⚠️ **IMPORTANT**: Check "Add Python to PATH" during installation

**OR use our automated installer:**
```powershell
# Run as Administrator
.\setup-windows.ps1
```

### Step 2: Start the Platform
```powershell
# In your project directory
.\run-local.ps1
```

This will:
- Create Python virtual environments
- Install all dependencies  
- Start all services in separate windows
- Open your browser to http://localhost:3000

### Step 3: See the Demo
```powershell
# In a new terminal (after services are running)
.\demo.ps1
```

## Option 2: Using VS Code (Best Developer Experience)

### Step 1: Open in VS Code
```powershell
# Open the workspace
code ai-hr-platform.code-workspace
```

### Step 2: Use Built-in Tasks
- Press `Ctrl + Shift + P`
- Type "Tasks: Run Task"
- Choose "🚀 Start All Services"

### Step 3: Use Debug Features
- Press `F5` to debug individual services
- Set breakpoints and step through code
- Use the integrated terminal
 

## 🌐 Access URLs

Once everything is running:
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000  
- **ML Service API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 Demo Features

The platform includes:

1. **Resume Upload & Parsing**
   - Upload PDF/text resumes
   - Extract name, skills, experience, etc.

2. **AI-Powered Scoring**
   - Score resumes against job descriptions
   - Multi-factor scoring algorithm
   - Confidence ratings and recommendations

3. **Interview Questions**
   - Auto-generate relevant questions
   - Categorized by difficulty and type
   - Based on candidate's background

4. **Analytics Dashboard**
   - Candidate pipeline visualization
   - Skill gap analysis
   - Recruitment metrics

## 🛠️ Development Commands

```powershell
# Start all services
.\run-local.ps1

# Stop all services  
.\run-local.ps1 -StopServices

# Run with Docker (if you have Docker Desktop)
.\run-local.ps1 -UseDocker

# Run demo
.\demo.ps1

# Test individual services
cd ml-service
.\venv\Scripts\Activate.ps1
python -m pytest tests/

cd ..\backend
npm test
```

## 📂 Project Structure

```
D:\Projects\AI Resumer\
├── ml-service/           # Python ML API
├── backend/              # Node.js API  
├── frontend/             # React Dashboard
├── docker/               # Container setup
├── infra/                # AWS deployment
├── *.ps1                 # Windows scripts
└── ai-hr-platform.code-workspace  # VS Code setup
```

## 🚨 Troubleshooting

### Python Not Found
```powershell
# Check if Python is installed
python --version

# If not found, install from python.org
# Make sure to check "Add Python to PATH"
```

### Port Already in Use
```powershell
# Stop all services first
.\run-local.ps1 -StopServices

# Then restart
.\run-local.ps1
```

### Dependencies Issues
```powershell
# Delete node_modules and reinstall
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd ..\frontend  
Remove-Item -Recurse -Force node_modules
npm install

# Delete Python venv and reinstall
cd ..\ml-service
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### MongoDB Connection
The platform uses a local MongoDB connection by default. You can:
1. Install MongoDB locally, OR
2. Use MongoDB Atlas (cloud), OR  
3. Update the `.env` files to point to your database

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ All service windows start without errors
- ✅ Browser opens to http://localhost:3000
- ✅ You can see the login/dashboard page
- ✅ Demo script runs successfully

## 🚀 Next Steps

1. **Try the Demo**: Run `.\demo.ps1` to see AI features
2. **Upload Real Resumes**: Use the web interface  
3. **Create Job Postings**: Add your own job descriptions
4. **Explore Code**: Use VS Code workspace for development
5. **Deploy to Cloud**: Follow AWS deployment guide

## 💡 Tips for Development

- Use VS Code for the best experience
- Each service runs in its own terminal window
- Check the logs if something isn't working
- The ML service takes 30-60 seconds to fully initialize
- Frontend hot-reloads when you make changes

## 📞 Getting Help

If you run into issues:
1. Check the service logs in their terminal windows
2. Ensure all prerequisites are installed
3. Try stopping and restarting services
4. Check if ports 3000, 5000, 8000 are available