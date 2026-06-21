/* ══════════════════════════════════════════════════
   DDIA Cumulative Exam Engine — Application Logic
   ══════════════════════════════════════════════════ */

// ── Configuration & State ───────────────────────────

const CHAPTERS_LIST = [
  { num: 1, dir: "ch01", title: "Trade-Offs in Data Systems Architecture" },
  { num: 2, dir: "ch02", title: "Defining Nonfunctional Requirements" },
  { num: 3, dir: "ch03", title: "Data Models and Query Languages" },
  { num: 4, dir: "ch04", title: "Storage and Retrieval" },
  { num: 5, dir: "ch05", title: "Encoding and Evolution" },
  { num: 6, dir: "ch06", title: "Replication" },
  { num: 7, dir: "ch07", title: "Sharding" },
  { num: 8, dir: "ch08", title: "Transactions" },
  { num: 9, dir: "ch09", title: "The Trouble with Distributed Systems" },
  { num: 10, dir: "ch10", title: "Consistency and Consensus" },
  { num: 11, dir: "ch11", title: "Batch Processing" },
  { num: 12, dir: "ch12", title: "Stream Processing" },
  { num: 13, dir: "ch13", title: "A Philosophy of Streaming Systems" },
  { num: 14, dir: "ch14", title: "Doing the Right Thing" }
];

let examType = 'midterm'; // 'midterm' or 'final'
let examState = null;
let currentQuestionIndex = 0;
let timerInterval = null;

// Shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── State Management ────────────────────────────────

function getStorageKey() {
  return `ddia_exam_${examType}`;
}

function loadExamState() {
  if (window.loadState) {
    examState = window.loadState(getStorageKey());
  }
  // Return a snapshot, not the live object
  return examState && Object.keys(examState).length > 0 ? JSON.parse(JSON.stringify(examState)) : null;
}

function saveExamState(state) {
  examState = JSON.parse(JSON.stringify(state));
  if (window.saveState) {
    window.saveState(examState, getStorageKey());
  }
}


// ── Question Loader ─────────────────────────────────

