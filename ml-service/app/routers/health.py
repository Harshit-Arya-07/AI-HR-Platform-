from fastapi import APIRouter, Request
from app.models.schemas import HealthResponse

router = APIRouter()

@router.get("/", response_model=HealthResponse)
async def health_check(request: Request):
    """Health check endpoint"""
    ml_models = request.app.state.ml_models
    health_status = ml_models.get_health_status()
    
    return HealthResponse(**health_status)