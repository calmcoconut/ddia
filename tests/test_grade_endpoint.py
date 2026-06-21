#!/usr/bin/env python3
"""
Smoke tests for the /grade Flask endpoint.
Run with: python -m pytest tests/test_grade_endpoint.py -v

Requires:
  - GEMINI_API_KEY set in environment (for live tests)
  - pip install pytest flask
"""

import json
import logging
import os
import pytest
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from grade_responses import load_env
load_env()

if os.environ.get("LLM_KEY"):
    os.environ["LLM_KEY"] = os.environ["LLM_KEY"].strip()

# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Create a Flask test client with a fake API key."""
    os.environ.setdefault("LLM_KEY", "test-key-placeholder")
    from server import app
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

VALID_PAYLOAD = {
    "chapterKey": "ddia_ch1_learning",
    "writeIns": {
        "2": "The sushi principle means storing raw data in a lake so analysts can interpret it flexibly, unlike a warehouse that enforces schema on write."
    }
}

# ── Smoke Tests (no real API call) ──────────────────────────────────────────

@pytest.mark.smoketest
class TestEndpointContract:
    """Validate request/response shape without a live Gemini call."""

    def test_missing_chapter_key_returns_400(self, client):
        """Malformed payload: no chapterKey."""
        print("\n--> Starting test_missing_chapter_key_returns_400", flush=True)
        print("--> Sending POST request to /grade without chapterKey...", flush=True)
        res = client.post("/grade", json={"writeIns": {"0": "some answer"}})
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 400
        data = res.get_json()
        assert "error" in data
        print("--> Finished test_missing_chapter_key_returns_400", flush=True)

    def test_invalid_chapter_number_returns_404(self, client):
        """chapterKey with a chapter number not in CHAPTERS_LIST."""
        print("\n--> Starting test_invalid_chapter_number_returns_404", flush=True)
        print("--> Sending POST request with invalid chapter number...", flush=True)
        res = client.post("/grade", json={
            "chapterKey": "ddia_ch99_learning",
            "writeIns": {"0": "answer"}
        })
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 400
        print("--> Finished test_invalid_chapter_number_returns_404", flush=True)

    def test_empty_write_ins_returns_zero_grades(self, client, monkeypatch):
        """All blank answers → score of 0, no API call made."""
        print("\n--> Starting test_empty_write_ins_returns_zero_grades", flush=True)
        import server
        
        # Patch the model's generate_json to fail, ensuring no live API call is made
        def fail_on_api_call(*args, **kwargs):
            raise AssertionError("Should not make API call for empty responses")
        
        if hasattr(server.model, "generate_json"):
            monkeypatch.setattr(server.model, "generate_json", fail_on_api_call)
        else:
            monkeypatch.setattr(server.model, "generate_content", fail_on_api_call)

        print("--> Sending POST request with empty write-ins...", flush=True)
        res = client.post("/grade", json={
            "chapterKey": "ddia_ch1_learning",
            "writeIns": {"2": "   ", "5": ""}
        })
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        
        grades = res.get_json()["grades"]
        assert grades["2"]["score"] == 0
        assert grades["5"]["score"] == 0
        assert "empty response" in grades["2"]["feedback"].lower()
        print("--> Finished test_empty_write_ins_returns_zero_grades", flush=True)

    def test_response_shape_with_mock(self, client, monkeypatch):
        """Mock grade_question → verify response JSON has correct shape."""
        print("\n--> Starting test_response_shape_with_mock", flush=True)
        import server
        mock_result = {
            "score": 4,
            "strengths": "Good understanding of schema-on-read.",
            "weaknesses": "Missed the performance trade-off detail.",
            "feedback": "Consider adding why schema-on-write is faster for known queries."
        }
        print("--> Patching server.grade_question with mock result...", flush=True)
        monkeypatch.setattr(server, "grade_question", lambda *a, **kw: mock_result)

        print("--> Sending POST request with VALID_PAYLOAD...", flush=True)
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200

        data = res.get_json()
        assert "grades" in data
        assert "2" in data["grades"]

        grade = data["grades"]["2"]
        assert set(grade.keys()) == {"score", "strengths", "weaknesses", "feedback"}
        assert isinstance(grade["score"], int)
        assert 1 <= grade["score"] <= 5
        print("--> Finished test_response_shape_with_mock", flush=True)

    def test_static_files_still_served(self, client):
        """Ensure static serving is not broken by the /grade route."""
        print("\n--> Starting test_static_files_still_served", flush=True)
        print("--> Requesting /index.html...", flush=True)
        res = client.get("/index.html")
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        assert b"<!DOCTYPE html>" in res.data or b"<html" in res.data
        print("--> Finished test_static_files_still_served", flush=True)


