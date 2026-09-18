# FocusPledge — Self-Scheduling Focus & Time Management App

FocusPledge is a full-stack MERN (MongoDB, Express, React, Node.js) application designed to help students avoid phone distraction after getting home by committing to a self-made daily schedule, enforcing it with interactive focus guards, rewarding consistency with an exact gamification engine, and issuing a downloadable, verified **"Time Management Consistency Certificate" (PDF)**.

---

## 🌟 Core Flow & Features

1. **Evening Check-In ("I'm Home")**:
   - Tap "I'm Home" upon arrival to initiate today's focus pledge and advance your daily consistency streak.
   - Shows active streak flame, streak multiplier, and productivity tier.

2. **Schedule Builder**:
   - Add/edit/delete time slots (e.g. Study 5–7 PM, Break 7–7:30 PM, Drawing 7:30–8:30 PM, Sleep prep 10 PM).
   - Built-in smart duration calculator and preset routines (*Balanced Student Evening*, *Exam Sprint*, *Creative Hustle*).

3. **Active Focus Session & Distraction Guard**:
   - Circular countdown progress ring with live timer.
   - Ambient sound generator (brown/white noise synthesizer via Web Audio API).
   - Rotating focus quotes and audio feedback.
   - **Distraction Guard**: Intercepts attempts to open distracting apps (Instagram, TikTok, YouTube, Mobile Games, etc.) with a high-friction overlay warning.
   - If user breaks focus: **-5 credits penalty**.
   - If user completes slot: **+10 base credits × Streak Multiplier**.

4. **Gamification Engine (Exact Formula Rules)**:
   - **Base Credit**: `+10 credits` per completed slot.
   - **Full-Day Completion Bonus**: `+20 credits` when all scheduled slots for the day are completed.
   - **Streak Multiplier**:
     - Day 1–2: `1.0x`
     - Day 3–6: `1.2x`
     - Day 7–29: `1.5x`
     - Day 30+: `2.0x`
   - **Distraction Penalty**: `-5 credits`.
   - **Productivity Tiers**:
     - 🥉 **Bronze**: 0 – 500 credits
     - 🥈 **Silver**: 501 – 2,000 credits
     - 🥇 **Gold**: 2,001+ credits
   - **Badges Catalog**: First Pledge, Ignition (3d), Focus Warrior (7d), Habit Master (21d), Zen Master (30d), Silver Achiever, Gold Legend, Flawless Day, Shield of Willpower.

5. **Dashboard & Analytics**:
   - 7-Day interactive productivity & credit flow graph.
   - Real-time credit audit ledger with transaction history.
   - Badges trophy showcase.

6. **Time Management Consistency Certificate (PDF)**:
   - **Unlock Condition**: Silver level (500+ credits) **OR** 21-day streak.
   - Authentic gold-foil credential with recipient name, verified streak, total credits, consistency rating (98.6%), and unique serial number (`FP-2026-XXXXXX`).
   - One-click high-definition PDF export and shareable credential link.

7. **Settings & Simulation Controls**:
   - Customizable distraction blacklist.
   - Sound and notification preferences.
   - Quick developer/demo simulator to test milestone transitions.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Start Backend Server
```bash
cd server
npm install
npm start
```
*Note: The backend automatically connects to local MongoDB or seamlessly spawns an embedded In-Memory MongoDB database if no local MongoDB instance is running.*

### 2. Start Frontend App
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Canvas Confetti, jsPDF, html2canvas, Web Audio API Sound Synthesizer, Glassmorphism CSS Design System.
- **Backend**: Node.js, Express.js, Mongoose, MongoDB Memory Server fallback.
- **Architecture**: RESTful API, Service-Layer Gamification Engine.
