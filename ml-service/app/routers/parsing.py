from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ParseResumeRequest, ParseResponse, ErrorResponse

router = APIRouter()

@router.post("/resume", response_model=ParseResponse, responses={
    400: {"model": ErrorResponse, "description": "Bad Request"},
    500: {"model": ErrorResponse, "description": "Internal Server Error"}
})
async def parse_resume(request: Request, parse_request: ParseResumeRequest):
    """
    Parse a resume and extract structured information
    
    This endpoint accepts resume text and returns:
    - Extracted candidate profile (name, email, phone, skills, etc.)
    - Raw sections identified in the resume
    - Processing time
    """
    try:
        ml_models = request.app.state.ml_models
        
        if not ml_models.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="ML models are still initializing. Please try again in a moment."
            )
        
        result = await ml_models.parse_resume(parse_request.resume_text)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume parsing failed: {str(e)}"
        )