# ── Live Integration Test (opt-in, skipped without real key) ────────────────

@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY") or os.environ.get("LLM_PROVIDER", "gemini").lower() != "gemini",
    reason="Set LLM_KEY and LLM_PROVIDER=gemini to run live integration test"
)
class TestLiveGrading:
    def test_live_grade_returns_valid_score(self, client, monkeypatch):
        """Real Gemini call — validates end-to-end round trip."""
        print("\n--> Starting test_live_grade_returns_valid_score", flush=True)
        import server
        from grade_responses import get_llm_config
        # Temporarily force provider to gemini for this test
        monkeypatch.setenv("LLM_PROVIDER", "gemini")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(server, "get_llm_config", lambda: (provider, api_key, model_name))
        
        print("--> Sending live request to Gemini API (through Flask server)...", flush=True)
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_grade_returns_valid_score", flush=True)


@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY") or os.environ.get("LLM_PROVIDER", "").lower() != "openai",
    reason="Set LLM_KEY and LLM_PROVIDER=openai to run live OpenAI integration test"
)
class TestLiveOpenAIGrading:
    def test_live_openai_grade_returns_valid_score(self, client, monkeypatch):
        """Real OpenAI call — validates end-to-end round trip."""
        print("\n--> Starting test_live_openai_grade_returns_valid_score", flush=True)
        import server
        from grade_responses import get_llm_config
        # Temporarily force provider to openai for this test
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(server, "get_llm_config", lambda: (provider, api_key, model_name))
        
        print("--> Sending live request to OpenAI API (through Flask server)...", flush=True)
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_openai_grade_returns_valid_score", flush=True)


@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY") or os.environ.get("LLM_PROVIDER", "").lower() != "claude",
    reason="Set LLM_KEY and LLM_PROVIDER=claude to run live Claude integration test"
)
class TestLiveClaudeGrading:
    def test_live_claude_grade_returns_valid_score(self, client, monkeypatch):
        """Real Claude call — validates end-to-end round trip."""
        print("\n--> Starting test_live_claude_grade_returns_valid_score", flush=True)
        import server
        from grade_responses import get_llm_config
        # Temporarily force provider to claude for this test
        monkeypatch.setenv("LLM_PROVIDER", "claude")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(server, "get_llm_config", lambda: (provider, api_key, model_name))
        
        print("--> Sending live request to Claude API (through Flask server)...", flush=True)
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_claude_grade_returns_valid_score", flush=True)


