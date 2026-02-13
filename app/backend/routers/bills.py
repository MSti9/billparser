"""
Bills API Router
Handles bill fetching, parsing, and AI analysis endpoints
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from services.bill_fetcher import BillFetcherService
from services.bill_parser import BillParserService
from services.claude_analyzer import ClaudeAnalyzerService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/bills", tags=["bills"])

# Initialize services
bill_fetcher = BillFetcherService()
bill_parser = BillParserService()
claude_analyzer = ClaudeAnalyzerService()


# Request/Response Models
class FetchBillRequest(BaseModel):
    url: str


class FetchBillResponse(BaseModel):
    html: str
    success: bool
    error: Optional[str] = None


class ParseBillRequest(BaseModel):
    html: str


class BillSegment(BaseModel):
    type: str
    text: str


class BillStats(BaseModel):
    new_count: int
    new_words: int
    deleted_count: int
    deleted_words: int


class ParseBillResponse(BaseModel):
    segments: List[BillSegment]
    taggedText: str
    stats: BillStats
    success: bool
    error: Optional[str] = None


class AnalyzeBillRequest(BaseModel):
    taggedText: str


@router.post("/fetch", response_model=FetchBillResponse)
async def fetch_bill(request: FetchBillRequest):
    """
    Fetch HTML content from an ILGA.gov URL
    This avoids CORS issues by fetching server-side
    """
    try:
        result = await bill_fetcher.fetch_bill_html(request.url)
        return FetchBillResponse(**result)
    except Exception as e:
        logger.error(f"Error in fetch_bill endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse", response_model=ParseBillResponse)
async def parse_bill(request: ParseBillRequest):
    """
    Parse bill HTML to detect NEW and DELETED language
    Returns segments, tagged text, and statistics
    """
    try:
        result = bill_parser.parse_bill_html(request.html)
        
        if not result["success"]:
            return ParseBillResponse(
                segments=[],
                taggedText="",
                stats=BillStats(new_count=0, new_words=0, deleted_count=0, deleted_words=0),
                success=False,
                error=result.get("error", "Failed to parse bill")
            )
        
        return ParseBillResponse(
            segments=result["segments"],
            taggedText=result["taggedText"],
            stats=BillStats(**result["stats"]),
            success=True
        )
    except Exception as e:
        logger.error(f"Error in parse_bill endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_bill(request: AnalyzeBillRequest):
    """
    Analyze bill with Claude AI (streaming response)
    Returns Server-Sent Events stream
    """
    try:
        async def generate():
            try:
                async for chunk in claude_analyzer.analyze_bill_stream(request.taggedText):
                    # Format as Server-Sent Events
                    yield f"data: {chunk}\n\n"
            except Exception as e:
                logger.error(f"Error in analysis stream: {str(e)}")
                yield f"data: Error: {str(e)}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        logger.error(f"Error in analyze_bill endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))