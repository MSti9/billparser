"""
Bill Fetcher Service
Fetches HTML content from ILGA.gov URLs to avoid CORS issues
"""
import httpx
import logging
from typing import Dict

logger = logging.getLogger(__name__)


class BillFetcherService:
    """Service for fetching bill HTML from ILGA.gov"""
    
    def __init__(self):
        self.timeout = 30.0
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    async def fetch_bill_html(self, url: str) -> Dict[str, any]:
        """
        Fetch HTML content from an ILGA.gov URL
        
        Args:
            url: The ILGA.gov bill URL
            
        Returns:
            Dict with html content, success status, and optional error message
        """
        try:
            # Validate URL is from ILGA.gov
            if not url or "ilga.gov" not in url.lower():
                return {
                    "html": "",
                    "success": False,
                    "error": "Invalid URL. Please provide a valid ILGA.gov bill URL."
                }
            
            # Fetch the HTML
            async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                html_content = response.text
                
                if not html_content or len(html_content) < 100:
                    return {
                        "html": "",
                        "success": False,
                        "error": "Retrieved content appears to be empty or invalid."
                    }
                
                return {
                    "html": html_content,
                    "success": True
                }
                
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching URL: {url}")
            return {
                "html": "",
                "success": False,
                "error": "Request timed out. The ILGA.gov server may be slow or unreachable."
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching URL: {url}, status: {e.response.status_code}")
            return {
                "html": "",
                "success": False,
                "error": f"HTTP error {e.response.status_code}. The bill page may not exist."
            }
        except Exception as e:
            logger.error(f"Error fetching URL: {url}, error: {str(e)}")
            return {
                "html": "",
                "success": False,
                "error": f"Failed to fetch bill: {str(e)}"
            }