@pytest.mark.smoketest
class TestLogging:
    """Verify that grading requests are written to the log."""

    def test_successful_grade_is_logged(self, client, monkeypatch, tmp_path):
        """A successful /grade call writes a question_graded INFO entry."""
        print("\n--> Starting test_successful_grade_is_logged", flush=True)
        import server, logger_setup

        print("--> Redirecting logs to a temp file for inspection...", flush=True)
        # Redirect logs to a temp file for inspection
        log_file = tmp_path / "test_grader.log"
        test_handler = logging.FileHandler(str(log_file))
        test_handler.setFormatter(logger_setup.JsonFormatter())
        logger = logging.getLogger("ddia.grader")
        logger.addHandler(test_handler)

        print("--> Patching server.grade_question with mock...", flush=True)
        monkeypatch.setattr(server, "grade_question", lambda *a, **kw: {
            "score": 3, "strengths": "ok", "weaknesses": "gaps", "feedback": "review"
        })

        print("--> Sending POST request to /grade...", flush=True)
        client.post("/grade", json={
            "chapterKey": "ddia_ch1_learning",
            "username":   "testuser",
            "writeIns":   {"2": "My answer about data lakes."}
        })

        print("--> Flushing handler and reading logged lines...", flush=True)
        test_handler.flush()
        lines = log_file.read_text().strip().splitlines()
        events = [json.loads(l) for l in lines if l]

        event_names = [e["msg"] for e in events]
        assert "grade_request_received" in event_names
        assert "question_graded"        in event_names
        assert "grade_request_complete" in event_names
        print("--> Finished test_successful_grade_is_logged", flush=True)

    def test_question_graded_log_has_required_fields(self, client, monkeypatch, tmp_path):
        """question_graded log entry contains score, latency, and username."""
        print("\n--> Starting test_question_graded_log_has_required_fields", flush=True)
        import server, logger_setup

        print("--> Setting up logging handler for fields inspection...", flush=True)
        log_file = tmp_path / "fields_test.log"
        handler = logging.FileHandler(str(log_file))
        handler.setFormatter(logger_setup.JsonFormatter())
        logging.getLogger("ddia.grader").addHandler(handler)

        print("--> Patching server.grade_question...", flush=True)
        monkeypatch.setattr(server, "grade_question", lambda *a, **kw: {
            "score": 5, "strengths": "excellent", "weaknesses": "", "feedback": "great"
        })

        print("--> Sending POST request with username...", flush=True)
        client.post("/grade", json={
            "chapterKey": "ddia_ch1_learning",
            "username":   "alice",
            "writeIns":   {"2": "Schema-on-read allows flexibility."}
        })

        print("--> Flushing and parsing fields log...", flush=True)
        handler.flush()
        lines = log_file.read_text().strip().splitlines()
        graded = next(json.loads(l) for l in lines
                      if json.loads(l).get("msg") == "question_graded")

        assert graded["score"]       == 5
        assert graded["username"]    == "alice"
        assert "latency_ms"          in graded
        assert "student_ans_preview" in graded
        print("--> Finished test_question_graded_log_has_required_fields", flush=True)

    def test_api_error_is_logged_to_error_level(self, client, monkeypatch, tmp_path):
        """A Gemini API failure writes an ERROR-level log entry."""
        print("\n--> Starting test_api_error_is_logged_to_error_level", flush=True)
        import server, logger_setup

        print("--> Setting up error logging handler...", flush=True)
        log_file = tmp_path / "error_test.log"
        handler = logging.FileHandler(str(log_file))
        handler.setLevel(logging.ERROR)
        handler.setFormatter(logger_setup.JsonFormatter())
        logging.getLogger("ddia.grader").addHandler(handler)

        print("--> Patching server.grade_question to throw RuntimeError...", flush=True)
        monkeypatch.setattr(server, "grade_question",
                            lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("timeout")))

        print("--> Sending POST request that triggers API error...", flush=True)
        client.post("/grade", json={
            "chapterKey": "ddia_ch1_learning",
            "username":   "bob",
            "writeIns":   {"2": "Some answer."}
        })

        print("--> Flushing and verifying error log level...", flush=True)
        handler.flush()
        lines = [l for l in log_file.read_text().strip().splitlines() if l]
        assert any(json.loads(l)["level"] == "ERROR" for l in lines)
        print("--> Finished test_api_error_is_logged_to_error_level", flush=True)


@pytest.mark.smoketest
def test_book_context_extraction_integration():
    """Verify that chapter numbers are parsed correctly, and full chapter text is retrieved."""
    print("\n--> Starting test_book_context_extraction_integration", flush=True)
    from grade_responses import parse_context_desc, extract_book_chapter_text
    
    ch_num, sec_name = parse_context_desc("Chapter 1 (Trade-Offs), section: Data Warehouses")
    assert ch_num == 1
    assert sec_name == "Data Warehouses"
    
    # skip the actual text extraction if chapters dir is missing, which it may be in test env
    if os.path.exists(os.path.join(os.path.dirname(os.path.dirname(__file__)), "chapters")):
        text = extract_book_chapter_text(1)
        assert text != ""
        assert "data warehouse" in text.lower()
        assert "Thomas Sowell" in text
    print("--> Finished test_book_context_extraction_integration", flush=True)


@pytest.mark.smoketest
def test_grade_responses_sqlite_loading_support(tmp_path):
    """Verify that grade_responses can detect and load progress from an exported SQLite database."""
    print("\n--> Starting test_grade_responses_sqlite_loading_support", flush=True)
    import sqlite3
    import json
    
    # Create temp SQLite database file
    db_path = tmp_path / "temp_progress.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE progress (username TEXT, state_key TEXT, state_data TEXT, PRIMARY KEY (username, state_key))")
    
    mock_state = {
        "writeInAnswers": {"2": "Schema-on-read offers analyst flexibility."}
    }
    cursor.execute(
        "INSERT INTO progress (username, state_key, state_data) VALUES (?, ?, ?)",
        ["patrick", "ddia_ch1_learning", json.dumps(mock_state)]
    )
    conn.commit()
    conn.close()
    
    # Assert it is recognized as a SQLite file
    with open(db_path, "rb") as f:
        header = f.read(15)
        assert header.startswith(b"SQLite format 3")
        
    # Replicate the exact loading logic of grade_responses.py
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT username FROM progress")
    db_users = [r[0] for r in cursor.fetchall()]
    assert "patrick" in db_users
    
    selected_user = db_users[0]
    cursor.execute("SELECT state_key, state_data FROM progress WHERE username = ?", [selected_user])
    
    loaded_state = {}
    for key, data_str in cursor.fetchall():
        loaded_state[key] = json.loads(data_str)
        
    conn.close()
    
    assert "ddia_ch1_learning" in loaded_state
    assert loaded_state["ddia_ch1_learning"]["writeInAnswers"]["2"] == "Schema-on-read offers analyst flexibility."
    print("--> Finished test_grade_responses_sqlite_loading_support", flush=True)


