import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from grade_responses import _extract_field


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
