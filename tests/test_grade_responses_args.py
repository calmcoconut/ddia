#!/usr/bin/env python3
import os
import sys
import pytest
from unittest.mock import patch
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from grade_responses import parse_args

@pytest.mark.smoketest
class TestParseArgs:
    def test_default_args(self):
        with patch('sys.argv', ['grade_responses.py']):
            args = parse_args()
            assert args.state == "ddia_progress.json"
            assert args.output == "ddia_grades_report.md"
            assert args.provider is None
            assert args.model is None

    def test_custom_state(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "ddia_grades_report.md"
            assert args.provider is None
            assert args.model is None

    def test_custom_state_and_output(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json', '--output', 'custom_output.md']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "custom_output.md"
            assert args.provider is None
            assert args.model is None

    def test_all_args(self):
        with patch('sys.argv', ['grade_responses.py', '--state', 'custom_state.json', '--output', 'custom_output.md', '--provider', 'openai', '--model', 'gpt-4o']):
            args = parse_args()
            assert args.state == "custom_state.json"
            assert args.output == "custom_output.md"
            assert args.provider == "openai"
            assert args.model == "gpt-4o"
