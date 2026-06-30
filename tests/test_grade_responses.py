#!/usr/bin/env python3
import os
import sys
import pytest

# Add parent directory to path to import grade_responses
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from grade_responses import parse_context_desc

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
