#!/usr/bin/env python3
import os
import sys
import json
import re
import argparse
import glob
import sqlite3
import google.generativeai as genai
import openai
import anthropic
from bs4 import BeautifulSoup
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)


def load_env():
    """Load env variables from .env if it exists, mapping them to os.environ."""
    if os.path.exists(".env"):
        try:
            with open(".env", "r") as f:
                for line in f:
                    line_clean = line.strip()
                    if not line_clean or line_clean.startswith("#"):
                        continue
                    if "=" in line_clean:
                        key, val = line_clean.split("=", 1)
                        key = key.strip()
                        val = val.strip()
                        if (val.startswith('"') and val.endswith('"')) or (
                            val.startswith("'") and val.endswith("'")
                        ):
                            val = val[1:-1].strip()
                        os.environ[key] = val
        except Exception:
            pass


# Load environment variables immediately on module import
load_env()


def get_llm_config():
    """
    Determines the LLM provider, API key, and model choice based on environment variables.
    Supports LLM_PROVIDER, LLM_KEY, and LLM_MODEL.
    Returns: (provider, api_key, model_name)
    """
    provider = os.environ.get("LLM_PROVIDER", "").strip().lower()
    if not provider:
        provider = "gemini"

    if provider in ("anthropic", "claude"):
        provider = "claude"

    api_key = os.environ.get("LLM_KEY")
    model_name = os.environ.get("LLM_MODEL")

    if not model_name:
        if provider == "gemini":
            model_name = "gemini-3.5-flash"
        elif provider == "openai":
            model_name = "gpt-4o"
        elif provider == "claude":
            model_name = "claude-3-5-sonnet-latest"

    if api_key:
        api_key = api_key.strip()
    if model_name:
        model_name = model_name.strip()

    return provider, api_key, model_name


class LLMGrader:
    def __init__(self, provider, api_key, model_name):
        self.provider = provider
        self.api_key = api_key
        self.model_name = model_name
        self._client = None

        if not self.api_key:
            var_name = "LLM_KEY"
            raise ValueError(
                f"API Key for provider '{self.provider}' is not set. "
                f"Please set '{var_name}' in your .env file or environment."
            )

        self._init_client()

    def _init_client(self):
        if self.provider == "gemini":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' library is required for Gemini grading. Please install it by running:\n  pip install google-generativeai"
                )
            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(self.model_name)
        elif self.provider == "openai":
            if openai is None:
                raise ImportError(
                    "The 'openai' library is required for OpenAI grading. Please install it by running:\n  pip install openai"
                )
            self._client = openai.OpenAI(api_key=self.api_key)
        elif self.provider == "claude":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' library is required for Claude grading. Please install it by running:\n  pip install anthropic"
                )
            self._client = anthropic.Anthropic(api_key=self.api_key)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def generate_json(self, prompt):
        if self.provider == "gemini":
            response = self._client.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 300.0},
            )
            return response.text
        elif self.provider == "openai":
            response = self._client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=300.0,
            )
            return response.choices[0].message.content
        elif self.provider == "claude":
            response = self._client.messages.create(
                model=self.model_name,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
                timeout=300.0,
            )
            return response.content[0].text
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")


