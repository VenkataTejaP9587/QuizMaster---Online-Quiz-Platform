# 🎯 QuizMaster — Online Quiz Platform

A fully client-side, feature-rich online quiz platform built with vanilla HTML, CSS, and JavaScript. No backend required — everything runs in your browser using `localStorage`.

---

## 🚀 Live Preview

Run locally with any static file server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open **http://localhost:8000** in your browser.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔒 **User Auth** | Register & login system stored in `localStorage` |
| 🧠 **180 Questions** | 6 subjects × 3 difficulty levels × 10 questions each |
| ⏱️ **Live Timer** | Countdown timer (10m Easy / 8m Medium / 6m Hard) with auto-submit |
| 🔀 **Randomized** | Questions and options shuffled every session |
| 🛡️ **Anti-Cheating** | Tab-switch detection — warning on 1st, auto-submit on 2nd violation |
| 📊 **Performance Chart** | Chart.js line graph of your last 10 quiz scores |
| 🏆 **Leaderboard** | Live global leaderboard ranking all registered users |
| 📝 **Detailed Review** | Full answer review with explanations for every question |
| 🎓 **PDF Certificate** | Download a certificate of completion for scores ≥ 80% (jsPDF) |
| 💾 **Data Backup** | Export/import quiz history as JSON |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

---

## 📁 Project Structure

```
Online_Quiz/
├── index.html          # Login page (split-screen design)
├── signup.html         # Registration page
├── dashboard.html      # Main dashboard (stats, chart, leaderboard)
├── subjects.html       # Subject selection page
├── levels.html         # Difficulty level selection
├── quiz.html           # Active quiz interface
├── results.html        # Results, score ring, and question review
├── css/
│   └── style.css       # Unified dark glassmorphism design system
└── js/
    ├── auth.js         # User registration, login, session management
    ├── questions.js    # 180-question bank with answers & explanations
    ├── quiz.js         # Quiz engine (timer, navigation, scoring, anti-cheat)
    └── dashboard.js    # Dashboard rendering (stats, charts, leaderboard)
```

---

## 🎓 Subjects Covered

| Subject | Topics |
|---|---|
| 🐍 **Python** | Syntax, data types, OOP, modules, decorators |
| 🤖 **Artificial Intelligence** | ML, neural nets, search algorithms, NLP |
| 🌐 **Web Development** | HTML, CSS, JavaScript, DOM, APIs |
| 🔢 **Data Structures & Algorithms** | Arrays, trees, graphs, sorting, complexity |
| 🗄️ **DBMS** | SQL, normalization, transactions, indexing |
| 🔗 **Computer Networks** | OSI model, TCP/IP, DNS, routing protocols |

---

## 🔧 Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Structure & semantics |
| CSS3 | Dark glassmorphism theme, animations |
| Vanilla JavaScript (ES6+) | All logic — no frameworks |
| [Chart.js](https://www.chartjs.org/) | Performance trend line chart (CDN) |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF certificate generation (CDN) |
| `localStorage` | All data persistence (users, sessions, history) |

---

## 📸 Pages

### 🔐 Login / Register
Split-screen layout with animated hero panel showcasing features on the left and a clean auth form on the right.

### 📊 Dashboard
- **Stats**: Total attempts, best score, average score
- **Subject Mastery**: Progress bars for each subject
- **Recent Attempts**: Full history table
- **Performance Trend**: Interactive Chart.js line graph
- **Leaderboard**: Top 8 users ranked by best score
- **Data Management**: Export/import JSON backup

### 🧪 Quiz Interface
- Question number dots for quick navigation
- Real-time countdown timer with color warnings
- Always-visible **Submit Quiz** button
- Custom in-page submit confirmation modal
- Anti-cheat tab detection overlay

### 📋 Results Page
- Animated circular score ring
- Correct / Incorrect / Skipped breakdown
- **🎓 Download Certificate** button (if score ≥ 80%)
- Full per-question review with explanations

---

## 🛡️ Anti-Cheating System

During a quiz, the browser's `visibilitychange` event is monitored:

- **1st tab switch** → Warning alert shown
- **2nd tab switch** → Quiz is automatically submitted with answers so far

---

## 💾 Data Storage Schema

All data is stored in `localStorage` under the key `qm_users` as a JSON array:

```json
[
  {
    "username": "TestUser",
    "email": "test@email.com",
    "password": "hashed_or_plain",
    "history": [
      {
        "id": 1234567890,
        "subject": "Python",
        "level": "Easy",
        "score": 8,
        "total": 10,
        "timeTaken": 142,
        "date": "2025-06-30T07:00:00.000Z",
        "review": [...]
      }
    ]
  }
]
```

---

## 🎓 Certificate Generation

Users who score **80% or above** can download a personalized PDF certificate. The certificate includes:

- User's name
- Subject & difficulty level
- Score achieved
- Date of completion
- QuizMaster branding

---

## 📦 Running Without Python

Any static file server works:

```bash
# VS Code Live Server extension — just open index.html and click "Go Live"

# Node.js http-server
npx http-server .

# PHP
php -S localhost:8000
```

---

## 👥 Authors

Built as a Mini Project for **B.Tech II Year II Semester**.

---

## 📄 License

This project is for educational purposes. Free to use and modify.
