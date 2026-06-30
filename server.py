# server.py
"""
Flask server for the DDIA Applied Learning Platform.
Serves static files and evaluates student write-in answers via the Gemini API.
"""

from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import time
import uuid
import re
import concurrent.futures
import threading
from logger_setup import configure_logging
from grade_responses import (
    grade_question,
    generate_summary,
    CHAPTERS_LIST,
    load_questions_from_app_js,
    load_env,
    get_llm_config,
    LLMGrader,
)

log = configure_logging()

app = Flask(__name__, static_folder="learning-app", static_url_path="")

# Load .env variables dynamically
load_env()
provider, api_key, model_name = get_llm_config()

# Initialize the model client
try:
    model = LLMGrader(provider, api_key, model_name)
except Exception as exc:
    log.error("llm_grader_init_failed", extra={"error": str(exc)}, exc_info=True)
    model = None


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)


# ── /grade endpoint with logging ──────────────────────────────────────────
@app.route("/grade", methods=["POST"])
def grade():
    request_id = str(uuid.uuid4())[:8]  # short ID for log correlation
    start_time = time.monotonic()

    # Re-evaluate configuration in case .env was updated/loaded dynamically
    load_env()
    provider, api_key, model_name = get_llm_config()

    if not api_key:
        log.error("LLM_KEY missing", extra={"request_id": request_id})
        return jsonify({"error": "API Key (LLM_KEY) not set on server"}), 500

    try:
        model = LLMGrader(provider, api_key, model_name)
    except Exception as exc:
        log.error(
            "llm_grader_init_failed",
            extra={"request_id": request_id, "error": str(exc)},
            exc_info=True,
        )
        return jsonify({"error": f"Failed to initialize LLM grader: {str(exc)}"}), 500

    payload = request.get_json(force=True)
    ch_key = payload.get("chapterKey", "")
    write_ins = payload.get("writeIns", {})
    username = payload.get("username", "anonymous")  # forward from browser
    is_exam = payload.get("isExam", False)

    if is_exam:
        exam_questions = payload.get("questions", [])
        log.info(
            "grade_request_received",
            extra={
                "request_id": request_id,
                "username": username,
                "chapter_key": ch_key,
                "question_count": len(exam_questions),
            },
        )

        results = {}
        abort_event = threading.Event()

        def process_exam_question(item):
            if abort_event.is_set():
                raise RuntimeError("API evaluation aborted due to previous error")

            q_idx_str = str(item.get("idx"))
            student_ans = item.get("studentAnswer", "")
            q_text = item.get("q", "")
            model_ans = item.get("modelAnswer", "")
            ch_num = item.get("chapterNum")
            section = item.get("section", "General")

            q_start = time.monotonic()
            context = f"Chapter {ch_num}, section: {section}"

            try:
                grade_result = grade_question(
                    model, q_text, model_ans, student_ans, context, raise_on_error=True
                )
            except Exception as exc:
                log.error(
                    "llm_api_error",
                    extra={
                        "request_id": request_id,
                        "q_idx": q_idx_str,
                        "error": str(exc),
                    },
                    exc_info=True,
                )
                abort_event.set()
                raise

            elapsed_ms = round((time.monotonic() - q_start) * 1000)

            log.info(
                "question_graded",
                extra={
                    "request_id": request_id,
                    "username": username,
                    "chapter_key": ch_key,
                    "q_idx": q_idx_str,
                    "section": section,
                    "student_ans_preview": student_ans[:300],
                    "score": grade_result["score"],
                    "strengths": grade_result["strengths"],
                    "weaknesses": grade_result["weaknesses"],
                    "feedback": grade_result["feedback"],
                    "latency_ms": elapsed_ms,
                },
            )
            return q_idx_str, grade_result

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_idx = {
                executor.submit(process_exam_question, item): item
                for item in exam_questions
            }
            api_error = None
            for future in concurrent.futures.as_completed(future_to_idx):
                try:
                    q_idx_str, grade_result = future.result()
                    results[q_idx_str] = grade_result
                except Exception as exc:
                    log.error(
                        "thread_execution_error",
                        extra={"request_id": request_id, "error": str(exc)},
                        exc_info=True,
                    )
                    api_error = exc
                    # Cancel any pending futures that haven't started yet
                    for f in future_to_idx:
                        f.cancel()
                    break

        if api_error:
            return jsonify({"error": f"LLM grading failed: {str(api_error)}"}), 500

        total_ms = round((time.monotonic() - start_time) * 1000)
        log.info(
            "grade_request_complete",
            extra={
                "request_id": request_id,
                "username": username,
                "chapter_key": ch_key,
                "graded_count": len(results),
                "avg_score": round(
                    sum(r["score"] for r in results.values()) / len(results), 2
                )
                if results
                else None,
                "total_latency_ms": total_ms,
            },
        )
        return jsonify({"grades": results})

    answered = {k: v for k, v in write_ins.items()}

    log.info(
        "grade_request_received",
        extra={
            "request_id": request_id,
            "username": username,
            "chapter_key": ch_key,
            "question_count": len(answered),
        },
    )

    # Validate chapterKey and load questions
    try:
        ch_num = int(re.search(r"\d+", ch_key).group())
        ch_info = CHAPTERS_LIST.get(ch_num)
        if not ch_info:
            raise ValueError(f"Unknown chapter number: {ch_num}")
        questions = load_questions_from_app_js(ch_info["dir"])
    except Exception as exc:
        log.error(
            "validation_failed",
            extra={"request_id": request_id, "chapter_key": ch_key, "error": str(exc)},
            exc_info=True,
        )
        return jsonify({"error": f"Invalid chapter key: {ch_key}"}), 400

    results = {}
    abort_event = threading.Event()

    def process_chapter_question(q_idx_str, student_ans):
        if abort_event.is_set():
            raise RuntimeError("API evaluation aborted due to previous error")

        q_start = time.monotonic()
        try:
            q_idx = int(q_idx_str)
            q = questions[q_idx]
        except (ValueError, IndexError):
            log.warning(
                "invalid_question_index",
                extra={"request_id": request_id, "q_idx_str": q_idx_str},
            )
            return None

        q_section = q.get("section", "General")
        q_hint = q.get("hint", "")
        context = f"Chapter {ch_num} ({ch_info['title']}), section: {q_section}"
        if q_hint:
            context += f", hint provided to student: {q_hint}"

        try:
            grade_result = grade_question(
                model,
                q["q"],
                q["modelAnswer"],
                student_ans,
                context,
                raise_on_error=True,
            )
        except Exception as exc:
            log.error(
                "llm_api_error",
                extra={
                    "request_id": request_id,
                    "q_idx": q_idx_str,
                    "error": str(exc),
                },
                exc_info=True,
            )
            abort_event.set()
            raise

        elapsed_ms = round((time.monotonic() - q_start) * 1000)

        log.info(
            "question_graded",
            extra={
                "request_id": request_id,
                "username": username,
                "chapter_key": ch_key,
                "q_idx": q_idx_str,
                "section": q.get("section"),
                # Truncate student answer to avoid giant log files
                "student_ans_preview": student_ans[:300],
                "score": grade_result["score"],
                "strengths": grade_result["strengths"],
                "weaknesses": grade_result["weaknesses"],
                "feedback": grade_result["feedback"],
                "latency_ms": elapsed_ms,
            },
        )

        return q_idx_str, grade_result

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_idx = {
            executor.submit(process_chapter_question, q_idx_str, student_ans): q_idx_str
            for q_idx_str, student_ans in answered.items()
        }
        api_error = None
        for future in concurrent.futures.as_completed(future_to_idx):
            try:
                res = future.result()
                if res:
                    q_idx_str, grade_result = res
                    results[q_idx_str] = grade_result
            except Exception as exc:
                log.error(
                    "thread_execution_error",
                    extra={"request_id": request_id, "error": str(exc)},
                    exc_info=True,
                )
                api_error = exc
                for f in future_to_idx:
                    f.cancel()
                break

    if api_error:
        return jsonify({"error": f"LLM grading failed: {str(api_error)}"}), 500

    total_ms = round((time.monotonic() - start_time) * 1000)
    log.info(
        "grade_request_complete",
        extra={
            "request_id": request_id,
            "username": username,
            "chapter_key": ch_key,
            "graded_count": len(results),
            "avg_score": round(
                sum(r["score"] for r in results.values()) / len(results), 2
            )
            if results
            else None,
            "total_latency_ms": total_ms,
        },
    )

    return jsonify({"grades": results})


