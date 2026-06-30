"""
conftest.py — pytest session-wide setup.

This file is loaded by pytest before any test module is imported,
so environment variables are guaranteed to be set before `import server`
executes server-level initialization (load_env, get_llm_config, LLMGrader).
"""

import os

from grade_responses import load_env

# Load .env if present, then fall back to a placeholder key so the LLM
# client initializes cleanly in CI (where no real key is available).
load_env()
os.environ.setdefault("LLM_KEY", "test-key-placeholder")
if os.environ.get("LLM_KEY"):
    os.environ["LLM_KEY"] = os.environ["LLM_KEY"].strip()
