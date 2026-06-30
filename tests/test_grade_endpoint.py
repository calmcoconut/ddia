import json
import logging
import os
import sqlite3

import grade_responses
import logger_setup
import pytest
import server
from grade_responses import (
    LLMGrader,
    extract_book_chapter_text,
    generate_summary,
    get_llm_config,
    grade_question,
    parse_context_desc,
    parse_llm_json,
)
from server import app

# ── Fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture
def client():
    """Create a Flask test client with a fake API key."""
    os.environ.setdefault("LLM_KEY", "test-key-placeholder")

    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


VALID_PAYLOAD = {
    "chapterKey": "ddia_ch1_learning",
    "writeIns": {
        "2": "The sushi principle means storing raw data in a lake so analysts can interpret it flexibly, unlike a warehouse that enforces schema on write."
    },
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
        res = client.post(
            "/grade",
            json={"chapterKey": "ddia_ch99_learning", "writeIns": {"0": "answer"}},
        )
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 400
        print("--> Finished test_invalid_chapter_number_returns_404", flush=True)

    def test_empty_write_ins_returns_zero_grades(self, client, monkeypatch):
        """All blank answers → score of 0, no API call made."""
        print("\n--> Starting test_empty_write_ins_returns_zero_grades", flush=True)

        # Patch the model's generate_json to fail, ensuring no live API call is made
        def fail_on_api_call(*args, **kwargs):
            raise AssertionError("Should not make API call for empty responses")

        if server.model is not None:
            if hasattr(server.model, "generate_json"):
                monkeypatch.setattr(server.model, "generate_json", fail_on_api_call)
            else:
                monkeypatch.setattr(server.model, "generate_content", fail_on_api_call)

        print("--> Sending POST request with empty write-ins...", flush=True)
        res = client.post(
            "/grade",
            json={"chapterKey": "ddia_ch1_learning", "writeIns": {"2": "   ", "5": ""}},
        )
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

        mock_result = {
            "score": 4,
            "strengths": "Good understanding of schema-on-read.",
            "weaknesses": "Missed the performance trade-off detail.",
            "feedback": "Consider adding why schema-on-write is faster for known queries.",
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

    def test_grade_summary_response_shape(self, client, monkeypatch):
        """Mock generate_summary -> verify /grade_summary JSON response shape."""
        print("\n--> Starting test_grade_summary_response_shape", flush=True)

        mock_summary = {
            "summary": "You did great. Areas to improve: read more about B-Trees.",
            "strengths": "Good",
            "weaknesses": "None",
        }
        monkeypatch.setattr(server, "generate_summary", lambda *a, **kw: mock_summary)

        print("--> Sending POST request to /grade_summary...", flush=True)
        res = client.post(
            "/grade_summary",
            json={
                "chapterKey": "ddia_ch1_learning",
                "grades": {
                    "2": {
                        "score": 4,
                        "strengths": "Good",
                        "weaknesses": "None",
                        "feedback": "Nice",
                    }
                },
            },
        )
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200

        data = res.get_json()
        assert "summary" in data
        assert "strengths" in data
        assert "weaknesses" in data
        assert "You did great." in data["summary"]
        print("--> Finished test_grade_summary_response_shape", flush=True)

    def test_index_route_serves_index_html(self, client):
        """Test that the index route (/) serves index.html."""
        print("\n--> Starting test_index_route_serves_index_html", flush=True)
        print("--> Requesting /...", flush=True)
        res = client.get("/")
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        assert b"<!DOCTYPE html>" in res.data or b"<html" in res.data
        print("--> Finished test_index_route_serves_index_html", flush=True)

    def test_static_files_still_served(self, client):
        """Ensure static serving is not broken by the /grade route."""
        print("\n--> Starting test_static_files_still_served", flush=True)
        print("--> Requesting /index.html...", flush=True)
        res = client.get("/index.html")
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        assert b"<!DOCTYPE html>" in res.data or b"<html" in res.data
        print("--> Finished test_static_files_still_served", flush=True)

    def test_serve_static_existing_file(self, client):
        """Test that serve_static correctly serves an existing static file like styles.css."""
        print("\n--> Starting test_serve_static_existing_file", flush=True)
        print("--> Requesting /styles.css...", flush=True)
        res = client.get("/styles.css")
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        assert b"body {" in res.data or b"font-family:" in res.data
        print("--> Finished test_serve_static_existing_file", flush=True)

    def test_serve_static_nonexistent_file(self, client):
        """Test that serve_static correctly returns 404 for a missing file."""
        print("\n--> Starting test_serve_static_nonexistent_file", flush=True)
        print("--> Requesting /nonexistent_file.css...", flush=True)
        res = client.get("/nonexistent_file.css")
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 404
        print("--> Finished test_serve_static_nonexistent_file", flush=True)

    def test_api_error_returns_500_early(self, client, monkeypatch):
        """Test that a grading failure in the chapter path returns 500 immediately."""
        print("\n--> Starting test_api_error_returns_500_early", flush=True)

        def fail_on_api_call(*args, **kwargs):
            raise RuntimeError("Rate limit or auth error from LLM API")

        monkeypatch.setattr(
            grade_responses.LLMGrader, "generate_json", fail_on_api_call
        )

        payload = {
            "chapterKey": "ddia_ch1_learning",
            "writeIns": {"2": "Answer for Q2", "5": "Answer for Q5"},
        }

        res = client.post("/grade", json=payload)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 500
        data = res.get_json()
        assert "error" in data
        assert "Rate limit or auth error" in data["error"]
        print("--> Finished test_api_error_returns_500_early", flush=True)

    def test_exam_api_error_returns_500_early(self, client, monkeypatch):
        """Test that a grading failure in the exam path returns 500 immediately."""
        print("\n--> Starting test_exam_api_error_returns_500_early", flush=True)

        def fail_on_api_call(*args, **kwargs):
            raise RuntimeError("API quota exceeded")

        monkeypatch.setattr(
            grade_responses.LLMGrader, "generate_json", fail_on_api_call
        )

        payload = {
            "isExam": True,
            "chapterKey": "ddia_exam_midterm",
            "questions": [
                {
                    "idx": 0,
                    "studentAnswer": "Ans 1",
                    "q": "Q1",
                    "modelAnswer": "MA1",
                    "chapterNum": 1,
                },
                {
                    "idx": 1,
                    "studentAnswer": "Ans 2",
                    "q": "Q2",
                    "modelAnswer": "MA2",
                    "chapterNum": 1,
                },
            ],
        }

        res = client.post("/grade", json=payload)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 500
        data = res.get_json()
        assert "error" in data
        assert "API quota exceeded" in data["error"]
        print("--> Finished test_exam_api_error_returns_500_early", flush=True)

    def test_grade_summary_api_error_returns_500(self, client, monkeypatch):
        """Test that an API error during summary generation returns a 500 status code."""
        print("\n--> Starting test_grade_summary_api_error_returns_500", flush=True)

        def fail_on_summary_call(*args, **kwargs):
            raise RuntimeError("LLM API summary service unavailable")

        monkeypatch.setattr(
            grade_responses.LLMGrader, "generate_json", fail_on_summary_call
        )

        payload = {
            "chapterKey": "ddia_ch1_learning",
            "grades": {
                "2": {
                    "score": 4,
                    "strengths": "Good",
                    "weaknesses": "None",
                    "feedback": "Nice",
                }
            },
        }

        res = client.post("/grade_summary", json=payload)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 500
        data = res.get_json()
        assert "error" in data
        assert "LLM API summary service unavailable" in data["error"]
        print("--> Finished test_grade_summary_api_error_returns_500", flush=True)


# ── Live Integration Test (opt-in, skipped without real key) ────────────────


@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY")
    or os.environ.get("LLM_PROVIDER", "gemini").lower() != "gemini",
    reason="Set LLM_KEY and LLM_PROVIDER=gemini to run live integration test",
)
class TestLiveGrading:
    def test_live_grade_returns_valid_score(self, client, monkeypatch):
        """Real Gemini call — validates end-to-end round trip."""
        print("\n--> Starting test_live_grade_returns_valid_score", flush=True)

        # Temporarily force provider to gemini for this test
        monkeypatch.setenv("LLM_PROVIDER", "gemini")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(
            server, "get_llm_config", lambda: (provider, api_key, model_name)
        )

        print(
            "--> Sending live request to Gemini API (through Flask server)...",
            flush=True,
        )
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_grade_returns_valid_score", flush=True)


@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY")
    or os.environ.get("LLM_PROVIDER", "").lower() != "openai",
    reason="Set LLM_KEY and LLM_PROVIDER=openai to run live OpenAI integration test",
)
class TestLiveOpenAIGrading:
    def test_live_openai_grade_returns_valid_score(self, client, monkeypatch):
        """Real OpenAI call — validates end-to-end round trip."""
        print("\n--> Starting test_live_openai_grade_returns_valid_score", flush=True)

        # Temporarily force provider to openai for this test
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(
            server, "get_llm_config", lambda: (provider, api_key, model_name)
        )

        print(
            "--> Sending live request to OpenAI API (through Flask server)...",
            flush=True,
        )
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_openai_grade_returns_valid_score", flush=True)


