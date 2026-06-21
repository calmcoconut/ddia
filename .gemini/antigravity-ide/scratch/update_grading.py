import os

target_dir = "/Users/alejandrodiaz/Documents/projects/ddia/learning-app"

new_grade_write_ins = """async function gradeWriteIns() {
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

  statusEl.textContent = `Preparing to grade 1 of ${totalToGrade} questions...`;
  fillEl.style.width = '0%';
  percentEl.textContent = '0%';

  const grades = {};
  let currentCount = 0;

  for (const idxStr of Object.keys(answered)) {
    currentCount++;
    const idx = parseInt(idxStr);
    statusEl.textContent = `Grading question ${currentCount} of ${totalToGrade}: "${QUIZ_QUESTIONS[idx].q.substring(0, 30)}..."`;
    
    const response = await fetch('/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chapterKey: STATE_KEY,
        writeIns: { [idxStr]: answered[idxStr] },
        username: getCurrentUsername()
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
    fillEl.style.width = `${pct}%`;
    percentEl.textContent = `${pct}%`;
  }

  statusEl.textContent = `All questions graded successfully!`;
  
  const currentState = loadState();
  currentState.aiGrades = { ...(currentState.aiGrades || {}), ...grades };
  saveState(currentState);
  renderAiGrades(currentState.aiGrades);

  setTimeout(() => {
    progressContainer.classList.add('hidden');
  }, 3000);

  return { grades: currentState.aiGrades };
}"""

new_setup_llm_grading = """function setupLLMGrading() {
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
}"""

# 1. Update all app.js files
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file == "app.js":
            file_path = os.path.join(root, file)
            print(f"Updating: {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Find and replace gradeWriteIns
            # We can locate the function by matching from "async function gradeWriteIns()" to the end of the return statement.
            # However, a robust way is to find the bounds using indices or split.
            start_str = "async function gradeWriteIns()"
            end_str = "return data;\\n}"
            
            if start_str in content:
                # Find start
                start_idx = content.find(start_str)
                # Find end of function (which ends with return data; \n })
                # To be absolutely sure, let's find the closing brace matching the function signature.
                # We can trace braces or find the return statement.
                # All files have:
                #   renderAiGrades(data.grades);
                #   return data;
                # }
                end_marker = "return data;\\n}"
                if end_marker not in content:
                    end_marker = "return data;\\r\\n}"
                
                end_idx = content.find(end_marker, start_idx)
                if end_idx != -1:
                    end_idx += len(end_marker)
                    old_func = content[start_idx:end_idx]
                    content = content.replace(old_func, new_grade_write_ins)
                    print("  Successfully replaced gradeWriteIns")
                else:
                    # Let's try matching via braces count
                    brace_count = 0
                    idx = start_idx
                    while idx < len(content):
                        if content[idx] == '{':
                            brace_count += 1
                        elif content[idx] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                old_func = content[start_idx:idx+1]
                                content = content.replace(old_func, new_grade_write_ins)
                                print("  Successfully replaced gradeWriteIns (braces match)")
                                break
                        idx += 1
            
            # Find and replace setupLLMGrading
            start_setup = "function setupLLMGrading()"
            if start_setup in content:
                start_idx = content.find(start_setup)
                brace_count = 0
                idx = start_idx
                while idx < len(content):
                    if content[idx] == '{':
                        brace_count += 1
                    elif content[idx] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            old_func = content[start_idx:idx+1]
                            content = content.replace(old_func, new_setup_llm_grading)
                            print("  Successfully replaced setupLLMGrading")
                            break
                    idx += 1
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

# 2. Update exams/exam.js
exam_js_path = "/Users/alejandrodiaz/Documents/projects/ddia/learning-app/exams/exam.js"
print(f"Updating: {exam_js_path}")
with open(exam_js_path, "r", encoding="utf-8") as f:
    exam_content = f.read()

old_exam_grading_block = """  const gradeExamBtn = document.getElementById('gradeExamWriteInsBtn');
  if (gradeExamBtn) {
    gradeExamBtn.addEventListener('click', async () => {
      const originalText = gradeExamBtn.textContent;
      gradeExamBtn.textContent = 'Grading...';
      gradeExamBtn.disabled = true;
      
      const statusEl = document.getElementById('examGradingStatus');
      statusEl.textContent = 'Contacting Gemini API for grading...';
      statusEl.className = 'save-confirmation'; // show it (remove hidden)
      
      try {
        const examQuestionsToGrade = [];
        examState.questions.forEach((q, idx) => {
          if (q.type === 'write') {
            const studentAns = examState.writeIns[idx] || '';
            examQuestionsToGrade.push({
              idx: idx.toString(),
              q: q.q,
              modelAnswer: q.modelAnswer,
              studentAnswer: studentAns,
              chapterNum: q.chapterNum,
              section: q.section
            });
          }
        });

        if (examQuestionsToGrade.length === 0) {
          throw new Error('No write-in questions to grade.');
        }

        const response = await fetch('/grade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chapterKey: getStorageKey(),
            username: sessionStorage.getItem('ddia_active_user') || 'anonymous',
            isExam: true,
            questions: examQuestionsToGrade
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        examState.aiGrades = data.grades;
        saveExamState(examState);
        
        statusEl.textContent = '✓ Grading completed successfully!';
        statusEl.style.color = 'var(--accent-emerald)';
        statusEl.style.background = 'rgba(16, 185, 129, 0.1)';
        
        // Refresh modal display and active question to reflect grading
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
  }"""

new_exam_grading_block = """  const gradeExamBtn = document.getElementById('gradeExamWriteInsBtn');
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
  }"""

# Normalise line endings in both strings
exam_content_norm = exam_content.replace("\\r\\n", "\\n")
old_exam_grading_block_norm = old_exam_grading_block.replace("\\r\\n", "\\n")

if old_exam_grading_block_norm in exam_content_norm:
    exam_content_norm = exam_content_norm.replace(old_exam_grading_block_norm, new_exam_grading_block)
    print("  Successfully replaced exam grading block")
    with open(exam_js_path, "w", encoding="utf-8") as f:
        f.write(exam_content_norm)
else:
    # Try finding subset or matching without normalization
    if old_exam_grading_block in exam_content:
        exam_content = exam_content.replace(old_exam_grading_block, new_exam_grading_block)
        print("  Successfully replaced exam grading block (direct match)")
        with open(exam_js_path, "w", encoding="utf-8") as f:
            f.write(exam_content)
    else:
        print("  Warning: Could not find exact exam grading block to replace in exam.js")
