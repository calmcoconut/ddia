#!/usr/bin/env python3
import os
import sys
import json
import re
import argparse
import subprocess

# Verify imports
try:
    import google.generativeai as genai
except ImportError:
    if __name__ == "__main__":
        print("Error: The 'google-generativeai' library is required to run this script.")
        print("Please install it by running:")
        print("  pip install google-generativeai")
        sys.exit(1)
    else:
        genai = None

try:
    from bs4 import BeautifulSoup
    import warnings
    from bs4 import XMLParsedAsHTMLWarning
    warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
    HAS_BS4 = True
except ImportError:
    BeautifulSoup = None
    HAS_BS4 = False

# Load .env variables
if os.path.exists(".env"):
    try:
        with open(".env", "r") as f:
            for line in f:
                line_clean = line.strip()
                if line_clean.startswith("GEMINI_KEY="):
                    val = line_clean.split("=", 1)[1].strip()
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1].strip()
                    os.environ["GEMINI_API_KEY"] = val
                elif line_clean.startswith("GEMINI_MODEL="):
                    val = line_clean.split("=", 1)[1].strip()
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1].strip()
                    os.environ["GEMINI_MODEL"] = val
    except Exception:
        pass

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
    14: {"dir": "ch14", "title": "Doing the Right Thing"}
}

def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate DDIA write-in answers using the Gemini API.")
    parser.add_argument(
        "--state", 
        default="ddia_progress.json",
        help="Path to the exported ddia_progress.json progress file (default: ddia_progress.json)"
    )
    parser.add_argument(
        "--output", 
        default="ddia_grades_report.md",
        help="Path to save the generated grading report (default: ddia_grades_report.md)"
    )
    default_model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash").strip()
    parser.add_argument(
        "--model", 
        default=default_model,
        help=f"Gemini model to use for evaluation (default: {default_model})"
    )
    return parser.parse_args()

def load_questions_from_app_js(dir_name):
    """
    Invokes Node.js to evaluate the QUIZ_QUESTIONS array in the chapter's app.js.
    This guarantees 100% accurate parsing matching the browser's behavior.
    """
    js_path = os.path.join("learning-app", dir_name, "app.js")
    if not os.path.exists(js_path):
        print(f"Warning: File {js_path} does not exist. Skipping.")
        return []
    
    node_cmd = (
        f"const fs = require('fs'); "
        f"const content = fs.readFileSync('{js_path}', 'utf8'); "
        f"const start = content.indexOf('const QUIZ_QUESTIONS = ['); "
        f"const end = content.indexOf('const FLASHCARDS = ['); "
        f"if (start === -1 || end === -1) throw new Error('Markers not found'); "
        f"const data = content.substring(start + 'const QUIZ_QUESTIONS = ['.length - 1, end); "
        f"console.log(JSON.stringify(eval(data)));"
    )
    
    try:
        res = subprocess.run(
            ["node", "-e", node_cmd], 
            capture_output=True, 
            text=True, 
            check=True
        )
        return json.loads(res.stdout)
    except Exception as e:
        print(f"Error parsing questions for {dir_name}: {e}")
        return []

def extract_book_chapter_text(ch_num):
    if not HAS_BS4:
        return ""
    
    # Locate matching HTML file in chapters/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    chapters_dir = os.path.join(base_dir, "chapters")
    
    import glob
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
            soup = BeautifulSoup(f.read(), "html.parser")
            return soup.get_text(separator="\n", strip=True)
    except Exception:
        return ""

def parse_context_desc(context_desc):
    ch_num = None
    section_name = None
    if not context_desc:
        return None, None
        
    # Match "Chapter 1" or "Ch 1"
    ch_match = re.search(r'(?:Chapter|Ch\b)\s*(\d+)', context_desc, re.IGNORECASE)
    if ch_match:
        ch_num = int(ch_match.group(1))
        
    # Match "section: <name>"
    sec_match = re.search(r'section:\s*(.*)', context_desc, re.IGNORECASE)
    if sec_match:
        section_name = sec_match.group(1).strip()
    else:
        # Match "Ch 1 (<name>)"
        sec_match2 = re.search(r'Ch\s*\d+\s*\(([^)]+)\)', context_desc, re.IGNORECASE)
        if sec_match2:
            section_name = sec_match2.group(1).strip()
            
    return ch_num, section_name