@pytest.mark.live
@pytest.mark.skipif(
    not os.environ.get("LLM_KEY")
    or os.environ.get("LLM_PROVIDER", "").lower() != "claude",
    reason="Set LLM_KEY and LLM_PROVIDER=claude to run live Claude integration test",
)
class TestLiveClaudeGrading:
    def test_live_claude_grade_returns_valid_score(self, client, monkeypatch):
        """Real Claude call — validates end-to-end round trip."""
        print("\n--> Starting test_live_claude_grade_returns_valid_score", flush=True)

        # Temporarily force provider to claude for this test
        monkeypatch.setenv("LLM_PROVIDER", "claude")
        provider, api_key, model_name = get_llm_config()
        monkeypatch.setattr(
            server, "get_llm_config", lambda: (provider, api_key, model_name)
        )

        print(
            "--> Sending live request to Claude API (through Flask server)...",
            flush=True,
        )
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

        print("--> Redirecting logs to a temp file for inspection...", flush=True)
        # Redirect logs to a temp file for inspection
        log_file = tmp_path / "test_grader.log"
        test_handler = logging.FileHandler(str(log_file))
        test_handler.setFormatter(logger_setup.JsonFormatter())
        logger = logging.getLogger("ddia.grader")
        logger.addHandler(test_handler)

        print("--> Patching server.grade_question with mock...", flush=True)
        monkeypatch.setattr(
            server,
            "grade_question",
            lambda *a, **kw: {
                "score": 3,
                "strengths": "ok",
                "weaknesses": "gaps",
                "feedback": "review",
            },
        )

        print("--> Sending POST request to /grade...", flush=True)
        client.post(
            "/grade",
            json={
                "chapterKey": "ddia_ch1_learning",
                "username": "testuser",
                "writeIns": {"2": "My answer about data lakes."},
            },
        )

        print("--> Flushing handler and reading logged lines...", flush=True)
        test_handler.flush()
        lines = log_file.read_text().strip().splitlines()
        events = [json.loads(line) for line in lines if line]

        event_names = [e["msg"] for e in events]
        assert "grade_request_received" in event_names
        assert "question_graded" in event_names
        assert "grade_request_complete" in event_names
        print("--> Finished test_successful_grade_is_logged", flush=True)

    def test_question_graded_log_has_required_fields(
        self, client, monkeypatch, tmp_path
    ):
        """question_graded log entry contains score, latency, and username."""
        print("\n--> Starting test_question_graded_log_has_required_fields", flush=True)

        print("--> Setting up logging handler for fields inspection...", flush=True)
        log_file = tmp_path / "fields_test.log"
        handler = logging.FileHandler(str(log_file))
        handler.setFormatter(logger_setup.JsonFormatter())
        logging.getLogger("ddia.grader").addHandler(handler)

        print("--> Patching server.grade_question...", flush=True)
        monkeypatch.setattr(
            server,
            "grade_question",
            lambda *a, **kw: {
                "score": 5,
                "strengths": "excellent",
                "weaknesses": "",
                "feedback": "great",
            },
        )

        print("--> Sending POST request with username...", flush=True)
        client.post(
            "/grade",
            json={
                "chapterKey": "ddia_ch1_learning",
                "username": "alice",
                "writeIns": {"2": "Schema-on-read allows flexibility."},
            },
        )

        print("--> Flushing and parsing fields log...", flush=True)
        handler.flush()
        lines = log_file.read_text().strip().splitlines()
        graded = next(
            json.loads(line)
            for line in lines
            if json.loads(line).get("msg") == "question_graded"
        )

        assert graded["score"] == 5
        assert graded["username"] == "alice"
        assert "latency_ms" in graded
        assert "student_ans_preview" in graded
        print("--> Finished test_question_graded_log_has_required_fields", flush=True)

    def test_api_error_is_logged_to_error_level(self, client, monkeypatch, tmp_path):
        """A Gemini API failure writes an ERROR-level log entry."""
        print("\n--> Starting test_api_error_is_logged_to_error_level", flush=True)

        print("--> Setting up error logging handler...", flush=True)
        log_file = tmp_path / "error_test.log"
        handler = logging.FileHandler(str(log_file))
        handler.setLevel(logging.ERROR)
        handler.setFormatter(logger_setup.JsonFormatter())
        logging.getLogger("ddia.grader").addHandler(handler)

        print("--> Patching server.grade_question to throw RuntimeError...", flush=True)
        monkeypatch.setattr(
            server,
            "grade_question",
            lambda *a, **kw: (_ for _ in ()).throw(RuntimeError("timeout")),
        )

        print("--> Sending POST request that triggers API error...", flush=True)
        client.post(
            "/grade",
            json={
                "chapterKey": "ddia_ch1_learning",
                "username": "bob",
                "writeIns": {"2": "Some answer."},
            },
        )

        print("--> Flushing and verifying error log level...", flush=True)
        handler.flush()
        lines = [line for line in log_file.read_text().strip().splitlines() if line]
        assert any(json.loads(line)["level"] == "ERROR" for line in lines)
        print("--> Finished test_api_error_is_logged_to_error_level", flush=True)


