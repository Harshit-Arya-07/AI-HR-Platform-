from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import GenerateQuestionsRequest, QuestionResponse, ErrorResponse

router = APIRouter()

@router.post("/generate", response_model=QuestionResponse, responses={
    400: {"model": ErrorResponse, "description": "Bad Request"},
    500: {"model": ErrorResponse, "description": "Internal Server Error"}
})
async def generate_questions(request: Request, questions_request: GenerateQuestionsRequest):
    """
    Generate tailored interview questions for a candidate
    
    This endpoint accepts candidate profile and job description, then returns:
    - List of tailored interview questions
    - Questions grouped by category (technical, behavioral, experience)
    - Difficulty level for each question
    - Estimated interview duration
    """
    try:
        ml_models = request.app.state.ml_models
        
        if not ml_models.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="ML models are still initializing. Please try again in a moment."
            )
        
        result = await ml_models.generate_questions(
            candidate_profile=questions_request.candidate_profile,
            job_description=questions_request.job_description,
            focus_areas=questions_request.focus_areas
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Question generation failed: {str(e)}"
        )