# FocusPledge — Self-Scheduling Focus & Gamification App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7.svg)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black.svg)](https://vercel.com/)

> **FocusPledge** is a full-stack MERN (MongoDB, Express, React, Node.js) web application engineered to help students and professionals conquer post-commute phone distraction. Commit to your evening schedule, enter guarded focus sessions, earn gamified credits with streak multipliers, and unlock an official downloadable **Time Management Consistency Certificate (PDF)**.

---

## 📸 Screenshots & Preview

![FocusPledge App Preview](https://raw.githubusercontent.com/kaladharroyal/Focus-pledge/main/docs/preview.png)

| 🏠 "I'm Home" Check-In | ⏱️ Guarded Focus Session | 🎓 Verifiable Certificate |
| :---: | :---: | :---: |
| Daily streak locks & pledge activation | Live circular timer + Distraction Guard | Downloadable high-res PDF credential |

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Gamification Formula](#-gamification-formula)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Features

- **🏠 "I'm Home" Evening Commitment**: Tap check-in upon arriving home to lock in daily streaks and initiate slot tracking.
- **📅 Timeline Schedule Builder**: Drag-and-drop or configure study, project, and break blocks with automated duration calculators.
- **🛡️ Distraction Guard & Blocker**: Intercepts attempts to open blacklisted apps (Instagram, TikTok, YouTube, Games) with a high-friction friction screen.
- **🔥 Multiplier-Based Gamification**: Base +10 credits per slot, +20 full-day completion bonus, and progressive streak multipliers (up to 2.0x).
- **📊 7-Day Consistency Analytics**: Interactive charts, badge trophies, and real-time transaction audit ledger.
- **🎓 PDF Certificate Generator**: High-resolution, verifiable academic certificate unlocked at Silver Tier (500 pts) or 21-day streak.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Canvas Confetti, jsPDF, html2canvas, Web Audio API Sound Synthesizer, Vanilla CSS Design System.
- **Backend**: Node.js, Express.js, Mongoose ORM, In-Memory MongoDB auto-fallback.
- **Hosting**: Vercel (Frontend), Render (Backend API), MongoDB Atlas (Cloud Database).

---

## 📥 Installation

Follow these steps to set up and run FocusPledge locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (version 9 or higher)
- [Git](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/kaladharroyal/Focus-pledge.git
cd Focus-pledge
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `server/` directory:
```bash
cp .env.example .env
```
Add your connection parameters:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/focuspledge
CLIENT_URL=http://localhost:5173
```

### Step 4: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 🚀 Usage

### Running Locally

1. **Start the Backend API Server**:
   ```bash
   cd server
   npm start
   ```
   The API will start on `http://localhost:5000`.

2. **Start the Frontend Development Server**:
   ```bash
   cd client
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Example Flow:
1. Tap **"I'm Home — Start Pledge"** on the home screen.
2. Navigate to **Schedule** and click **"+ Add Time Slot"** or choose a preset like *Balanced Student*.
3. Click **"Start Focus"** on an active slot to launch the guarded countdown timer.
4. If you attempt to open a distracting app, the **Distraction Guard** overlay triggers with a -5 credit warning.
5. Complete the session to claim your credits and level up to **Silver** to export your certificate!

---

## 🎮 Gamification Formula

| Action | Reward / Rule |
| :--- | :--- |
| **Completed Focus Slot** | `+10 Credits` × Streak Multiplier |
| **Full-Day Completion Bonus** | `+20 Credits` (awarded when all daily slots are done) |
| **Day 1–2 Streak** | `1.0x` Multiplier |
| **Day 3–6 Streak** | `1.2x` Multiplier |
| **Day 7–29 Streak** | `1.5x` Multiplier |
| **Day 30+ Streak** | `2.0x` Double Multiplier |
| **Distraction Penalty** | `-5 Credits` |
| **Bronze Tier** | 0 – 500 Credits |
| **Silver Tier** | 501 – 2,000 Credits |
| **Gold Tier** | 2,001+ Credits |
| **Certificate Unlock** | Silver Tier (500+ pts) **OR** 21-Day Streak |

---

## 🔌 API Reference

### User & Check-In
- `GET /api/user` — Fetch current user profile, credits, and streak.
- `POST /api/user/checkin` — Check in for the day and increment streak.
- `PUT /api/user/profile` — Update user settings and blocked app blacklist.

### Schedules
- `GET /api/schedules/today` — Retrieve today's scheduled time slots.
- `POST /api/schedules/slots` — Add a new focus slot.
- `PUT /api/schedules/slots/:id` — Update slot details or status.
- `DELETE /api/schedules/slots/:id` — Remove a slot.

### Focus & Penalties
- `POST /api/focus/start` — Activate focus mode on a slot.
- `POST /api/focus/complete` — Complete slot, calculate credits with multipliers.
- `POST /api/focus/penalty` — Log a distraction attempt and deduct 5 credits.

### Certificate
- `GET /api/certificate/status` — Check certificate eligibility criteria.
- `POST /api/certificate/issue` — Generate official verifiable certificate record.
- `GET /api/certificate/verify/:id` — Public credential verification.

---

## ☁️ Deployment

### Live Production Endpoints
- **Frontend App (Vercel)**: [https://client-eosin-eta.vercel.app/](https://client-eosin-eta.vercel.app/)
- **Backend API (Render)**: [https://focuspledge-api.onrender.com](https://focuspledge-api.onrender.com)

### Render Blueprint Deployment
Deploy both services with one click using the included [`render.yaml`](render.yaml) file:
1. Link your repository in the [Render Dashboard](https://dashboard.render.com).
2. Create a new **Blueprint** project.
3. Supply your `MONGODB_URI` environment variable.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

*FocusPledge © 2026. Built with precision for student focus and time management excellence.*
