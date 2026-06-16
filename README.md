# Interactive Workbook for Designing Data-Intensive Applications

*No association with the author or publisher. This is a site I built for my own learning.*

This is an interactive study platform for Martin Kleppmann's *Designing Data-Intensive Applications*. It helps you actively retrieve and retain the concepts in the book rather than just reading passively.

![Dashboard Preview](assets/dashboard_screenshot.png)

## Features

- **Chapter Activities**: Each chapter has a system design puzzle, a misconception check, a timed recall block, a 30-question quiz (with optional AI grading), and spaced repetition flashcards.
- **Midterm & Final Exams**: Randomized timed exams (40/60 questions) spanning multiple chapters, with deferred grading and one-click AI grading.
- **Dashboard**: Track your mastery, answered questions, active chapters, and exam scores over time.

![One-Click Exam AI Grading](assets/exam_grading_screenshot.png)

## Getting Started

### 1. Run the Web App
Start the Flask server using the launch script:
```bash
./launch.sh
```
Go to: 👉 http://localhost:8080/index.html

### 2. Configure AI Grading (Optional)
To use AI grading for open-ended questions, create a `.env` file at the root:
```env
GEMINI_KEY="your_api_key_here"
GEMINI_MODEL="gemini-3.5-flash"
```

### 3. CLI Grading (Optional)
You can also run AI grading directly in your terminal:
```bash
# Exports your progress first from the UI, then run:
./grade.sh
```

### 4. Reset Progress
To wipe all local progress, database exports, and grading logs:
```bash
./reset_database
```

## Development & AI Disclosure

This codebase was generated using agentic AI coding assistants (colloquially known as "vibe coding") under human direction. 

Additionally, the platform uses Generative AI to grade open-ended responses. Please verify AI-generated feedback against the textbook.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
