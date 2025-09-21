from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ScoreRequest, ScoreResponse, ErrorResponse

router = APIRouter()

@router.post("/", response_model=ScoreResponse, responses={
    400: {"model": ErrorResponse, "description": "Bad Request"},
    500: {"model": ErrorResponse, "description": "Internal Server Error"}
})
async def score_resume(request: Request, score_request: ScoreRequest):
    """
    Score a resume against a job description
    
    This endpoint accepts a resume text and job description, then returns:
    - Overall compatibility score (0-10)
    - Detailed score breakdown
    - Extracted skills and missing skills
    - AI-generated summary
    - Tailored interview questions
    - Recommendation level
    """
    try:
        ml_models = request.app.state.ml_models
        
        if not ml_models.is_initialized:
            raise HTTPException(
                status_code=503, 
                detail="ML models are still initializing. Please try again in a moment."
            )
        
        result = await ml_models.score_resume(
            resume_text=score_request.resume_text,
            job_description=score_request.job_description,
            job_requirements=score_request.job_requirements
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume scoring failed: {str(e)}"
        )