def grade_question(model, q_text, model_answer, student_answer, context_desc=""):
    if not student_answer or not student_answer.strip():
        return {
            "score": 0,
            "strengths": "",
            "weaknesses": "No response was provided.",
            "feedback": "Empty response. Please provide an answer to receive grading feedback."
        }
    ch_num, _ = parse_context_desc(context_desc)
    
    book_chapter_text = ""
    if ch_num:
        book_chapter_text = extract_book_chapter_text(ch_num)
        
    if book_chapter_text:
        prompt_context = f"{context_desc}\n\nTEXTBOOK CHAPTER {ch_num} FULL CONTENT:\n{book_chapter_text}"
    else:
        prompt_context = context_desc

    prompt = f"""You are a senior database systems tutor grading a graduate-level student response to a questions on Designing Data-Intensive Applications by Martin Kleppmann.

CONTEXT: {prompt_context}
QUESTION: {q_text}
MODEL ANSWER (RUBRIC): {model_answer}
STUDENT RESPONSE: {student_answer}

Grade the student's response on a scale of 1 to 5:
- 1: Completely incorrect, irrelevant, or empty.
- 2: Severe misunderstandings, or misses the core architectural concepts entirely.
- 3: Demonstrates partial understanding, but misses critical details, key terminology, or essential trade-offs.
- 4: Strong answer. Correctly identifies core concepts and terminology with minor omissions or slightly lacking depth.
- 5: Excellent, rigorous response. Fully explains the architecture, correct trade-offs, and design implications.

Provide your grading in the following structured JSON format:
{{
  "score": <integer from 1 to 5>,
  "strengths": "<brief description of what they got right, citing specific details from the response and textbook content if applicable>",
  "weaknesses": "<description of missing trade-offs, conceptual errors, or details in comparison to the model answer and textbook content>",
  "feedback": "<constructive guidance and corrected explanation targeting their specific gaps, clarifying the concepts using terminology from the textbook content>"
}}

Output ONLY the JSON object. Do not wrap it in markdown code blocks or add preamble.
"""
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 300.0}
        )
        text = response.text.strip()
        # Clean markdown wrappers if returned
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {
            "score": 0,
            "strengths": "Error",
            "weaknesses": "API failed to evaluate response.",
            "feedback": str(e)
        }

def main():
    args = parse_args()
    


    # Check API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Please set it in your terminal by running:")
        print("  export GEMINI_API_KEY=\"your-api-key-here\"")
        sys.exit(1)
        
    api_key = api_key.strip()
    os.environ["GEMINI_API_KEY"] = api_key
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(args.model)
    
    # Check state file
    if not os.path.exists(args.state):
        print(f"Error: State file '{args.state}' not found.")
        print("Please export your progress from the web app using the 'Export Progress' button in the header,")
        print(f"and save it in this directory as '{args.state}'.")
        sys.exit(1)
        
    try:
        with open(args.state, "r") as f:
            state = json.load(f)
    except Exception as e:
        print(f"Error reading state file: {e}")
        sys.exit(1)
        
    print(f"Successfully loaded progress from {args.state}.")
    print("Connecting to Gemini API for evaluation...\n")
    
    report_markdown = f"# Designing Data-Intensive Applications — AI Evaluation Report\n"
    report_markdown += f"Evaluated using model: `{args.model}`\n\n---\n\n"
    
    # 1. Process Chapter Quizzes
    chapter_keys = [k for k in state.keys() if k.startswith("ddia_ch") and k.endswith("_learning")]
    
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
            
        print(f"Grading Chapter {ch_num}: {ch_info['title']} ({len(answered_write_ins)} write-in answers)...")
        
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
                
            print(f"  - Evaluating Q{q_idx + 1}: \"{q['q'][:50]}...\"")
            
            context_desc = f"Chapter {ch_num} ({ch_info['title']}), section: {q.get('section', 'General')}"
            grade = grade_question(model, q["q"], q["modelAnswer"], student_ans, context_desc)
            
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
            report_markdown += f"**Tutor Feedback & Core Concepts**:\n{grade['feedback']}\n\n"
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
                
            print(f"  - Evaluating Q{q_idx + 1}: \"{q['q'][:50]}...\"")
            context_desc = f"Cumulative {e_type}, Ch {q.get('chapterNum')} ({q.get('section')})"
            grade = grade_question(model, q["q"], q["modelAnswer"], student_ans, context_desc)
            
            total_graded_questions += 1
            total_score_sum += grade["score"]
            
            report_markdown += f"### Q{q_idx + 1} (Ch {q.get('chapterNum')} - {q.get('section')})\n"
            report_markdown += f"**Question**: {q['q']}\n\n"
            report_markdown += f"**Your Answer**:\n> {student_ans}\n\n"
            report_markdown += f"**Model Answer (Rubric)**:\n> {q['modelAnswer']}\n\n"
            
            score_stars = "★" * grade["score"] + "☆" * (5 - grade["score"])
            report_markdown += f"**Grade**: `{score_stars}` ({grade['score']}/5)\n\n"
            report_markdown += f"**Strengths**: {grade['strengths']}\n\n"
            report_markdown += f"**Weaknesses**: {grade['weaknesses']}\n\n"
            report_markdown += f"**Tutor Feedback & Core Concepts**:\n{grade['feedback']}\n\n"
            report_markdown += "---\n\n"

    # Write Report Summary
    summary_markdown = "# DDIA AI Evaluation Summary\n\n"
    if total_graded_questions > 0:
        total_avg = round(total_score_sum / total_graded_questions, 2)
        summary_markdown += f"**Overall Average Score**: `{total_avg} / 5` ({round((total_avg / 5) * 100)}%)\n"
        summary_markdown += f"**Total Graded Responses**: `{total_graded_questions}` write-ins\n"
        summary_markdown += f"**Graded Chapters**: `{graded_chapters_count}` chapters\n\n"
    else:
        summary_markdown += "*No write-in responses found in progress file. Complete some write-ins in the app and export progress again.*\n\n"
        
    full_report = summary_markdown + "\n---\n\n" + report_markdown
    
    with open(args.output, "w") as f:
        f.write(full_report)
        
    print(f"Grading complete! Evaluation report saved to: {args.output}")

if __name__ == "__main__":
    main()
