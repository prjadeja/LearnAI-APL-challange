<<<<<<< HEAD
# LearnAI-APL-challange
Google Gemini Vibe Coding challange
=======
# 🧠 LearnAI — Intelligent Learning Assistant

A mobile-first, adaptive learning app inspired by Duolingo × ChatGPT.  
**Zero API keys required** — uses a fully self-contained mock AI curriculum engine.

---

## 📁 Project Structure

```
APL-2/
├── client/                    # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx            # Root component (screen router)
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Global styles + Tailwind
│   │   ├── api.js             # API client (Vite proxy → Express)
│   │   └── components/
│   │       ├── Onboarding.jsx # 3-step topic/level/time flow
│   │       ├── LessonView.jsx # Lesson + adaptive Q&A
│   │       ├── Dashboard.jsx  # Progress, stats, next lesson
│   │       └── ui.jsx         # Shared UI primitives
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                    # Node.js + Express backend
    ├── index.js               # Main server + all API routes
    ├── data/
    │   └── curriculum.js      # Mock AI curriculum generator
    ├── tests/
    │   └── api.test.js        # API test suite (no framework)
    └── package.json
```

---

## 🚀 Setup & Run (< 5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))

### Step 1 — Install dependencies

```bash
# Terminal 1: Server
cd server
npm install

# Terminal 2: Client
cd client
npm install
```

### Step 2 — Start the backend

```bash
# In the /server directory
npm run dev
```

You should see:
```
🧠 Learning Assistant API running on http://localhost:3001
📚 Endpoints: POST /start-learning | GET /next-lesson | POST /submit-answer | GET /progress
```

### Step 3 — Start the frontend

```bash
# In the /client directory
npm run dev
```

Visit: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/start-learning` | Start a new learning session |
| `GET`  | `/next-lesson` | Get the next adapted lesson |
| `POST` | `/submit-answer` | Submit an answer, get feedback |
| `GET`  | `/progress` | Get full progress dashboard data |
| `GET`  | `/explain-differently` | Get alternative explanation |
| `GET`  | `/confused` | Get simplified explanation + encouragement |
| `GET`  | `/health` | Server health check |

### Example: Start a session

```bash
curl -X POST http://localhost:3001/start-learning \
  -H "Content-Type: application/json" \
  -d '{"topic": "JavaScript", "level": "beginner", "dailyMinutes": 10}'
```

---

## 🧪 Run Tests

```bash
# Make sure server is running first (npm run dev in /server)
cd server
npm test
```

Expected output: **All 20+ tests pass** covering happy paths + edge cases + error handling.

---

## 🎯 Sample User Flow

1. **Onboarding** → Type "Python" → Select "Beginner" → "10 min/day"
2. **Lesson 1** loads: "🐍 Introduction & Fundamentals"
   - Read the explanation
   - Click "🔄 Explain differently" to see an analogy
   - Answer the question → **Correct** = +10 XP, advance
3. **Lesson 2** (harder if doing well, simpler if struggling)
   - Wrong answer → "😕 I'm confused" → simplified mode activates
4. **Dashboard** (tap nav) → See progress ring, XP, streak
5. **Complete all 8 lessons** → Celebration screen 🏆

---

## 🧠 Adaptive Logic

| Situation | Response |
|-----------|----------|
| 2+ correct in a row | Difficulty increases, bonus XP unlocked |
| 2+ wrong in a row | Explanation simplifies automatically |
| "I'm confused" clicked | Simplified mode + encouragement |
| "Explain differently" | Alternative analogy/perspective |

---

## ✨ Features

- 🎯 3-step personalized onboarding
- 📚 8 adaptive lessons per topic (auto-generated)
- ❓ Multiple-choice questions with instant feedback
- ⚡ XP system with animated rewards
- 🔥 Day streak tracking
- 📊 Dashboard with progress ring
- 🔄 "Explain differently" button
- 😕 "I'm confused" simplified mode
- 🌙 Dark glassmorphism UI
- 📱 Mobile-first responsive design
- 🚀 No API keys, no database, no config

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Backend | Node.js + Express |
| State | React useState (no Redux) |
| Data | In-memory JSON |
| AI | Mock curriculum engine (no API) |
>>>>>>> b4674f3 (initial commit)
