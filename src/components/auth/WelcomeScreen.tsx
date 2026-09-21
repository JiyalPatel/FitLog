// src/components/auth/WelcomeScreen.tsx
import React, { useState } from 'react';
import { 
  Dumbbell, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Loader2, 
  Sparkles, 
  Scale, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataRepository } from '../../services/storage/dataRepository';
import { isFirebaseConfigured } from '../../lib/firebase';
import { ONBOARDING_SPLITS } from '../../services/data/onboardingPresets';

export interface OnboardingData {
  accountMode: 'guest' | 'google';
  displayName: string;
  weightUnit: 'kg' | 'lbs';
  currentWeight?: number;
  goalType?: 'lose' | 'gain' | 'maintain';
  targetWeight?: number;
  splitId: string;
  targetDaysPerWeek: number;
  restTimerSeconds: number;
}

interface WelcomeScreenProps {
  onCompleteOnboarding: (data: OnboardingData) => Promise<void> | void;
  onSkipToDefaults: (isGuest: boolean) => Promise<void> | void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCompleteOnboarding,
  onSkipToDefaults,
}) => {
  // Wizard Step: 0 = Account Selection, 1 = Profile/Units, 2 = Weight & Goal, 3 = Split, 4 = Rest Timer, 5 = Summary
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Form State
  const [accountMode, setAccountMode] = useState<'guest' | 'google'>('guest');
  const [displayName, setDisplayName] = useState<string>('Athlete');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Weight & Goal State
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [goalType, setGoalType] = useState<'lose' | 'gain' | 'maintain'>('maintain');
  const [targetWeight, setTargetWeight] = useState<string>('');

  // Routine State
  const [selectedSplitId, setSelectedSplitId] = useState<string>('ppl');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number>(5);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(90);

  const handleGoogleSignIn = async () => {
    setStatusMessage(null);

    if (!isFirebaseConfigured) {
      setStatusMessage({
        text: 'Firebase credentials not detected. Continuing in offline mode.',
        isError: false,
      });
      setAccountMode('guest');
      setDisplayName('Athlete');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const user = await dataRepository.signInWithGoogle();
      if (user) {
        setAccountMode('google');
        setDisplayName(user.displayName || 'Athlete');
        setStep(1);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setStatusMessage(null);
      } else {
        setStatusMessage({
          text: err.message || 'Failed to sign in with Google. Continuing as Guest.',
          isError: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    const data: OnboardingData = {
      accountMode,
      displayName: displayName.trim() || 'Athlete',
      weightUnit,
      currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
      goalType,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      splitId: selectedSplitId,
      targetDaysPerWeek,
      restTimerSeconds,
    };
    onCompleteOnboarding(data);
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between py-5 space-y-6">
        
        {/* Persistent Top Navigation Bar */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-white text-black font-mono font-black text-sm flex items-center justify-center shadow-glow-sm">
              F
            </div>
            <span className="font-mono font-black text-sm tracking-wider text-white">FITLOG</span>
          </div>

          <div className="flex items-center space-x-3">
            {step > 0 && (
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Step {step} of 5
              </span>
            )}

            {/* Skip Button */}
            <button
              onClick={() => onSkipToDefaults(accountMode === 'google')}
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900/60 hover:bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800"
              title="Skip setup and start immediately with proven defaults"
            >
              <span>Skip</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Step Progress Dots */}
        {step > 0 && (
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-white' : 'bg-zinc-900'
                }`}
              />
            ))}
          </div>
        )}

        {/* Main Step Content */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: Welcome & Account Selection */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-black font-mono font-black text-3xl shadow-glow-md mx-auto mb-2">
                    F
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white font-mono m-0">
                    FITLOG
                  </h1>
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Minimalist Workout Journal
                  </p>
                </div>

                {/* Features Value Pillars */}
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Dumbbell className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-white">Smart Workout Memory</span>
                      <p className="text-zinc-400 mt-0.5 leading-relaxed">
                        Sets remember your exact weights from last time so you never waste time adjusting.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-white">Flexible Rest Controls</span>
                      <p className="text-zinc-400 mt-0.5 leading-relaxed">
                        Automatic rest timer between sets, or self-paced free intervals without timer popups.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Scale className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-white">Weight Trajectory & Calendar Weeks</span>
                      <p className="text-zinc-400 mt-0.5 leading-relaxed">
                        Track body weight and weekly consistency mapped cleanly to Monday-start weeks.
                      </p>
                    </div>
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono border ${
                      statusMessage.isError
                        ? 'bg-zinc-950 border-red-900/50 text-red-400'
                        : 'bg-zinc-950 border-zinc-800 text-white'
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}

                {/* Account Action Buttons */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white text-black font-bold font-mono text-xs tracking-wider rounded-2xl shadow-glow-sm hover:bg-zinc-100 transition-colors flex items-center justify-center space-x-3 uppercase disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>CONTINUE WITH GOOGLE</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setAccountMode('guest');
                      setDisplayName('Athlete');
                      setStep(1);
                    }}
                    className="w-full py-3.5 px-4 bg-zinc-950 border border-zinc-800 text-zinc-300 font-semibold font-mono text-xs tracking-wider rounded-2xl hover:text-white hover:border-zinc-700 transition-colors flex items-center justify-center space-x-2 uppercase"
                  >
                    <span>CONTINUE AS GUEST</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Profile & Units */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Step 1 · Athlete Profile
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                    What should we call you?
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Personalize your dashboard and choose your preferred unit.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">Your Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  {/* Weight Unit Selection */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-mono uppercase text-zinc-400">Weight Unit</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['kg', 'lbs'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setWeightUnit(unit)}
                          className={`p-4 rounded-xl border text-center font-mono transition-all ${
                            weightUnit === unit
                              ? 'bg-white text-black font-bold border-white shadow-glow-sm'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-lg font-bold uppercase">{unit}</div>
                          <div className="text-[11px] opacity-70">
                            {unit === 'kg' ? 'Kilograms' : 'Pounds'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={() => setStep(0)}
                    className="p-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Body Weight & Goal */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Step 2 · Body Metrics (Optional)
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                    Body weight & goal
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Set a baseline to unlock visual progress charts.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Current Weight Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-zinc-400">
                      Current Body Weight ({weightUnit})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        placeholder={weightUnit === 'kg' ? '75.0' : '165.0'}
                        className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-white transition-colors pr-12"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-mono text-zinc-500 uppercase">
                        {weightUnit}
                      </span>
                    </div>
                  </div>

                  {/* Goal Type */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-mono uppercase text-zinc-400">Primary Goal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'lose', label: 'Cut / Fat Loss', icon: TrendingDown },
                        { id: 'gain', label: 'Bulk / Muscle', icon: TrendingUp },
                        { id: 'maintain', label: 'Maintain', icon: Activity },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = goalType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGoalType(item.id as any)}
                            className={`p-3 rounded-xl border text-center font-mono transition-all flex flex-col items-center justify-center space-y-1.5 ${
                              isSelected
                                ? 'bg-white text-black font-bold border-white shadow-glow-sm'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] uppercase font-bold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Weight */}
                  {goalType !== 'maintain' && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-mono uppercase text-zinc-400">
                        Target Goal Weight ({weightUnit})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={targetWeight}
                          onChange={(e) => setTargetWeight(e.target.value)}
                          placeholder={weightUnit === 'kg' ? '80.0' : '175.0'}
                          className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-white transition-colors pr-12"
                        />
                        <span className="absolute right-4 top-3.5 text-xs font-mono text-zinc-500 uppercase">
                          {weightUnit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="p-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Workout Routine Split */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Step 3 · Training Routine
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                    Choose your workout split
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Workouts roll forward smoothly if life gets busy.
                  </p>
                </div>

                {/* Split Cards */}
                <div className="space-y-2.5">
                  {ONBOARDING_SPLITS.map((split) => {
                    const isSelected = selectedSplitId === split.id;
                    return (
                      <div
                        key={split.id}
                        onClick={() => {
                          setSelectedSplitId(split.id);
                          setTargetDaysPerWeek(split.recommendedDaysPerWeek);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-900/90 border-white shadow-glow-sm'
                            : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white font-mono">{split.name}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-white border-white' : 'border-zinc-700'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 font-mono mt-1">
                          {split.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {split.previewDays.map((d, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-zinc-850 border border-zinc-750 text-[10px] font-mono text-zinc-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Days per week target */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase text-zinc-400">
                      Target Workouts Per Week
                    </label>
                    <span className="text-xs font-mono font-bold text-white">
                      {targetDaysPerWeek} days / week
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setTargetDaysPerWeek(days)}
                        className={`py-2 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                          targetDaysPerWeek === days
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-3 pt-3">
                  <button
                    onClick={() => setStep(2)}
                    className="p-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Rest Between Exercises & Sets */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Step 4 · Rest Between Exercises
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                    Rest between sets & exercises
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Do you want an automated rest timer between sets, or prefer self-paced free intervals?
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      seconds: 0,
                      label: 'No Rest Timer (Self-Paced)',
                      desc: 'No automated timer popups. Rest freely at your own rhythm.',
                      badge: 'Off',
                    },
                    {
                      seconds: 60,
                      label: '60 Seconds Rest',
                      desc: 'Quick rest interval for high-intensity circuits and conditioning.',
                      badge: 'Quick',
                    },
                    {
                      seconds: 90,
                      label: '90 Seconds Rest (Standard)',
                      desc: 'Optimal baseline for muscle hypertrophy and hypertrophy recovery.',
                      badge: 'Popular',
                    },
                    {
                      seconds: 120,
                      label: '120 Seconds Rest',
                      desc: 'Great for heavy compound movements like Squats and Bench Press.',
                      badge: 'Strength',
                    },
                    {
                      seconds: 180,
                      label: '180 Seconds Rest',
                      desc: 'Full neuromuscular recovery for heavy powerlifting sets.',
                      badge: 'Power',
                    },
                  ].map((option) => {
                    const isSelected = restTimerSeconds === option.seconds;
                    return (
                      <div
                        key={option.seconds}
                        onClick={() => setRestTimerSeconds(option.seconds)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-zinc-900/90 border-white shadow-glow-sm'
                            : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-white font-mono">
                              {option.label}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800">
                              {option.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {option.desc}
                          </p>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ml-3 ${
                            isSelected ? 'bg-white border-white' : 'border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-3 pt-3">
                  <button
                    onClick={() => setStep(3)}
                    className="p-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm"
                  >
                    <span>Review Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Ready to Train / Review */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-white font-mono text-2xl mx-auto border border-white/20">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white font-mono">
                    All Set, {displayName}!
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    Your journal is customized and ready for your first workout.
                  </p>
                </div>

                {/* Summary Configuration Card */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                    <span className="text-zinc-500">ACCOUNT</span>
                    <span className="text-white font-bold uppercase">
                      {accountMode === 'google' ? 'Google Account' : 'Guest (Offline)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                    <span className="text-zinc-500">WEIGHT UNIT</span>
                    <span className="text-white font-bold uppercase">{weightUnit}</span>
                  </div>

                  {currentWeight && (
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                      <span className="text-zinc-500">BODY WEIGHT</span>
                      <span className="text-white font-bold">
                        {currentWeight} {weightUnit} {targetWeight ? `→ Goal: ${targetWeight} ${weightUnit}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                    <span className="text-zinc-500">SPLIT</span>
                    <span className="text-white font-bold">
                      {ONBOARDING_SPLITS.find((s) => s.id === selectedSplitId)?.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                    <span className="text-zinc-500">WEEKLY TARGET</span>
                    <span className="text-white font-bold">{targetDaysPerWeek} workouts / week</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">REST BETWEEN SETS</span>
                    <span className="text-white font-bold">
                      {restTimerSeconds === 0 ? 'Off (Self-Paced)' : `${restTimerSeconds} Seconds`}
                    </span>
                  </div>
                </div>

                {/* Final CTA Button */}
                <div className="space-y-2 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinish}
                    className="w-full py-4 px-4 bg-white text-black font-black font-mono text-xs tracking-wider rounded-2xl shadow-glow-md hover:bg-zinc-100 transition-all flex items-center justify-center space-x-2 uppercase"
                  >
                    <span>CRUSH YOUR FIRST WORKOUT</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <button
                    onClick={() => setStep(4)}
                    className="w-full py-2 text-center text-xs font-mono text-zinc-500 hover:text-zinc-300"
                  >
                    Edit preferences
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info note */}
        <div className="text-center text-[10px] font-mono text-zinc-600">
          All settings can be changed anytime from the Settings & Routine tabs.
        </div>
      </div>
    </div>
  );
};