# Chapter list matching index.html
CHAPTERS_LIST = {
    1: {"dir": "ch01", "title": "Trade-Offs in Data Systems Architecture"},
    2: {"dir": "ch02", "title": "Defining Nonfunctional Requirements"},
    3: {"dir": "ch03", "title": "Data Models and Query Languages"},
    4: {"dir": "ch04", "title": "Storage and Retrieval"},
    5: {"dir": "ch05", "title": "Encoding and Evolution"},
    6: {"dir": "ch06", "title": "Replication"},
    7: {"dir": "ch07", "title": "Sharding"},
    8: {"dir": "ch08", "title": "Transactions"},
    9: {"dir": "ch09", "title": "The Trouble with Distributed Systems"},
    10: {"dir": "ch10", "title": "Consistency and Consensus"},
    11: {"dir": "ch11", "title": "Batch Processing"},
    12: {"dir": "ch12", "title": "Stream Processing"},
    13: {"dir": "ch13", "title": "A Philosophy of Streaming Systems"},
    14: {"dir": "ch14", "title": "Doing the Right Thing"},
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate DDIA write-in answers using Gemini, OpenAI, or Claude."
    )
    parser.add_argument(
        "--state",
        default="ddia_progress.db",
        help="Path to the exported ddia_progress.db progress file (default: ddia_progress.db)",
    )
    parser.add_argument(
        "--output",
        default="ddia_grades_report.md",
        help="Path to save the generated grading report (default: ddia_grades_report.md)",
    )
    parser.add_argument(
        "--provider",
        default=None,
        help="LLM provider to use: gemini, openai, or claude (default: auto-detected from env)",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model to use for evaluation (defaults to provider's configured model or default model)",
    )
    return parser.parse_args()


_QUESTIONS_CACHE = {}


def load_questions_from_app_js(dir_name):
    """
    Parses the QUIZ_QUESTIONS array from the chapter's app.js file securely.
    """
    if dir_name in _QUESTIONS_CACHE:
        return _QUESTIONS_CACHE[dir_name]

    js_path = os.path.join("learning-app", dir_name, "app.js")
    if not os.path.exists(js_path):
        print(f"Warning: File {js_path} does not exist. Skipping.")
        return []

    try:
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read()

        start = content.find("const QUIZ_QUESTIONS = [")
        end = content.find("const FLASHCARDS = [")
        if start == -1 or end == -1:
            raise ValueError("Markers not found")

        data = content[start + len("const QUIZ_QUESTIONS = ") : end].strip()
        if data.endswith(";"):
            data = data[:-1]

        # Parse the JS object-like string to JSON
        pattern = (
            r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')|([a-zA-Z_][a-zA-Z0-9_]*)\s*:'
        )

        def replacer(match):
            if match.group(1) is not None:
                s = match.group(1)
                if s.startswith("'"):
                    inner = s[1:-1]
                    inner = inner.replace("\\'", "'").replace('"', '\\"')
                    return f'"{inner}"'
                return s
            else:
                return f'"{match.group(2)}":'

        json_str = re.sub(pattern, replacer, data)

        # Remove trailing commas before closing braces/brackets only if they are not inside strings.
        # We ensure it's not inside a string by checking that the number of quotes following it is even.
        json_str = re.sub(r',\s*([}\]])(?=(?:[^"]*"[^"]*")*[^"]*$)', r"\1", json_str)

        questions = json.loads(json_str)
        _QUESTIONS_CACHE[dir_name] = questions
        return questions
    except Exception as e:
        print(f"Error parsing questions for {dir_name}: {e}")
        return []


_CHAPTER_TEXT_CACHE = {}


def extract_book_chapter_text(ch_num):
    if ch_num in _CHAPTER_TEXT_CACHE:
        return _CHAPTER_TEXT_CACHE[ch_num]

    # Locate matching HTML file in chapters/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    chapters_dir = os.path.join(base_dir, "chapters")

    pattern = os.path.join(chapters_dir, f"*_chapter_{ch_num}_*.html")
    files = glob.glob(pattern)
    if not files:
        pattern = os.path.join(chapters_dir, f"*_{ch_num}_*.html")
        files = glob.glob(pattern)
        if not files:
            return ""

    html_file = files[0]
    try:
        with open(html_file, "r", encoding="utf-8") as f:
            # Add comment explaining optimization
            # Performance optimization: cache the parsed HTML text per chapter to
            # avoid expensive synchronous File I/O and BeautifulSoup parsing in loops.
            soup = BeautifulSoup(f.read(), "html.parser")
            result = soup.get_text(separator="\n", strip=True)
            _CHAPTER_TEXT_CACHE[ch_num] = result
            return result
    except Exception:
        return ""


def parse_context_desc(context_desc):
    ch_num = None
    section_name = None
    if not context_desc:
        return None, None

    # Match "Chapter 1" or "Ch 1"
    ch_match = re.search(r"(?:Chapter|Ch\b)\s*(\d+)", context_desc, re.IGNORECASE)
    if ch_match:
        ch_num = int(ch_match.group(1))

    # Match "section: <name>"
    sec_match = re.search(r"section:\s*(.*)", context_desc, re.IGNORECASE)
    if sec_match:
        section_name = sec_match.group(1).strip()
    else:
        # Match "Ch 1 (<name>)"
        sec_match2 = re.search(r"Ch\s*\d+\s*\(([^)]+)\)", context_desc, re.IGNORECASE)
        if sec_match2:
            section_name = sec_match2.group(1).strip()

    return ch_num, section_name


def _extract_field(text, key):
    """
    Extracts a JSON string value for `key` from raw LLM output using regex.
    Falls back gracefully when JSON is malformed due to unescaped quotes/newlines.
    """
    # Match: "key": "...anything until the closing quote before a comma/newline/brace..."
    # We use a lazy match stopping at the last unescaped quote followed by , or }
    pattern = rf'"{re.escape(key)}"\s*:\s*"(.*?)"(?=\s*[,\n\r}}])'
    m = re.search(pattern, text, re.DOTALL)
    if m:
        return m.group(1).replace("\\n", "\n").replace('\\"', '"')
    # Also handle integer values (e.g. score)
    pattern_int = rf'"{re.escape(key)}"\s*:\s*(\d+)'
    m2 = re.search(pattern_int, text)
    if m2:
        return int(m2.group(1))
    return None


def parse_llm_json(text):
    """
    Robustly parses a JSON string returned by an LLM.
    Handles markdown backticks and attempts to find a JSON block between curly braces
    if there's surrounding text. Falls back to regex field extraction when JSON is
    structurally broken (e.g. unescaped quotes inside values causing parse errors).
    """
    text_stripped = text.strip()

    # Try finding markdown code block first
    if "```json" in text_stripped:
        try:
            start_idx = text_stripped.index("```json") + 7
            end_idx = text_stripped.index("```", start_idx)
            candidate = text_stripped[start_idx:end_idx].strip()
            return json.loads(candidate, strict=False)
        except Exception:
            pass

    # Try finding between first { and last }
    try:
        start_idx = text_stripped.index("{")
        end_idx = text_stripped.rindex("}") + 1
        candidate = text_stripped[start_idx:end_idx].strip()
        return json.loads(candidate, strict=False)
    except json.JSONDecodeError:
        # JSON is structurally broken — fall through to regex extraction
        candidate = (
            text_stripped[text_stripped.index("{") : text_stripped.rindex("}") + 1]
            if "{" in text_stripped
            else text_stripped
        )
    except Exception:
        candidate = text_stripped

    # Regex field-level extraction fallback
    # Detect which fields are present and extract them individually
    known_str_fields = [
        "strengths",
        "weaknesses",
        "feedback",
        "summary",
        "went_well",
        "could_be_better",
        "tldr_summary",
    ]
    result = {}
    score_val = _extract_field(candidate, "score")
    if score_val is not None:
        try:
            result["score"] = int(score_val)
        except (ValueError, TypeError):
            pass
    for field in known_str_fields:
        val = _extract_field(candidate, field)
        if val is not None:
            result[field] = val
    if result:
        print(
            f"parse_llm_json: used regex fallback, extracted fields: {list(result.keys())}"
        )
        return result

    # Last resort: direct parse (will re-raise)
    return json.loads(text_stripped, strict=False)


def grade_question(model, q_text, model_answer, student_answer, context_desc=""):
    if not student_answer or not student_answer.strip():
        return {
            "score": 0,
            "strengths": "",
            "weaknesses": "No response was provided.",
            "feedback": "Empty response. Please provide an answer to receive grading feedback.",
        }
    ch_num, _ = parse_context_desc(context_desc)

    book_chapter_text = ""
    if ch_num:
        book_chapter_text = extract_book_chapter_text(ch_num)

    if book_chapter_text:
        prompt_context = f"{context_desc}\n\nTEXTBOOK CHAPTER {ch_num} FULL CONTENT:\n{book_chapter_text}"
    else:
        prompt_context = context_desc

    prompt = f"""You are a world-class senior database systems tutor grading a student response to a question from "Designing Data-Intensive Applications" by Martin Kleppmann.
Your goal is to provide insightful, highly pedagogical, and encouraging feedback that helps the student build a deep, intuitive understanding of database systems architecture.

CONTEXT: {prompt_context}
QUESTION: {q_text}
MODEL ANSWER (RUBRIC): {model_answer}
STUDENT RESPONSE: {student_answer}

### GRADING PRINCIPLES:
1. **Prioritize Conceptual Understanding over Rote Terminology**: If the student explains the underlying concept or architectural trade-off correctly, do NOT penalize their score heavily for omitting specific vocabulary/buzzwords (like the exact name of a principle). Instead, reward their intuition, and gently introduce the formal term in the feedback.
2. **Evaluate Core Engineering over Formatting Constraints**: If the question asks for a specific format (e.g., "a code review comment to a junior engineer"), prioritize the database concepts first. If the student gets the database engineering right but misses the format, grade them primarily on the engineering, and use the feedback to show how to frame it in the requested scenario.
3. **Encouraging and Mentoring Voice**: Write the strengths and feedback in a supportive, conversational, and highly engaging tone. Avoid dry, checklist-like evaluations. Make the student feel like they are having a 1-on-1 session with a senior architect.
4. **Deepen the Discussion with a Follow-Up Question**: Always conclude the "feedback" section with a highly relevant, thought-provoking follow-up question related to the trade-off. This question should prompt active recall or explore a related edge-case.

### SCORING RUBRIC (1 to 5):
- **1**: Irrelevant, empty, or completely incorrect.
- **2**: Severe misunderstandings, or misses the core architectural concepts entirely.
- **3**: Demonstrates partial understanding but contains notable conceptual gaps, incorrect trade-offs, or major omissions of core design implications.
- **4**: Strong answer. Correctly identifies and explains the core concepts and trade-offs, but lacks slightly in technical depth or misses minor architectural nuances.
- **5**: Excellent, rigorous response. Accurately explains the architecture, correct trade-offs, and design implications with proper technical depth.

### RESPONSE FORMAT (MUST BE VALID JSON):
Provide your response in the following JSON format. Do not wrap it in markdown code blocks or add any text outside the JSON.
{{
  "score": <integer from 1 to 5>,
  "strengths": "<Explain the strengths of their response. Address the correct parts of their mental model and validate why their reasoning is sound. Include positive reinforcement.>",
  "weaknesses": "<Point out missing trade-offs, conceptual gaps, or potential operational risks they overlooked. Do not complain about missing exact terminology or formatting; focus on the architectural concepts.>",
  "feedback": "<A conversational, supportive paragraph explaining the key conceptual gaps, bridging the student's answer to the rubric, and clarifying the database design trade-offs. Conclude the feedback with a specific, engaging follow-up question to probe their understanding further (e.g., 'To think about further: how would you handle...?')>"
}}
"""
    try:
        text = model.generate_json(prompt).strip()
        return parse_llm_json(text)
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        return {
            "score": 0,
            "strengths": "Error",
            "weaknesses": "API failed to evaluate response.",
            "feedback": str(e),
        }


def generate_summary(model, chapter_title, grades_dict):
    """
    Generates an overall feedback summary for the student's performance on a chapter.
    Returns a dictionary with a 'summary' string.
    """
    prompt = f"""You are a senior database systems tutor.
The student just completed a quiz on "{chapter_title}" from "Designing Data-Intensive Applications".

Here is the feedback they received on their individual answers:
{json.dumps(grades_dict)}

Please provide a personalized, encouraging summary of their overall performance.
Highlight BOTH their main areas of strength AND specific areas they need to improve or review based on the total results.
Write in a supportive, conversational tone as a senior engineer mentoring a junior.

### RESPONSE FORMAT (MUST BE VALID JSON):
Provide your response in the following JSON format. Do not wrap it in markdown code blocks or add any text outside the JSON.
{{
  "went_well": "<bulleted list or paragraph of what went well>",
  "could_be_better": "<bulleted list or paragraph of what could have been better>",
  "tldr_summary": "<a tl;dr summary>"
}}
"""
    try:
        text = model.generate_json(prompt).strip()
        result = parse_llm_json(text)
        if "tldr_summary" not in result:
            result["tldr_summary"] = "Could not generate summary."
        if "went_well" not in result:
            result["went_well"] = ""
        if "could_be_better" not in result:
            result["could_be_better"] = ""

        # Backward compatibility / fallback map
        result["summary"] = result["tldr_summary"]
        result["strengths"] = result["went_well"]
        result["weaknesses"] = result["could_be_better"]
        return result
    except Exception as e:
        print(f"Error calling LLM API for summary: {e}")
        return {
            "summary": f"Failed to generate summary: {str(e)}",
            "strengths": "",
            "weaknesses": "",
        }


def main():
    args = parse_args()

    # Resolve provider, api_key, model_name
    provider, api_key, model_name = get_llm_config()

    if args.provider:
        provider = args.provider.strip().lower()

    if args.model:
        model_name = args.model.strip()

    try:
        model = LLMGrader(provider, api_key, model_name)
    except (ValueError, ImportError) as e:
        print(f"Error: {e}")
        sys.exit(1)

    # Check state file
    if not os.path.exists(args.state):
        print(f"Error: State file '{args.state}' not found.")
        print(
            "Please export your progress from the web app using the 'Export Progress' button in the header,"
        )
        print(f"and save it in this directory as '{args.state}'.")
        sys.exit(1)

    state = {}
    is_sqlite = False
    try:
        # Check if the file is a SQLite database by reading the first 15 bytes
        with open(args.state, "rb") as f:
            header = f.read(15)
            if header.startswith(b"SQLite format 3"):
                is_sqlite = True
    except Exception:
        pass

    if is_sqlite:
        try:
            print(f"Detected SQLite database format for progress file: {args.state}")
            conn = sqlite3.connect(args.state)
            cursor = conn.cursor()

            # Find distinct usernames in progress
            cursor.execute("SELECT DISTINCT username FROM progress")
            db_users = [r[0] for r in cursor.fetchall()]

            if not db_users:
                print("Error: No progress records found in the SQLite database.")
                sys.exit(1)

            # Determine username to grade
            selected_user = db_users[0]
            if len(db_users) > 1:
                # If there's a non-anonymous user, prioritize it
                non_anon = [u for u in db_users if u != "anonymous"]
                if non_anon:
                    selected_user = non_anon[0]
                print(
                    f"Database contains multiple users {db_users}. Selecting user '{selected_user}' for grading."
                )
            else:
                print(f"Loading progress for user '{selected_user}' from SQLite.")

            cursor.execute(
                "SELECT state_key, state_data FROM progress WHERE username = ?",
                [selected_user],
            )
            for key, data_str in cursor.fetchall():
                try:
                    state[key] = json.loads(data_str)
                except Exception:
                    pass
            conn.close()
        except Exception as e:
            print(f"Error reading SQLite state database: {e}")
            sys.exit(1)
    else:
        try:
            with open(args.state, "r") as f:
                state = json.load(f)
        except Exception as e:
            print(f"Error reading state file as JSON: {e}")
            sys.exit(1)

    print(f"Successfully loaded progress from {args.state}.")
    print(
        f"Connecting to {model.provider.capitalize()} API for evaluation using `{model.model_name}`...\n"
    )

    report_markdown = "# Designing Data-Intensive Applications — AI Evaluation Report\n"
    report_markdown += f"Evaluated using provider: `{model.provider}` and model: `{model.model_name}`\n\n---\n\n"

    # 1. Process Chapter Quizzes
    chapter_keys = [
        k for k in state.keys() if k.startswith("ddia_ch") and k.endswith("_learning")
    ]

    graded_chapters_count = 0
    total_score_sum = 0
    total_graded_questions = 0

    for key in sorted(chapter_keys, key=lambda k: int(re.search(r"\d+", k).group())):
        ch_num = int(re.search(r"\d+", key).group())
        ch_state = state[key]

        # Check if there are write-in answers
        write_ins = ch_state.get("writeInAnswers", {})
        # Keep all write-in answers, even empty ones (which get automatically graded as 0)
        answered_write_ins = {k: v for k, v in write_ins.items()}

        if not answered_write_ins:
            continue

        ch_info = CHAPTERS_LIST.get(ch_num)
        if not ch_info:
            continue

        print(
            f"Grading Chapter {ch_num}: {ch_info['title']} ({len(answered_write_ins)} write-in answers)..."
        )

        # Load questions to map indices
        questions = load_questions_from_app_js(ch_info["dir"])
        if not questions:
            continue

        report_markdown += f"## Chapter {ch_num}: {ch_info['title']}\n\n"

        ch_score_sum = 0
        ch_graded_count = 0

        for q_idx_str, student_ans in answered_write_ins.items():
            try:
                q_idx = int(q_idx_str)
                q = questions[q_idx]
            except (ValueError, IndexError):
                print(f"  Warning: Invalid question index {q_idx_str}. Skipping.")
                continue

            print(f'  - Evaluating Q{q_idx + 1}: "{q["q"][:50]}..."')

            context_desc = f"Chapter {ch_num} ({ch_info['title']}), section: {q.get('section', 'General')}"
            grade = grade_question(
                model, q["q"], q["modelAnswer"], student_ans, context_desc
            )

            ch_score_sum += grade["score"]
            ch_graded_count += 1
            total_graded_questions += 1
            total_score_sum += grade["score"]

            report_markdown += f"### Q{q_idx + 1} ({q.get('section', 'General')})\n"
            report_markdown += f"**Question**: {q['q']}\n\n"
            report_markdown += f"**Your Answer**:\n> {student_ans}\n\n"
            report_markdown += f"**Model Answer (Rubric)**:\n> {q['modelAnswer']}\n\n"

            score_stars = "★" * grade["score"] + "☆" * (5 - grade["score"])
            report_markdown += f"**Grade**: `{score_stars}` ({grade['score']}/5)\n\n"
            report_markdown += f"**Strengths**: {grade['strengths']}\n\n"
            report_markdown += f"**Weaknesses**: {grade['weaknesses']}\n\n"
            report_markdown += (
                f"**Tutor Feedback & Core Concepts**:\n{grade['feedback']}\n\n"
            )
            report_markdown += "---\n\n"

        if ch_graded_count > 0:
            graded_chapters_count += 1
            ch_avg = round(ch_score_sum / ch_graded_count, 2)
            print(f"  Average Chapter Grade: {ch_avg}/5\n")

    # 2. Process Exams
    exam_keys = ["ddia_exam_midterm", "ddia_exam_final"]
    for e_key in exam_keys:
        if e_key not in state:
            continue
        e_state = state[e_key]
        if not e_state.get("isSubmitted"):
            continue

        e_type = "Midterm Exam" if "midterm" in e_key else "Final Exam"
        questions = e_state.get("questions", [])
        # Keep all write-in answers, even empty ones
        answered_write_ins = {k: v for k, v in write_ins.items()}

        if not answered_write_ins:
            continue

        print(f"Grading {e_type} ({len(answered_write_ins)} write-in answers)...")
        report_markdown += f"## Cumulative Assessment: {e_type}\n\n"

        for q_idx_str, student_ans in answered_write_ins.items():
            try:
                q_idx = int(q_idx_str)
                q = questions[q_idx]
            except (ValueError, IndexError):
                continue

            print(f'  - Evaluating Q{q_idx + 1}: "{q["q"][:50]}..."')
            context_desc = (
                f"Cumulative {e_type}, Ch {q.get('chapterNum')} ({q.get('section')})"
            )
            grade = grade_question(
                model, q["q"], q["modelAnswer"], student_ans, context_desc
            )

            total_graded_questions += 1
            total_score_sum += grade["score"]

            report_markdown += (
                f"### Q{q_idx + 1} (Ch {q.get('chapterNum')} - {q.get('section')})\n"
            )
            report_markdown += f"**Question**: {q['q']}\n\n"
            report_markdown += f"**Your Answer**:\n> {student_ans}\n\n"
            report_markdown += f"**Model Answer (Rubric)**:\n> {q['modelAnswer']}\n\n"

            score_stars = "★" * grade["score"] + "☆" * (5 - grade["score"])
            report_markdown += f"**Grade**: `{score_stars}` ({grade['score']}/5)\n\n"
            report_markdown += f"**Strengths**: {grade['strengths']}\n\n"
            report_markdown += f"**Weaknesses**: {grade['weaknesses']}\n\n"
            report_markdown += (
                f"**Tutor Feedback & Core Concepts**:\n{grade['feedback']}\n\n"
            )
            report_markdown += "---\n\n"

    # Write Report Summary
    summary_markdown = "# DDIA AI Evaluation Summary\n\n"
    if total_graded_questions > 0:
        total_avg = round(total_score_sum / total_graded_questions, 2)
        summary_markdown += f"**Overall Average Score**: `{total_avg} / 5` ({round((total_avg / 5) * 100)}%)\n"
        summary_markdown += (
            f"**Total Graded Responses**: `{total_graded_questions}` write-ins\n"
        )
        summary_markdown += (
            f"**Graded Chapters**: `{graded_chapters_count}` chapters\n\n"
        )
    else:
        summary_markdown += "*No write-in responses found in progress file. Complete some write-ins in the app and export progress again.*\n\n"

    full_report = summary_markdown + "\n---\n\n" + report_markdown

    with open(args.output, "w") as f:
        f.write(full_report)

    print(f"Grading complete! Evaluation report saved to: {args.output}")


if __name__ == "__main__":
    main()
