"""
Claude Analyzer Service
Handles AI analysis of legislative bills using Anthropic Claude API
"""
import os
import logging
from typing import AsyncGenerator
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ClaudeAnalyzerService:
    """Service for analyzing bills with Claude AI"""
    
    # System prompt for legislative analysis
    SYSTEM_PROMPT = """You are a legislative analyst AI. You are reading bill text that has been specially tagged to preserve legislative formatting:

- Text wrapped in [NEW] ... [/NEW] tags represents NEW LANGUAGE being added to existing law (shown as underlined text in the original bill)
- Text wrapped in [DELETED] ... [/DELETED] tags represents LANGUAGE BEING REMOVED from existing law (shown as strikethrough text in the original bill)
- All other text is EXISTING LAW that remains unchanged

Your job is to:
1. Clearly explain what substantive changes this bill makes
2. Identify what existing provisions are being removed and what is replacing them
3. Note the practical impact of these changes
4. Flag any provisions that seem ambiguous or could have unintended consequences

Be specific and reference the actual language. Do not summarize generically — a legislative professional is reading your analysis."""
    
    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            logger.warning("ANTHROPIC_API_KEY not found in environment variables")
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 4096
        self.word_limit = 15000
    
    def check_length(self, tagged_text: str) -> tuple[bool, int]:
        """
        Check if tagged text exceeds word limit
        
        Returns:
            Tuple of (is_too_long, word_count)
        """
        word_count = len(tagged_text.split())
        is_too_long = word_count > self.word_limit
        return is_too_long, word_count
    
    async def analyze_bill_stream(self, tagged_text: str) -> AsyncGenerator[str, None]:
        """
        Analyze bill with Claude API (streaming)
        
        Args:
            tagged_text: The tagged bill text with [NEW] and [DELETED] markers
            
        Yields:
            Text chunks as they arrive from Claude
        """
        if not self.client:
            yield "Error: Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable."
            return
        
        try:
            # Check length
            is_too_long, word_count = self.check_length(tagged_text)
            
            if is_too_long:
                yield f"Note: This bill contains {word_count:,} words, which exceeds the recommended limit of {self.word_limit:,} words. "
                yield "The analysis may be incomplete. Consider using the 'Copy for Any AI' button to analyze sections separately.\n\n"
            
            # Create the analysis prompt
            user_message = f"""Analyze the following tagged legislative text. Explain what changes are being made, what is being removed, what is being added, and the practical impact:

{tagged_text}"""
            
            # Stream the response
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.error(f"Error analyzing bill with Claude: {str(e)}")
            yield f"\n\nError: Could not connect to Claude API. {str(e)}\n\nUse the 'Copy for Any AI' button to paste the tagged text into any AI chat."