function extractQuizQuestions(text) {
  const startMarker = 'const QUIZ_QUESTIONS = [';
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Failed to locate QUIZ_QUESTIONS start marker`);
  }
  
  let bracketCount = 1;
  let index = startIndex + startMarker.length;
  let inString = false;
  let quoteChar = null;
  let escaped = false;
  
  while (index < text.length) {
    const char = text[index];
    
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (inString) {
      if (char === quoteChar) {
        inString = false;
        quoteChar = null;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        quoteChar = char;
      } else if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          return text.substring(startIndex + startMarker.length - 1, index + 1);
        }
      }
    }
    index++;
  }
  throw new Error(`Failed to find matching closing bracket for QUIZ_QUESTIONS`);
}

async function fetchChapterQuestions(dir) {
  try {
    const response = await fetch(`../${dir}/app.js`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const text = await response.text();
    
    // Extract array text robustly
    const arrayContent = extractQuizQuestions(text);
    
    // Evaluate Javascript array safely
    const parserFn = new Function(`return ${arrayContent}`);
    const questions = parserFn();
    
    // Tag each question with its origin chapter
    return questions.map(q => ({
      ...q,
      chapterDir: dir,
      chapterNum: parseInt(dir.replace('ch', ''))
    }));
  } catch (e) {
    console.error(`Error loading questions for ${dir}:`, e);
    return [];
  }
}

function sampleBalanced(allQuestions, numMcNeeded, numWriteNeeded, chaptersList) {
  const chapterMc = {};
  const chapterWrite = {};
  
  chaptersList.forEach(ch => {
    chapterMc[ch.num] = [];
    chapterWrite[ch.num] = [];
  });
  
  allQuestions.forEach(q => {
    const chNum = q.chapterNum;
    if (chapterMc[chNum] && q.type === 'mc') {
      chapterMc[chNum].push(q);
    } else if (chapterWrite[chNum] && q.type === 'write') {
      chapterWrite[chNum].push(q);
    }
  });
  
  const selectedMc = [];
  const selectedWrite = [];
  
  const minMcPerChapter = Math.floor(numMcNeeded / chaptersList.length);
  const minWritePerChapter = Math.floor(numWriteNeeded / chaptersList.length);
  
  chaptersList.forEach(ch => {
    const mcPool = shuffleArray(chapterMc[ch.num]);
    const writePool = shuffleArray(chapterWrite[ch.num]);
    
    const mcQuota = mcPool.slice(0, Math.min(minMcPerChapter, mcPool.length));
    selectedMc.push(...mcQuota);
    chapterMc[ch.num] = mcPool.slice(mcQuota.length);
    
    const writeQuota = writePool.slice(0, Math.min(minWritePerChapter, writePool.length));
    selectedWrite.push(...writeQuota);
    chapterWrite[ch.num] = writePool.slice(writeQuota.length);
  });
  
  const remainingMc = [];
  const remainingWrite = [];
  chaptersList.forEach(ch => {
    remainingMc.push(...chapterMc[ch.num]);
    remainingWrite.push(...chapterWrite[ch.num]);
  });
  
  const shuffledRemainingMc = shuffleArray(remainingMc);
  const additionalMcNeeded = numMcNeeded - selectedMc.length;
  if (additionalMcNeeded > 0) {
    selectedMc.push(...shuffledRemainingMc.slice(0, additionalMcNeeded));
  }
  
  const shuffledRemainingWrite = shuffleArray(remainingWrite);
  const additionalWriteNeeded = numWriteNeeded - selectedWrite.length;
  if (additionalWriteNeeded > 0) {
    selectedWrite.push(...shuffledRemainingWrite.slice(0, additionalWriteNeeded));
  }
  
  return {
    mc: selectedMc,
    write: selectedWrite
  };
}

function formatDuration(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  
  const parts = [];
  if (hrs > 0) parts.push(hrs.toString().padStart(2, '0'));
  parts.push(mins.toString().padStart(2, '0'));
  parts.push(secs.toString().padStart(2, '0'));
  return parts.join(':');
}

async function assembleExamPool() {
  document.getElementById('loadingOverlay').classList.remove('hidden');
  
  // Decide scope of chapters
  const maxChapter = examType === 'midterm' ? 7 : 14;
  const chaptersToLoad = CHAPTERS_LIST.filter(ch => ch.num <= maxChapter);
  
  document.getElementById('loadingText').textContent = `Loading Chapters (0 / ${chaptersToLoad.length})...`;
  
  let loadedCount = 0;
  const allQuestions = [];
  
  for (const ch of chaptersToLoad) {
    const questions = await fetchChapterQuestions(ch.dir);
    allQuestions.push(...questions);
    loadedCount++;
    document.getElementById('loadingText').textContent = `Loading Chapters (${loadedCount} / ${chaptersToLoad.length})...`;
  }
  
  if (allQuestions.length === 0) {
    alert("Error loading chapter files. Please verify the HTTP server is running.");
    return;
  }
  
  // Define exam criteria
  const numMc = examType === 'midterm' ? 25 : 35;
  const numWrite = examType === 'midterm' ? 15 : 25;
  
  // Sample balanced questions per chapter
  const sampled = sampleBalanced(allQuestions, numMc, numWrite, chaptersToLoad);
  
  // Merge and shuffle to interleave MC and Write-ins
  const examQuestions = shuffleArray([...sampled.mc, ...sampled.write]);
  
  // Create initial state
  const timeLimit = examType === 'midterm' ? 60 * 60 : 90 * 60; // 60 or 90 minutes
  
  examState = {
    examType,
    questions: examQuestions,
    selections: {},
    writeIns: {},
    flagged: {},
    timeRemaining: timeLimit,
    isSubmitted: false,
    submittedAt: null,
    mcScore: 0,
    mcRatio: "0 / 0"
  };
  
  saveExamState(examState);
  
  document.getElementById('loadingOverlay').classList.add('hidden');
}

// ── Timer Logic ─────────────────────────────────────

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (examState.isSubmitted) {
      clearInterval(timerInterval);
      return;
    }
    
    examState.timeRemaining--;
    
    if (examState.timeRemaining <= 0) {
      examState.timeRemaining = 0;
      clearInterval(timerInterval);
      submitExam(true); // Auto submit
    }
    
    updateTimerDisplay();
    
    // Save timer periodically (every 5 seconds) to reduce disk overhead
    if (examState.timeRemaining % 5 === 0) {
      saveExamState(examState);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const totalSecs = examState.timeRemaining;
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  
  const formatted = [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
  
  const display = document.getElementById('examTimerDisplay');
  display.textContent = formatted;
  
  if (totalSecs <= 300) { // 5 minutes warning
    display.style.color = 'var(--accent-rose)';
    display.style.textShadow = '0 0 20px rgba(244, 63, 94, 0.4)';
  } else {
    display.style.color = 'var(--accent-indigo)';
    display.style.textShadow = '0 0 20px rgba(99, 102, 241, 0.3)';
  }
}

// ── Rendering & Navigation ──────────────────────────

function updateProgressBar() {
  const total = examState.questions.length;
  let answered = 0;
  
  examState.questions.forEach((q, idx) => {
    if (q.type === 'mc') {
      if (examState.selections[idx] !== undefined) answered++;
    } else {
      if (examState.writeIns[idx] && examState.writeIns[idx].trim().length > 0) answered++;
    }
  });
  
  document.getElementById('answeredRatio').textContent = `${answered} / ${total} Answered`;
  const pct = Math.min((answered / total) * 100, 100);
  document.getElementById('examProgressBar').style.width = `${pct}%`;
}

function renderQuestionMap() {
  const container = document.getElementById('qNavGrid');
  container.innerHTML = '';
  
  examState.questions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'q-nav-btn';
    btn.textContent = (idx + 1).toString().padStart(2, '0');
    
    // Styling states
    const isCurrent = idx === currentQuestionIndex;
    const isMc = q.type === 'mc';
    const isAnswered = isMc 
      ? examState.selections[idx] !== undefined 
      : (examState.writeIns[idx] && examState.writeIns[idx].trim().length > 0);
    const isFlagged = examState.flagged[idx] === true;
    
    if (isCurrent) btn.classList.add('active');
    if (isAnswered) btn.classList.add('answered');
    if (isFlagged) btn.classList.add('flagged');
    
    btn.addEventListener('click', () => {
      saveActiveQuestionState();
      currentQuestionIndex = idx;
      renderActiveQuestion();
    });
    
    container.appendChild(btn);
  });
}

function saveActiveQuestionState() {
  if (examState.isSubmitted) return;
  
  const q = examState.questions[currentQuestionIndex];
  if (q.type === 'write') {
    const text = document.getElementById('writeInAnswerArea').value;
    examState.writeIns[currentQuestionIndex] = text;
  }
  
  examState.flagged[currentQuestionIndex] = document.getElementById('flagQuestionCheckbox').checked;
  saveExamState(examState);
  updateProgressBar();
  renderQuestionMap();
}

function renderActiveQuestion() {
  const q = examState.questions[currentQuestionIndex];
  const isMc = q.type === 'mc';
  const isFlagged = examState.flagged[currentQuestionIndex] === true;
  const isSubmitted = examState.isSubmitted;
  
  // Header details
  document.getElementById('questionNumDisplay').textContent = `Q${(currentQuestionIndex + 1).toString().padStart(2, '0')}`;
  document.getElementById('questionSectionDisplay').textContent = `Ch. ${q.chapterNum} — ${q.section}`;
  document.getElementById('questionTypeBadge').textContent = isMc ? 'Multiple Choice' : 'Write-In Challenge';
  document.getElementById('flagQuestionCheckbox').checked = isFlagged;
  
  // Disable flag edit if submitted
  document.getElementById('flagQuestionCheckbox').disabled = isSubmitted;
  
  // Question text
  document.getElementById('questionText').textContent = q.q;
  
  // Toggle answer views
  const mcContainer = document.getElementById('mcOptionsContainer');
  const writeInContainer = document.getElementById('writeInContainer');
  
  if (isMc) {
    mcContainer.classList.remove('hidden');
    writeInContainer.classList.add('hidden');
    renderMcOptions(q, mcContainer, isSubmitted);
  } else {
    mcContainer.classList.add('hidden');
    writeInContainer.classList.remove('hidden');
    renderWriteIn(q, writeInContainer, isSubmitted);
  }
  
  // Nav buttons states
  document.getElementById('prevQuestionBtn').disabled = currentQuestionIndex === 0;
  
  const nextBtn = document.getElementById('nextQuestionBtn');
  if (currentQuestionIndex === examState.questions.length - 1) {
    nextBtn.textContent = 'Finish & Submit';
    nextBtn.style.background = 'var(--gradient-warm)';
  } else {
    nextBtn.textContent = 'Next →';
    nextBtn.style.background = 'var(--gradient-primary)';
  }
}

function renderMcOptions(q, container, isSubmitted) {
  container.innerHTML = '';
  
  q.options.forEach((opt, oIdx) => {
    const btn = document.createElement('button');
    btn.className = 'mc-btn';
    
    // Checked state
    const isSelected = examState.selections[currentQuestionIndex] === oIdx;
    if (isSelected) btn.classList.add('selected');
    
    btn.innerHTML = `
      <span class="mc-letter">${String.fromCharCode(65 + oIdx)}</span>
      <span class="mc-text"></span>
    `;
    // Set textContent safely to prevent HTML injection
    btn.querySelector('.mc-text').textContent = opt;
    
    if (isSubmitted) {
      btn.disabled = true;
      const isCorrect = oIdx === q.correct;
      
      if (isCorrect) {
        btn.classList.add('correct');
      } else if (isSelected) {
        btn.classList.add('wrong');
      }
    } else {
      btn.addEventListener('click', () => {
        examState.selections[currentQuestionIndex] = oIdx;
        // Re-render options to update selected class
        renderMcOptions(q, container, false);
        saveExamState(examState);
        updateProgressBar();
        renderQuestionMap();
      });
    }
    
    container.appendChild(btn);
  });
  
  // Show explanation if submitted
  if (isSubmitted) {
    const explDiv = document.createElement('div');
    explDiv.className = 'quiz-explanation';
    explDiv.style.marginTop = '1.5rem';
    explDiv.innerHTML = `
      <strong>Explanation:</strong> <span id="explSpan"></span>
    `;
    explDiv.querySelector('#explSpan').textContent = q.explanation;
    container.appendChild(explDiv);
  }
}

function renderWriteIn(q, container, isSubmitted) {
  const hintEl = document.getElementById('writeInHint');
  hintEl.textContent = `Hint: ${q.hint}`;
  
  const area = document.getElementById('writeInAnswerArea');
  area.value = examState.writeIns[currentQuestionIndex] || '';
  area.disabled = isSubmitted;
  
  // Show model answer if submitted
  const modelAnsDivId = 'modelAnswerDisplay';
  let modelAnsDiv = document.getElementById(modelAnsDivId);
  if (modelAnsDiv) modelAnsDiv.remove();
  
  if (isSubmitted) {
    modelAnsDiv = document.createElement('div');
    modelAnsDiv.id = modelAnsDivId;
    modelAnsDiv.className = 'quiz-explanation';
    modelAnsDiv.style.marginTop = '1.5rem';
    modelAnsDiv.innerHTML = `
      <strong>Model Answer (Rubric):</strong> <span id="modelSpan"></span>
    `;
    modelAnsDiv.querySelector('#modelSpan').textContent = q.modelAnswer;
    container.appendChild(modelAnsDiv);
  }

  // Show AI feedback if submitted and grades exist
  const feedbackDivId = 'aiFeedbackDisplay';
  let feedbackDiv = document.getElementById(feedbackDivId);
  if (feedbackDiv) feedbackDiv.remove();

  if (isSubmitted && examState.aiGrades && examState.aiGrades[currentQuestionIndex]) {
    const grade = examState.aiGrades[currentQuestionIndex];
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = feedbackDivId;
    feedbackDiv.className = 'ai-grade-feedback';
    feedbackDiv.style.marginTop = '1.5rem';
    
    const scoreStars = "★".repeat(grade.score) + "☆".repeat(5 - grade.score);
    feedbackDiv.innerHTML = `
      <div class="grade-header">
        <span class="grade-title">🤖 AI Grading Feedback</span>
        <span class="grade-score">${scoreStars} (${grade.score}/5)</span>
      </div>
      <div class="grade-body">
        <div style="margin-bottom: 0.5rem;"><strong>Strengths:</strong> <span id="gradeStrengths"></span></div>
        <div style="margin-bottom: 0.5rem;"><strong>Weaknesses/Gaps:</strong> <span id="gradeWeaknesses"></span></div>
        <div><strong>Tutor Feedback:</strong> <span id="gradeFeedback"></span></div>
      </div>
    `;
    feedbackDiv.querySelector('#gradeStrengths').textContent = grade.strengths || 'N/A';
    feedbackDiv.querySelector('#gradeWeaknesses').textContent = grade.weaknesses || 'N/A';
    feedbackDiv.querySelector('#gradeFeedback').textContent = grade.feedback || 'N/A';
    container.appendChild(feedbackDiv);
  }
}

// ── Submission & Scoring ────────────────────────────

function submitExam(force = false) {
  if (!force) {
    const total = examState.questions.length;
    let unanswered = 0;
    
    examState.questions.forEach((q, idx) => {
      if (q.type === 'mc') {
        if (examState.selections[idx] === undefined) unanswered++;
      } else {
        if (!examState.writeIns[idx] || examState.writeIns[idx].trim().length === 0) unanswered++;
      }
    });
    
    let confirmMsg = "Are you sure you want to finish and submit the exam?";
    if (unanswered > 0) {
      confirmMsg = `You have ${unanswered} unanswered question(s). ${confirmMsg}`;
    }
    
    if (!confirm(confirmMsg)) return;
  }
  
  examState.isSubmitted = true;
  examState.submittedAt = new Date().toISOString();
  
  // Score MC questions
  let totalMc = 0;
  let correctMc = 0;
  
  examState.questions.forEach((q, idx) => {
    if (q.type === 'mc') {
      totalMc++;
      if (examState.selections[idx] === q.correct) {
        correctMc++;
      }
    }
  });
  
  const scorePercent = totalMc > 0 ? Math.round((correctMc / totalMc) * 100) : 0;
  examState.mcScore = scorePercent;
  examState.mcRatio = `${correctMc} / ${totalMc}`;
  
  saveExamState(examState);
  
  // Render results
  showResultsModal();
  renderActiveQuestion();
  renderQuestionMap();
}

function showResultsModal() {
  document.getElementById('resultsMcScore').textContent = `${examState.mcScore}%`;
  document.getElementById('resultsMcRatio').textContent = `${examState.mcRatio} correct`;
  
  let totalWriteInCount = 0;
  let completedWriteInCount = 0;
  
  examState.questions.forEach((q, idx) => {
    if (q.type === 'write') {
      totalWriteInCount++;
      if (examState.writeIns[idx] && examState.writeIns[idx].trim().length > 0) {
        completedWriteInCount++;
      }
    }
  });
  
  const label = document.querySelector('#resultsScoreBlock .comparison-panel:nth-child(2) .score-label:last-child');
  const gradeBtn = document.getElementById('gradeExamWriteInsBtn');

  if (examState.aiGrades) {
    let writeInScoreSum = 0;
    let writeInCount = 0;
    Object.keys(examState.aiGrades).forEach(k => {
      writeInScoreSum += examState.aiGrades[k].score;
      writeInCount++;
    });
    const avgWriteInScore = writeInCount > 0 ? (writeInScoreSum / writeInCount).toFixed(1) : "0.0";
    document.getElementById('resultsWriteInCount').textContent = `${avgWriteInScore} / 5`;
    document.getElementById('resultsWriteInCount').style.color = 'var(--accent-indigo)';
    if (label) label.textContent = 'Avg Score (LLM Graded)';
    
    if (gradeBtn) {
      gradeBtn.textContent = '✓ Graded with LLM';
      gradeBtn.disabled = true;
      gradeBtn.style.background = 'var(--bg-hover)';
    }
  } else {
    document.getElementById('resultsWriteInCount').textContent = `${completedWriteInCount} / ${totalWriteInCount}`;
    document.getElementById('resultsWriteInCount').style.color = 'var(--accent-purple)';
    if (label) label.textContent = 'Pending LLM Evaluation';
    
    if (gradeBtn) {
      gradeBtn.textContent = '📋 Grade Write-Ins with LLM (One-Click)';
      gradeBtn.disabled = false;
      gradeBtn.style.background = 'var(--gradient-primary)';
    }
  }
  
  // Time Used calculation
  const limitSecs = examState.examType === 'midterm' ? 60 * 60 : 90 * 60;
  const timeUsedSecs = limitSecs - examState.timeRemaining;
  const formattedTimeUsed = formatDuration(timeUsedSecs);
  const limitMins = limitSecs / 60;
  
  document.getElementById('resultsTimeUsed').textContent = formattedTimeUsed;
  document.getElementById('resultsTimeLimit').textContent = `out of ${limitMins} mins`;
  
  const title = examType === 'midterm' ? 'Midterm Exam Complete' : 'Final Exam Complete';
  const subtitle = examType === 'midterm' ? 'Chapters 1-7 Assessment Completed' : 'Chapters 1-14 Comprehensive Assessment Completed';
  
  document.getElementById('resultsTitle').textContent = title;
  document.getElementById('resultsSubtitle').textContent = subtitle;
  
  document.getElementById('resultsModal').classList.remove('hidden');
}

// ── LLM Grading Prompt Exporter ──────────────────────

function generateLlmGradingPrompt() {
  const title = examType === 'midterm' ? 'Midterm Exam' : 'Final Exam';
  const scope = examType === 'midterm' ? 'Chapters 1 to 7' : 'Chapters 1 to 14';
  
  let prompt = `You are an expert grading a student's responses to the cumulative ${title} (${scope}) of Designing Data-Intensive Applications by Martin Kleppmann.

For each question, evaluate their response against the model answer and provide:
1. A score from 1 to 5 (1 = completely incorrect/irrelevant, 3 = partial understanding with some missing details, 5 = excellent, rigorous, and architecturally complete response).
2. What they got right (praise core concepts mentioned).
3. What they missed or got wrong (identify missing trade-offs, terminology errors, or design flaws).
4. A corrected or ideal explanation that addresses the gaps.

Use the following format for each question:
---
QUESTION [N] (Ch [Num] - [Section]): [Question text]
STUDENT'S RESPONSE: [Student answer]
MODEL ANSWER: [Model answer]
GRADE: [1-5 score]
FEEDBACK: [Analysis and ideal answer]
---

Here are the student's responses:

`;

  let count = 0;
  examState.questions.forEach((q, idx) => {
    if (q.type === 'write') {
      const studentAns = examState.writeIns[idx] || '(No response provided)';
      count++;
      prompt += `---
QUESTION ${count} (Ch. ${q.chapterNum} - ${q.section}):
${q.q}

STUDENT'S RESPONSE:
${studentAns}

MODEL ANSWER:
${q.modelAnswer}
---

`;
    }
  });
  
  prompt += `After grading all questions, provide:
- Overall Write-in Score: [Average score out of 5, expressed as a percentage]
- Top 3 architectural strengths demonstrated by the student.
- Top 3 conceptual blindspots or areas for improvement.
- A recommended study list of chapters or specific sections to re-read.`;

  return prompt;
}

// ── Initialization ──────────────────────────────────

async function init() {
  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  examType = params.get('type') === 'final' ? 'final' : 'midterm';
  
  // Set logo header texts
  document.getElementById('examLogoTitle').textContent = examType === 'midterm' ? 'DDIA · Midterm' : 'DDIA · Final';
  document.getElementById('examLogoSubtitle').textContent = examType === 'midterm' ? 'Cumulative Chapters 1-7' : 'Cumulative Chapters 1-14';
  
  // Load state
  examState = loadExamState();
  
  if (!examState) {
    await assembleExamPool();
  }
  
  // Render layout and show
  document.getElementById('examMain').classList.remove('hidden');
  document.getElementById('loadingOverlay').classList.add('hidden');
  
  updateProgressBar();
  renderQuestionMap();
  renderActiveQuestion();
  
  // Setup timer
  updateTimerDisplay();
  if (!examState.isSubmitted) {
    startTimer();
  } else {
    showResultsModal();
  }
  
  // Setup event listeners
  document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    saveActiveQuestionState();
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderActiveQuestion();
      renderQuestionMap();
    }
  });
  
  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    saveActiveQuestionState();
    if (currentQuestionIndex < examState.questions.length - 1) {
      currentQuestionIndex++;
      renderActiveQuestion();
      renderQuestionMap();
    } else {
      submitExam();
    }
  });
  
  document.getElementById('submitExamBtn').addEventListener('click', () => {
    saveActiveQuestionState();
    submitExam();
  });
  
  document.getElementById('copyLlmPromptBtn').addEventListener('click', () => {
    const promptText = generateLlmGradingPrompt();
    navigator.clipboard.writeText(promptText).then(() => {
      const msg = document.getElementById('promptCopiedMsg');
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 3000);
    }).catch(err => {
      console.error("Failed to copy text", err);
      alert("Could not copy automatically. Please copy the console log.");
      console.log(promptText);
    });
  });

  const gradeExamBtn = document.getElementById('gradeExamWriteInsBtn');
  if (gradeExamBtn) {
    gradeExamBtn.addEventListener('click', async () => {
      const originalText = gradeExamBtn.textContent;
      gradeExamBtn.textContent = 'Grading...';
      gradeExamBtn.disabled = true;
      
      const statusEl = document.getElementById('examGradingStatus');
      statusEl.textContent = 'Preparing to grade write-in questions...';
      statusEl.className = 'save-confirmation'; // show it (remove hidden)
      statusEl.style.color = 'var(--text-secondary)';
      statusEl.style.background = 'var(--bg-elevated)';
      
      try {
        const examQuestionsToGrade = [];
        examState.questions.forEach((q, idx) => {
          if (q.type === 'write') {
            const studentAns = examState.writeIns[idx] || '';
            examQuestionsToGrade.push({
              idx: idx,
              q: q.q,
              modelAnswer: q.modelAnswer,
              studentAnswer: studentAns,
              chapterNum: q.chapterNum,
              section: q.section
            });
          }
        });

        const totalToGrade = examQuestionsToGrade.length;
        if (totalToGrade === 0) {
          throw new Error('No write-in questions to grade.');
        }

        // Set up progress bar UI in results modal dynamically
        let progressContainer = document.getElementById('examGradingProgressContainer');
        if (!progressContainer) {
          progressContainer = document.createElement('div');
          progressContainer.id = 'examGradingProgressContainer';
          progressContainer.className = 'grading-progress-container';
          progressContainer.style.marginTop = '1rem';
          progressContainer.style.width = '100%';
          progressContainer.style.textAlign = 'left';
          progressContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
              <span id="examGradingProgressStatus">Grading write-in responses...</span>
              <span id="examGradingProgressPercent">0%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(99, 102, 241, 0.1); border-radius: 4px; overflow: hidden;">
              <div id="examGradingProgressBarFill" style="width: 0%; height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.3s ease;"></div>
            </div>
          `;
          // Insert after statusEl
          statusEl.parentNode.insertBefore(progressContainer, statusEl.nextSibling);
        }
        progressContainer.classList.remove('hidden');

        const fillEl = document.getElementById('examGradingProgressBarFill');
        const percentEl = document.getElementById('examGradingProgressPercent');

        fillEl.style.width = '0%';
        percentEl.textContent = '0%';

        const grades = {};
        let currentCount = 0;

        for (const item of examQuestionsToGrade) {
          currentCount++;
          statusEl.textContent = `Grading question ${currentCount} of ${totalToGrade}: "${item.q.substring(0, 30)}..."`;
          
          const response = await fetch('/grade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chapterKey: getStorageKey(),
              username: sessionStorage.getItem('ddia_active_user') || 'anonymous',
              isExam: true,
              questions: [item]
            })
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data && data.grades) {
            Object.assign(grades, data.grades);
          }

          const pct = Math.round((currentCount / totalToGrade) * 100);
          fillEl.style.width = `${pct}%`;
          percentEl.textContent = `${pct}%`;
        }

        examState.aiGrades = { ...(examState.aiGrades || {}), ...grades };
        saveExamState(examState);
        
        statusEl.textContent = '✓ Grading completed successfully!';
        statusEl.style.color = 'var(--accent-emerald)';
        statusEl.style.background = 'rgba(16, 185, 129, 0.1)';
        
        setTimeout(() => {
          progressContainer.classList.add('hidden');
        }, 3000);

        showResultsModal();
        renderActiveQuestion();
        
        setTimeout(() => {
          statusEl.classList.add('hidden');
        }, 5000);

      } catch (err) {
        console.error('Error during exam grading:', err);
        statusEl.textContent = '❌ Grading failed: ' + err.message;
        statusEl.style.color = 'var(--accent-rose)';
        statusEl.style.background = 'rgba(244, 63, 94, 0.1)';
        gradeExamBtn.textContent = originalText;
        gradeExamBtn.disabled = false;
      }
    });
  }
  
  document.getElementById('closeResultsModalBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
  });
  
  // Real-time auto-saves
  document.getElementById('flagQuestionCheckbox').addEventListener('change', (e) => {
    if (examState && !examState.isSubmitted) {
      examState.flagged[currentQuestionIndex] = e.target.checked;
      saveExamState(examState);
      renderQuestionMap();
    }
  });
  
  document.getElementById('writeInAnswerArea').addEventListener('input', (e) => {
    if (examState && !examState.isSubmitted) {
      examState.writeIns[currentQuestionIndex] = e.target.value;
      saveExamState(examState);
      updateProgressBar();
      renderQuestionMap();
    }
  });
  
  // Modal buttons
  document.getElementById('reviewExamBtn')?.addEventListener('click', () => {
    document.getElementById('resultsModal').classList.add('hidden');
  });
  
  document.getElementById('retakeExamBtn')?.addEventListener('click', async () => {
    if (confirm("Are you sure you want to discard your current answers and generate a brand-new practice exam pool?")) {
      if (window.saveState) {
        window.saveState({}, getStorageKey());
      }
      await assembleExamPool();
      currentQuestionIndex = 0;
      document.getElementById('resultsModal').classList.add('hidden');
      updateProgressBar();
      renderQuestionMap();
      renderActiveQuestion();
      startTimer();
    }
  });
}

// Start
window.addEventListener('DOMContentLoaded', async () => {
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

