# NOIR FIT — Minimalist Mobile-First Fitness Tracker

A modern, mobile-first fitness tracking web application built with a **Noir / Black & White Minimalist Luxury aesthetic**, fluid micro-animations, a sequential rolling missed-workout queue, previous workout memory, live PR tracking, workout scoring (0–100), progressive overload suggestions, and dual-mode operation (instant offline Guest mode + Supabase Cloud account mode with 1-click migration).

---

## ⚡ Key Features

- **Sequential Rolling Workout Queue**: Workouts are treated as an unbroken sequential cycle (e.g. Push → Pull → Legs) instead of rigid weekdays. Missed sessions automatically roll forward to the next training day without penalizing streaks.
- **Previous Workout Memory**: Automatically remembers and displays your previous weights and reps directly above the set rows for fast 1-tap logging.
- **Live Personal Record (PR) Engine**: Real-time 1RM estimation (Epley formula) and weight detection with celebratory badges when a new PR is broken.
- **Floating Rest Timer**: Auto-starts upon set completion with an animated circular progress ring, `+30s` quick extensions, pause/resume, and Web Audio synthesizers.
- **Session Score (0–100)**: Evaluates completion rate, volume overload, progression vs previous sessions, and PR bonuses.
- **Progressive Overload Suggestions**: Rule-based intelligence analyzing consecutive sessions to recommend weight and rep progressions.
- **Visual Analytics**: Interactive Recharts progression curves for Weight, 1RM, and Volume across `1W`, `1M`, `3M`, and `All` timeframes, plus muscle group set distribution and PR Trophy Wall.
- **Dual-Mode (Guest + Supabase)**: Autonomous zero-setup offline usage via local storage, paired with full Supabase Auth, PostgreSQL schema, and a 1-click **Guest-to-Cloud Data Migration** tool.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (Custom Noir monochrome palette, glassmorphism, hairline borders)
- **Icons**: Lucide React
- **Animations**: Framer Motion & canvas-confetti
- **Charts**: Recharts
- **Audio**: Web Audio API Synthesizer
- **Database & Auth**: Supabase (PostgreSQL with Row-Level Security)
- **Local Storage**: Storage repository abstraction layer with automatic reactive updates

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase Configuration (Optional)

The app works fully offline in **Guest Mode** right out of the box. To connect Supabase for cloud sync:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your Supabase project URL and anon key:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run the SQL migration located at `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.
4. When you sign up or log in from the app, use the **1-Click Migration** prompt to transfer all your local guest workouts and PRs into your cloud account.

---

## 📄 License
MIT License
