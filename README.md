# FitLog — Minimalist Mobile-First Fitness Tracker

A modern, mobile-first fitness tracking web application built with a **Noir / Black & White Minimalist Luxury aesthetic**, fluid micro-animations, a sequential rolling missed-workout queue, previous workout memory, live PR tracking, workout scoring (0–100), progressive overload suggestions, and dual-mode operation (instant offline Guest mode + Cloud account backup with 1-click migration).

---

## ⚡ Key Features

- **Sequential Rolling Workout Queue**: Workouts are treated as an unbroken sequential cycle (e.g. Push → Pull → Legs) instead of rigid weekdays. Missed sessions automatically roll forward to the next training day without penalizing streaks.
- **Previous Workout Memory**: Automatically remembers and displays your previous weights and reps directly above the set rows for fast 1-tap logging.
- **Live Personal Record (PR) Engine**: Real-time 1RM estimation (Epley formula) and weight detection with celebratory badges when a new PR is broken.
- **Floating Rest Timer**: Auto-starts upon set completion with an animated circular progress ring, `+30s` quick extensions, pause/resume, and Web Audio synthesizers.
- **Session Score (0–100)**: Evaluates completion rate, volume overload, progression vs previous sessions, and PR bonuses.
- **Progressive Overload Suggestions**: Rule-based intelligence analyzing consecutive sessions to recommend weight and rep progressions.
- **Visual Analytics**: Interactive Recharts progression curves for Weight, 1RM, and Volume across `1W`, `1M`, `3M`, and `All` timeframes, plus muscle group set distribution and PR Trophy Wall.
- **Dual-Mode (Guest + Firebase)**: Autonomous zero-setup offline usage via local storage, paired with 1-tap Google Sign-In, Cloud Firestore data isolation, and automatic **Guest-to-Cloud Data Migration**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (Custom Noir monochrome palette, glassmorphism, hairline borders)
- **Icons**: Lucide React
- **Animations**: Framer Motion & canvas-confetti
- **Charts**: Recharts
- **Audio**: Web Audio API Synthesizer
- **Database & Auth**: Firebase (Firebase Auth with Google Sign-In, Cloud Firestore, Firebase Analytics)
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

## 🔥 Firebase Configuration (Optional for Cloud Sync)

The app works fully offline in **Guest Mode** right out of the box. To connect Firebase for cloud backup and cross-device sync:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate your Firebase web configuration values:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
3. Enable **Google Sign-In** under **Authentication** in your Firebase Console.
4. Deploy the security rules defined in `firestore.rules` to your Cloud Firestore database.
5. Signing in with Google automatically transfers all your guest workouts, routines, PRs, and body weight logs into your cloud account.

---

## 📄 License
MIT License
