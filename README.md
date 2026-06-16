# Designing Data-Intensive Applications (DDIA) — Applied Learning Platform

An interactive, evidence-based learning platform tailored to Martin Kleppmann's *Designing Data-Intensive Applications*. The platform implements the **2026 pedagogical consensus on learning science**, shifting learning from passive reading to effortful cognitive processing, retrieval practice, and spaced repetition.

---

## Core Features

### 1. Chapter-by-Chapter Practice (Chapters 1 to 14)
Each chapter folder hosts an independent web application implementing three research-backed learning phases:
- **Phase 1: Pre-Activity (Prime)**
  - *Confidence Diagnostics*: Sliders to assess baseline confidence on key chapter topics.
  - *Architecture Design Puzzle*: A complex, open-ended scenario where the student designs a system *before* reading the content (ABC Pedagogy).
  - *Misconception Detector*: Provocative statements that target common beginner misconceptions, providing immediate corrective feedback.
- **Phase 2: Post-Activity (Retrieve)**
  - *Timed Brain Dump*: A 5-minute timed recall area to perform free-recall consolidation immediately after reading.
  - *30-Question Interleaved Quiz*: Exactly 30 questions (18 multiple choice, 12 write-ins) interleaving different chapter sub-sections to build categorization strength.
  - *LLM Exporter*: Export write-in answers alongside canonical rubrics to copy/paste into ChatGPT, Claude, or Gemini for 1-5 scoring and feedback.
- **Phase 3: Sustained Practice (Retain)**
  - *Spaced Repetition Calendar*: An 8-step review schedule using expanding intervals (Today, +1d, +3d, +1w, +2w, +1m).
  - *Self-Rated Flashcards*: 12–15 flashcards with self-rating buttons (1-4 scale) to track memory strength.
  - *Interleaved Scenarios*: Cross-topic application challenges ending with a "Trade-off Tribunal" where the student argues both sides.
  - *Forgetting Curve Canvas*: An interactive HTML5 Canvas displaying memory decay over time, spiked by spaced review events.

### 2. Timed Cumulative Exams
- **Midterm Exam (Chapters 1 to 7)**: Selects a randomized pool of 40 questions (25 Multiple Choice, 15 Write-In) from the 210 questions in Ch 1-7. Starts a 60-minute countdown.
- **Final Exam (Chapters 1 to 14)**: Selects a randomized pool of 60 questions (35 Multiple Choice, 25 Write-In) from all 420 questions. Starts a 90-minute countdown.
- **Exam Testing UI**: Sticky sidebar with a ticking timer, progress meter, flagged status checkbox, and a grid question-number map (green for answered, yellow for flagged, outline for current).
- **Deferred Evaluation**: Feedback is deferred; scores, correct/wrong selections, explanations, and model answers are only revealed after the exam is submitted.

### 3. Integrated Dashboard Landing Page
- Serves as the central navigation hub.
- Displays aggregate metrics dynamically computed from browser `localStorage`:
  - *Overall Mastery*: The average score percentage across all chapters.
  - *Questions Answered*: The aggregate count of answered questions (out of 420 total).
  - *Cards Reviewed*: Total cards rated across all learning sessions.
  - *Chapters Active*: Total chapters where activities have commenced.
  - *Exam Statuses*: High scores and progress states for Midterm and Final Exams.

---

## Directory Structure

```
/ddia
├── /chapters/             # Source HTML files of the book chapters
├── /learning-app/         # Core application directory
│   ├── /ch01/ to /ch14/   # Sub-apps for Chapters 1-14 (index.html, app.js)
│   ├── /exams/            # Exams engine (index.html, exam.js)
│   ├── index.html         # Main Dashboard Landing Hub
│   └── styles.css         # Consolidated design system stylesheet
├── README.md              # This documentation file
└── split_epub.py          # Utility script
```

---

## How to Run Locally

The application is written entirely in Vanilla HTML, CSS, and JS. It requires no build tools, frameworks, or NPM dependencies.

To run the application, navigate to the root directory in your terminal and start a local web server using Python's built-in module:

```bash
# Run server pointing to the learning-app folder
python3 -m http.server 8080 --directory learning-app/
```

### Accessing the Site
Once the server is running, open your web browser and navigate to:
👉 **[http://localhost:8080/index.html](http://localhost:8080/index.html)**

*Note: If port `8080` is occupied by another process on your machine, launch the server on an alternative port:*
```bash
python3 -m http.server 8085 --directory learning-app/
# Open http://localhost:8085/index.html
```

---

## Automated AI Grading

Use the `grade_responses.py` script to automatically evaluate your write-in answers across all chapters and cumulative exams using the Gemini API:

1. **Install SDK**: `pip install google-generativeai`
2. **Export Progress**: Click **📥 Export Progress** in the app header and save `ddia_progress.json` in the project root.
3. **Run Script**:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   python3 grade_responses.py
   ```

The script queries `gemini-2.5-flash` to grade answers (1-5 scale) against the model rubrics and outputs a detailed feedback report to `ddia_grades_report.md`.

---

## Technology Stack & State Management
- **Frontend**: Pure Semantic HTML5, CSS Variables, and Vanilla ES6 JavaScript.
- **Styling**: Sleek dark-mode, glassmorphism UI with custom transitions, frosted panels, and ambient orbs (`@keyframes`).
- **State Isolation**: Progress is persisted in browser `localStorage`. Each chapter and exam operates under its own isolated key (`ddia_ch01_learning` to `ddia_ch14_learning`, and `ddia_exam_midterm` / `ddia_exam_final`), preventing state collisions and data corruption.