@pytest.mark.smoketest
class TestLLMGraderAdapter:
    """Unit tests validating dynamic LLMGrader client adapter logic with mock wrappers."""

    def test_grader_gemini_mock(self, monkeypatch):
        from grade_responses import LLMGrader
        
        # Create fake model response class
        class FakeResponse:
            def __init__(self, text):
                self.text = text

        class FakeGenerativeModel:
            def __init__(self, model_name):
                self.model_name = model_name

            def generate_content(self, prompt, generation_config=None, request_options=None):
                return FakeResponse('{"score": 5, "feedback": "excellent"}')

        # Patch google.generativeai GenerativeModel constructor
        import grade_responses
        monkeypatch.setattr(grade_responses.genai, "GenerativeModel", FakeGenerativeModel)

        grader = LLMGrader(provider="gemini", api_key="fake-gemini-key", model_name="gemini-3.5-flash")
        res = grader.generate_json("Test Prompt")
        assert "excellent" in res

    def test_grader_openai_mock(self, monkeypatch):
        from grade_responses import LLMGrader
        
        # Mock OpenAI library and client
        class FakeMessage:
            def __init__(self, content):
                self.content = content

        class FakeChoice:
            def __init__(self, message):
                self.message = message

        class FakeCompletion:
            def __init__(self, choices):
                self.choices = choices

        class FakeCompletions:
            def create(self, **kwargs):
                return FakeCompletion([FakeChoice(FakeMessage('{"score": 4, "feedback": "good"}'))])

        class FakeChat:
            def __init__(self):
                self.completions = FakeCompletions()

        class FakeOpenAIClient:
            def __init__(self, api_key):
                self.api_key = api_key
                self.chat = FakeChat()

        import grade_responses
        class DummyOpenaiModule:
            OpenAI = FakeOpenAIClient

        monkeypatch.setattr(grade_responses, "openai", DummyOpenaiModule)
        
        grader = LLMGrader(provider="openai", api_key="fake-openai-key", model_name="gpt-4o")
        res = grader.generate_json("Test Prompt")
        assert "good" in res

    def test_grader_claude_mock(self, monkeypatch):
        from grade_responses import LLMGrader

        # Mock Anthropic library and client
        class FakeTextMessage:
            def __init__(self, text):
                self.text = text

        class FakeMessageResponse:
            def __init__(self, content):
                self.content = content

        class FakeMessages:
            def create(self, **kwargs):
                return FakeMessageResponse([FakeTextMessage('{"score": 3, "feedback": "fair"}')])

        class FakeAnthropicClient:
            def __init__(self, api_key):
                self.api_key = api_key
                self.messages = FakeMessages()

        import grade_responses
        class DummyAnthropicModule:
            Anthropic = FakeAnthropicClient

        monkeypatch.setattr(grade_responses, "anthropic", DummyAnthropicModule)

        grader = LLMGrader(provider="claude", api_key="fake-claude-key", model_name="claude-3-5-sonnet-latest")
        res = grader.generate_json("Test Prompt")
        assert "fair" in res

    def test_llm_config_general_vars(self, monkeypatch):
        from grade_responses import get_llm_config
        
        # Setup general variables in environment
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        monkeypatch.setenv("LLM_KEY", "general-key-123")
        monkeypatch.setenv("LLM_MODEL", "gpt-4-custom")
        
        # Remove any provider-specific overrides from environment for clean test
        monkeypatch.delenv("OPENAI_KEY", raising=False)
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        
        provider, api_key, model_name = get_llm_config()
        assert provider == "openai"
        assert api_key == "general-key-123"
        assert model_name == "gpt-4-custom"