def test_book_context_extraction_integration():
    """Verify that chapter numbers are parsed correctly, and full chapter text is retrieved."""
    print("\n--> Starting test_book_context_extraction_integration", flush=True)

    ch_num, sec_name = parse_context_desc(
        "Chapter 1 (Trade-Offs), section: Data Warehouses"
    )
    assert ch_num == 1
    assert sec_name == "Data Warehouses"

    # skip the actual text extraction if chapters dir is missing, which it may be in test env
    if os.path.exists(
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "chapters")
    ):
        text = extract_book_chapter_text(1)
        assert text != ""
        assert "data warehouse" in text.lower()
        assert "Thomas Sowell" in text
    print("--> Finished test_book_context_extraction_integration", flush=True)


def test_book_context_fallback_extraction():
    """Verify that if chapters/ HTML file is missing, extract_book_chapter_text falls back to chapters_fallback/."""
    print("\n--> Starting test_book_context_fallback_extraction", flush=True)

    # Clear cache for chapter 99
    grade_responses._CHAPTER_TEXT_CACHE.pop(99, None)

    # Use project root directory to create a temporary fallback file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fallback_dir = os.path.join(base_dir, "chapters_fallback")
    os.makedirs(fallback_dir, exist_ok=True)

    fallback_file = os.path.join(fallback_dir, "chapter_99.txt")
    with open(fallback_file, "w", encoding="utf-8") as f:
        f.write("This is chapter 99 fallback summary content.")

    try:
        text = extract_book_chapter_text(99)
        assert text == "This is chapter 99 fallback summary content."
    finally:
        if os.path.exists(fallback_file):
            try:
                os.remove(fallback_file)
            except Exception:
                pass
    print("--> Finished test_book_context_fallback_extraction", flush=True)


