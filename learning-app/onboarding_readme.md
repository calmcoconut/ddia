## 🏗️ System Architecture & Learning Theory

The application is structured as a client-side single-page app (SPA) workbook for each textbook chapter, orchestrated by a central dashboard. It is built using standard HTML5, CSS3, and JavaScript, leveraging browser-side SQLite WASM for offline persistence.

### Cognitive Science Principles
The platform implements evidence-based learning principles:
1. **Pre-Activity Priming**:
   - *Diagnostic Confidence*: Pre-study self-evaluation to benchmark confidence.
   - *Prediction Puzzles*: Generating predictions before learning to prime cognitive schemas.
   - *Misconceptions Check*: Actively identifying and debunking common industry myths before reading.
2. **Post-Activity Retrieval**:
   - *Timed Recall Quiz*: 30 quiz questions per chapter. Multiple-choice responses are checked client-side, while open-ended write-ins are evaluated with automated AI feedback via a local Flask server.
3. **Sustained Spaced Repetition**:
   - *Flashcard Engine*: Spaced repetition practice linked to an exportable Anki file generator.

---

## 📂 Directory Index

Below is the file structure of the [learning-app/](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app) folder:

```
learning-app/
├── index.html         - Central hub/dashboard page showing overall progress and midterm/final exams.
├── styles.css         - Shared stylesheet including dark-mode aesthetics, custom gradients, and responsive layouts.
├── app.js             - Handles dashboard stats rendering, user management, and dynamic listing of chapters.
├── db.js              - Core storage manager using SQLite WASM client-side database synced with localStorage.
├── shared-app.js      - Central activity engine implementing diagnostic checks, quizzes, flashcards, and grading flows.
├── tests.html         - Frontend testing client that runs JavaScript unit tests for database and state logic.
├── favicon.svg        - SVG asset for site favicon.
├── exams/             - Holds cumulative midterm and final exam assets.
│   ├── index.html     - Exam UI layout featuring a countdown timer, progress bar, and feedback modal.
│   └── exam.js        - Exam driver code running randomized question selection, timer, state savings, and grading.
└── ch01/ ... ch14/    - Workbook sections for Designing Data-Intensive Applications chapters.
    ├── index.html     - Interactive study UI for the specific chapter (Pre-Activity, Post-Activity, Sustained Practice).
    └── app.js         - Question banks, puzzle predictions, misconceptions checks, and configuration for that chapter.
```

---

## ⚙️ Function & Symbol Reference

### Progress Storage Management ([db.js](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js))
Manages active username sessions and SQLite WASM client-side storage synced to `localStorage`.
- [initDb](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L57): Asynchronously initializes SQLite WASM and runs initial migrations (`users` and `progress` tables).
- [listUsers](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L107): Queries database to list all existing local usernames.
- [getOrCreateUser](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L121): Bootstraps user session context and inserts the username if it doesn't already exist.
- [loadState](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L136): Fetches stringified JSON progress metrics by key and active user.
- [saveState](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L156): Inserts or updates progress JSON for the current session.
- [getCurrentUsername](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L178): Helper to read the active user from session/local storage.
- [exportToAnki](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L196): Assembles card data into an APKG-compatible text format for import.
- [logoutUser](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js#L228): Clear active session states and returns back to login overlay.

### Central Activity Engine ([shared-app.js](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js))
Coordinates rendering and interactivity across individual chapter routes.
- [switchPhase](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L22): Handles tab switching between Pre-Activity, Post-Activity, and Sustained Practice views.
- [renderMisconceptions](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L76): Dynamically renders interactive misconception statements.
- [renderQuiz](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L231): Generates questions, formats options, and checks input types (multiple-choice or write-in text).
- [gradeQuiz](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L441): Scores the multiple-choice section and saves the local state.
- [setupLLMGrading](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L796): Configures AJAX calls to trigger automated AI write-in scoring using the Flask backend.
- [renderFlashcard](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js#L938): Runs interactive flashcard cycle with rating buttons.

### Cumulative Exams ([exams/exam.js](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/exams/exam.js))
Powers midterm and final exam experiences.
- [sampleBalanced](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/exams/exam.js#L131): Generates exam configurations with proportional chapter question distributions.
- [startTimer](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/exams/exam.js#L262): Initiates countdown timer and triggers auto-submission upon expiry.
- [submitExam](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/exams/exam.js#L534): Submits exam responses and seals status in SQLite.

---

## 🚀 Local Development Setup

To run and preview the learning application locally, you can serve the directory static assets. Using the workspace Flask backend enables automated AI grading of open-ended write-in answers.

### Prerequisite Environment
Create a virtual environment and install the workspace dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Launching the Application
Execute the launch script to start the local Flask server and automatically open the application in your default web browser:
```bash
./launch.sh
```
The server will run on port `8080` by default. You can open it manually at:
👉 **[http://localhost:8080/index.html](http://localhost:8080/index.html)**

### Optional: AI Grading Configuration
For write-in scoring to succeed, create a `.env` file in the project root directory and specify your model credentials:
```env
LLM_PROVIDER="gemini"
LLM_KEY="your_api_key_here"
LLM_MODEL="gemini-3.5-flash"
```

---

## 🧪 Testing

The platform features two distinct testing layers:

### 1. Offline Frontend JavaScript Tests
Runs unit tests validating local storage base64 serialization, database migration schemas, and active user lifecycle states.
- **Execution**: Start the local server and navigate to:
  👉 **[http://localhost:8080/tests.html](http://localhost:8080/tests.html)**
- **Running tests**: Click the **"Run Tests"** button in the top right to execute the suite. Tests verify actions in:
  - [db.js](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/db.js) database initialization and base64 conversions.
  - [shared-app.js](file:///Users/alejandrodiaz/Documents/projects/ddia/learning-app/shared-app.js) state retrieval and puzzle saving.

### 2. Backend API Integration Tests
Tests Flask endpoints, request logging, LLM parser configurations, and regex extraction fallbacks using `pytest`. The tests are divided into two main categories using custom markers defined in [pytest.ini](file:///Users/alejandrodiaz/Documents/projects/ddia/pytest.ini):

- **Fast Offline Smoke Tests (`smoketest`)**:
  Runs fast, mock-based unit and smoke tests. These execute entirely offline and do *not* require any external API keys.
  ```bash
  venv/bin/pytest -m smoketest
  ```

- **Live LLM Integration Tests (`live`)**:
  Runs integration tests that make live calls to external LLM providers (Gemini, OpenAI, Claude). This requires a configured `.env` file with active API keys.
  ```bash
  venv/bin/pytest -m live
  ```

- **All Tests**:
  Runs the entire suite (including mock-based and live tests):
  ```bash
  venv/bin/pytest
  ```

- **Targeted Endpoint Tests**:
  To target [test_grade_endpoint.py](file:///Users/alejandrodiaz/Documents/projects/ddia/tests/test_grade_endpoint.py) specifically:
  ```bash
  venv/bin/pytest tests/test_grade_endpoint.py
  ```

