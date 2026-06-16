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

# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Create a Flask test client with a fake API key."""
    os.environ.setdefault("GEMINI_API_KEY", "test-key-placeholder")
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

    def test_empty_write_ins_returns_empty_grades(self, client, monkeypatch):
        """All blank answers → empty grades dict, no API call made."""
        print("\n--> Starting test_empty_write_ins_returns_empty_grades", flush=True)
        import server, grade_responses
        def fail_on_call(*args, **kwargs):
            raise AssertionError("Should not call API")
        print("--> Patching grade_question to fail on call...", flush=True)
        monkeypatch.setattr(grade_responses, "grade_question", fail_on_call)
        monkeypatch.setattr(server, "grade_question", fail_on_call)

        print("--> Sending POST request with empty write-ins...", flush=True)
        res = client.post("/grade", json={
            "chapterKey": "ddia_ch1_learning",
            "writeIns": {"2": "   ", "5": ""}
        })
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        assert res.get_json()["grades"] == {}
        print("--> Finished test_empty_write_ins_returns_empty_grades", flush=True)

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

@pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY", "").strip().startswith("AIzaSy"),
    reason="Set GEMINI_API_KEY starting with AIzaSy to run live integration test"
)
class TestLiveGrading:
    def test_live_grade_returns_valid_score(self, client):
        """Real Gemini call — validates end-to-end round trip."""
        print("\n--> Starting test_live_grade_returns_valid_score", flush=True)
        print("--> Sending live request to Gemini API (through Flask server)...", flush=True)
        res = client.post("/grade", json=VALID_PAYLOAD)
        print(f"--> Received response status {res.status_code}", flush=True)
        assert res.status_code == 200
        grade = res.get_json()["grades"]["2"]
        assert 1 <= grade["score"] <= 5
        assert len(grade["feedback"]) > 10
        print("--> Finished test_live_grade_returns_valid_score", flush=True)


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
