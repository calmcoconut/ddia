# server.py
"""
Flask server for the DDIA Applied Learning Platform.
Serves static files and evaluates student write-in answers via the Gemini API.
"""
from flask import Flask, request, jsonify, send_from_directory
import os
import time
import uuid
import re
import google.generativeai as genai
from logger_setup import configure_logging
from grade_responses import grade_question, CHAPTERS_LIST, load_questions_from_app_js

log = configure_logging()

app = Flask(__name__, static_folder="learning-app", static_url_path="")

# Load GEMINI_KEY from .env if GEMINI_API_KEY not already set
if not os.environ.get("GEMINI_API_KEY") and os.path.exists(".env"):
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.strip().startswith("GEMINI_KEY="):
                    val = line.strip().split("=", 1)[1]
                    os.environ["GEMINI_API_KEY"] = val
                    break
    except Exception as exc:
        log.error("error_reading_env_file", extra={"error": str(exc)}, exc_info=True)

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ── /grade endpoint with logging ──────────────────────────────────────────
@app.route("/grade", methods=["POST"])
def grade():
    request_id = str(uuid.uuid4())[:8]   # short ID for log correlation
    start_time = time.monotonic()

    # Re-evaluate in case env was set dynamically or loaded
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        log.error("GEMINI_API_KEY missing", extra={"request_id": request_id})
        return jsonify({"error": "GEMINI_API_KEY not set on server"}), 500

    payload    = request.get_json(force=True)
    ch_key     = payload.get("chapterKey", "")
    write_ins  = payload.get("writeIns", {})
    username   = payload.get("username", "anonymous")   # forward from browser

    answered = {k: v for k, v in write_ins.items() if v and v.strip()}

    log.info("grade_request_received", extra={
        "request_id":   request_id,
        "username":     username,
        "chapter_key":  ch_key,
        "question_count": len(answered),
    })

    # Validate chapterKey and load questions
    try:
        ch_num = int(re.search(r"\d+", ch_key).group())
        ch_info = CHAPTERS_LIST.get(ch_num)
        if not ch_info:
            raise ValueError(f"Unknown chapter number: {ch_num}")
        questions = load_questions_from_app_js(ch_info["dir"])
    except Exception as exc:
        log.error("validation_failed", extra={
            "request_id": request_id,
            "chapter_key": ch_key,
            "error": str(exc)
        }, exc_info=True)
        return jsonify({"error": f"Invalid chapter key: {ch_key}"}), 400

    results = {}
    for q_idx_str, student_ans in answered.items():
        q_start = time.monotonic()
        try:
            q_idx = int(q_idx_str)
            q     = questions[q_idx]
        except (ValueError, IndexError):
            log.warning("invalid_question_index", extra={
                "request_id": request_id,
                "q_idx_str": q_idx_str
            })
            continue

        q_section = q.get('section', 'General')
        q_hint = q.get('hint', '')
        context = f"Chapter {ch_num} ({ch_info['title']}), section: {q_section}"
        if q_hint:
            context += f", hint provided to student: {q_hint}"
        
        try:
            grade_result = grade_question(model, q["q"], q["modelAnswer"], student_ans, context)
        except Exception as exc:
            log.error("gemini_api_error", extra={
                "request_id": request_id,
                "q_idx":      q_idx_str,
                "error":      str(exc),
            }, exc_info=True)
            grade_result = {"score": 0, "strengths": "", "weaknesses": "", "feedback": str(exc)}

        elapsed_ms = round((time.monotonic() - q_start) * 1000)

        log.info("question_graded", extra={
            "request_id":   request_id,
            "username":     username,
            "chapter_key":  ch_key,
            "q_idx":        q_idx_str,
            "section":      q.get("section"),
            # Truncate student answer to avoid giant log files
            "student_ans_preview": student_ans[:300],
            "score":        grade_result["score"],
            "strengths":    grade_result["strengths"],
            "weaknesses":   grade_result["weaknesses"],
            "feedback":     grade_result["feedback"],
            "latency_ms":   elapsed_ms,
        })

        results[q_idx_str] = grade_result

    total_ms = round((time.monotonic() - start_time) * 1000)
    log.info("grade_request_complete", extra={
        "request_id":      request_id,
        "username":        username,
        "chapter_key":     ch_key,
        "graded_count":    len(results),
        "avg_score":       round(sum(r["score"] for r in results.values()) / len(results), 2) if results else None,
        "total_latency_ms": total_ms,
    })

    return jsonify({"grades": results})

if __name__ == "__main__":
    import sys
    # Ensure genai is configured if the model is recreated/run
    if os.environ.get("GEMINI_API_KEY"):
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    else:
        port = int(os.environ.get("PORT", 8080))
        
    app.run(host="0.0.0.0", port=port, debug=True)