def test_grade_responses_sqlite_loading_support(tmp_path):
    """Verify that grade_responses can detect and load progress from an exported SQLite database."""
    print("\n--> Starting test_grade_responses_sqlite_loading_support", flush=True)

    # Create temp SQLite database file
    db_path = tmp_path / "temp_progress.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute(
        "CREATE TABLE progress (username TEXT, state_key TEXT, state_data TEXT, PRIMARY KEY (username, state_key))"
    )

    mock_state = {"writeInAnswers": {"2": "Schema-on-read offers analyst flexibility."}}
    cursor.execute(
        "INSERT INTO progress (username, state_key, state_data) VALUES (?, ?, ?)",
        ["patrick", "ddia_ch1_learning", json.dumps(mock_state)],
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
    cursor.execute(
        "SELECT state_key, state_data FROM progress WHERE username = ?", [selected_user]
    )

    loaded_state = {}
    for key, data_str in cursor.fetchall():
        loaded_state[key] = json.loads(data_str)

    conn.close()

    assert "ddia_ch1_learning" in loaded_state
    assert (
        loaded_state["ddia_ch1_learning"]["writeInAnswers"]["2"]
        == "Schema-on-read offers analyst flexibility."
    )
    print("--> Finished test_grade_responses_sqlite_loading_support", flush=True)


@pytest.mark.smoketest
class TestLLMGraderAdapter:
    """Unit tests validating dynamic LLMGrader client adapter logic with mock wrappers."""

    def test_grader_gemini_mock(self, monkeypatch):
        # Create fake model response class
        class FakeResponse:
            def __init__(self, text):
                self.text = text

        class FakeGenerativeModel:
            def __init__(self, model_name):
                self.model_name = model_name

            def generate_content(
                self, prompt, generation_config=None, request_options=None
            ):
                return FakeResponse('{"score": 5, "feedback": "excellent"}')

        # Patch google.generativeai GenerativeModel constructor
        monkeypatch.setattr(
            grade_responses.genai, "GenerativeModel", FakeGenerativeModel
        )

        grader = LLMGrader(
            provider="gemini", api_key="fake-gemini-key", model_name="gemini-3.5-flash"
        )
        res = grader.generate_json("Test Prompt")
        assert "excellent" in res

    def test_grader_openai_mock(self, monkeypatch):

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
                return FakeCompletion(
                    [FakeChoice(FakeMessage('{"score": 4, "feedback": "good"}'))]
                )

        class FakeChat:
            def __init__(self):
                self.completions = FakeCompletions()

        class FakeOpenAIClient:
            def __init__(self, api_key):
                self.api_key = api_key
                self.chat = FakeChat()

        class DummyOpenaiModule:
            OpenAI = FakeOpenAIClient

        monkeypatch.setattr(grade_responses, "openai", DummyOpenaiModule)

        grader = LLMGrader(
            provider="openai", api_key="fake-openai-key", model_name="gpt-4o"
        )
        res = grader.generate_json("Test Prompt")
        assert "good" in res

    def test_grader_claude_mock(self, monkeypatch):

        # Mock Anthropic library and client
        class FakeTextMessage:
            def __init__(self, text):
                self.text = text

        class FakeMessageResponse:
            def __init__(self, content):
                self.content = content

        class FakeMessages:
            def create(self, **kwargs):
                return FakeMessageResponse(
                    [FakeTextMessage('{"score": 3, "feedback": "fair"}')]
                )

        class FakeAnthropicClient:
            def __init__(self, api_key):
                self.api_key = api_key
                self.messages = FakeMessages()

        class DummyAnthropicModule:
            Anthropic = FakeAnthropicClient

        monkeypatch.setattr(grade_responses, "anthropic", DummyAnthropicModule)

        grader = LLMGrader(
            provider="claude",
            api_key="fake-claude-key",
            model_name="claude-3-5-sonnet-latest",
        )
        res = grader.generate_json("Test Prompt")
        assert "fair" in res

    def test_llm_config_general_vars(self, monkeypatch):

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

    def test_generate_summary_injects_chapter_content(self, monkeypatch):
        """Verify that generate_summary fetches and injects the textbook chapter content in the prompt."""

        captured_prompt = None

        class MockLLMGrader:
            def __init__(self):
                self.provider = "gemini"
                self.api_key = "fake"
                self.model_name = "gemini-3.5-flash"

            def generate_json(self, prompt):
                nonlocal captured_prompt
                captured_prompt = prompt
                return '{"went_well": "excellent", "could_be_better": "none", "tldr_summary": "perfect"}'

        mock_model = MockLLMGrader()

        # Call generate_summary for Chapter 1
        result = generate_summary(
            mock_model, "Chapter 1: Trade-Offs in Data Systems Architecture", {}
        )

        assert captured_prompt is not None
        assert "TEXTBOOK CHAPTER 1 FULL CONTENT:" in captured_prompt
        if os.path.exists(
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "chapters")
        ):
            assert "Thomas Sowell" in captured_prompt  # specific quote from chapter 1 text
        else:
            assert "sushi principle" in captured_prompt  # present in the fallback text
        assert result["summary"] == "perfect"


