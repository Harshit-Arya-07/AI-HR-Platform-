from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
from loguru import logger

from app.routers import scoring, parsing, questions, health
from app.models.ml_models import MLModels

# Load environment variables
load_dotenv()

# Initialize ML models on startup
ml_models = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ml_models
    logger.info("Starting ML service...")
    
    # Initialize ML models
    ml_models = MLModels()
    await ml_models.initialize()
    
    # Store in app state for access in routes
    app.state.ml_models = ml_models
    
    logger.info("ML service startup completed")
    yield
    
    logger.info("Shutting down ML service...")

# Create FastAPI app
app = FastAPI(
    title="AI HR Platform - ML Service",
    description="Machine Learning service for resume screening and candidate evaluation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(scoring.router, prefix="/score", tags=["Scoring"])
app.include_router(parsing.router, prefix="/parse", tags=["Parsing"])
app.include_router(questions.router, prefix="/questions", tags=["Questions"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI HR Platform ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )