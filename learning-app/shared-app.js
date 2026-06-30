/* ══════════════════════════════════════════════════
   DDIA Learning Activities — Central Shared Core Engine
   ══════════════════════════════════════════════════ */

// ── State Management ────────────────────────────────

function loadState(stateKey) {
  const key = stateKey || STATE_KEY;
  const s = window.dbLoadState ? window.dbLoadState(key) : {};
  return (s && typeof s === 'object') ? s : {};
}

function saveState(data, stateKey) {
  const key = stateKey || STATE_KEY;
  if (window.dbSaveState) {
    window.dbSaveState(data, key);
  }
}

// ── Navigation ──────────────────────────────────────

function switchPhase(phase) {
  document.querySelectorAll('.phase-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const targetSection = document.getElementById(`phase-${phase}`);
  const targetButton = document.getElementById(`nav-${phase}`);
  if (targetSection) targetSection.classList.add('active');
  if (targetButton) targetButton.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPhase(btn.dataset.phase));
});

// ── Pre-Activity: Diagnostic ────────────────────────

const saveDiagnosticBtn = document.getElementById('saveDiagnostic');
if (saveDiagnosticBtn) {
  saveDiagnosticBtn.addEventListener('click', () => {
    const values = [];
    if (typeof CONFIDENCE_LABELS !== 'undefined') {
      CONFIDENCE_LABELS.forEach((_, i) => {
        const el = document.getElementById(`conf-${i + 1}`);
        if (el) {
          values.push(parseInt(el.value));
        }
      });
    }
    saveState({ diagnosticBaseline: values, diagnosticDate: new Date().toISOString() });
    const diagnosticSaved = document.getElementById('diagnosticSaved');
    if (diagnosticSaved) diagnosticSaved.classList.remove('hidden');
    renderConfidenceComparison();
  });
}

// ── Pre-Activity: Puzzle ────────────────────────────

const savePuzzleBtn = document.getElementById('savePuzzle');
if (savePuzzleBtn) {
  savePuzzleBtn.addEventListener('click', () => {
    const answers = {};
    document.querySelectorAll('[id^="puzzle-a"]').forEach(el => {
      const idx = el.id.replace('puzzle-a', '');
      answers[`q${idx}`] = el.value;
    });
    saveState({ puzzleAnswers: answers });
    const puzzleSaved = document.getElementById('puzzleSaved');
    if (puzzleSaved) puzzleSaved.classList.remove('hidden');
    renderRevisitPredictions();
  });
}

// ── Pre-Activity: Misconceptions ────────────────────

function renderMisconceptions() {
  const listEl = document.getElementById('misconceptionList');
  if (!listEl) return;

  if (typeof MISCONCEPTIONS !== 'undefined' && Array.isArray(MISCONCEPTIONS)) {
    listEl.innerHTML = '';
    MISCONCEPTIONS.forEach(m => {
      const div = document.createElement('div');
      div.className = 'misconception-item';
      div.setAttribute('data-correct', m.correct);
      div.setAttribute('data-id', m.key);
      div.innerHTML = `
        <p class="misconception-text">"${m.statement}"</p>
        <div class="misconception-btns">
          <button class="mc-btn" data-value="true">True</button>
          <button class="mc-btn" data-value="false">False</button>
          <button class="mc-btn" data-value="unsure">Not Sure</button>
        </div>
        <div class="misconception-feedback hidden"></div>
      `;
      listEl.appendChild(div);
    });
  }

  listEl.querySelectorAll('.misconception-item').forEach(item => {
    const btns = item.querySelectorAll('.mc-btn');
    const feedbackEl = item.querySelector('.misconception-feedback');
    const correct = item.dataset.correct;
    const id = item.dataset.id;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const value = btn.dataset.value;
        let explanation = "";
        
        if (typeof MISCONCEPTIONS !== 'undefined' && Array.isArray(MISCONCEPTIONS)) {
          const mObj = MISCONCEPTIONS.find(m => m.key === id);
          explanation = mObj ? mObj.explanation[value] : "";
        } else if (typeof MISCONCEPTION_EXPLANATIONS !== 'undefined') {
          explanation = MISCONCEPTION_EXPLANATIONS[id] ? MISCONCEPTION_EXPLANATIONS[id][value] : "";
        }

        if (feedbackEl) {
          feedbackEl.textContent = explanation;
          feedbackEl.className = 'misconception-feedback';
          if (value === correct || value === 'unsure') {
            feedbackEl.classList.add(value === correct ? 'correct' : 'noted');
          } else {
            feedbackEl.classList.add('noted');
          }
          feedbackEl.classList.remove('hidden');
        }

        if (typeof MISCONCEPTIONS !== 'undefined') {
          checkMisconceptionsComplete();
        }
      });
    });
  });
}

function checkMisconceptionsComplete() {
  const items = document.querySelectorAll('.misconception-item');
  let answeredAll = true;
  let correctCount = 0;
  items.forEach(item => {
    const selected = item.querySelector('.mc-btn.selected');
    if (!selected) {
      answeredAll = false;
    } else {
      const value = selected.dataset.value;
      const correct = item.dataset.correct;
      if (value === correct) correctCount++;
    }
  });

  if (answeredAll) {
    const summaryEl = document.getElementById('misconceptionSummary');
    if (summaryEl) {
      summaryEl.classList.remove('hidden');
      const resultEl = document.getElementById('misconceptionResult');
      if (resultEl) {
        resultEl.innerHTML = `You correctly identified <strong>${correctCount} out of ${items.length}</strong> common misconceptions.`;
      }
    }
  }
}

// ── Post-Activity: Timer ────────────────────────────

let timerInterval = null;
let timerRunning = false;

const timerBtn = document.getElementById('timerBtn');
if (timerBtn) {
  timerBtn.addEventListener('click', function() {
    this.disabled = true;

    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      this.textContent = 'Start 5-min Timer';
      this.disabled = false;
      return;
    }

    timerRunning = true;
    this.textContent = 'Pause';
    this.disabled = false;
    let remaining = 300;
    const total = 300;
    const display = document.getElementById('timerDisplay');
    const progress = document.getElementById('timerProgress');

    timerInterval = setInterval(() => {
      remaining--;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (display) display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      if (progress) progress.style.width = `${((total - remaining) / total) * 100}%`;

      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        if (display) {
          display.textContent = "0:00";
          display.style.color = '#f43f5e';
        }
        if (timerBtn) timerBtn.textContent = 'Done!';
      }
    }, 1000);
  });
}

// ── Post-Activity: Brain Dump ───────────────────────

const saveBrainDumpBtn = document.getElementById('saveBrainDump');
if (saveBrainDumpBtn) {
  saveBrainDumpBtn.addEventListener('click', () => {
    const area = document.getElementById('brainDumpArea');
    if (area) {
      saveState({ brainDump: area.value });
      const savedFeedback = document.getElementById('brainDumpSaved');
      if (savedFeedback) savedFeedback.classList.remove('hidden');
    }
  });
}

// ── Post-Activity: Quiz ─────────────────────────────

let currentFilter = 'all';

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  
  const state = loadState();
  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};
  const graded = state.quizGraded || false;

  const renderedCaseStudies = new Set();
  let renderedCount = 0;

  QUIZ_QUESTIONS.forEach((q, idx) => {
    // Apply filters
    const isMc = q.type === 'mc';
    const hasSelection = selections[idx] !== undefined;
    const hasWriteIn = writeIns[idx] && writeIns[idx].trim().length > 0;
    const isAnswered = isMc ? hasSelection : hasWriteIn;

    if (currentFilter === 'mc' && !isMc) return;
    if (currentFilter === 'write' && isMc) return;
    if (currentFilter === 'unanswered' && isAnswered) return;

    renderedCount++;

    if (q.caseStudy) {
      const csId = q.caseStudy.id || q.caseStudy.title;
      if (!renderedCaseStudies.has(csId)) {
        renderedCaseStudies.add(csId);
        const csDiv = document.createElement('div');
        csDiv.className = 'quiz-case-study';
        csDiv.innerHTML = `
          <div class="case-study-banner">Case Study Context</div>
          <div class="case-study-header">
            <span class="case-study-icon">📖</span>
            <h3 class="case-study-title">${q.caseStudy.title}</h3>
          </div>
          <div class="case-study-content">
            ${q.caseStudy.text}
          </div>
        `;
        container.appendChild(csDiv);
      }
    }

    const div = document.createElement('div');
    div.className = `quiz-question ${isMc ? 'type-mc' : 'type-write'}`;
    div.setAttribute('data-q-index', idx);
    div.dataset.qIndex = idx;

    if (isMc) {
      // Multiple Choice Question
      const selectedOptionIdx = selections[idx];
      const isCorrect = selectedOptionIdx === q.correct;

      div.innerHTML = `
        <div class="quiz-q-text">
          <span class="quiz-q-num">${idx + 1}</span>
          <span>${q.q}</span>
          <span class="badge-tag" style="margin-left:auto; font-size:0.65rem; color:var(--accent-indigo); border:1px solid rgba(99,102,241,0.2); padding:0.1rem 0.3rem; border-radius:3px;">${q.section}</span>
        </div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => {
            let extraClass = '';
            let markerText = '';
            
            if (graded) {
              if (oi === q.correct) {
                extraClass = 'correct-answer';
                markerText = '✓';
              } else if (oi === selectedOptionIdx && !isCorrect) {
                extraClass = 'wrong-answer';
                markerText = '✗';
              }
            } else {
              if (oi === selectedOptionIdx) {
                extraClass = 'selected';
              }
            }

            return `
              <button class="quiz-option ${extraClass}" data-q="${idx}" data-o="${oi}" ${graded ? 'disabled' : ''}>
                <span class="quiz-option-marker">${markerText}</span>
                <span>${opt}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;

      // If graded, append explanation
      if (graded) {
        div.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');
        const explDiv = document.createElement('div');
        explDiv.className = 'quiz-explanation';
        explDiv.textContent = q.explanation;
        div.appendChild(explDiv);
      }
    } else {
      // Write-In Question
      const savedText = writeIns[idx] || '';
      div.innerHTML = `
        <div class="quiz-q-text">
          <span class="quiz-q-num">${idx + 1}</span>
          <span>${q.q}</span>
          <span class="badge-tag" style="margin-left:auto; font-size:0.65rem; color:var(--accent-cyan); border:1px solid rgba(6,182,212,0.2); padding:0.1rem 0.3rem; border-radius:3px;">${q.section}</span>
        </div>
        <div class="quiz-writein-container">
          <div class="elab-hint">Hint: ${q.hint}</div>
          <textarea class="quiz-writein-textarea" data-q="${idx}" placeholder="Write your conceptual answer here (saved automatically)..." ${graded ? 'disabled' : ''}>${savedText}</textarea>
          ${graded ? `<div class="quiz-writein-feedback">✓ Response recorded & locked. Ready for LLM grading.</div>` : ''}
        </div>
      `;
    }

    container.appendChild(div);
  });

  if (renderedCount === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-filter-msg';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '2rem';
    emptyMsg.style.color = 'var(--text-muted)';
    emptyMsg.style.fontSize = '0.9rem';
    emptyMsg.textContent = 'No questions match the current filter.';
    container.appendChild(emptyMsg);
  }

  // Update progress info
  updateQuizProgress();

  // Add click handlers for MC options
  if (!graded) {
    container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', function() {
        const qIndex = parseInt(this.dataset.q);
        const oIndex = parseInt(this.dataset.o);
        
        // Remove selection from siblings
        container.querySelectorAll(`.quiz-option[data-q="${qIndex}"]`).forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        // Save selection to state
        const state = loadState();
        const selections = state.quizSelections || {};
        selections[qIndex] = oIndex;
        saveState({ quizSelections: selections });

        updateQuizProgress();
      });
    });

    // Add input handlers for write-in textareas
    container.querySelectorAll('.quiz-writein-textarea').forEach(tx => {
      tx.addEventListener('input', function() {
        const qIndex = parseInt(this.dataset.q);
        const val = this.value;

        // Save write-in to state
        const state = loadState();
        const writeIns = state.writeInAnswers || {};
        writeIns[qIndex] = val;
        saveState({ writeInAnswers: writeIns });

        updateQuizProgress();
      });
    });
  }

  // Show results or submit button
  if (graded) {
    showQuizResultsPanel(loadState());
    const cachedState = loadState();
    if (cachedState.aiGrades) {
      renderAiGrades(cachedState.aiGrades, cachedState.aiSummary);
    }
  } else {
    // Render submit row
    const submitRow = document.createElement('div');
    submitRow.className = 'quiz-submit-row';
    submitRow.innerHTML = `<button class="btn-primary" id="submitQuiz">Check Answers</button>`;
    container.appendChild(submitRow);
    const submitQuizBtn = document.getElementById('submitQuiz');
    if (submitQuizBtn) submitQuizBtn.addEventListener('click', gradeQuiz);
  }
}

function updateQuizProgress() {
  const state = loadState();
  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};

  let answeredCount = 0;
  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'mc') {
      if (selections[idx] !== undefined) answeredCount++;
    } else {
      if (writeIns[idx] && writeIns[idx].trim().length > 0) answeredCount++;
    }
  });

  const total = QUIZ_QUESTIONS.length;
  const textEl = document.getElementById('quizProgressText');
  const fillEl = document.getElementById('quizProgressFill');
  if (textEl) textEl.textContent = `${answeredCount} of ${total} answered`;
  if (fillEl) fillEl.style.width = `${(answeredCount / total) * 100}%`;
}

function gradeQuiz() {
  // Save that we have graded
  saveState({ quizGraded: true });

  // Re-render quiz in graded state
  renderQuiz();
}

function showQuizResultsPanel(state) {
  // Restructure results-header for uniform results circles if not already done
  const header = document.querySelector('.results-header');
  if (header) {
    const mcContainer = header.querySelector('.results-score');
    if (mcContainer) {
      mcContainer.className = 'results-score-item mc-score-item';
    }
    const writeInBadge = header.querySelector('.results-writein-badge');
    if (writeInBadge) {
      const writeInContainer = document.createElement('div');
      writeInContainer.className = 'results-score-item writein-score-item';

      const writeInCircle = document.createElement('div');
      writeInCircle.className = 'score-circle writein-score-circle';

      const countSpan = document.getElementById('writeinCount') || writeInBadge.querySelector('.writein-count');
      if (countSpan) {
        countSpan.className = 'score-num';
        writeInCircle.appendChild(countSpan);
      }

      writeInContainer.appendChild(writeInCircle);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'score-label';
      labelSpan.textContent = 'Write-in responses saved';
      writeInContainer.appendChild(labelSpan);

      writeInBadge.replaceWith(writeInContainer);
    }
  }

  const selections = state.quizSelections || {};
  const writeIns = state.writeInAnswers || {};

  let mcCorrect = 0;
  let mcTotal = 0;
  let writeInAnswered = 0;

  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'mc') {
      mcTotal++;
      if (selections[idx] === q.correct) mcCorrect++;
    } else {
      if (writeIns[idx] && writeIns[idx].trim().length > 0) writeInAnswered++;
    }
  });

  const scoreNumEl = document.getElementById('scoreNum');
  const scoreDenomEl = document.getElementById('scoreDenom');
  const writeinCountEl = document.getElementById('writeinCount');
  if (scoreNumEl) scoreNumEl.textContent = mcCorrect;
  if (scoreDenomEl) scoreDenomEl.textContent = `/ ${mcTotal}`;
  if (writeinCountEl) writeinCountEl.textContent = writeInAnswered;

  const breakdown = document.getElementById('resultsBreakdown');
  if (breakdown) {
    const percent = Math.round((mcCorrect / mcTotal) * 100);

    if (percent >= 85) {
      breakdown.innerHTML = `<p style="color: var(--accent-emerald);">🎯 Excellent retrieval! You scored <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. Focus your remaining review on write-in grading below.</p>`;
    } else if (percent >= 60) {
      breakdown.innerHTML = `<p style="color: var(--accent-amber);">👍 Good job! You scored <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. Analyze the feedback on questions you missed, and evaluate your write-in answers.</p>`;
    } else {
      breakdown.innerHTML = `<p style="color: var(--accent-rose);">📖 Retrieval gaps detected: <strong>${percent}%</strong> (${mcCorrect}/${mcTotal}) on Multiple Choice. The struggle of recalling makes re-reading the text highly effective! Use LLM grading below to check your write-in explanations.</p>`;
    }
  }

  const quizResultsPanel = document.getElementById('quizResults');
  if (quizResultsPanel) quizResultsPanel.classList.remove('hidden');
  
  // Hide submit button just in case
  const submitBtn = document.getElementById('submitQuiz');
  if (submitBtn) submitBtn.style.display = 'none';
}

function setupQuizFilters() {
  const filterContainer = document.querySelector('.quiz-filter-btns');
  if (filterContainer && !document.getElementById('resetQuizBtn')) {
    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetQuizBtn';
    resetBtn.className = 'filter-btn reset-quiz-btn';
    resetBtn.style.marginLeft = '1rem';
    resetBtn.textContent = 'Reset Quiz';
    resetBtn.addEventListener('click', () => {
      const confirmReset = confirm('Are you sure you want to reset the quiz? This will permanently clear all your multiple-choice and write-in answers, as well as AI grading feedback for this chapter.');
      if (confirmReset) {
        saveState({
          quizGraded: false,
          quizSelections: {},
          writeInAnswers: {},
          aiGrades: {}
        });
        
        // Hide results panel if visible
        const resultsPanel = document.getElementById('quizResults');
        if (resultsPanel) resultsPanel.classList.add('hidden');
        
        // Reset current filter to 'all' and active filter button
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => {
          if (b.dataset.filter === 'all') {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        
        renderQuiz();
      }
    });
    filterContainer.appendChild(resetBtn);
  }

  document.querySelectorAll('.filter-btn:not(.reset-quiz-btn)').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderQuiz();
    });
  });
}

async function gradeWriteIns() {
  const state = loadState();
  const writeIns = state.writeInAnswers || {};
  const answered = {};
  
  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (q.type === 'write' && writeIns[idx] && writeIns[idx].trim().length > 0) {
      answered[idx] = writeIns[idx];
    }
  });

  const totalToGrade = Object.keys(answered).length;
  if (totalToGrade === 0) {
    alert('Please answer at least one write-in question before grading.');
    return;
  }

  // Set up progress bar UI dynamically
  let progressContainer = document.getElementById('gradingProgressContainer');
  if (!progressContainer) {
    progressContainer = document.createElement('div');
    progressContainer.id = 'gradingProgressContainer';
    progressContainer.className = 'grading-progress-container';
    progressContainer.style.marginTop = '1rem';
    progressContainer.style.width = '100%';
    progressContainer.style.textAlign = 'left';
    progressContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
        <span id="gradingProgressStatus">Grading write-in responses...</span>
        <span id="gradingProgressPercent">0%</span>
      </div>
      <div style="width: 100%; height: 8px; background: rgba(99, 102, 241, 0.1); border-radius: 4px; overflow: hidden;">
        <div id="gradingProgressBarFill" style="width: 0%; height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.3s ease;"></div>
      </div>
    `;
    const resultsActions = document.querySelector('.results-actions');
    if (resultsActions) {
      resultsActions.parentNode.insertBefore(progressContainer, resultsActions);
    }
  }
  progressContainer.classList.remove('hidden');

  const statusEl = document.getElementById('gradingProgressStatus');
  const fillEl = document.getElementById('gradingProgressBarFill');
  const percentEl = document.getElementById('gradingProgressPercent');

  if (statusEl) statusEl.textContent = `Preparing to grade 1 of ${totalToGrade} questions...`;
  if (fillEl) fillEl.style.width = '0%';
  if (percentEl) percentEl.textContent = '0%';

  const grades = {};
  let currentCount = 0;

  for (const idxStr of Object.keys(answered)) {
    currentCount++;
    const idx = parseInt(idxStr);
    if (statusEl) statusEl.textContent = `Grading question ${currentCount} of ${totalToGrade}: "${QUIZ_QUESTIONS[idx].q.substring(0, 30)}..."`;
    
    const response = await fetch('/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chapterKey: STATE_KEY,
        writeIns: { [idxStr]: answered[idxStr] },
        username: typeof getCurrentUsername !== 'undefined' ? getCurrentUsername() : 'anonymous'
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.grades && data.grades[idxStr]) {
      grades[idxStr] = data.grades[idxStr];
    }

    const pct = Math.round((currentCount / totalToGrade) * 100);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (percentEl) percentEl.textContent = `${pct}%`;
  }

  const currentState = loadState();
  currentState.aiGrades = { ...(currentState.aiGrades || {}), ...grades };

  if (statusEl) statusEl.textContent = `All questions graded successfully! Generating overall AI summary...`;

  let summaryObj = null;
  try {
    const summaryResponse = await fetch('/grade_summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterKey: STATE_KEY,
        grades: currentState.aiGrades,
        username: typeof getCurrentUsername !== 'undefined' ? getCurrentUsername() : 'anonymous'
      })
    });
    if (summaryResponse.ok) {
      summaryObj = await summaryResponse.json();
    } else {
      summaryObj = { summary: "Failed to fetch summary from server." };
    }
  } catch (err) {
    summaryObj = { summary: `Error fetching summary: ${err.message}` };
  }

  currentState.aiSummary = summaryObj;
  saveState(currentState);

  if (statusEl) statusEl.textContent = `Summary generated!`;

  renderAiGrades(currentState.aiGrades, currentState.aiSummary);

  setTimeout(() => {
    progressContainer.classList.add('hidden');
  }, 3000);

  return { grades: currentState.aiGrades };
}

function renderAiGrades(grades, summary = null) {
  if (!grades) return;

  let totalScore = 0;
  let maxScore = 0;

  Object.keys(grades).forEach(idxStr => {
    const idx = parseInt(idxStr);
    const grade = grades[idxStr];
    totalScore += grade.score;
    maxScore += 5;

    const questionDiv = document.querySelector(`.quiz-question[data-q-index="${idx}"]`);
    if (!questionDiv) return;
    
    const existing = questionDiv.querySelector('.ai-grade-feedback');
    if (existing) existing.remove();
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'ai-grade-feedback';
    feedbackDiv.style.marginTop = '1rem';
    
    const scoreStars = "★".repeat(grade.score) + "☆".repeat(5 - grade.score);
    feedbackDiv.innerHTML = `
      <div class="grade-header">
        <span class="grade-title">🤖 AI Grading Feedback</span>
        <span class="grade-score">${scoreStars} (${grade.score}/5)</span>
      </div>
      <div class="grade-body">
        <div style="margin-bottom: 0.4rem;"><strong>Strengths:</strong> <span class="grade-strengths"></span></div>
        <div style="margin-bottom: 0.4rem;"><strong>Weaknesses/Gaps:</strong> <span class="grade-weaknesses"></span></div>
        <div><strong>Tutor Feedback:</strong> <span class="grade-feedback-text"></span></div>
      </div>
    `;
    feedbackDiv.querySelector('.grade-strengths').textContent = grade.strengths || 'None';
    feedbackDiv.querySelector('.grade-weaknesses').textContent = grade.weaknesses || 'None';
    feedbackDiv.querySelector('.grade-feedback-text').textContent = grade.feedback || 'None';
    
    questionDiv.appendChild(feedbackDiv);
  });

  if (maxScore > 0) {
    const header = document.querySelector('.results-header');
    if (header) {
      let badge = document.getElementById('llmBadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'llmBadge';
        badge.className = 'results-score-item llm-score-item';
        badge.innerHTML = `
          <div class="score-circle llm-score-circle">
            <span class="llm-score" id="llmScoreText" style="display: flex; flex-direction: column; align-items: center;"><span class="score-num" id="llmScoreNum"></span><span class="score-denom" id="llmScoreDenom"></span></span>
          </div>
          <span class="score-label llm-label">LLM Grading Score</span>
        `;
        header.appendChild(badge);
      }

      const numEl = document.getElementById('llmScoreNum');
      const denomEl = document.getElementById('llmScoreDenom');
      if (numEl && denomEl) {
        numEl.textContent = totalScore;
        denomEl.textContent = ` / ${maxScore}`;
      } else {
        const scoreTextEl = document.getElementById('llmScoreText');
        if (scoreTextEl) {
          scoreTextEl.textContent = `${totalScore} / ${maxScore}`;
        }
      }
    }

    if (summary) {
      const resultsContainer = document.getElementById('quizResults');
      if (resultsContainer) {
        let summaryPanel = document.getElementById('aiSummaryPanel');
        if (!summaryPanel) {
          summaryPanel = document.createElement('div');
          summaryPanel.id = 'aiSummaryPanel';
          summaryPanel.className = 'ai-summary-panel';
          resultsContainer.appendChild(summaryPanel);
        }

        const formatText = (text) => text ? text.replace(/\n/g, '<br>') : '';
        let html = `<h3 class="summary-title">🌟 AI Grading Summary</h3>`;
        if (summary.strengths) {
          html += `<div class="summary-content"><strong>What went well:</strong><br>${formatText(summary.strengths)}</div><br>`;
        }
        if (summary.weaknesses) {
          html += `<div class="summary-content"><strong>What could have been better:</strong><br>${formatText(summary.weaknesses)}</div><br>`;
        }
        html += `<div class="summary-content"><strong>TL;DR Summary:</strong><br>${formatText(summary.summary)}</div>`;

        summaryPanel.innerHTML = html;
      }
    }
  }
}

function setupLLMGrading() {
  const gradeBtn = document.getElementById('gradeWriteIns');
  if (gradeBtn) {
    gradeBtn.addEventListener('click', async () => {
      const originalText = gradeBtn.textContent;
      gradeBtn.textContent = 'Grading...';
      gradeBtn.disabled = true;
      try {
        await gradeWriteIns();
      } catch (err) {
        console.error('Error during grading:', err);
        alert('Grading failed: ' + err.message);
      } finally {
        gradeBtn.textContent = originalText;
        gradeBtn.disabled = false;
      }
    });
  }
}

const retakeQuizBtn = document.getElementById('retakeQuiz');
if (retakeQuizBtn) {
  retakeQuizBtn.addEventListener('click', () => {
    saveState({ quizGraded: false, quizSelections: {}, writeInAnswers: {} });
    const resultsPanel = document.getElementById('quizResults');
    if (resultsPanel) resultsPanel.classList.add('hidden');
    renderQuiz();
  });
}

// ── Post-Activity: Revisit ──────────────────────────

function renderRevisitPredictions() {
  const state = loadState();
  if (state.puzzleAnswers) {
    Object.keys(state.puzzleAnswers).forEach(key => {
      const idx = key.replace('q', '');
      const el = document.getElementById(`revisit-puzzle-${idx}`);
      if (el) el.textContent = state.puzzleAnswers[key] || '(No answer recorded)';
    });
  }
}

function renderConfidenceComparison() {
  const state = loadState();
  const container = document.getElementById('confidenceComparison');
  if (!container) return;
  container.innerHTML = '';

  const baseline = state.diagnosticBaseline || Array(CONFIDENCE_LABELS.length).fill(3);
  const levelLabels = ['—', 'No clue', 'Vaguely', 'Somewhat', 'Well', 'Could teach'];

  CONFIDENCE_LABELS.forEach((label, i) => {
    const div = document.createElement('div');
    div.className = 'conf-compare-item';
    div.innerHTML = `
      <span class="conf-compare-label">${label}</span>
      <span class="conf-compare-before">Before: ${levelLabels[baseline[i]] || '—'}</span>
      <div class="conf-compare-after">
        <span>Now:</span>
        <select data-conf-idx="${i}">
          <option value="1">No clue</option>
          <option value="2">Vaguely</option>
          <option value="3" selected>Somewhat</option>
          <option value="4">Well</option>
          <option value="5">Could teach</option>
        </select>
      </div>
    `;
    container.appendChild(div);
  });
}

const saveRevisitBtn = document.getElementById('saveRevisit');
if (saveRevisitBtn) {
  saveRevisitBtn.addEventListener('click', () => {
    const revisitArea = document.getElementById('revisit-a1');
    if (revisitArea) {
      saveState({
        revisitAnswer: revisitArea.value,
        revisitDate: new Date().toISOString()
      });
      const revisitSaved = document.getElementById('revisitSaved');
      if (revisitSaved) revisitSaved.classList.remove('hidden');
    }
  });
}

// ── Sustained: Schedule ─────────────────────────────

function renderSchedule() {
  const container = document.getElementById('scheduleGrid');
  if (!container) return;
  const state = loadState();
  const completed = state.scheduleCompleted || {};

  container.innerHTML = '';

  SCHEDULE_ITEMS.forEach((item, idx) => {
    const isCompleted = completed[idx];
    const isToday = item.type === 'due';
    const div = document.createElement('div');
    div.className = `schedule-item ${isCompleted ? 'completed' : ''} ${isToday && !isCompleted ? 'today' : ''} ${!isToday && !isCompleted ? 'future' : ''}`;
    div.innerHTML = `
      <span class="schedule-day">${item.day}</span>
      <span class="schedule-task">${item.task}</span>
      <span class="schedule-status ${isCompleted ? 'done' : isToday ? 'due' : 'upcoming'}">
        ${isCompleted ? '✓ Completed' : isToday ? '● Due now' : '○ Upcoming'}
      </span>
      ${!isCompleted ? `<span class="schedule-check" data-idx="${idx}">✓ Mark Complete</span>` : ''}
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.schedule-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.dataset.idx;
      const state = loadState();
      const completed = state.scheduleCompleted || {};
      completed[idx] = true;
      saveState({ scheduleCompleted: completed });
      renderSchedule();
    });
  });
}

// ── Sustained: Flashcards ───────────────────────────

let fcIndex = 0;
let fcRatings = [];
let fcDeck = [];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderFlashcard() {
  if (!FLASHCARDS || FLASHCARDS.length === 0) return;
  if (fcDeck.length === 0) {
    fcDeck = shuffleArray(FLASHCARDS);
  }
  const card = fcDeck[fcIndex];
  if (!card) return;

  const frontEl = document.getElementById('fcFront');
  const backEl = document.getElementById('fcBack');
  const progressText = document.getElementById('fcProgress');
  const progressFill = document.getElementById('fcProgressFill');

  if (frontEl) frontEl.textContent = card.front;
  if (backEl) backEl.textContent = card.back;
  if (progressText) progressText.textContent = `Card ${fcIndex + 1} of ${fcDeck.length}`;
  if (progressFill) progressFill.style.width = `${((fcIndex + 1) / fcDeck.length) * 100}%`;

  // Reset flip
  const innerEl = document.getElementById('flashcardInner');
  const ratingEl = document.getElementById('fcRating');
  const flipBtn = document.getElementById('fcFlip');
  const deckEl = document.getElementById('flashcardDeck');
  const completeEl = document.getElementById('fcComplete');

  if (innerEl) innerEl.classList.remove('flipped');
  if (ratingEl) ratingEl.classList.add('hidden');
  if (flipBtn) flipBtn.classList.remove('hidden');
  if (deckEl) deckEl.classList.remove('hidden');
  if (completeEl) completeEl.classList.add('hidden');
}

const fcFlipBtn = document.getElementById('fcFlip');
if (fcFlipBtn) {
  fcFlipBtn.addEventListener('click', () => {
    const innerEl = document.getElementById('flashcardInner');
    const ratingEl = document.getElementById('fcRating');
    if (innerEl) {
      innerEl.classList.toggle('flipped');
      if (innerEl.classList.contains('flipped')) {
        if (ratingEl) ratingEl.classList.remove('hidden');
        fcFlipBtn.classList.add('hidden');
      }
    }
  });
}

const flashcardEl = document.getElementById('flashcard');
if (flashcardEl) {
  flashcardEl.addEventListener('click', () => {
    const innerEl = document.getElementById('flashcardInner');
    const ratingEl = document.getElementById('fcRating');
    const flipBtn = document.getElementById('fcFlip');
    if (innerEl && !innerEl.classList.contains('flipped')) {
      innerEl.classList.add('flipped');
      if (ratingEl) ratingEl.classList.remove('hidden');
      if (flipBtn) flipBtn.classList.add('hidden');
    }
  });
}

document.querySelectorAll('.fc-rate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const rating = parseInt(btn.dataset.rating);
    fcRatings.push({ card: fcIndex, rating });

    fcIndex++;
    if (fcIndex >= fcDeck.length) {
      showFcComplete();
    } else {
      renderFlashcard();
    }
  });
});