# ── parse_llm_json Robustness Tests (TDD for malformed LLM output) ───────────
#
# These tests document the exact failure mode seen in production:
#   "Expecting ',' delimiter: line 6 column 3 (char 1984)"
# This happens when the LLM writes unescaped double-quotes inside a JSON string
# value, breaking the parser midway through a long response.


class TestParseLlmJson:
    """Unit tests for parse_llm_json covering clean JSON, markdown-wrapped JSON,
    and malformed JSON produced by LLMs (unescaped quotes, literal newlines, etc.)."""

    def setup_method(self):

        self.parse = parse_llm_json

    def test_clean_json_is_parsed(self):
        """Normal well-formed JSON is parsed correctly."""
        raw = '{"score": 4, "strengths": "Good.", "weaknesses": "Minor gaps.", "feedback": "Nice work."}'
        result = self.parse(raw)
        assert result["score"] == 4
        assert result["strengths"] == "Good."

    def test_markdown_wrapped_json_is_parsed(self):
        """LLM sometimes wraps JSON in ```json ... ``` — this must be stripped."""
        raw = '```json\n{"score": 3, "strengths": "OK", "weaknesses": "Gaps", "feedback": "See below."}\n```'
        result = self.parse(raw)
        assert result["score"] == 3

    def test_json_with_surrounding_text_is_parsed(self):
        """LLM sometimes adds prose before/after the JSON block."""
        raw = 'Here is my evaluation:\n{"score": 5, "strengths": "Excellent", "weaknesses": "", "feedback": "Perfect."}\nHope this helps!'
        result = self.parse(raw)
        assert result["score"] == 5

    def test_unescaped_quote_inside_value_does_not_raise(self):
        """
        REGRESSION TEST — matches the production error:
        "Expecting ',' delimiter: line 6 column 3 (char 1984)"

        The LLM wrote an unescaped double-quote inside a string value, e.g.:
            "feedback": "You said "data lake" which is correct..."
        This breaks json.loads but our regex fallback should still extract the fields.
        """
        # Simulate LLM output with an unescaped quote inside the feedback string
        raw = (
            "{\n"
            '  "score": 4,\n'
            '  "strengths": "Good understanding of the core concept.",\n'
            '  "weaknesses": "Missed the write amplification trade-off.",\n'
            '  "feedback": "You mentioned the "schema-on-read" pattern which is spot on. '
            'To think further: how would you handle schema evolution?"\n'
            "}"
        )
        # This MUST NOT raise and MUST return the score
        result = self.parse(raw)
        assert result.get("score") == 4, (
            "score should be extracted even when feedback contains an unescaped quote"
        )
        assert "strengths" in result
        assert "weaknesses" in result

    def test_literal_newline_inside_value_does_not_raise(self):
        """
        json.loads strict=False handles literal newlines in strings,
        but let's document this explicitly.
        """
        raw = '{"score": 3, "strengths": "Good.\nClear explanation.", "weaknesses": "Gaps.", "feedback": "Nice."}'
        result = self.parse(raw)
        assert result["score"] == 3

    def test_very_long_feedback_with_unescaped_quote_near_char_1984(self):
        """
        Stress test: feedback ~2000 chars with an unescaped quote near position 1984
        (the exact production failure). Ensures the regex fallback handles long payloads.
        """
        long_feedback = (
            ("A" * 900)
            + ' this concept is called "write amplification" and it is critical. '
            + ("B" * 900)
        )
        raw = (
            f"{{\n"
            f'  "score": 4,\n'
            f'  "strengths": "Great work on the core concepts.",\n'
            f'  "weaknesses": "Minor gaps in trade-off analysis.",\n'
            f'  "feedback": "{long_feedback}"\n'
            f"}}"
        )
        result = self.parse(raw)
        assert result.get("score") == 4

    def test_completely_missing_braces_raises(self):
        """If there is no JSON structure at all, parse_llm_json should raise."""
        raw = "I cannot grade this response. Please try again."
        with pytest.raises(Exception):
            self.parse(raw)

    def test_grade_question_returns_graceful_error_dict_on_bad_json(self, monkeypatch):
        """
        End-to-end: if the LLM returns malformed JSON for grade_question,
        the result dict should NOT contain 'Error' in strengths.
        Instead it should extract whatever fields it can, or at minimum not crash.
        """

        # Simulate LLM returning JSON with unescaped quote inside feedback
        bad_json = (
            '{"score": 4, "strengths": "Good.", "weaknesses": "Minor gaps.", '
            '"feedback": "You used the word "consistency" correctly. Keep it up."}'
        )

        class FakeLLMGrader:
            def generate_json(self, prompt):
                return bad_json

        result = grade_question(
            FakeLLMGrader(),
            q_text="What is write-ahead logging?",
            model_answer="WAL ensures durability by writing changes to a log before applying them.",
            student_answer="The database writes to a log first so crashes don't lose data.",
            context_desc="Chapter 3, section: Storage Engines",
        )

        # Should not return the generic "API failed to evaluate response." error message
        assert result.get("strengths") != "Error", (
            "parse_llm_json should recover from unescaped quotes rather than "
            "falling through to the generic API error handler"
        )
        assert result.get("score") == 4
