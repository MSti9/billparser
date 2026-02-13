"""
Bill Parser Service
Parses legislative bill HTML to detect NEW and DELETED language formatting
"""
import re
import html
from bs4 import BeautifulSoup
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class BillParserService:
    """Service for parsing legislative bill HTML"""
    
    # Tags that indicate NEW language (being added)
    NEW_TAGS = ['u', 'ins', 'U', 'INS']
    
    # Tags that indicate DELETED language (being removed)
    DELETED_TAGS = ['del', 's', 'strike', 'DEL', 'S', 'STRIKE']
    
    def __init__(self):
        pass
    
    def cleanup_html(self, html_content: str) -> str:
        """
        Clean up HTML before parsing
        - Remove line numbers
        - Remove page headers
        - Decode HTML entities
        - Strip non-content tags
        """
        # Decode HTML entities
        cleaned = html.unescape(html_content)
        
        # Remove page headers (pattern: SB2846 - 5 - LRB104 16878 AAS 30288 b)
        cleaned = re.sub(r'\b[A-Z]{2}\d+\s*-\s*\d+\s*-\s*LRB\d+\s+\d+\s+[A-Z]+\s+\d+\s+[a-z]\b', '', cleaned)
        
        # Remove standalone line numbers at start of lines (1-26 typically)
        cleaned = re.sub(r'^\s*\d{1,2}\s+', '', cleaned, flags=re.MULTILINE)
        
        return cleaned
    
    def detect_formatting_in_span(self, tag) -> str:
        """
        Detect if a span tag has underline or line-through styling
        Returns: "new", "deleted", or "unchanged"
        """
        # Check style attribute
        style = tag.get('style', '')
        if 'text-decoration' in style:
            if 'underline' in style:
                return "new"
            elif 'line-through' in style:
                return "deleted"
        
        # Check class attribute
        class_attr = tag.get('class', [])
        if isinstance(class_attr, list):
            class_str = ' '.join(class_attr).lower()
        else:
            class_str = str(class_attr).lower()
        
        if 'inserted' in class_str:
            return "new"
        elif 'deleted' in class_str:
            return "deleted"
        
        return "unchanged"
    
    def parse_element(self, element, current_type: str = "unchanged") -> List[Dict]:
        """
        Recursively parse an element and its children
        Returns list of segments with type and text
        """
        segments = []
        
        if isinstance(element, str):
            # Text node
            text = element.strip()
            if text:
                segments.append({"type": current_type, "text": text})
            return segments
        
        # Determine the type for this element
        tag_name = element.name
        element_type = current_type
        
        if tag_name in self.NEW_TAGS:
            element_type = "new"
        elif tag_name in self.DELETED_TAGS:
            element_type = "deleted"
        elif tag_name == 'span':
            span_type = self.detect_formatting_in_span(element)
            if span_type != "unchanged":
                element_type = span_type
        
        # Process children
        for child in element.children:
            segments.extend(self.parse_element(child, element_type))
        
        return segments
    
    def merge_adjacent_segments(self, segments: List[Dict]) -> List[Dict]:
        """
        Merge adjacent segments of the same type
        """
        if not segments:
            return []
        
        merged = [segments[0]]
        
        for segment in segments[1:]:
            last = merged[-1]
            if last["type"] == segment["type"]:
                # Merge with previous segment
                merged[-1]["text"] = last["text"] + " " + segment["text"]
            else:
                merged.append(segment)
        
        return merged
    
    def collapse_whitespace(self, text: str) -> str:
        """
        Collapse multiple spaces/newlines into single spaces
        """
        # Replace multiple whitespace with single space
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def calculate_stats(self, segments: List[Dict]) -> Dict:
        """
        Calculate statistics about NEW and DELETED provisions
        """
        new_count = 0
        new_words = 0
        deleted_count = 0
        deleted_words = 0
        
        for segment in segments:
            if segment["type"] == "new":
                new_count += 1
                new_words += len(segment["text"].split())
            elif segment["type"] == "deleted":
                deleted_count += 1
                deleted_words += len(segment["text"].split())
        
        return {
            "new_count": new_count,
            "new_words": new_words,
            "deleted_count": deleted_count,
            "deleted_words": deleted_words
        }
    
    def generate_tagged_text(self, segments: List[Dict]) -> str:
        """
        Generate tagged text with [NEW] and [DELETED] markers
        """
        tagged_parts = []
        
        for segment in segments:
            if segment["type"] == "new":
                tagged_parts.append(f"[NEW] {segment['text']} [/NEW]")
            elif segment["type"] == "deleted":
                tagged_parts.append(f"[DELETED] {segment['text']} [/DELETED]")
            else:
                tagged_parts.append(segment["text"])
        
        return " ".join(tagged_parts)
    
    def parse_bill_html(self, html_content: str) -> Dict:
        """
        Main parsing function
        
        Args:
            html_content: Raw HTML content from bill
            
        Returns:
            Dict with segments, taggedText, stats, and success status
        """
        try:
            # Cleanup HTML
            cleaned_html = self.cleanup_html(html_content)
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(cleaned_html, 'lxml')
            
            # Remove table structure tags (ILGA uses tables for layout)
            for tag in soup.find_all(['table', 'tr', 'td', 'tbody', 'thead']):
                tag.unwrap()
            
            # Parse the body
            body = soup.find('body')
            if not body:
                # If no body tag, use the whole soup
                body = soup
            
            # Extract segments
            segments = []
            for element in body.children:
                segments.extend(self.parse_element(element))
            
            # Clean up segment text
            for segment in segments:
                segment["text"] = self.collapse_whitespace(segment["text"])
            
            # Remove empty segments
            segments = [s for s in segments if s["text"]]
            
            # Merge adjacent segments of same type
            segments = self.merge_adjacent_segments(segments)
            
            # Check if any formatting was detected
            has_formatting = any(s["type"] in ["new", "deleted"] for s in segments)
            
            if not has_formatting:
                return {
                    "segments": [],
                    "taggedText": "",
                    "stats": {},
                    "success": False,
                    "error": "No legislative formatting detected. Make sure the HTML contains underline or strikethrough tags."
                }
            
            # Calculate statistics
            stats = self.calculate_stats(segments)
            
            # Generate tagged text
            tagged_text = self.generate_tagged_text(segments)
            
            return {
                "segments": segments,
                "taggedText": tagged_text,
                "stats": stats,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error parsing bill HTML: {str(e)}")
            return {
                "segments": [],
                "taggedText": "",
                "stats": {},
                "success": False,
                "error": f"Failed to parse bill: {str(e)}"
            }