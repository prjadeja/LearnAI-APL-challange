import { useState, useEffect } from 'react';

/** Animated XP pop-up */
export function XpFlash({ amount }) {
  if (!amount) return null;
  return (
    <div className="fixed top-20 right-6 z-50 pointer-events-none" aria-live="polite">
      <div className="xp-flash text-2xl font-bold text-yellow-400 drop-shadow-lg">
        +{amount} XP ⚡
      </div>
    </div>
  );
}

/** Day-streak indicator — hidden when streak is 0 */
export function StreakBadge({ streak }) {
  if (!streak) return null;
  return (
    <div className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30">
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </div>
  );
}

/** Level badge with color coding */
export function LevelBadge({ level }) {
  const styles = {
    beginner:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    advanced:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  const icons = { beginner: '🌱', intermediate: '⚡', advanced: '🚀' };
  const style = styles[level] || styles.beginner;
  const icon  = icons[level]  || '🌱';
  return (
    <div className={`badge border ${style}`}>
      {icon} {level}
    </div>
  );
}

/** Animated SVG circular progress ring.
 *  Uses a unique gradientId so multiple rings on the same page don't clash. */
export function ProgressRing({ percent, size = 80, stroke = 6, gradientId = 'ring-grad-default' }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#6575f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-white">{percent}%</span>
    </div>
  );
}

/** Linear progress bar */
export function ProgressBar({ percent, className = '' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={`progress-bar ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** Centred loading spinner with optional message */
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

/** Auto-dismissing toast — clears itself after 3 s */
export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: 'border-green-500/40 bg-green-500/10 text-green-300',
    error:   'border-red-500/40 bg-red-500/10 text-red-300',
    info:    'border-brand-500/40 bg-brand-500/10 text-brand-300',
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border glass text-sm font-medium animate-slide-up ${styles[type] || styles.info}`}
    >
      {message}
    </div>
  );
}
