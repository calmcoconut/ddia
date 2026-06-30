#!/usr/bin/env python3
import os
import sys
import pytest

# Add parent directory to path to import grade_responses
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from grade_responses import parse_context_desc, _extract_field

class TestParseContextDesc:
    def test_empty_or_none(self):
        assert parse_context_desc(None) == (None, None)
        assert parse_context_desc("") == (None, None)
        assert parse_context_desc("   ") == (None, None)

    def test_chapter_only(self):
        assert parse_context_desc("Chapter 1") == (1, None)
        assert parse_context_desc("chapter 2") == (2, None)
        assert parse_context_desc("Ch 3") == (3, None)
        assert parse_context_desc("cH 4") == (4, None)
        assert parse_context_desc("Chapter 14") == (14, None)

    def test_section_only(self):
        assert parse_context_desc("section: Storage and Retrieval") == (None, "Storage and Retrieval")
        assert parse_context_desc("SECTION:   Encoding and Evolution ") == (None, "Encoding and Evolution")
        assert parse_context_desc("section:Data Models") == (None, "Data Models")

    def test_chapter_and_section_parentheses(self):
        assert parse_context_desc("Ch 1 (Trade-Offs)") == (1, "Trade-Offs")
        assert parse_context_desc("ch 12 ( Stream Processing )") == (12, "Stream Processing")
        assert parse_context_desc("Chapter 7 (Sharding)") == (7, "Sharding")

    def test_chapter_and_section_comma(self):
        # Format: "Chapter X, section: Y" or "Ch X section: Y"
        assert parse_context_desc("Chapter 14, section: Doing the Right Thing") == (14, "Doing the Right Thing")
        assert parse_context_desc("Ch 5 section: Encoding and Evolution") == (5, "Encoding and Evolution")

    def test_invalid_format(self):
        assert parse_context_desc("Random text without chapter or section") == (None, None)
        assert parse_context_desc("Ch X") == (None, None)
        assert parse_context_desc("Chapter ") == (None, None)
        assert parse_context_desc("section: ") == (None, "")


@pytest.mark.parametrize(
    "text, key, expected",
    [
        # Standard string extraction
        (
            '{"strengths": "Great answer", "score": 5}',
            "strengths",
            "Great answer",
        ),
        # Standard integer extraction
        (
            '{"strengths": "Great answer", "score": 5}',
            "score",
            5,
        ),
        # Malformed JSON with unescaped quotes inside the value string
        (
            '{"strengths": "This "quote" is unescaped", "score": 5}',
            "strengths",
            'This "quote" is unescaped',
        ),
        # Text with internal newlines (using \n literal in string)
        (
            '{"feedback": "Line 1\\nLine 2", "score": 5}',
            "feedback",
            "Line 1\nLine 2",
        ),
        # Missing key
        (
            '{"score": 5}',
            "strengths",
            None,
        ),
        # Key not wrapped in quotes (won't match pattern for string extraction, expected behavior based on regex)
        (
            '{strengths: "Great answer"}',
            "strengths",
            None,
        ),
        # Handle trailing commas
        (
            '{\n  "strengths": "Good",\n}',
            "strengths",
            "Good",
        ),
        # Ensure it stops at a closing brace properly without comma
        (
            '{"summary": "A long summary without a trailing comma"}',
            "summary",
            "A long summary without a trailing comma",
        ),
        # Whitespace handling around colon
        (
            '{"feedback"  :   "Nice job"}',
            "feedback",
            "Nice job",
        ),
        # Escaped quotes handling (should unescape)
        (
            '{"weaknesses": "You missed \\"something\\" important."}',
            "weaknesses",
            'You missed "something" important.',
        ),
        # Mixed string and int, ensuring extraction doesn't bleed
        (
            '{\n  "score": 4,\n  "feedback": "Almost perfect."\n}',
            "feedback",
            "Almost perfect.",
        ),
        # Mixed string and int, extraction for int
        (
            '{\n  "score": 4,\n  "feedback": "Almost perfect."\n}',
            "score",
            4,
        ),
        # Extremely broken JSON structure, but matching regex
        (
            'Here is some text "score" : 3 and then "strengths" : "Good point"\n',
            "strengths",
            "Good point",
        ),
    ],
)
def test_extract_field(text, key, expected):
    """
    Test extraction of JSON fields from text using the _extract_field regex fallback function.
    Covers edge cases like malformed JSON, unescaped quotes, and missing keys.
    """
    result = _extract_field(text, key)
    assert result == expected