@app.route("/grade_summary", methods=["POST"])
def grade_summary():
    request_id = str(uuid.uuid4())[:8]
    start_time = time.monotonic()

    load_env()
    provider, api_key, model_name = get_llm_config()
    if not api_key:
        return jsonify({"error": "API Key not set"}), 500

    try:
        model = LLMGrader(provider, api_key, model_name)
    except Exception as exc:
        return jsonify({"error": f"Failed to init grader: {str(exc)}"}), 500

    payload = request.get_json(force=True)
    ch_key = payload.get("chapterKey", "")
    grades_dict = payload.get("grades", {})
    username = payload.get("username", "anonymous")

    chapter_title = ch_key
    try:
        ch_num = int(re.search(r"\d+", ch_key).group())
        ch_info = CHAPTERS_LIST.get(ch_num)
        if ch_info:
            chapter_title = f"Chapter {ch_num}: {ch_info['title']}"
    except Exception:
        pass

    log.info(
        "grade_summary_request_received",
        extra={"request_id": request_id, "username": username, "chapter_key": ch_key},
    )

    try:
        summary_result = generate_summary(model, chapter_title, grades_dict, raise_on_error=True)
    except Exception as exc:
        log.error(
            "llm_api_error_summary",
            extra={
                "request_id": request_id,
                "error": str(exc),
            },
            exc_info=True,
        )
        return jsonify({"error": f"Failed to generate summary: {str(exc)}"}), 500

    elapsed_ms = round((time.monotonic() - start_time) * 1000)
    log.info(
        "grade_summary_complete",
        extra={
            "request_id": request_id,
            "username": username,
            "chapter_key": ch_key,
            "latency_ms": elapsed_ms,
        },
    )

    return jsonify(summary_result)


if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    else:
        port = int(os.environ.get("PORT", 8080))

    app.run(host="0.0.0.0", port=port, debug=True)