function showFcComplete() {
  const deckEl = document.getElementById('flashcardDeck');
  const completeEl = document.getElementById('fcComplete');
  if (deckEl) deckEl.classList.add('hidden');
  if (completeEl) completeEl.classList.remove('hidden');

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  fcRatings.forEach(r => counts[r.rating]++);

  const statsEl = document.getElementById('fcStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div>😤 Didn't know: <strong>${counts[1]}</strong></div>
      <div>😓 Hard: <strong>${counts[2]}</strong></div>
      <div>🙂 Good: <strong>${counts[3]}</strong></div>
      <div>😎 Easy: <strong>${counts[4]}</strong></div>
      <div style="margin-top:0.75rem; color: var(--text-muted); font-size: 0.82rem;">
        Cards rated "Didn't know" or "Hard" should be reviewed again tomorrow.
        Cards rated "Easy" can be pushed to next week.
      </div>
    `;
  }

  saveState({
    fcSession: {
      date: new Date().toISOString(),
      ratings: fcRatings,
      counts
    }
  });

  // Reset ratings immediately after saving to prevent double-counting on next session
  fcRatings = [];
}

const fcRestartBtn = document.getElementById('fcRestart');
if (fcRestartBtn) {
  fcRestartBtn.addEventListener('click', () => {
    fcIndex = 0;
    fcRatings = [];
    fcDeck = shuffleArray(FLASHCARDS);
    renderFlashcard();
  });
}

// ── Sustained: Scenarios ────────────────────────────

let currentScenario = 0;

function renderScenarioDots() {
  const dots = document.getElementById('scenarioDots');
  if (!dots) return;
  const scenarioCards = document.querySelectorAll('.scenario-card');
  const totalScenarios = scenarioCards.length || 4;
  dots.innerHTML = '';
  for (let i = 0; i < totalScenarios; i++) {
    const dot = document.createElement('span');
    dot.className = `scenario-dot ${i === currentScenario ? 'active' : ''}`;
    dot.addEventListener('click', () => goToScenario(i));
    dots.appendChild(dot);
  }
}

function goToScenario(idx) {
  const card = document.querySelector(`.scenario-card[data-scenario="${idx}"]`);
  if (!card) return;

  currentScenario = idx;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  const prevBtn = document.getElementById('scenarioPrev');
  const nextBtn = document.getElementById('scenarioNext');
  const scenarioCards = document.querySelectorAll('.scenario-card');
  const totalScenarios = scenarioCards.length || 4;

  if (prevBtn) prevBtn.disabled = idx === 0;
  if (nextBtn) nextBtn.disabled = idx === (totalScenarios - 1);
  renderScenarioDots();
}

const scNextBtn = document.getElementById('scenarioNext');
if (scNextBtn) {
  scNextBtn.addEventListener('click', () => {
    const scenarioCards = document.querySelectorAll('.scenario-card');
    const totalScenarios = scenarioCards.length || 4;
    if (currentScenario < totalScenarios - 1) goToScenario(currentScenario + 1);
  });
}
const scPrevBtn = document.getElementById('scenarioPrev');
if (scPrevBtn) {
  scPrevBtn.addEventListener('click', () => {
    if (currentScenario > 0) goToScenario(currentScenario - 1);
  });
}

const saveScenariosBtn = document.getElementById('saveScenarios');
if (saveScenariosBtn) {
  saveScenariosBtn.addEventListener('click', () => {
    const answers = {};
    document.querySelectorAll('.scenario-textarea').forEach(el => {
      const match = el.id.match(/sc-(\d+)-(\d+)/);
      if (match) {
        answers[`s${match[1]}q${match[2]}`] = el.value;
      }
    });
    saveState({ scenarioAnswers: answers });
    const scenariosSaved = document.getElementById('scenariosSaved');
    if (scenariosSaved) scenariosSaved.classList.remove('hidden');
  });
}

// ── Sustained: Forgetting Curve ─────────────────────

function drawForgettingCurve() {
  const canvas = document.getElementById('forgettingCurve');
  if (!canvas) return;

  const W = canvas.offsetWidth || 600;
  const H = canvas.offsetHeight || 300;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  ctx.clearRect(0, 0, W, H);

  // Axes
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, H - padding.bottom);
  ctx.lineTo(W - padding.right, H - padding.bottom);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Time →', W / 2, H - 8);
  ctx.save();
  ctx.translate(14, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Memory Retention', 0, 0);
  ctx.restore();

  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.fillText('100%', padding.left - 8, padding.top + 5);
  ctx.fillText('50%', padding.left - 8, padding.top + plotH / 2 + 5);
  ctx.fillText('0%', padding.left - 8, H - padding.bottom + 5);

  // X-axis labels
  ctx.textAlign = 'center';
  const days = ['0', '1d', '3d', '1w', '2w', '1m'];
  days.forEach((label, i) => {
    const x = padding.left + (plotW / (days.length - 1)) * i;
    ctx.fillText(label, x, H - padding.bottom + 18);
  });

  function toX(t) { return padding.left + (t / 30) * plotW; }
  function toY(v) { return padding.top + (1 - v) * plotH; }

  // Without review curve (exponential decay)
  ctx.beginPath();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  for (let t = 0; t <= 30; t += 0.5) {
    const v = Math.exp(-t * 0.12);
    const x = toX(t); const y = toY(v);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // With spaced review curve
  const reviewPoints = [0, 1, 3, 7, 14];
  ctx.beginPath();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;

  let retention = 1;
  let lastReview = 0;
  const points = [];

  for (let t = 0; t <= 30; t += 0.25) {
    if (reviewPoints.includes(t) && t > 0) {
      retention = Math.min(1, retention + 0.35);
      lastReview = t;
      points.push({ x: toX(t), y: toY(retention) });
    }
    const decay = Math.exp(-(t - lastReview) * 0.06);
    const v = retention * decay;
    const x = toX(t); const y = toY(v);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Review point dots
  points.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = '#6366f1';
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// ── Initialization ──────────────────────────────────

function init() {
  // Save total questions count to state for dashboard accuracy
  saveState({ totalQuestions: QUIZ_QUESTIONS.length });

  // Restore saved data
  const state = loadState();

  // Restore diagnostic sliders
  if (state.diagnosticBaseline) {
    state.diagnosticBaseline.forEach((v, i) => {
      const el = document.getElementById(`conf-${i + 1}`);
      if (el) el.value = v;
    });
    const diagnosticSaved = document.getElementById('diagnosticSaved');
    if (diagnosticSaved) diagnosticSaved.classList.remove('hidden');
  }

  // Restore puzzle answers
  if (state.puzzleAnswers) {
    Object.keys(state.puzzleAnswers).forEach(key => {
      const idx = key.replace('q', '');
      const el = document.getElementById(`puzzle-a${idx}`);
      if (el) el.value = state.puzzleAnswers[key];
    });
    const puzzleSaved = document.getElementById('puzzleSaved');
    if (puzzleSaved) puzzleSaved.classList.remove('hidden');
  }

  // Restore brain dump
  if (state.brainDump) {
    const area = document.getElementById('brainDumpArea');
    if (area) area.value = state.brainDump;
  }

  // Restore scenario answers
  if (state.scenarioAnswers) {
    Object.keys(state.scenarioAnswers).forEach(key => {
      const match = key.match(/s(\d+)q(\d+)/);
      if (match) {
        const el = document.getElementById(`sc-${match[1]}-${match[2]}`);
        if (el) el.value = state.scenarioAnswers[key];
      }
    });
  }

  // Render components
  setupQuizFilters();
  setupLLMGrading();
  renderQuiz();
  renderSchedule();
  renderScenarioDots();
  renderConfidenceComparison();
  renderRevisitPredictions();
  renderMisconceptions();

  // Flashcards
  if (typeof FLASHCARDS !== 'undefined' && FLASHCARDS.length > 0) {
    fcDeck = shuffleArray(FLASHCARDS);
    renderFlashcard();
  }

  // Draw forgetting curve
  drawForgettingCurve();
  window.addEventListener('resize', drawForgettingCurve);

  // Wire up Anki export button
  document.getElementById('exportAnkiBtn')?.addEventListener('click', () => {
    if (typeof exportToAnki === 'function') {
      exportToAnki(FLASHCARDS, document.title);
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initDb !== 'undefined') {
    await initDb();
  }
  const cachedUser = sessionStorage.getItem('ddia_active_user');
  if (cachedUser) {
    if (typeof getOrCreateUser !== 'undefined') {
      getOrCreateUser(cachedUser);
    }
    init();
  } else {
    window.location.href = '../index.html';
  }
});
