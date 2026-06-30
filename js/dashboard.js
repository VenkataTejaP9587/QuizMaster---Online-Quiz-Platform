/* ============================================================
   QuizMaster — dashboard.js
   Populates the dashboard: stats, subject performance,
   attempt history, and leaderboard.
   Requires: auth.js
   ============================================================ */

function initDashboard() {
  const session = guardPage();
  if (!session) return;

  const user = getUserData(session.username);
  if (!user) { logout(); return; }

  // Nav bar
  const navAvatar   = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');
  if (navAvatar)   navAvatar.textContent   = session.username[0].toUpperCase();
  if (navUsername) navUsername.textContent = session.username;

  // Welcome name
  const welcomeName = document.getElementById('welcome-name');
  if (welcomeName) welcomeName.textContent = session.username;

  const history = Array.isArray(user.history) ? user.history : [];

  // ---- Global stats ----------------------------------------
  const totalQuizzes = history.length;
  const pcts         = history.map(h => Math.round((h.score / h.total) * 100));
  const bestScore    = pcts.length > 0 ? Math.max(...pcts) : null;
  const avgScore     = pcts.length > 0 ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : null;

  _setText('stat-total', totalQuizzes);
  _setText('stat-best',  bestScore  !== null ? bestScore  + '%' : '--');
  _setText('stat-avg',   avgScore   !== null ? avgScore   + '%' : '--');

  // ---- Subject performance ----------------------------------
  renderSubjectPerformance(history);

  // ---- Recent history table --------------------------------
  renderHistory(history);

  // ---- Leaderboard ----------------------------------------
  renderLeaderboard(session.username);

  // ---- Performance Chart -----------------------------------
  if (typeof Chart !== 'undefined') {
    renderChart(history);
  }
}

/* ---- Subject Performance Bars ---- */
function renderSubjectPerformance(history) {
  const container = document.getElementById('subject-performance');
  if (!container) return;

  const subjects = ['Python', 'AI', 'Web Dev', 'DSA', 'DBMS', 'Networks'];
  container.innerHTML = '';

  subjects.forEach(subj => {
    const attempts = history.filter(h => h.subject === subj);
    const best     = attempts.length > 0
      ? Math.max(...attempts.map(a => Math.round((a.score / a.total) * 100)))
      : null;
    const pct  = best !== null ? best : 0;
    const fill = best !== null ? pct  : 0;

    // Pick fill color based on score
    let fillStyle = 'background: var(--gradient-brand);';
    if (best !== null) {
      if (pct >= 80)      fillStyle = 'background: var(--success);';
      else if (pct >= 60) fillStyle = 'background: var(--warning);';
      else                fillStyle = 'background: var(--error);';
    }

    const div = document.createElement('div');
    div.className = 'subject-perf-item';
    div.innerHTML = `
      <span class="subject-perf-name">${subj}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${fill}%; ${fillStyle}"></div>
      </div>
      <span class="subject-perf-score">${best !== null ? best + '%' : '—'}</span>
    `;
    container.appendChild(div);
  });
}

/* ---- Attempt History Table ---- */
function renderHistory(history) {
  const tbody      = document.getElementById('history-tbody');
  const emptyState = document.getElementById('history-empty');
  if (!tbody) return;

  if (!history.length) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = history.slice(0, 10).map(h => {
    const pct       = Math.round((h.score / h.total) * 100);
    const dateStr   = new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const scoreBadge = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red';
    const lvlBadge   = h.level === 'Easy' ? 'badge-green' : h.level === 'Medium' ? 'badge-yellow' : 'badge-red';

    return `
      <tr>
        <td style="font-weight:600; color: var(--text-primary)">${h.subject}</td>
        <td><span class="badge ${lvlBadge}">${h.level}</span></td>
        <td><strong>${h.score}/${h.total}</strong></td>
        <td><span class="badge ${scoreBadge}">${pct}%</span></td>
        <td>${_formatTime(h.timeTaken)}</td>
        <td>${dateStr}</td>
      </tr>
    `;
  }).join('');
}

/* ---- Leaderboard ---- */
function renderLeaderboard(currentUsername) {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  const allUsers = getAllUsers();

  const ranked = allUsers
    .filter(u => u.history && u.history.length > 0)
    .map(u => {
      const pcts = u.history.map(h => Math.round((h.score / h.total) * 100));
      return {
        username: u.username,
        best:     Math.max(...pcts),
        attempts: u.history.length
      };
    })
    .sort((a, b) => b.best - a.best || b.attempts - a.attempts)
    .slice(0, 8);

  if (!ranked.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <p class="empty-state-text">No scores yet. Be the first!</p>
      </div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const isYouFn = u => u.username.toLowerCase() === currentUsername.toLowerCase();

  container.innerHTML = ranked.map((u, i) => {
    const isYou = isYouFn(u);
    return `
      <div class="leaderboard-item ${isYou ? 'leaderboard-you' : ''}">
        <span class="lb-rank">${medals[i] || '#' + (i + 1)}</span>
        <div class="avatar" style="width:30px;height:30px;font-size:12px;min-width:30px">${u.username[0].toUpperCase()}</div>
        <span class="lb-name">
          ${u.username}
          ${isYou ? '<span class="badge badge-purple" style="font-size:10px;padding:2px 8px;margin-left:4px">You</span>' : ''}
        </span>
        <span class="lb-score">${u.best}%</span>
      </div>
    `;
  }).join('');
}

/* ---- Helpers ---- */
function _setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _formatTime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2,'0')}s`;
}

/* ---- Charts ---- */
function renderChart(history) {
  const ctx = document.getElementById('performance-chart');
  if (!ctx || history.length === 0) return;

  // Get last 10 attempts chronologically (history is newest first, so we reverse a slice)
  const recent = history.slice(0, 10).reverse();
  const labels = recent.map(h => new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const dataPoints = recent.map(h => Math.round((h.score / h.total) * 100));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Accuracy (%)',
        data: dataPoints,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(255, 255, 255, 0.07)' },
          ticks: { color: '#94a3b8', font: { size: 12 } },
          border: { color: 'transparent' }
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.07)' },
          ticks: { color: '#94a3b8', font: { size: 12 } },
          border: { color: 'transparent' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f1f5f9', font: { size: 13 } } },
        tooltip: {
          backgroundColor: 'rgba(15, 15, 30, 0.9)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(124, 58, 237, 0.4)',
          borderWidth: 1,
          padding: 12
        }
      }
    },
    plugins: [{
      id: 'transparentBackground',
      beforeDraw(chart) {
        // Clear any default white fill so the dark card background shows through
        chart.ctx.clearRect(0, 0, chart.width, chart.height);
      }
    }]
  });
}

/* ---- Data Management ---- */
function exportData() {
  const users = localStorage.getItem('qm_users');
  if (!users) { alert("No data found."); return; }
  
  const blob = new Blob([users], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `quizmaster_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        localStorage.setItem('qm_users', JSON.stringify(data));
        alert("Data imported successfully! The dashboard will reload.");
        location.reload();
      } else {
        alert("Invalid backup file format.");
      }
    } catch (err) {
      alert("Error parsing backup file.");
    }
  };
  reader.readAsText(file);
}
