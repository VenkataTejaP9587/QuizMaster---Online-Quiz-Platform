/* ============================================================
   QuizMaster — quiz.js
   Quiz engine: timer, question rendering, navigation, scoring
   Requires: auth.js, questions.js
   ============================================================ */

const TIME_LIMITS = { Easy: 600, Medium: 480, Hard: 360 };

let _state = {
  subject:       '',
  level:         '',
  questions:     [],
  answers:       [],   // null = unanswered, string = selected option
  currentIndex:  0,
  timeLeft:      0,
  timerInterval: null,
  startTime:     null,
  tabViolations: 0
};

/* ============================================================
   Initialise
   ============================================================ */

function initQuiz() {
  const session = guardPage();
  if (!session) return;

  const subject = localStorage.getItem('quizSubject');
  const level   = localStorage.getItem('quizLevel');

  if (!subject || !level) { window.location.href = 'subjects.html'; return; }

  const raw = getQuestions(subject, level);
  if (!raw.length) { window.location.href = 'subjects.html'; return; }

  _state.subject      = subject;
  _state.level        = level;
  _state.questions    = shuffle(raw).slice(0, 10);
  _state.answers      = new Array(_state.questions.length).fill(null);
  _state.currentIndex = 0;
  _state.timeLeft     = TIME_LIMITS[level] || 600;
  _state.startTime    = Date.now();

  // Header badges
  document.getElementById('quiz-subject').textContent = subject;
  document.getElementById('quiz-level').textContent   = level;

  renderDots();
  renderQuestion(0);
  startTimer();

  // Anti-cheating visibilitychange listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/* ============================================================
   Question dots navigation
   ============================================================ */

function renderDots() {
  const container = document.getElementById('question-dots');
  container.innerHTML = '';
  _state.questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className   = 'q-dot';
    btn.id          = `dot-${i}`;
    btn.textContent = i + 1;
    btn.title       = `Jump to Q${i + 1}`;
    btn.onclick     = () => goToQuestion(i);
    container.appendChild(btn);
  });
  _updateDots();
}

function _updateDots() {
  _state.questions.forEach((_, i) => {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) return;
    dot.className = 'q-dot';
    if (i === _state.currentIndex)       dot.classList.add('current');
    else if (_state.answers[i] !== null) dot.classList.add('answered');
  });
}

/* ============================================================
   Render a single question
   ============================================================ */

function renderQuestion(index) {
  const q        = _state.questions[index];
  const selected = _state.answers[index];
  const labels   = ['A', 'B', 'C', 'D'];
  const total    = _state.questions.length;

  document.getElementById('question-number').textContent =
    `Question ${index + 1} of ${total}`;
  document.getElementById('question-text').textContent = q.q;
  document.getElementById('progress-fill').style.width =
    `${((index + 1) / total) * 100}%`;

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  // Shuffle options on first render per question; keep order stable for re-renders
  // We store the shuffled order in the question object so it stays consistent
  if (!q._shuffledOptions) {
    q._shuffledOptions = shuffle(q.options);
  }

  q._shuffledOptions.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className   = 'option-btn' + (selected === opt ? ' selected' : '');
    btn.setAttribute('data-value', opt);
    const safeOpt = opt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    btn.innerHTML   = `<span class="option-label">${labels[i]}</span><span>${safeOpt}</span>`;
    btn.onclick     = () => _selectOption(opt, container);
    container.appendChild(btn);
  });

  // Prev / Next button states
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  if (prevBtn) prevBtn.disabled = (index === 0);
  if (nextBtn) {
    const isLast = (index === total - 1);
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = isLast; // disable Next on last question — use Submit Quiz button instead
    nextBtn.style.opacity = isLast ? '0.4' : '1';
  }

  _updateDots();
}

/* ============================================================
   Option selection
   ============================================================ */

function _selectOption(value, container) {
  _state.answers[_state.currentIndex] = value;
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-value') === value);
  });
  _updateDots();
}

/* ============================================================
   Navigation
   ============================================================ */

function goToQuestion(index) {
  if (index < 0 || index >= _state.questions.length) return;
  _state.currentIndex = index;
  renderQuestion(index);
}

function nextQuestion() {
  if (_state.currentIndex === _state.questions.length - 1) {
    confirmSubmit();
  } else {
    goToQuestion(_state.currentIndex + 1);
  }
}

function prevQuestion() {
  goToQuestion(_state.currentIndex - 1);
}

/* ============================================================
   Submit
   ============================================================ */

function confirmSubmit() {
  const answered   = _state.answers.filter(a => a !== null).length;
  const total      = _state.questions.length;
  const unanswered = total - answered;

  const msg = unanswered > 0
    ? `You've answered ${answered} of ${total} questions. ${unanswered} question(s) will be marked as skipped. Submit now?`
    : `All ${total} questions answered. Ready to see your results?`;

  // Use custom in-page modal (window.confirm can be blocked by browsers)
  if (typeof openSubmitModal === 'function') {
    openSubmitModal(msg);
  } else {
    // fallback
    if (window.confirm(msg)) submitQuiz();
  }
}

function submitQuiz() {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  clearInterval(_state.timerInterval);

  const session = getSession();
  if (!session) return;

  const timeTaken = Math.floor((Date.now() - _state.startTime) / 1000);

  let score = 0;
  const review = _state.questions.map((q, i) => {
    const userAnswer = _state.answers[i];
    const correct    = (userAnswer === q.answer);
    if (correct) score++;
    return {
      q:           q.q,
      options:     q._shuffledOptions || q.options,
      answer:      q.answer,
      userAnswer,
      correct,
      explanation: q.explanation
    };
  });

  const attempt = {
    id:        Date.now(),
    subject:   _state.subject,
    level:     _state.level,
    score,
    total:     _state.questions.length,
    timeTaken,
    date:      new Date().toISOString(),
    review
  };

  saveAttempt(session.username, attempt);
  localStorage.setItem('lastAttempt', JSON.stringify(attempt));

  window.location.href = 'results.html';
}

/* ============================================================
   Timer
   ============================================================ */

function startTimer() {
  _updateTimerDisplay();
  _state.timerInterval = setInterval(() => {
    _state.timeLeft--;
    _updateTimerDisplay();
    if (_state.timeLeft <= 0) {
      clearInterval(_state.timerInterval);
      alert("⏱ Time's up! Your quiz will now be submitted automatically.");
      submitQuiz();
    }
  }, 1000);
}

function _updateTimerDisplay() {
  const mins    = Math.floor(_state.timeLeft / 60);
  const secs    = _state.timeLeft % 60;
  const display = document.getElementById('timer-display');
  const text    = document.getElementById('timer-text');
  if (!display || !text) return;

  text.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  display.className = 'timer-display';
  if      (_state.timeLeft <= 60)  display.classList.add('critical');
  else if (_state.timeLeft <= 120) display.classList.add('warning');
}

/* ============================================================
   Anti-Cheating Visibility Listener
   ============================================================ */

function handleVisibilityChange() {
  if (document.hidden) {
    _state.tabViolations++;
    if (_state.tabViolations >= 2) {
      alert("🚨 Cheat Detection: You have switched tabs/windows twice. Your quiz will be submitted automatically with current answers.");
      submitQuiz();
    } else {
      alert("⚠️ Cheat Warning: Switching tabs or leaving the page is not allowed during the quiz. Next violation will auto-submit your quiz.");
    }
  }
}

