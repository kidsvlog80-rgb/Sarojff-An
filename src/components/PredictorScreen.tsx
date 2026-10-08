import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  Cpu, 
  ShieldCheck, 
  History, 
  Search, 
  TrendingUp, 
  Volume2, 
  VolumeX,
  Zap,
  RefreshCw,
  Sparkles,
  Calendar,
  LogOut,
  Copy,
  Check,
  KeyRound,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Server,
  CheckCircle2,
  Flame,
  Eye,
  EyeOff
} from 'lucide-react';
import { GameTab, PredictionRecord } from '../types';
import { 
  playBeep as playUnifiedBeep, 
  playClickSound,
  playCountdownTickSound as playUnifiedCountdownTick, 
  playRadiantSuccessSound,
  playTimerSelectTransition,
  playScanTickSound,
  playPredictionSuccessSound
} from '../lib/audio';
import LoaderOverlay from './LoaderOverlay';
import MuscleDogSticker from './MuscleDogSticker';
import DuckUmbrellaSticker from './DuckUmbrellaSticker';
import DuckMuscleSticker from './DuckMuscleSticker';
import RecommendationSticker from './RecommendationSticker';
import WinCelebrationSticker from './WinCelebrationSticker';
import { SreeWinLogo, SreeWinSideIcon } from './SreeWinLogo';
import { getPublicSettings, subscribePublicSettings } from '../lib/settings';

interface PredictorScreenProps {
  onBack: () => void;
  onServerStateChange?: (started: boolean, gameId?: string | null) => void;
}

// Helper to determine accurate color mapping based on explicit game rules provided by user:
// 0: red-violet, 1: green, 2: red, 3: green, 4: red
// 5: green-violet, 6: red, 7: green, 8: red, 9: green
function getNumberColorType(num: number): 'red' | 'green' | 'red-violet' | 'green-violet' {
  if (num === 0) return 'red-violet';
  if (num === 5) return 'green-violet';
  if (num === 2 || num === 4 || num === 6 || num === 8) return 'red';
  return 'green'; // 1, 3, 7, 9
}

// Generate realistic, strictly consecutive 17-digit game history based on current UTC day & interval (shifted 1 round behind)
function generateInitialConsecutiveHistory(mode: '1min' | '30sec' = '1min'): PredictionRecord[] {
  const offsetMs = mode === '30sec' ? 30 * 1000 : 60 * 1000;
  const now = new Date(Date.now() - offsetMs);
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();

  const totalIntervals = mode === '30sec'
    ? (hours * 120) + (minutes * 2) + (seconds >= 30 ? 2 : 1)
    : (hours * 60) + minutes + 1;
  const gameCode = mode === '30sec' ? '10005' : '10001';
  const padStr = String(totalIntervals).padStart(4, '0');
  const activePeriodBig = BigInt(`${dateStr}${gameCode}${padStr}`);

  const history: PredictionRecord[] = [];
  const intervalSeconds = mode === '30sec' ? 30 : 60;
  const baseTime = Date.now() - offsetMs;

  let prevNum = -1;
  for (let idx = 0; idx < 20; idx++) {
    const recPeriod = String(activePeriodBig - BigInt(idx + 1));
    let num = (parseInt(recPeriod.slice(-1)) * 7 + 3) % 10;
    // Anti-duplicate protection: strictly prevent adjacent duplicate numbers
    if (num === prevNum) {
      const pDigit = parseInt(recPeriod.slice(-1)) || 1;
      num = (num + 1 + (pDigit % 8)) % 10;
    }
    prevNum = num;

    const colorType = getNumberColorType(num);
    const colorVal = colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : (colorType === 'red' ? 'red' : 'green');
    const recordTime = new Date(baseTime - (idx + 1) * intervalSeconds * 1000);
    const timestamp = recordTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    history.push({
      id: `rec-${recPeriod}`,
      period: recPeriod,
      gameType: 'wingo1',
      result: num >= 5 ? 'BIG' : 'SMALL',
      color: colorVal,
      accuracy: 95 + (parseInt(recPeriod.slice(-2)) || 0) % 5,
      timestamp: timestamp,
      status: 'WIN',
      predictedNumber: num
    });
  }

  return history;
}

const INITIAL_HISTORY: PredictionRecord[] = generateInitialConsecutiveHistory('1min');

export const NUMBER_IMAGES: string[] = [
  "/images/balls/ball_0.png", // 0
  "/images/balls/ball_1.png", // 1
  "/images/balls/ball_2.png", // 2
  "/images/balls/ball_3.png", // 3
  "/images/balls/ball_4.png", // 4
  "/images/balls/ball_5.png", // 5
  "/images/balls/ball_6.png", // 6
  "/images/balls/ball_7.png", // 7
  "/images/balls/ball_8.png", // 8
  "/images/balls/ball_9.png"  // 9
];

export default function PredictorScreen({ onBack, onServerStateChange }: PredictorScreenProps) {
  const [settings, setSettings] = useState(getPublicSettings);
  useEffect(() => {
    return subscribePublicSettings((newSettings) => {
      setSettings(newSettings);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<GameTab>('wingo1');
  const [selectedGame, setSelectedGame] = useState<'yaarwin' | 'eightytwolottery' | 'jalwagame' | 'tiranga' | 'fiftyonegame' | 'jaiclub' | 'goagame' | 'ninetyoneclub' | 'bdgwin' | 'sreewin' | 'sixclub' | 'veergame' | 'dmfirst' | null>(null);

  const isRedTheme = selectedGame === 'eightytwolottery';
  const isJalwaTheme = selectedGame === 'jalwagame';
  const isTirangaTheme = selectedGame === 'tiranga';
  const isFiftyOneTheme = selectedGame === 'fiftyonegame';
  const isJaiClubTheme = selectedGame === 'jaiclub';
  const isGoaTheme = selectedGame === 'goagame';
  const isNinetyOneTheme = selectedGame === 'ninetyoneclub';
  const isBdgTheme = selectedGame === 'bdgwin';
  const isSreeWinTheme = selectedGame === 'sreewin';
  const isSixClubTheme = selectedGame === 'sixclub';
  const isVeerGameTheme = selectedGame === 'veergame';
  const isDmFirstTheme = selectedGame === 'dmfirst';

  // Dynamic theme classes for prediction dashboard
  const getThemeClasses = () => {
    if (isRedTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(239,68,68,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(239,68,68,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(239,68,68,0.35)]',
        borderGradient: 'from-[#ef4444] via-[#b91c1c] to-[#450a0a]/60',
        bgGradient: 'from-[#450a0a] via-[#1a0505] to-black',
        textGlow: 'text-[#ef4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.65)]',
        textGlowSmall: 'text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.65)]',
        topGlowBar: 'from-[#ef4444] via-[#fca5a5]',
        recordBorder: 'border-red-950/30',
        recordHover: 'hover:bg-red-950/10',
        borderMuted: 'border-red-500/20',
        textSoft: 'text-red-500/60 hover:text-red-400',
        textSolid: 'text-[#ef4444]',
        borderSplitter: 'bg-red-500/15',
        bannerBorder: 'border-red-900/30 hover:border-red-500/50',
        bannerGlowIcon: 'border-red-500/20 bg-red-950/20 text-red-500',
        accentColor: '#ef4444',
      };
    } else if (isJalwaTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(97,218,204,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(97,218,204,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(97,218,204,0.35)]',
        borderGradient: 'from-[#61DACC] via-[#097969] to-[#01262d]/60',
        bgGradient: 'from-[#031d44] via-[#010815] to-[#000207]',
        textGlow: 'text-[#61DACC] drop-shadow-[0_0_10px_rgba(97,218,204,0.65)]',
        textGlowSmall: 'text-[#61DACC] drop-shadow-[0_0_8px_rgba(97,218,204,0.65)]',
        topGlowBar: 'from-[#61DACC] via-[#99f6e4]',
        recordBorder: 'border-teal-950/30',
        recordHover: 'hover:bg-teal-950/10',
        borderMuted: 'border-[#61DACC]/25',
        textSoft: 'text-[#61DACC]/60 hover:text-[#61DACC]',
        textSolid: 'text-[#61DACC]',
        borderSplitter: 'bg-[#61DACC]/15',
        bannerBorder: 'border-[#61DACC]/30 hover:border-[#61DACC]/60',
        bannerGlowIcon: 'border-[#61DACC]/20 bg-teal-950/20 text-[#61DACC]',
        accentColor: '#61DACC',
      };
    } else if (isTirangaTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(100,149,237,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(100,149,237,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(100,149,237,0.35)]',
        borderGradient: 'from-[#6495ED] via-[#3b82f6] to-[#1e3a8a]/60',
        bgGradient: 'from-[#0f1e36] via-[#050b14] to-black',
        textGlow: 'text-[#6495ED] drop-shadow-[0_0_10px_rgba(100,149,237,0.65)]',
        textGlowSmall: 'text-[#6495ED] drop-shadow-[0_0_8px_rgba(100,149,237,0.65)]',
        topGlowBar: 'from-[#6495ED] via-[#93c5fd]',
        recordBorder: 'border-blue-950/30',
        recordHover: 'hover:bg-blue-950/10',
        borderMuted: 'border-[#6495ED]/25',
        textSoft: 'text-[#6495ED]/60 hover:text-[#6495ED]',
        textSolid: 'text-[#6495ED]',
        borderSplitter: 'bg-[#6495ED]/15',
        bannerBorder: 'border-[#6495ED]/30 hover:border-[#6495ED]/60',
        bannerGlowIcon: 'border-[#6495ED]/20 bg-blue-950/20 text-[#6495ED]',
        accentColor: '#6495ED',
      };
    } else if (isFiftyOneTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(245,158,11,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.35)]',
        borderGradient: 'from-[#f59e0b] via-[#d97706] to-[#78350f]/60',
        bgGradient: 'from-[#1e1302] via-[#090500] to-black',
        textGlow: 'text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]',
        textGlowSmall: 'text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.65)]',
        topGlowBar: 'from-[#f59e0b] via-[#fde047]',
        recordBorder: 'border-amber-950/30',
        recordHover: 'hover:bg-amber-950/10',
        borderMuted: 'border-[#f59e0b]/25',
        textSoft: 'text-[#f59e0b]/60 hover:text-[#f59e0b]',
        textSolid: 'text-[#f59e0b]',
        borderSplitter: 'bg-[#f59e0b]/15',
        bannerBorder: 'border-[#f59e0b]/30 hover:border-[#f59e0b]/60',
        bannerGlowIcon: 'border-[#f59e0b]/20 bg-amber-950/20 text-[#f59e0b]',
        accentColor: '#f59e0b',
      };
    } else if (isJaiClubTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(217,70,239,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(217,70,239,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(217,70,239,0.35)]',
        borderGradient: 'from-[#d946ef] via-[#a855f7] to-[#581c87]/60',
        bgGradient: 'from-[#1a0824] via-[#05010b] to-black',
        textGlow: 'text-[#d946ef] drop-shadow-[0_0_10px_rgba(217,70,239,0.65)]',
        textGlowSmall: 'text-[#d946ef] drop-shadow-[0_0_8px_rgba(217,70,239,0.65)]',
        topGlowBar: 'from-[#d946ef] via-[#f472b6]',
        recordBorder: 'border-purple-950/30',
        recordHover: 'hover:bg-purple-950/10',
        borderMuted: 'border-[#d946ef]/25',
        textSoft: 'text-[#d946ef]/60 hover:text-[#d946ef]',
        textSolid: 'text-[#d946ef]',
        borderSplitter: 'bg-[#d946ef]/15',
        bannerBorder: 'border-[#d946ef]/30 hover:border-[#d946ef]/60',
        bannerGlowIcon: 'border-[#d946ef]/20 bg-purple-950/20 text-[#d946ef]',
        accentColor: '#d946ef',
      };
    } else if (isGoaTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(37,99,235,0.3)]',
        dropShadowLarge: 'drop-shadow-[0_4px_20px_rgba(37,99,235,0.5)]',
        borderGradient: 'from-[#3b82f6] via-[#1d4ed8] to-[#0d1bf8]/60',
        bgGradient: 'from-[#07122b] via-[#030814] to-black',
        textGlow: 'text-[#60a5fa] drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]',
        textGlowSmall: 'text-[#93c5fd] drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]',
        topGlowBar: 'from-[#3b82f6] via-[#93c5fd]',
        recordBorder: 'border-blue-900/40',
        recordHover: 'hover:bg-blue-950/20',
        borderMuted: 'border-[#3b82f6]/30',
        textSoft: 'text-[#60a5fa]/70 hover:text-[#93c5fd]',
        textSolid: 'text-[#3b82f6]',
        borderSplitter: 'bg-[#3b82f6]/25',
        bannerBorder: 'border-[#3b82f6]/40 hover:border-[#60a5fa]/70',
        bannerGlowIcon: 'border-[#3b82f6]/30 bg-blue-950/40 text-[#60a5fa]',
        accentColor: '#2563eb',
      };
    } else if (isNinetyOneTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(255,30,39,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(255,30,39,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(255,30,39,0.35)]',
        borderGradient: 'from-[#ff1e27] via-[#dc2626] to-[#450a0a]/60',
        bgGradient: 'from-[#450a0a] via-[#1a0505] to-black',
        textGlow: 'text-[#ff1e27] drop-shadow-[0_0_10px_rgba(255,30,39,0.65)]',
        textGlowSmall: 'text-[#ff1e27] drop-shadow-[0_0_8px_rgba(255,30,39,0.65)]',
        topGlowBar: 'from-[#ff1e27] via-[#fca5a5]',
        recordBorder: 'border-red-950/30',
        recordHover: 'hover:bg-red-950/10',
        borderMuted: 'border-red-500/20',
        textSoft: 'text-red-500/60 hover:text-red-400',
        textSolid: 'text-[#ff1e27]',
        borderSplitter: 'bg-red-500/15',
        bannerBorder: 'border-red-900/30 hover:border-red-500/50',
        bannerGlowIcon: 'border-red-500/20 bg-red-950/20 text-red-500',
        accentColor: '#ff1e27',
      };
    } else if (isBdgTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(240,213,151,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(240,213,151,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(240,213,151,0.35)]',
        borderGradient: 'from-[#F0D597] via-[#d4af37] to-[#451a03]/60',
        bgGradient: 'from-[#2d1a04] via-[#0d0701] to-black',
        textGlow: 'text-[#F0D597] drop-shadow-[0_0_10px_rgba(240,213,151,0.65)]',
        textGlowSmall: 'text-[#F0D597] drop-shadow-[0_0_8px_rgba(240,213,151,0.65)]',
        topGlowBar: 'from-[#F0D597] via-[#fef08a]',
        recordBorder: 'border-amber-950/30',
        recordHover: 'hover:bg-amber-950/10',
        borderMuted: 'border-[#F0D597]/20',
        textSoft: 'text-amber-500/60 hover:text-amber-400',
        textSolid: 'text-[#F0D597]',
        borderSplitter: 'bg-[#F0D597]/15',
        bannerBorder: 'border-amber-900/30 hover:border-amber-500/50',
        bannerGlowIcon: 'border-amber-500/20 bg-amber-950/20 text-amber-500',
        accentColor: '#F0D597',
      };
    } else if (isSreeWinTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(139,92,246,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(139,92,246,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(139,92,246,0.35)]',
        borderGradient: 'from-[#8b5cf6] via-[#6d28d9] to-[#2e1065]/60',
        bgGradient: 'from-[#2e1065] via-[#170535] to-black',
        textGlow: 'text-[#a78bfa] drop-shadow-[0_0_10px_rgba(139,92,246,0.65)]',
        textGlowSmall: 'text-[#a78bfa] drop-shadow-[0_0_8px_rgba(139,92,246,0.65)]',
        topGlowBar: 'from-[#8b5cf6] via-[#c4b5fd]',
        recordBorder: 'border-purple-950/30',
        recordHover: 'hover:bg-purple-950/10',
        borderMuted: 'border-purple-500/25',
        textSoft: 'text-purple-400/60 hover:text-purple-300',
        textSolid: 'text-[#a78bfa]',
        borderSplitter: 'bg-purple-500/15',
        bannerBorder: 'border-purple-900/30 hover:border-purple-500/50',
        bannerGlowIcon: 'border-purple-500/20 bg-purple-950/20 text-purple-400',
        accentColor: '#8b5cf6',
      };
    } else if (isSixClubTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(245,158,11,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.35)]',
        borderGradient: 'from-[#f59e0b] via-[#eab308] to-[#78350f]/60',
        bgGradient: 'from-[#2e1d03] via-[#0f0901] to-black',
        textGlow: 'text-[#facc15] drop-shadow-[0_0_10px_rgba(250,204,21,0.65)]',
        textGlowSmall: 'text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.65)]',
        topGlowBar: 'from-[#f59e0b] via-[#fef08a]',
        recordBorder: 'border-amber-950/30',
        recordHover: 'hover:bg-amber-950/10',
        borderMuted: 'border-amber-500/20',
        textSoft: 'text-amber-400/70 hover:text-amber-300',
        textSolid: 'text-[#f59e0b]',
        borderSplitter: 'bg-amber-500/15',
        bannerBorder: 'border-amber-900/30 hover:border-amber-500/50',
        bannerGlowIcon: 'border-amber-500/20 bg-amber-950/20 text-amber-400',
        accentColor: '#f59e0b',
      };
    } else if (isVeerGameTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(34,197,94,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(34,197,94,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(34,197,94,0.35)]',
        borderGradient: 'from-[#22c55e] via-[#16a34a] to-[#14532d]/60',
        bgGradient: 'from-[#052e16] via-[#02180b] to-black',
        textGlow: 'text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.65)]',
        textGlowSmall: 'text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.65)]',
        topGlowBar: 'from-[#22c55e] via-[#86efac]',
        recordBorder: 'border-emerald-950/30',
        recordHover: 'hover:bg-emerald-950/10',
        borderMuted: 'border-emerald-500/20',
        textSoft: 'text-emerald-400/70 hover:text-emerald-300',
        textSolid: 'text-[#22c55e]',
        borderSplitter: 'bg-emerald-500/15',
        bannerBorder: 'border-emerald-900/30 hover:border-emerald-500/50',
        bannerGlowIcon: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400',
        accentColor: '#22c55e',
      };
    } else if (isDmFirstTheme) {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(245,158,11,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(245,158,11,0.35)]',
        borderGradient: 'from-[#fbbf24] via-[#f59e0b] to-[#78350f]/60',
        bgGradient: 'from-[#451a03] via-[#1c0a02] to-black',
        textGlow: 'text-[#fbbf24] drop-shadow-[0_0_10px_rgba(251,191,36,0.65)]',
        textGlowSmall: 'text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]',
        topGlowBar: 'from-[#fbbf24] via-[#fef08a]',
        recordBorder: 'border-amber-950/30',
        recordHover: 'hover:bg-amber-950/10',
        borderMuted: 'border-amber-500/20',
        textSoft: 'text-amber-400/70 hover:text-amber-300',
        textSolid: 'text-[#fbbf24]',
        borderSplitter: 'bg-amber-500/15',
        bannerBorder: 'border-amber-900/30 hover:border-amber-500/50',
        bannerGlowIcon: 'border-amber-500/20 bg-amber-950/20 text-amber-400',
        accentColor: '#f59e0b',
      };
    } else {
      return {
        dropShadowSmall: 'drop-shadow-[0_4px_12px_rgba(33,241,2,0.15)]',
        dropShadowMedium: 'drop-shadow-[0_4px_15px_rgba(33,241,2,0.18)]',
        dropShadowLarge: 'drop-shadow-[0_4px_15px_rgba(33,241,2,0.35)]',
        borderGradient: 'from-[#21F102] via-[#107801] to-[#075000]/60',
        bgGradient: 'from-[#0a200c] via-[#020d04] to-black',
        textGlow: 'text-[#21F102] drop-shadow-[0_0_10px_rgba(33,241,2,0.65)]',
        textGlowSmall: 'text-[#21F102] drop-shadow-[0_0_8px_rgba(33,241,2,0.65)]',
        topGlowBar: 'from-[#21F102] via-[#86efac]',
        recordBorder: 'border-emerald-900/30',
        recordHover: 'hover:bg-emerald-950/10',
        borderMuted: 'border-emerald-500/20',
        textSoft: 'text-emerald-500/60 hover:text-emerald-400',
        textSolid: 'text-[#22c55e]',
        borderSplitter: 'bg-emerald-500/15',
        bannerBorder: 'border-emerald-900/30 hover:border-[#22c55e]/50',
        bannerGlowIcon: 'border-emerald-500/20 bg-emerald-950/20 text-[#22c55e]',
        accentColor: '#21F102',
      };
    }
  };

  const theme = getThemeClasses();

  // Load and manage key duration state with back-up fallback
  const [keyInfo, setKeyInfo] = useState<{
    keyName: string;
    days: number;
    activatedAt: number;
    expiresAt: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('drago_active_key_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.keyName && typeof parsed.expiresAt === 'number') {
          if (Date.now() < parsed.expiresAt) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage parse failed for key info', e);
    }
    return null;
  });

  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [showKeyConsole, setShowKeyConsole] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);
  const [isKeyCopied, setIsKeyCopied] = useState<boolean>(false);

  // Auto redirect back to access key screen if no key info is present
  useEffect(() => {
    if (!keyInfo) {
      const timeout = setTimeout(() => {
        onBack();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [keyInfo, onBack]);

  // Dedicated Server Active Key state (Distinct key gate required for GET PREDICTION)
  const [isServerKeyActivated, setIsServerKeyActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('drago_server_key_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [serverKeyName, setServerKeyName] = useState<string>(() => {
    try {
      return localStorage.getItem('drago_server_key_name') || '';
    } catch {
      return '';
    }
  });
  const [showServerKeyModal, setShowServerKeyModal] = useState<boolean>(false);
  const [serverKeyInputValue, setServerKeyInputValue] = useState<string>('');
  const [serverKeyInputError, setServerKeyInputError] = useState<string>('');
  const [serverKeySuccessMessage, setServerKeySuccessMessage] = useState<string>('');
  const [isVerifyingServerKey, setIsVerifyingServerKey] = useState<boolean>(false);

  const BUILT_IN_SERVER_KEYS = [
    'SRV-DRAGO-VIP-99',
    'SRV-TURBO-ACTIVE-2026',
    'SRV-ALPHA-99',
    'SRV-VIP-2026'
  ];

  function checkOfflineServerKey(inputKey: string): { valid: boolean; isExpired?: boolean } {
    const clean = inputKey.trim().toUpperCase().replace(/[\s\r\n\t]/g, '');
    if (BUILT_IN_SERVER_KEYS.includes(clean)) {
      return { valid: true };
    }
    try {
      const raw = localStorage.getItem('drago_keys_v1');
      if (raw) {
        const keys = JSON.parse(raw);
        if (Array.isArray(keys)) {
          const found = keys.find((k: any) => k.type === 'server' && k.key.toUpperCase() === clean);
          if (found) {
            if (found.deleted || (found.expires && Date.now() > found.expires)) {
              return { valid: false, isExpired: true };
            }
            return { valid: true };
          }
        }
      }
    } catch (e) {}
    return { valid: false };
  }

  const handleVerifyServerActiveKey = async () => {
    const inputKey = serverKeyInputValue.trim().toUpperCase();
    setServerKeyInputError('');
    setServerKeySuccessMessage('');

    if (!inputKey) {
      playUnifiedBeep(300, 100);
      setServerKeyInputError('Please enter a SERVER ACTIVE KEY!');
      return;
    }

    // Check if user accidentally entered their portal login key
    const loginKey = keyInfo?.keyName || '';
    if (loginKey && inputKey === loginKey) {
      playUnifiedBeep(300, 120);
      setServerKeyInputError('This is your Portal Login Key! Please enter a valid SERVER ACTIVE KEY.');
      return;
    }

    setIsVerifyingServerKey(true);

    try {
      const devId = localStorage.getItem('drago_device_id') || '';
      const response = await fetch('/api/activate-server-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: inputKey,
          mainKey: keyInfo?.keyName || '',
          deviceId: devId
        })
      });

      const data = await response.json();

      if (data && data.success) {
        playRadiantSuccessSound(soundEnabled);
        setIsServerKeyActivated(true);
        setServerKeyName(inputKey);
        localStorage.setItem('drago_server_key_verified', 'true');
        localStorage.setItem('drago_server_key_name', inputKey);
        setServerKeySuccessMessage('SERVER ACTIVE KEY VERIFIED SUCCESSFULLY!');
        
        setTimeout(() => {
          setShowServerKeyModal(false);
          setServerKeySuccessMessage('');
          setServerKeyInputValue('');
        }, 1200);
      } else {
        // Fallback check against drago_keys_v1 in storage
        const offlineCheck = checkOfflineServerKey(inputKey);
        if (offlineCheck.valid) {
          playRadiantSuccessSound(soundEnabled);
          setIsServerKeyActivated(true);
          setServerKeyName(inputKey);
          localStorage.setItem('drago_server_key_verified', 'true');
          localStorage.setItem('drago_server_key_name', inputKey);
          setServerKeySuccessMessage('SERVER ACTIVE KEY VERIFIED SUCCESSFULLY!');
          setTimeout(() => {
            setShowServerKeyModal(false);
            setServerKeySuccessMessage('');
            setServerKeyInputValue('');
          }, 1200);
        } else if (offlineCheck.isExpired) {
          playUnifiedBeep(300, 150);
          setServerKeyInputError('This Server Key has EXPIRED or was deleted from Admin Panel!');
        } else {
          playUnifiedBeep(300, 150);
          setServerKeyInputError(data?.message || 'Invalid Server Active Key! Please check and enter a valid key.');
        }
      }
    } catch {
      // Offline fallback check against drago_keys_v1
      const offlineCheck = checkOfflineServerKey(inputKey);
      if (offlineCheck.valid) {
        playRadiantSuccessSound(soundEnabled);
        setIsServerKeyActivated(true);
        setServerKeyName(inputKey);
        localStorage.setItem('drago_server_key_verified', 'true');
        localStorage.setItem('drago_server_key_name', inputKey);
        setServerKeySuccessMessage('SERVER ACTIVE KEY VERIFIED SUCCESSFULLY!');
        setTimeout(() => {
          setShowServerKeyModal(false);
          setServerKeySuccessMessage('');
          setServerKeyInputValue('');
        }, 1200);
      } else if (offlineCheck.isExpired) {
        playUnifiedBeep(300, 150);
        setServerKeyInputError('This Server Key has EXPIRED or was deleted from Admin Panel!');
      } else {
        playUnifiedBeep(300, 150);
        setServerKeyInputError('Invalid Server Active Key! Please check and enter a valid key.');
      }
    } finally {
      setIsVerifyingServerKey(false);
    }
  };

  // Mask the last 6 characters of any access key for security display as requested by user ("Key hide hai hus ko 6 letar karo")
  const [showFullKey, setShowFullKey] = useState<boolean>(false);

  const maskKeyLastSixCharacters = (rawKey?: string): string => {
    if (!rawKey) return 'DRAGO-******';
    if (showFullKey) return rawKey;
    if (rawKey.length <= 6) return '******';
    return rawKey.slice(0, -6) + '******';
  };

  const handleCopyKey = () => {
    const currentKey = keyInfo?.keyName || '';
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey);
    playUnifiedBeep(600, 80);
    setIsKeyCopied(true);
    setTimeout(() => setIsKeyCopied(false), 2000);
  };

  // Active key ticker interval to calculate real-time decay and expire sessions instantly
  useEffect(() => {
    if (!keyInfo) return;

    const getDeviceId = () => {
      try {
        return localStorage.getItem('drago_device_id') || 'dev-unknown';
      } catch (e) {
        return 'dev-unknown';
      }
    };

    const getSignature = () => {
      try {
        return localStorage.getItem('drago_session_signature') || '';
      } catch (e) {
        return '';
      }
    };

    const checkBackendValidity = async () => {
      try {
        if (!keyInfo?.keyName) return;
        const devId = getDeviceId();
        const sig = getSignature();
        const res = await fetch(`/api/validate-key?key=${encodeURIComponent(keyInfo.keyName)}&deviceId=${encodeURIComponent(devId)}&signature=${encodeURIComponent(sig)}`);
        if (!res.ok) {
          console.warn('[Session] Session verification server status:', res.status);
          return;
        }
        const data = await res.json();
        if (data && data.valid === true) {
          const backendExpiresAt = Number(data.expiresAt);
          const backendDays = Number(data.days ?? keyInfo.days);
          if (backendExpiresAt !== keyInfo.expiresAt || backendDays !== keyInfo.days) {
            console.log('[Session] Key duration updated, updating frontend state:', backendDays, 'days');
            const updated = {
              ...keyInfo,
              expiresAt: backendExpiresAt,
              days: backendDays
            };
            setKeyInfo(updated);
            localStorage.setItem('drago_active_key_info', JSON.stringify(updated));
          }
        } else if (data && data.valid === false) {
          console.warn('[Session] Key validation rejected by server:', data.message);
          setTimeLeftMs(0);
          setShowExpiredModal(true);
          try {
            playUnifiedBeep(240, 300);
          } catch (e) {}
          localStorage.removeItem('drago_active_key_info');
          localStorage.removeItem('drago_server_key_verified');
          localStorage.removeItem('drago_server_key_name');
          localStorage.removeItem('drago_session_signature');
          localStorage.setItem('drago_key_expired_alert', 'true');
        }
      } catch (err) {
        console.warn('[Session] Session validation network notice:', err);
      }
    };

    const tick = () => {
      const diff = keyInfo.expiresAt - Date.now();
      
      if (diff <= 0) {
        setTimeLeftMs(0);
        setShowExpiredModal(true);
        try {
          playUnifiedBeep(240, 300);
        } catch (e) {}
        localStorage.removeItem('drago_active_key_info');
        localStorage.removeItem('drago_server_key_verified');
        localStorage.removeItem('drago_server_key_name');
        localStorage.removeItem('drago_session_signature');
        localStorage.setItem('drago_key_expired_alert', 'true');
      } else {
        setTimeLeftMs(diff);
      }
    };

    tick();
    
    // Validate session once immediately upon mounting PredictorScreen
    checkBackendValidity();

    // Verify session state dynamically every 15 seconds
    const validationIntervalId = setInterval(checkBackendValidity, 15000);
    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(validationIntervalId);
    };
  }, [keyInfo]);

  // Fast-forward simulator to subtract days instantly on the UI so users can verify key-decay
  const simulateDaysPassed = (numDays: number) => {
    if (!keyInfo) return;
    playBeep(450, 100);
    const newExpiresAt = keyInfo.expiresAt - numDays * 24 * 60 * 60 * 1000;
    const updated = {
      ...keyInfo,
      expiresAt: newExpiresAt
    };
    setKeyInfo(updated);
    localStorage.setItem('drago_active_key_info', JSON.stringify(updated));
  };

  // Instant expiration testing tool
  const simulateInstantExpiration = () => {
    if (!keyInfo) return;
    playBeep(320, 200);
    const updated = {
      ...keyInfo,
      expiresAt: Date.now() - 5000 // expired 5 seconds ago
    };
    setKeyInfo(updated);
    localStorage.setItem('drago_active_key_info', JSON.stringify(updated));
  };

  // Human-readable visual time parser
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return 'EXPIRED';
    const totalSecs = Math.floor(ms / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const mins = totalMins % 60;
    const secs = totalSecs % 60;

    if (days > 365) return 'LIFETIME';

    let parts = [];
    if (days > 0) parts.push(`${days}D`);
    parts.push(`${hours}H`);
    parts.push(`${mins}M`);
    parts.push(`${secs}S`);

    return parts.join(' ');
  };

  // Short day badge text formatter
  const getCompactDaysText = (ms: number) => {
    if (ms <= 0) return '0D';
    if (keyInfo && keyInfo.days > 365) return 'LIFETIME';
    const totalSecs = Math.floor(ms / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000));

    if (ms < 24 * 60 * 60 * 1000) {
      if (totalHours > 0) return `${totalHours}H`;
      return `${totalMins}M`;
    }
    return `${days}D`;
  };

  // Human-readable remaining days formatter (e.g. "30 DAYS") - Accurately rounded so full 30 days is preserved on day 1
  const getFormattedDaysText = () => {
    if (!keyInfo) return '30 DAYS';
    if (keyInfo.days > 365) return 'LIFETIME';
    if (timeLeftMs <= 0) return 'EXPIRED';

    const remSecs = Math.max(0, Math.floor(timeLeftMs / 1000));
    const remMins = Math.floor(remSecs / 60);
    const remHours = Math.floor(remMins / 60);
    const remDays = Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000));

    if (remDays <= 0) {
      if (remHours > 0) return `${remHours} HOURS`;
      if (remMins > 0) return `${remMins} MINS`;
      return 'EXPIRED';
    }

    if (timeLeftMs < 24 * 60 * 60 * 1000) {
      if (remHours > 0) return `${remHours} ${remHours === 1 ? 'HOUR' : 'HOURS'}`;
      if (remMins > 0) return `${remMins} ${remMins === 1 ? 'MIN' : 'MINS'}`;
      return '1 DAY';
    }

    return `${remDays} ${remDays === 1 ? 'DAY' : 'DAYS'}`;
  };

  // Style helper system supporting unified themes across Yar Win, 82 Lottery, Jalwa Game, and Tiranga
  const getGameStyles = () => {
    if (selectedGame === 'eightytwolottery') {
      return {
        text: 'text-red-400',
        textLight: 'text-red-200',
        textSoft: 'text-red-300/70',
        textMuted: 'text-red-400/55',
        textIntense: 'text-red-500',
        shadowGlow: 'shadow-[0_0_25px_rgba(239,68,68,0.08)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.45)]',
        glowClass: 'neon-glow-red',
        bgSoft: 'bg-red-950/20',
        bgSoftSubtle: 'bg-red-950/15 border-red-500/15 hover:bg-red-950/30',
        borderSoft: 'border-red-500/10',
        borderMedium: 'border-red-500/20 text-red-500 hover:bg-red-500/10',
        borderIntense: 'border-red-500/40',
        borderThick: 'border-red-500/30',
        badge: 'bg-red-900/40 text-red-300 border-red-400/10',
        accentIcon: 'text-red-450',
        accentIconBg: 'border-red-500/20 bg-red-950/20 text-red-500 hover:bg-red-500/10',
        accentBtn: 'bg-gradient-to-r from-red-500 via-rose-600 to-red-500',
        accentBtnDisabled: 'bg-red-950/20 border border-red-500/20 text-red-500/40 cursor-not-allowed',
        progressBarBorder: 'border-[#450a0a]',
        progressBarFill: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
        scanAlert: 'bg-black/50 border-red-500/30',
        progressIndicator: 'text-red-400',
        progressPing: 'bg-red-500',
        tabActive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-red-500/25 text-red-300 hover:text-white hover:bg-red-500/10',
        telegramBorderGlow: 'border-red-400/30 bg-gradient-to-r from-red-950/30 via-slate-950/40 to-red-950/30 hover:border-red-400/80 hover:bg-red-950/15',
        telegramFlashLight: 'bg-red-500/5',
        telegramSendBtn: 'bg-rose-500/10 border-rose-400/30 text-rose-450 group-hover:scale-110 group-hover:bg-rose-500/20 group-hover:text-red-300',
        borderColor: '#ef4444'
      };
    } else if (selectedGame === 'jalwagame') {
      return {
        text: 'text-[#61DACC]',
        textLight: 'text-teal-200',
        textSoft: 'text-[#61DACC]/70',
        textMuted: 'text-[#61DACC]/55',
        textIntense: 'text-[#61DACC]',
        shadowGlow: 'shadow-[0_0_25px_rgba(97,218,204,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(97,218,204,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(97,218,204,0.45)]',
        glowClass: 'neon-glow-teal',
        bgSoft: 'bg-teal-950/25',
        bgSoftSubtle: 'bg-teal-950/15 border-teal-500/15 hover:bg-[#61DACC]/10',
        borderSoft: 'border-[#61DACC]/10',
        borderMedium: 'border-[#61DACC]/20 text-[#61DACC] hover:bg-[#61DACC]/10',
        borderIntense: 'border-[#61DACC]/40',
        borderThick: 'border-[#61DACC]/30',
        badge: 'bg-[#61DACC]/20 text-[#61DACC] border-[#61DACC]/10',
        accentIcon: 'text-[#61DACC]',
        accentIconBg: 'border-[#61DACC]/20 bg-teal-950/20 text-[#61DACC] hover:bg-[#61DACC]/10',
        accentBtn: 'bg-gradient-to-r from-teal-500 via-[#61DACC] to-teal-500',
        accentBtnDisabled: 'bg-[#61DACC]/10 border border-[#61DACC]/25 text-[#61DACC]/40 cursor-not-allowed',
        progressBarBorder: 'border-teal-950',
        progressBarFill: 'bg-gradient-to-r from-teal-600 via-[#61DACC] to-[#61DACC] shadow-[0_0_12px_rgba(97,218,204,0.6)]',
        scanAlert: 'bg-black/50 border-[#61DACC]/30',
        progressIndicator: 'text-[#61DACC]',
        progressPing: 'bg-[#61DACC]',
        tabActive: 'bg-gradient-to-r from-teal-500 to-[#61DACC] text-white shadow-[0_0_15px_rgba(97,218,204,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#61DACC]/25 text-[#61DACC] hover:text-white hover:bg-[#61DACC]/10',
        telegramBorderGlow: 'border-[#61DACC]/30 bg-gradient-to-r from-teal-950/30 via-slate-950/40 to-teal-950/30 hover:border-[#61DACC]/80 hover:bg-teal-950/15',
        telegramFlashLight: 'bg-[#61DACC]/5',
        telegramSendBtn: 'bg-teal-500/10 border-[#61DACC]/30 text-[#61DACC] group-hover:scale-110 group-hover:bg-teal-500/20 group-hover:text-teal-200',
        borderColor: '#61DACC'
      };
    } else if (selectedGame === 'tiranga') {
      return {
        text: 'text-[#6495ED]',
        textLight: 'text-blue-200',
        textSoft: 'text-[#6495ED]/70',
        textMuted: 'text-[#6495ED]/55',
        textIntense: 'text-[#4169E1]',
        shadowGlow: 'shadow-[0_0_25px_rgba(100,149,237,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(65,105,225,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(100,149,237,0.45)]',
        glowClass: 'neon-glow-blue',
        bgSoft: 'bg-blue-950/25',
        bgSoftSubtle: 'bg-blue-950/15 border-blue-500/15 hover:bg-[#6495ED]/10',
        borderSoft: 'border-[#6495ED]/10',
        borderMedium: 'border-[#6495ED]/20 text-[#6495ED] hover:bg-[#6495ED]/10',
        borderIntense: 'border-[#6495ED]/40',
        borderThick: 'border-[#6495ED]/30',
        badge: 'bg-[#6495ED]/20 text-[#6495ED] border-[#6495ED]/10',
        accentIcon: 'text-[#6495ED]',
        accentIconBg: 'border-[#6495ED]/20 bg-blue-950/20 text-[#6495ED] hover:bg-[#6495ED]/10',
        accentBtn: 'bg-gradient-to-r from-blue-600 via-[#6495ED] to-blue-600',
        accentBtnDisabled: 'bg-[#6495ED]/10 border border-[#6495ED]/25 text-[#6495ED]/40 cursor-not-allowed',
        progressBarBorder: 'border-blue-950',
        progressBarFill: 'bg-gradient-to-r from-blue-700 via-[#6495ED] to-[#6495ED] shadow-[0_0_12px_rgba(100,149,237,0.6)]',
        scanAlert: 'bg-black/50 border-[#6495ED]/30',
        progressIndicator: 'text-[#6495ED]',
        progressPing: 'bg-[#6495ED]',
        tabActive: 'bg-gradient-to-r from-blue-600 to-[#6495ED] text-white shadow-[0_0_15px_rgba(100,149,237,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#6495ED]/25 text-[#6495ED] hover:text-white hover:bg-[#6495ED]/10',
        telegramBorderGlow: 'border-[#6495ED]/30 bg-gradient-to-r from-blue-950/30 via-slate-950/40 to-blue-950/30 hover:border-[#6495ED]/80 hover:bg-blue-950/15',
        telegramFlashLight: 'bg-[#6495ED]/5',
        telegramSendBtn: 'bg-blue-500/10 border-[#6495ED]/30 text-[#6495ED] group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-200',
        borderColor: '#6495ED'
      };
    } else if (selectedGame === 'fiftyonegame') {
      return {
        text: 'text-amber-400',
        textLight: 'text-amber-200',
        textSoft: 'text-amber-400/80',
        textMuted: 'text-yellow-600/60',
        textIntense: 'text-amber-500',
        shadowGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)]',
        glowClass: 'neon-glow-amber',
        bgSoft: 'bg-amber-950/25',
        bgSoftSubtle: 'bg-amber-950/15 border-amber-500/15 hover:bg-amber-500/10',
        borderSoft: 'border-[#f59e0b]/10',
        borderMedium: 'border-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/10',
        borderIntense: 'border-[#f59e0b]/40',
        borderThick: 'border-[#f59e0b]/30',
        badge: 'bg-amber-900/40 text-amber-300 border-[#f59e0b]/10',
        accentIcon: 'text-[#f59e0b]',
        accentIconBg: 'border-[#f59e0b]/20 bg-amber-950/20 text-[#f59e0b] hover:bg-[#f59e0b]/10',
        accentBtn: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
        accentBtnDisabled: 'bg-[#f59e0b]/10 border border-[#f59e0b]/25 text-[#f59e0b]/40 cursor-not-allowed',
        progressBarBorder: 'border-amber-950',
        progressBarFill: 'bg-gradient-to-r from-amber-700 via-[#f59e0b] to-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.6)]',
        scanAlert: 'bg-black/50 border-[#f59e0b]/30',
        progressIndicator: 'text-[#f59e0b]',
        progressPing: 'bg-[#f59e0b]',
        tabActive: 'bg-gradient-to-r from-amber-600 to-[#f59e0b] text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#f59e0b]/25 text-[#f59e0b] hover:text-white hover:bg-[#f59e0b]/10',
        telegramBorderGlow: 'border-[#f59e0b]/30 bg-gradient-to-r from-amber-950/30 via-slate-950/40 to-amber-950/30 hover:border-[#f59e0b]/80 hover:bg-amber-950/15',
        telegramFlashLight: 'bg-[#f59e0b]/5',
        telegramSendBtn: 'bg-amber-500/10 border-[#f59e0b]/30 text-[#f59e0b] group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-200',
        borderColor: '#f59e0b'
      };
    } else if (selectedGame === 'jaiclub') {
      return {
        text: 'text-[#d946ef]',
        textLight: 'text-[#f472b6]',
        textSoft: 'text-[#d946ef]/85',
        textMuted: 'text-[#d946ef]/55',
        textIntense: 'text-[#ec4899]',
        shadowGlow: 'shadow-[0_0_25px_rgba(217,70,239,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(236,72,153,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(217,70,239,0.5)]',
        glowClass: 'neon-glow-jaiclub',
        bgSoft: 'bg-[#581c87]/40',
        bgSoftSubtle: 'bg-[#581c87]/20 border-[#d946ef]/20 hover:bg-[#d946ef]/10',
        borderSoft: 'border-[#d946ef]/15',
        borderMedium: 'border-[#d946ef]/30 text-[#d946ef] hover:bg-[#d946ef]/10',
        borderIntense: 'border-[#ec4899]/50',
        borderThick: 'border-[#d946ef]/40',
        badge: 'bg-[#ec4899]/25 text-[#ec4899] border-[#ec4899]/20',
        accentIcon: 'text-[#d946ef]',
        accentIconBg: 'border-[#d946ef]/25 bg-[#581c87]/35 text-[#d946ef] hover:bg-[#d946ef]/15',
        accentBtn: 'bg-gradient-to-r from-[#581c87] via-[#d946ef] to-[#ec4899]',
        accentBtnDisabled: 'bg-[#d946ef]/10 border border-[#d946ef]/25 text-[#d946ef]/40 cursor-not-allowed',
        progressBarBorder: 'border-[#581c87]',
        progressBarFill: 'bg-gradient-to-r from-[#581c87] via-[#d946ef] to-[#ec4899] shadow-[0_0_12px_rgba(217,70,239,0.6)]',
        scanAlert: 'bg-[#581c87]/70 border-[#d946ef]/35',
        progressIndicator: 'text-[#d946ef]',
        progressPing: 'bg-[#d946ef]',
        tabActive: 'bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white font-semibold shadow-[0_0_15px_rgba(217,70,239,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#d946ef]/25 text-[#d946ef] hover:text-white hover:bg-[#d946ef]/10',
        telegramBorderGlow: 'border-[#d946ef]/30 bg-gradient-to-r from-[#581c87]/40 via-slate-950/40 to-[#581c87]/40 hover:border-[#ec4899]/80 hover:bg-[#581c87]/20',
        telegramFlashLight: 'bg-[#d946ef]/5',
        telegramSendBtn: 'bg-[#d946ef]/10 border-[#d946ef]/30 text-[#d946ef] group-hover:scale-110 group-hover:bg-[#ec4899]/15 group-hover:text-white',
        borderColor: '#d946ef'
      };
    } else if (selectedGame === 'goagame') {
      return {
        text: 'text-[#3b82f6]',
        textLight: 'text-blue-200',
        textSoft: 'text-[#60a5fa]/90',
        textMuted: 'text-[#3b82f6]/60',
        textIntense: 'text-[#1d4ed8]',
        shadowGlow: 'shadow-[0_0_25px_rgba(37,99,235,0.25)]',
        shadowPulse: 'shadow-[0_0_25px_rgba(37,99,235,0.45)]',
        iconGlow: 'filter drop-shadow-[0_4px_14px_rgba(37,99,235,0.6)]',
        glowClass: 'neon-glow-goagame',
        bgSoft: 'bg-[#061026]/60',
        bgSoftSubtle: 'bg-[#061026]/30 border-[#3b82f6]/30 hover:bg-[#3b82f6]/15',
        borderSoft: 'border-[#3b82f6]/25',
        borderMedium: 'border-[#3b82f6]/40 text-[#60a5fa] hover:bg-[#3b82f6]/15',
        borderIntense: 'border-[#3b82f6]/60',
        borderThick: 'border-[#3b82f6]/50',
        badge: 'bg-[#2563eb]/25 text-[#93c5fd] border-[#3b82f6]/30',
        accentIcon: 'text-[#60a5fa]',
        accentIconBg: 'border-[#3b82f6]/35 bg-[#061026]/50 text-[#60a5fa] hover:bg-[#3b82f6]/20',
        accentBtn: 'bg-gradient-to-r from-[#0d1bf8] via-[#2563eb] to-[#1d4ed8]',
        accentBtnDisabled: 'bg-[#3b82f6]/10 border border-[#3b82f6]/25 text-[#3b82f6]/40 cursor-not-allowed',
        progressBarBorder: 'border-[#061026]',
        progressBarFill: 'bg-gradient-to-r from-[#0d1bf8] via-[#3b82f6] to-[#93c5fd] shadow-[0_0_15px_rgba(59,130,246,0.7)]',
        scanAlert: 'bg-[#061026]/80 border-[#3b82f6]/45',
        progressIndicator: 'text-[#60a5fa]',
        progressPing: 'bg-[#3b82f6]',
        tabActive: 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white font-semibold shadow-[0_0_18px_rgba(37,99,235,0.5)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#3b82f6]/30 text-[#60a5fa] hover:text-white hover:bg-[#3b82f6]/15',
        telegramBorderGlow: 'border-[#3b82f6]/40 bg-gradient-to-r from-[#061026]/60 via-slate-950/40 to-[#061026]/60 hover:border-blue-400/90 hover:bg-[#061026]/30',
        telegramFlashLight: 'bg-[#3b82f6]/10',
        telegramSendBtn: 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#93c5fd] group-hover:scale-110 group-hover:bg-[#2563eb]/25 group-hover:text-white',
        borderColor: '#3b82f6'
      };
    } else if (selectedGame === 'ninetyoneclub') {
      return {
        text: 'text-[#ff1e27]',
        textLight: 'text-red-200',
        textSoft: 'text-[#ff1e27]/80',
        textMuted: 'text-[#ff1e27]/55',
        textIntense: 'text-[#ef4444]',
        shadowGlow: 'shadow-[0_0_25px_rgba(255,30,39,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(255,30,39,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(255,30,39,0.5)]',
        glowClass: 'neon-glow-red',
        bgSoft: 'bg-red-950/25',
        bgSoftSubtle: 'bg-red-950/15 border-red-500/15 hover:bg-[#ff1e27]/10',
        borderSoft: 'border-[#ff1e27]/15',
        borderMedium: 'border-[#ff1e27]/30 text-[#ff1e27] hover:bg-[#ff1e27]/10',
        borderIntense: 'border-[#ff1e27]/50',
        borderThick: 'border-[#ff1e27]/40',
        badge: 'bg-[#ff1e27]/20 text-[#ff1e27] border-[#ff1e27]/10',
        accentIcon: 'text-[#ff1e27]',
        accentIconBg: 'border-[#ff1e27]/20 bg-red-950/20 text-[#ff1e27] hover:bg-[#ff1e27]/10',
        accentBtn: 'bg-gradient-to-r from-red-700 via-[#ff1e27] to-red-800',
        accentBtnDisabled: 'bg-[#ff1e27]/10 border border-[#ff1e27]/25 text-[#ff1e27]/40 cursor-not-allowed',
        progressBarBorder: 'border-red-950',
        progressBarFill: 'bg-gradient-to-r from-red-700 via-[#ff1e27] to-red-500 shadow-[0_0_12px_rgba(255,30,39,0.6)]',
        scanAlert: 'bg-black/50 border-[#ff1e27]/30',
        progressIndicator: 'text-[#ff1e27]',
        progressPing: 'bg-[#ff1e27]',
        tabActive: 'bg-gradient-to-r from-red-700 to-red-500 text-white font-bold shadow-[0_0_15px_rgba(255,30,39,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#ff1e27]/25 text-[#ff1e27] hover:text-white hover:bg-[#ff1e27]/10',
        telegramBorderGlow: 'border-[#ff1e27]/30 bg-gradient-to-r from-red-950/30 via-slate-950/40 to-red-950/30 hover:border-[#ff1e27]/80 hover:bg-red-950/15',
        telegramFlashLight: 'bg-[#ff1e27]/5',
        telegramSendBtn: 'bg-red-500/10 border-[#ff1e27]/30 text-[#ff1e27] group-hover:scale-110 group-hover:bg-red-500/20 group-hover:text-red-200',
        borderColor: '#ff1e27'
      };
    } else if (selectedGame === 'bdgwin') {
      return {
        text: 'text-[#F0D597]',
        textLight: 'text-amber-100',
        textSoft: 'text-[#F0D597]/80',
        textMuted: 'text-[#F0D597]/55',
        textIntense: 'text-[#dfba6b]',
        shadowGlow: 'shadow-[0_0_25px_rgba(240,213,151,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(240,213,151,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(240,213,151,0.5)]',
        glowClass: 'neon-glow-gold',
        bgSoft: 'bg-amber-950/25',
        bgSoftSubtle: 'bg-amber-950/15 border-amber-500/15 hover:bg-[#F0D597]/10',
        borderSoft: 'border-[#F0D597]/15',
        borderMedium: 'border-[#F0D597]/30 text-[#F0D597] hover:bg-[#F0D597]/10',
        borderIntense: 'border-[#F0D597]/50',
        borderThick: 'border-[#F0D597]/40',
        badge: 'bg-[#F0D597]/20 text-[#F0D597] border-[#F0D597]/10',
        accentIcon: 'text-[#F0D597]',
        accentIconBg: 'border-[#F0D597]/20 bg-amber-950/20 text-[#F0D597] hover:bg-[#F0D597]/10',
        accentBtn: 'bg-gradient-to-r from-amber-700 via-[#F0D597] to-amber-800',
        accentBtnDisabled: 'bg-[#F0D597]/10 border border-[#F0D597]/25 text-[#F0D597]/40 cursor-not-allowed',
        progressBarBorder: 'border-amber-950',
        progressBarFill: 'bg-gradient-to-r from-amber-700 via-[#F0D597] to-amber-500 shadow-[0_0_12px_rgba(240,213,151,0.6)]',
        scanAlert: 'bg-black/50 border-[#F0D597]/30',
        progressIndicator: 'text-[#F0D597]',
        progressPing: 'bg-[#F0D597]',
        tabActive: 'bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold shadow-[0_0_15px_rgba(240,213,151,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#F0D597]/25 text-[#F0D597] hover:text-white hover:bg-[#F0D597]/10',
        telegramBorderGlow: 'border-[#F0D597]/30 bg-gradient-to-r from-amber-950/30 via-slate-950/40 to-amber-950/30 hover:border-[#F0D597]/80 hover:bg-amber-950/15',
        telegramFlashLight: 'bg-[#F0D597]/5',
        telegramSendBtn: 'bg-amber-500/10 border-[#F0D597]/30 text-[#F0D597] group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-200',
        borderColor: '#F0D597'
      };
    } else if (selectedGame === 'sreewin') {
      return {
        text: 'text-[#a78bfa]',
        textLight: 'text-purple-100',
        textSoft: 'text-[#a78bfa]/80',
        textMuted: 'text-[#a78bfa]/55',
        textIntense: 'text-[#c084fc]',
        shadowGlow: 'shadow-[0_0_25px_rgba(139,92,246,0.2)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(139,92,246,0.5)]',
        glowClass: 'neon-glow-sreewin',
        bgSoft: 'bg-purple-950/25',
        bgSoftSubtle: 'bg-purple-950/15 border-purple-500/15 hover:bg-[#8b5cf6]/10',
        borderSoft: 'border-[#8b5cf6]/15',
        borderMedium: 'border-[#8b5cf6]/30 text-[#a78bfa] hover:bg-[#8b5cf6]/10',
        borderIntense: 'border-[#8b5cf6]/50',
        borderThick: 'border-[#8b5cf6]/40',
        badge: 'bg-purple-950/40 text-[#c084fc] border-purple-500/20',
        accentIcon: 'text-[#a78bfa]',
        accentIconBg: 'border-[#8b5cf6]/20 bg-purple-950/20 text-[#a78bfa] hover:bg-[#8b5cf6]/10',
        accentBtn: 'bg-gradient-to-r from-purple-800 via-[#8b5cf6] to-indigo-900',
        accentBtnDisabled: 'bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 text-[#8b5cf6]/40 cursor-not-allowed',
        progressBarBorder: 'border-purple-950',
        progressBarFill: 'bg-gradient-to-r from-purple-800 via-[#a78bfa] to-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
        scanAlert: 'bg-black/50 border-[#8b5cf6]/30',
        progressIndicator: 'text-[#a78bfa]',
        progressPing: 'bg-[#a78bfa]',
        tabActive: 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#8b5cf6]/25 text-[#a78bfa] hover:text-white hover:bg-[#8b5cf6]/10',
        telegramBorderGlow: 'border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-950/40 to-purple-950/30 hover:border-purple-500/80 hover:bg-purple-950/15',
        telegramFlashLight: 'bg-purple-500/5',
        telegramSendBtn: 'bg-purple-500/10 border-purple-500/30 text-[#a78bfa] group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:text-purple-200',
        borderColor: '#8b5cf6'
      };
    } else if (selectedGame === 'sixclub') {
      return {
        text: 'text-[#facc15]',
        textLight: 'text-amber-100',
        textSoft: 'text-[#facc15]/80',
        textMuted: 'text-[#facc15]/55',
        textIntense: 'text-[#fef08a]',
        shadowGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]',
        glowClass: 'neon-glow-sixclub',
        bgSoft: 'bg-amber-950/25',
        bgSoftSubtle: 'bg-amber-950/15 border-amber-500/15 hover:bg-[#f59e0b]/10',
        borderSoft: 'border-[#f59e0b]/15',
        borderMedium: 'border-[#f59e0b]/30 text-[#facc15] hover:bg-[#f59e0b]/10',
        borderIntense: 'border-[#f59e0b]/50',
        borderThick: 'border-[#f59e0b]/40',
        badge: 'bg-amber-950/40 text-[#facc15] border-amber-500/20',
        accentIcon: 'text-[#facc15]',
        accentIconBg: 'border-[#f59e0b]/20 bg-amber-950/20 text-[#facc15] hover:bg-[#f59e0b]/10',
        accentBtn: 'bg-gradient-to-r from-amber-700 via-[#f59e0b] to-yellow-600',
        accentBtnDisabled: 'bg-[#f59e0b]/10 border border-[#f59e0b]/25 text-[#f59e0b]/40 cursor-not-allowed',
        progressBarBorder: 'border-amber-950',
        progressBarFill: 'bg-gradient-to-r from-amber-700 via-[#facc15] to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
        scanAlert: 'bg-black/50 border-[#f59e0b]/30',
        progressIndicator: 'text-[#facc15]',
        progressPing: 'bg-[#facc15]',
        tabActive: 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#f59e0b]/25 text-[#facc15] hover:text-white hover:bg-[#f59e0b]/10',
        telegramBorderGlow: 'border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-950/40 to-amber-950/30 hover:border-amber-500/80 hover:bg-amber-950/15',
        telegramFlashLight: 'bg-amber-500/5',
        telegramSendBtn: 'bg-amber-500/10 border-amber-500/30 text-[#facc15] group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-200',
        borderColor: '#f59e0b'
      };
    } else if (selectedGame === 'veergame') {
      return {
        text: 'text-[#4ade80]',
        textLight: 'text-emerald-100',
        textSoft: 'text-[#4ade80]/80',
        textMuted: 'text-[#4ade80]/55',
        textIntense: 'text-[#86efac]',
        shadowGlow: 'shadow-[0_0_25px_rgba(34,197,94,0.25)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.5)]',
        glowClass: 'neon-glow-veergame',
        bgSoft: 'bg-emerald-950/25',
        bgSoftSubtle: 'bg-emerald-950/15 border-emerald-500/15 hover:bg-[#22c55e]/10',
        borderSoft: 'border-[#22c55e]/15',
        borderMedium: 'border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10',
        borderIntense: 'border-[#22c55e]/50',
        borderThick: 'border-[#22c55e]/40',
        badge: 'bg-emerald-950/40 text-[#4ade80] border-emerald-500/20',
        accentIcon: 'text-[#4ade80]',
        accentIconBg: 'border-[#22c55e]/20 bg-emerald-950/20 text-[#4ade80] hover:bg-[#22c55e]/10',
        accentBtn: 'bg-gradient-to-r from-emerald-700 via-[#22c55e] to-green-600',
        accentBtnDisabled: 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]/40 cursor-not-allowed',
        progressBarBorder: 'border-emerald-950',
        progressBarFill: 'bg-gradient-to-r from-emerald-700 via-[#4ade80] to-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]',
        scanAlert: 'bg-black/50 border-[#22c55e]/30',
        progressIndicator: 'text-[#4ade80]',
        progressPing: 'bg-[#4ade80]',
        tabActive: 'bg-gradient-to-r from-emerald-600 to-green-500 text-black font-extrabold shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#22c55e]/25 text-[#4ade80] hover:text-white hover:bg-[#22c55e]/10',
        telegramBorderGlow: 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-950/40 to-emerald-950/30 hover:border-emerald-500/80 hover:bg-emerald-950/15',
        telegramFlashLight: 'bg-emerald-500/5',
        telegramSendBtn: 'bg-emerald-500/10 border-emerald-500/30 text-[#4ade80] group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-emerald-200',
        borderColor: '#22c55e'
      };
    } else if (selectedGame === 'dmfirst') {
      return {
        text: 'text-[#facc15]',
        textLight: 'text-amber-100',
        textSoft: 'text-[#facc15]/85',
        textMuted: 'text-[#eab308]/65',
        textIntense: 'text-[#fef08a]',
        shadowGlow: 'shadow-[0_0_25px_rgba(234,179,8,0.35)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(250,204,21,0.45)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.55)]',
        glowClass: 'neon-glow-dmfirst',
        bgSoft: 'bg-emerald-950/30',
        bgSoftSubtle: 'bg-emerald-950/20 border-amber-500/20 hover:bg-[#facc15]/10',
        borderSoft: 'border-[#facc15]/20',
        borderMedium: 'border-[#facc15]/40 text-[#facc15] hover:bg-[#facc15]/10',
        borderIntense: 'border-[#eab308]/60',
        borderThick: 'border-[#facc15]/50',
        badge: 'bg-emerald-950/50 text-[#facc15] border-amber-500/30',
        accentIcon: 'text-[#facc15]',
        accentIconBg: 'border-[#facc15]/25 bg-emerald-950/30 text-[#facc15] hover:bg-[#facc15]/15',
        accentBtn: 'bg-gradient-to-r from-emerald-700 via-[#10b981] to-amber-500',
        accentBtnDisabled: 'bg-[#eab308]/10 border border-[#eab308]/25 text-[#eab308]/40 cursor-not-allowed',
        progressBarBorder: 'border-emerald-950',
        progressBarFill: 'bg-gradient-to-r from-emerald-600 via-[#facc15] to-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]',
        scanAlert: 'bg-black/50 border-[#facc15]/35',
        progressIndicator: 'text-[#facc15]',
        progressPing: 'bg-[#facc15]',
        tabActive: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#facc15]/25 text-[#facc15] hover:text-white hover:bg-[#facc15]/10',
        telegramBorderGlow: 'border-amber-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-950/40 to-amber-950/40 hover:border-amber-500/80 hover:bg-amber-950/20',
        telegramFlashLight: 'bg-amber-500/10',
        telegramSendBtn: 'bg-amber-500/15 border-amber-500/30 text-[#facc15] group-hover:scale-110 group-hover:bg-amber-500/25 group-hover:text-amber-100',
        borderColor: '#eab308'
      };
    } else {
      return {
        text: 'text-green-400',
        textLight: 'text-green-200',
        textSoft: 'text-green-300/70',
        textMuted: 'text-green-400/55',
        textIntense: 'text-green-400',
        shadowGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
        shadowPulse: 'shadow-[0_0_25px_rgba(34,197,94,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.5)]',
        glowClass: 'neon-glow-green',
        bgSoft: 'bg-emerald-950/20',
        bgSoftSubtle: 'bg-emerald-950/15 border-emerald-500/15 hover:bg-emerald-950/30',
        borderSoft: 'border-emerald-500/10',
        borderMedium: 'border-emerald-500/20 text-green-400 hover:bg-emerald-500/10',
        borderIntense: 'border-emerald-400/40',
        borderThick: 'border-emerald-500/15',
        badge: 'bg-emerald-900/40 text-green-300 border-emerald-400/10',
        accentIcon: 'text-green-400',
        accentIconBg: 'border-emerald-500/20 bg-emerald-950/20 text-green-400 hover:bg-emerald-500/10',
        accentBtn: 'bg-gradient-to-r from-emerald-600 via-[#22c55e] to-emerald-700',
        accentBtnDisabled: 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-500/40 cursor-not-allowed',
        progressBarBorder: 'border-emerald-950',
        progressBarFill: 'bg-gradient-to-r from-emerald-500 via-[#22c55e] to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]',
        scanAlert: 'bg-emerald-950/30 border-emerald-500/30',
        progressIndicator: 'text-green-400',
        progressPing: 'bg-green-400',
        tabActive: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-emerald-500/25 text-green-300 hover:text-white hover:bg-emerald-500/10',
        telegramBorderGlow: 'border-emerald-400/30 bg-gradient-to-r from-emerald-950/30 via-slate-950/40 to-emerald-950/30 hover:border-emerald-400/80 hover:bg-emerald-950/15',
        telegramFlashLight: 'bg-emerald-500/10',
        telegramSendBtn: 'bg-emerald-500/10 border-emerald-400/30 text-green-400 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-green-200',
        borderColor: '#22c55e'
      };
    }
  };

  const st = getGameStyles();
  const [periodInput, setPeriodInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>('Initializing server connection...');
  const [predictionResult, setPredictionResult] = useState<PredictionRecord | null>(null);
  const [historyList, setHistoryList] = useState<PredictionRecord[]>(INITIAL_HISTORY);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const initialActivePeriod = String(BigInt(INITIAL_HISTORY[0].period) + 1n);
  const [liveAutoPeriod, setLiveAutoPeriod] = useState<number | string>(initialActivePeriod);
  const liveAutoPeriodRef = useRef<number | string>(initialActivePeriod);
  useEffect(() => {
    liveAutoPeriodRef.current = liveAutoPeriod;
  }, [liveAutoPeriod]);
  const [isServerStarted, setIsServerStarted] = useState<boolean>(false);
  const [isStartingServer, setIsStartingServer] = useState<boolean>(false);
  const [transitionState, setTransitionState] = useState<{
    isVisible: boolean;
    mode: 'entering' | 'exiting';
    gameTitle?: string;
    gameLogo?: string;
    themeColor: string;
    statusText?: string;
    customMessages: string[];
    duration: number;
  }>({
    isVisible: false,
    mode: 'entering',
    themeColor: '#22c55e',
    statusText: '',
    customMessages: [],
    duration: 650
  });
  const [serverProgress, setServerProgress] = useState<number>(0);
  const [startingStatusText, setStartingStatusText] = useState<string>('Establish Handshake...');
  const [showTimerSelection, setShowTimerSelection] = useState<boolean>(false);
  const [selectedTimeMode, setSelectedTimeMode] = useState<'1min' | '30sec'>('1min');

  // Refresh consecutive history and predictions when game or time mode changes
  useEffect(() => {
    setPredictionResult(null);
    setShowWinCelebration(false);
    setLastPredictedPeriodIndex(null);
    lastProcessedPeriodIndexRef.current = null;
    const fresh = generateInitialConsecutiveHistory(selectedTimeMode);
    setHistoryList(fresh);
    const active = String(BigInt(fresh[0].period) + 1n);
    setLiveAutoPeriod(active);
    liveAutoPeriodRef.current = active;
  }, [selectedTimeMode, selectedGame]);

  // Preload prediction result images to completely prevent 0.1s pop-in/flicker glitches
  useEffect(() => {
    const urls = [
      ...NUMBER_IMAGES,
      'https://i.ibb.co/JjZSB374/game-result-big.png',
      'https://i.ibb.co/GfVjCNnh/game-result-small.png',
      'https://i.ibb.co/CTnm54Q/54852.png'
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Auto increment simulated period code to feel alive based on selected mode
  const [showWinCelebration, setShowWinCelebration] = useState<boolean>(false);
  const [celebrationPeriodRecord, setCelebrationPeriodRecord] = useState<PredictionRecord | null>(null);
  const [wingoSubMode, setWingoSubMode] = useState<'bigsmall' | 'number'>('number');
  const [wingoTimeLeft, setWingoTimeLeft] = useState<number>(37);
  const [lastPredictedPeriodIndex, setLastPredictedPeriodIndex] = useState<number | string | null>(null);
  const lastProcessedPeriodIndexRef = useRef<number | string | null>(null);
  const lastPlayedSecondRef = useRef<number | null>(null);
  const hasBootedOnceRef = useRef<boolean>(false);
  const predictionResultRef = useRef<PredictionRecord | null>(predictionResult);
  
  // Store pre-known upcoming prediction from live API result stream
  const [upcomingPrediction, setUpcomingPrediction] = useState<{
    period: string;
    predictedNumber: number;
    result: 'BIG' | 'SMALL';
    color: 'red' | 'green' | 'purple';
    accuracy?: number;
  } | null>(null);
  const upcomingPredictionRef = useRef<any>(null);

  useEffect(() => {
    upcomingPredictionRef.current = upcomingPrediction;
  }, [upcomingPrediction]);

  useEffect(() => {
    predictionResultRef.current = predictionResult;
  }, [predictionResult]);

  // Derive past results balls directly from historyList's latest 5 entries so they are ALWAYS 100% in sync
  const pastBalls = useMemo(() => {
    const balls: { num: number; type: string; period: string }[] = [];
    let lastNum = -1;
    for (let i = 0; i < Math.min(5, historyList.length); i++) {
      const record = historyList[i];
      let num = record.predictedNumber !== undefined 
        ? record.predictedNumber 
        : (record.result === 'BIG' ? 9 : 1);
      
      // Anti-duplicate protection: never allow adjacent balls to have the same number
      if (num === lastNum) {
        const pDigit = parseInt(String(record.period).slice(-1)) || 1;
        num = (num + 1 + (pDigit % 8)) % 10;
      }
      lastNum = num;
      const type = getNumberColorType(num);
      balls.push({ num, type, period: record.period });
    }
    return balls;
  }, [historyList]);

  // Unified local countdown, rollover, and instant results prepend logic
  useEffect(() => {
    const intervalId = setInterval(() => {
      setWingoTimeLeft((prev) => {
        const currentPred = predictionResultRef.current;

        // When countdown hits 0 (or goes below 1), immediately trigger victory celebration or record rollover
        if (prev <= 1) {
          const currentActive = getFormattedPeriod();
          const finishedPeriod = currentActive;

          if (currentPred) {
            // Rollover victory sound & instant popup
            playBeep(800, 150);
            setCelebrationPeriodRecord(currentPred);
            setShowWinCelebration(true);
            setHistoryList((oldHistory) => {
              if (oldHistory.some(r => String(r.period) === String(currentPred.period))) {
                return oldHistory;
              }
              return [currentPred, ...oldHistory.slice(0, 29)];
            });
            setPredictionResult(null);
          } else if (finishedPeriod && /^\d+$/.test(finishedPeriod)) {
            // Even without manual prediction clicked, record the completed round so history never falls behind active period
            setHistoryList((oldHistory) => {
              if (oldHistory.some(r => String(r.period) === finishedPeriod)) {
                return oldHistory;
              }
              let numVal = (parseInt(finishedPeriod.slice(-1)) * 7 + 3) % 10;
              const lastPred = oldHistory[0]?.predictedNumber;
              if (lastPred !== undefined && numVal === lastPred) {
                const pDigit = parseInt(finishedPeriod.slice(-1)) || 1;
                numVal = (numVal + 1 + (pDigit % 8)) % 10;
              }
              const colorType = getNumberColorType(numVal);
              const colorVal = colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : (colorType === 'red' ? 'red' : 'green');
              const finishedRec: PredictionRecord = {
                id: `rec-${finishedPeriod}`,
                period: finishedPeriod,
                gameType: activeTab,
                result: numVal >= 5 ? 'BIG' : 'SMALL',
                color: colorVal,
                accuracy: 96,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'WIN',
                predictedNumber: numVal
              };
              return [finishedRec, ...oldHistory.slice(0, 29)];
            });
          }
          
          // Auto increment period locally to show the user the next period number immediately
          const nextPeriod = String(BigInt(finishedPeriod) + 1n);
          setLiveAutoPeriod(nextPeriod);
          liveAutoPeriodRef.current = nextPeriod;
          
          return selectedTimeMode === '30sec' ? 29 : 59;
        }

        const nextSecs = prev - 1;

        // Trigger countdown tick sounds precisely once per second in the final 5 seconds
        if (nextSecs >= 1 && nextSecs <= 5 && currentPred) {
          playCountdownTickSound(nextSecs);
        }

        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [selectedTimeMode, activeTab, soundEnabled]);

  // Dynamic Server Sync with Proxied API Routes (CORS bypassed, client cache buster added, and cookie resolved server-side)
  useEffect(() => {
    const endpoint = selectedTimeMode === '1min' 
      ? '/api/drago-live-results?mode=1min' 
      : '/api/drago-live-results?mode=30sec';
    let isMounted = true;

    const fetchDynamicData = async () => {
      try {
        // Appending a timestamp query parameter to bypass browser and reverse proxy caching
        const fetchUrl = `${endpoint}&_=${Date.now()}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fetchUrl}: ${response.statusText}`);
        }
        
        const text = await response.text();
        if (!isMounted) return;

        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // If response is raw plain text, it might be just the raw period number string
          const trimmed = text.trim();
          if (trimmed && /^\d+$/.test(trimmed)) {
            data = { period: trimmed };
          }
        }

        if (data) {
          // A. Parse and resolve active/current period
          let fetchedPeriod: string | null = null;
          if (data.period !== undefined) {
            fetchedPeriod = String(data.period);
          } else if (data.epoch !== undefined) {
            fetchedPeriod = String(data.epoch);
          } else if (data.issue !== undefined) {
            fetchedPeriod = String(data.issue);
          } else if (data.current_period !== undefined) {
            fetchedPeriod = String(data.current_period);
          }

          // Capture pre-known upcoming prediction from live stream with reference stability
          if (data.upcomingPrediction) {
            upcomingPredictionRef.current = data.upcomingPrediction;
            setUpcomingPrediction((prev) => {
              if (
                prev &&
                String(prev.period) === String(data.upcomingPrediction.period) &&
                prev.predictedNumber === data.upcomingPrediction.predictedNumber &&
                prev.result === data.upcomingPrediction.result &&
                prev.color === data.upcomingPrediction.color
              ) {
                return prev;
              }
              return data.upcomingPrediction;
            });
          }

          // B. Parse remaining timer seconds
          let fetchedTimeLeft: number | null = null;
          if (data.timeLeft !== undefined) {
            fetchedTimeLeft = Number(data.timeLeft);
          } else if (data.time !== undefined) {
            fetchedTimeLeft = Number(data.time);
          } else if (data.timeleft !== undefined) {
            fetchedTimeLeft = Number(data.timeleft);
          } else if (data.time_left !== undefined) {
            fetchedTimeLeft = Number(data.time_left);
          } else if (data.seconds !== undefined) {
            fetchedTimeLeft = Number(data.seconds);
          } else if (data.secs !== undefined) {
            fetchedTimeLeft = Number(data.secs);
          }

          // C. Parse past records / history table rows
          let rawHistory: any[] | null = null;
          if (Array.isArray(data)) {
            rawHistory = data;
          } else if (Array.isArray(data.history)) {
            rawHistory = data.history;
          } else if (Array.isArray(data.data)) {
            rawHistory = data.data;
          } else if (Array.isArray(data.results)) {
            rawHistory = data.results;
          } else if (Array.isArray(data.records)) {
            rawHistory = data.records;
          } else if (Array.isArray(data.last_results)) {
            rawHistory = data.last_results;
          }

          let parsedHistoryList: PredictionRecord[] = [];
          if (rawHistory && rawHistory.length > 0) {
            parsedHistoryList = rawHistory.map((item: any, index: number) => {
              const recPeriod = String(
                item.period || 
                item.issue || 
                item.epoch || 
                (fetchedPeriod ? String(BigInt(fetchedPeriod) - BigInt(index + 1)) : `${Date.now() - index}`)
              );

              let numVal = 0;
              if (item.predictedNumber !== undefined) {
                numVal = Number(item.predictedNumber);
              } else if (item.number !== undefined) {
                numVal = Number(item.number);
              } else if (item.num !== undefined) {
                numVal = Number(item.num);
              } else if (item.result_number !== undefined) {
                numVal = Number(item.result_number);
              } else {
                numVal = parseInt(recPeriod.slice(-1)) || 0;
              }

              let sizeVal: 'BIG' | 'SMALL' | 'RED' | 'GREEN' | 'MULTIPLIER' = 'BIG';
              if (item.result !== undefined) {
                const r = String(item.result).toUpperCase();
                if (r === 'BIG' || r === 'SMALL' || r === 'RED' || r === 'GREEN' || r === 'MULTIPLIER') {
                  sizeVal = r as any;
                }
              } else if (item.size !== undefined) {
                const s = String(item.size).toUpperCase();
                if (s === 'BIG' || s === 'SMALL') {
                  sizeVal = s as any;
                }
              } else {
                sizeVal = numVal >= 5 ? 'BIG' : 'SMALL';
              }

              let colorVal: 'red' | 'green' | 'blue' | 'purple' | 'amber' = 'green';
              if (item.color !== undefined) {
                const c = String(item.color).toLowerCase();
                if (c === 'red' || c === 'green' || c === 'blue' || c === 'purple' || c === 'amber') {
                  colorVal = c as any;
                }
              } else {
                const colorType = getNumberColorType(numVal);
                colorVal = colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : 
                           (colorType === 'red' ? 'red' : 'green');
              }

              const acc = Number(item.accuracy || (95 + (parseInt(recPeriod.slice(-2)) || 0) % 5));

              return {
                id: item.id || `rec-${recPeriod}`,
                period: recPeriod,
                gameType: activeTab,
                result: sizeVal,
                color: colorVal,
                accuracy: acc,
                timestamp: item.timestamp || new Date(Date.now() - (index + 1) * (selectedTimeMode === '30sec' ? 30000 : 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: item.status || 'WIN',
                predictedNumber: numVal
              } as PredictionRecord;
            });
          }

          // D. Determine target active period without jumping backward
          let targetPeriod = fetchedPeriod;
          if (!targetPeriod && parsedHistoryList.length > 0) {
            const latestHistoryPeriod = parsedHistoryList[0].period;
            if (/^\d+$/.test(latestHistoryPeriod)) {
              try {
                targetPeriod = String(BigInt(latestHistoryPeriod) + 1n);
              } catch (err) {
                const parsed = parseInt(latestHistoryPeriod);
                if (!isNaN(parsed)) {
                  targetPeriod = String(parsed + 1);
                }
              }
            }
          }

          if (targetPeriod && /^\d+$/.test(targetPeriod)) {
            setLiveAutoPeriod((curr) => {
              const currStr = String(curr || '');
              // If empty or different length/prefix (mode switch between 30sec and 1min), accept immediately
              if (!currStr || currStr.length !== targetPeriod.length || currStr.slice(0, 13) !== targetPeriod.slice(0, 13)) {
                return targetPeriod;
              }
              try {
                // Only advance period forward, never jump backward in same mode
                if (BigInt(targetPeriod) >= BigInt(currStr)) {
                  return targetPeriod;
                }
                return currStr;
              } catch {
                return targetPeriod;
              }
            });
          }

          // Smoothly finalize celebration if previous period round concluded on server
          const currentPred = predictionResultRef.current;
          if (
            currentPred && 
            targetPeriod && 
            /^\d+$/.test(targetPeriod) && 
            /^\d+$/.test(String(currentPred.period))
          ) {
            if (BigInt(targetPeriod) > BigInt(String(currentPred.period))) {
              playBeep(800, 150);
              setCelebrationPeriodRecord(currentPred);
              setShowWinCelebration(true);
              setPredictionResult(null);
            }
          }

          // Avoid timer jump jitter by keeping smooth 1s decrement if server is within 2 seconds
          if (fetchedTimeLeft !== null && !isNaN(fetchedTimeLeft)) {
            setWingoTimeLeft((nowLocal) => {
              if (Math.abs(nowLocal - fetchedTimeLeft) <= 2 && nowLocal > 0) {
                return nowLocal;
              }
              return fetchedTimeLeft;
            });
          }

          // Clean records table update with strictly consecutive period alignment to eliminate any mismatch
          if (parsedHistoryList.length > 0) {
            const currentActive = targetPeriod || String(liveAutoPeriodRef.current || liveAutoPeriod);
            if (currentActive && /^\d+$/.test(currentActive)) {
              const activeBig = BigInt(currentActive);
              const parsedMap = new Map<string, any>();
              for (const it of parsedHistoryList) {
                if (it.period) {
                  parsedMap.set(String(it.period), it);
                }
              }

              // Build strictly consecutive history starting immediately at activeBig - 1
              const consecutiveHistory: PredictionRecord[] = [];
              const intervalSeconds = selectedTimeMode === '30sec' ? 30 : 60;
              let prevConsecutiveNum = -1;
              for (let i = 0; i < 20; i++) {
                const recPeriod = String(activeBig - BigInt(i + 1));
                const existing = parsedMap.get(recPeriod) || parsedHistoryList[i];
                let numVal = 0;
                if (existing && String(existing.period) === recPeriod && existing.predictedNumber !== undefined) {
                  numVal = Number(existing.predictedNumber);
                } else if (existing?.predictedNumber !== undefined) {
                  numVal = Number(existing.predictedNumber);
                } else if (existing?.number !== undefined) {
                  numVal = Number(existing.number);
                } else {
                  numVal = (parseInt(recPeriod.slice(-1)) * 7 + 3) % 10;
                }

                // Anti-duplicate protection: strictly prevent adjacent duplicate numbers
                if (numVal === prevConsecutiveNum) {
                  const pDigit = parseInt(recPeriod.slice(-1)) || 1;
                  numVal = (numVal + 1 + (pDigit % 8)) % 10;
                }
                prevConsecutiveNum = numVal;

                const colorType = getNumberColorType(numVal);
                const colorVal = colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : (colorType === 'red' ? 'red' : 'green');
                consecutiveHistory.push({
                  id: `rec-${recPeriod}`,
                  period: recPeriod,
                  gameType: activeTab,
                  result: numVal >= 5 ? 'BIG' : 'SMALL',
                  color: colorVal,
                  accuracy: 95 + (parseInt(recPeriod.slice(-2)) || 0) % 5,
                  timestamp: existing?.timestamp || new Date(Date.now() - (i + 1) * intervalSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'WIN',
                  predictedNumber: numVal
                });
              }

              setHistoryList((prev) => {
                if (prev.length > 0 && prev.length === consecutiveHistory.length) {
                  const isIdentical = prev.slice(0, 10).every((item, idx) => {
                    const f = consecutiveHistory[idx];
                    return (
                      f &&
                      String(item.period) === String(f.period) &&
                      item.predictedNumber === f.predictedNumber &&
                      item.result === f.result &&
                      item.color === f.color
                    );
                  });
                  if (isIdentical) return prev; // Stable reference prevents re-render glitch
                }
                return consecutiveHistory;
              });
            }
          }
        }
      } catch (err) {
        // Quietly fail to let simulation fallback function seamlessly in sandbox
      }
    };

    // Run fetch immediately on mount/update
    fetchDynamicData();

    // Set polling interval to refresh every 2 seconds for a seamless realtime sync experience
    const pollIntervalId = setInterval(fetchDynamicData, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollIntervalId);
    };
  }, [isServerStarted, selectedTimeMode, activeTab]);

  const getGameLogoAndTitle = () => {
    switch (selectedGame) {
      case 'eightytwolottery':
        return {
          logo: 'https://i.ibb.co/9kyC9Kj7/IMG-20260611-144339.jpg',
          bigLogo: 'https://i.ibb.co/Xf3mrhQs/Untitled-11-June-2026-at-14-45-16.png',
          modalLogoScale: 'scale-[1.3] min-[360px]:scale-[1.45]',
          title: '82 LOTTERY',
          color: 'from-red-950/40 via-[#0e0f13] to-red-950/10',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          accentColor: '#ef4444',
          accentColorBg: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
      case 'jalwagame':
        return {
          logo: 'https://i.ibb.co/gZCkyBHW/Adobe-Express-file-2.png',
          bigLogo: 'https://i.ibb.co/gZCkyBHW/Adobe-Express-file-2.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: 'JALWA GAME',
          color: 'from-blue-950/45 via-[#010815] to-blue-950/10',
          textColor: 'text-[#61DACC]',
          borderColor: 'border-[#61DACC]/50',
          glow: 'shadow-[0_0_20px_rgba(97,218,204,0.35)]',
          accentColor: '#61DACC',
          accentColorBg: 'bg-[#61DACC]/10 text-[#61DACC] border-[#61DACC]/20'
        };
      case 'tiranga':
        return {
          logo: 'https://i.ibb.co/cSRGgtTs/Untitled-11-June-2026-at-15-19-06.png',
          bigLogo: 'https://i.ibb.co/cSRGgtTs/Untitled-11-June-2026-at-15-19-06.png',
          modalLogoScale: 'scale-[1.25] min-[360px]:scale-[1.4]',
          title: 'TIRANGA',
          color: 'from-blue-950/45 via-[#0e0f13] to-blue-900/10',
          textColor: 'text-[#6495ED]',
          borderColor: 'border-[#6495ED]/50',
          glow: 'shadow-[0_0_20px_rgba(100,149,237,0.35)]',
          accentColor: '#6495ED',
          accentColorBg: 'bg-[#6495ED]/10 text-[#6495ED] border-[#6495ED]/20'
        };
      case 'fiftyonegame':
        return {
          logo: 'https://i.ibb.co/chhhCW1y/Untitled-17-June-2026-at-10-34-00.png',
          bigLogo: 'https://i.ibb.co/chhhCW1y/Untitled-17-June-2026-at-10-34-00.png',
          modalLogoScale: 'scale-[1.25] min-[360px]:scale-[1.4]',
          title: '51 GAME',
          color: 'from-amber-950/45 via-[#0e0f13] to-amber-900/10',
          textColor: 'text-amber-400',
          borderColor: 'border-[#f59e0b]/50',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
          accentColor: '#f59e0b',
          accentColorBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'jaiclub':
        return {
          logo: 'https://i.ibb.co/2Yf609DL/Untitled-17-June-2026-at-09-27-49.png',
          bigLogo: 'https://i.ibb.co/2Yf609DL/Untitled-17-June-2026-at-09-27-49.png',
          modalLogoScale: 'scale-[1.25] min-[360px]:scale-[1.4]',
          title: 'JAI CLUB',
          color: 'from-purple-950/45 via-[#0e0f13] to-pink-900/10',
          textColor: 'text-[#d946ef]',
          borderColor: 'border-[#d946ef]/50',
          glow: 'shadow-[0_0_20px_rgba(217,70,239,0.4)]',
          accentColor: '#d946ef',
          accentColorBg: 'bg-[#d946ef]/10 text-[#d946ef] border-[#d946ef]/20'
        };
      case 'goagame':
        return {
          logo: 'https://i.ibb.co/Y75t85Mz/131178-removebg-preview.png',
          bigLogo: 'https://i.ibb.co/Y75t85Mz/131178-removebg-preview.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: 'GOA GAME',
          color: 'from-blue-950/45 via-[#0e0f13] to-blue-900/10',
          textColor: 'text-[#3b82f6]',
          borderColor: 'border-[#3b82f6]/50',
          glow: 'shadow-[0_0_25px_rgba(37,99,235,0.45)]',
          accentColor: '#2563eb',
          accentColorBg: 'bg-[#2563eb]/10 text-[#3b82f6] border-[#3b82f6]/20'
        };
      case 'ninetyoneclub':
        return {
          logo: 'https://i.ibb.co/RGs2hQZF/Adobe-Express-file-15.png',
          bigLogo: 'https://i.ibb.co/RGs2hQZF/Adobe-Express-file-15.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: '91 CLUB',
          color: 'from-red-950/45 via-[#0e0f13] to-red-900/10',
          textColor: 'text-[#ff1e27]',
          borderColor: 'border-[#ff1e27]/50',
          glow: 'shadow-[0_0_20px_rgba(255,30,39,0.35)]',
          accentColor: '#ff1e27',
          accentColorBg: 'bg-red-500/10 text-[#ff1e27] border-red-500/20'
        };
      case 'bdgwin':
        return {
          logo: 'https://i.ibb.co/2Y5NDFQT/Adobe-Express-file-16.png',
          bigLogo: 'https://i.ibb.co/2Y5NDFQT/Adobe-Express-file-16.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: 'BDG WIN',
          color: 'from-amber-950/45 via-[#0e0f13] to-[#F0D597]/10',
          textColor: 'text-[#F0D597]',
          borderColor: 'border-[#F0D597]/50',
          glow: 'shadow-[0_0_20px_rgba(240,213,151,0.35)]',
          accentColor: '#F0D597',
          accentColorBg: 'bg-amber-500/10 text-[#F0D597] border-[#F0D597]/20'
        };
      case 'sreewin':
        return {
          logo: 'https://i.ibb.co/4g8m2jx3/app-icon.webp',
          bigLogo: 'https://i.ibb.co/6JpFH3Wr/131450-removebg-preview.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: 'SREE WIN',
          color: 'from-purple-950/45 via-[#0e0f13] to-[#8b5cf6]/10',
          textColor: 'text-[#a78bfa]',
          borderColor: 'border-[#8b5cf6]/50',
          glow: 'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
          accentColor: '#8b5cf6',
          accentColorBg: 'bg-purple-500/10 text-[#a78bfa] border-purple-500/20'
        };
      case 'sixclub':
        return {
          logo: 'https://i.ibb.co/KjDjtgkV/cropped-6club-game-logo-1.jpg',
          bigLogo: 'https://i.ibb.co/9k0zm901/131387-removebg-preview.png',
          modalLogoScale: 'scale-[1.35] min-[360px]:scale-[1.5]',
          title: '6 CLUB',
          color: 'from-amber-950/45 via-[#0e0f13] to-yellow-900/10',
          textColor: 'text-[#facc15]',
          borderColor: 'border-[#f59e0b]/50',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
          accentColor: '#f59e0b',
          accentColorBg: 'bg-amber-500/10 text-[#facc15] border-amber-500/20'
        };
      case 'veergame':
        return {
          logo: 'https://i.ibb.co/CpRLCXp7/Chat-GPT-Image-Sep-11-2026-01-14-02-AM.png',
          bigLogo: 'https://i.ibb.co/kVRgwDY0/veer-game.webp',
          modalLogoScale: 'scale-100',
          title: 'VEER GAME',
          color: 'from-emerald-950/45 via-[#0e0f13] to-green-900/10',
          textColor: 'text-[#4ade80]',
          borderColor: 'border-[#22c55e]/50',
          glow: 'shadow-[0_0_20px_rgba(34,197,94,0.35)]',
          accentColor: '#22c55e',
          accentColorBg: 'bg-emerald-500/10 text-[#4ade80] border-emerald-500/20'
        };
      case 'dmfirst':
        return {
          logo: 'https://i.ibb.co/TM9TPXqV/dmfirst-logo.png',
          bigLogo: 'https://i.ibb.co/7d352X5Y/151840-removebg-preview.png',
          modalLogoScale: 'scale-100',
          title: 'DM FIRST',
          color: 'from-emerald-950/50 via-[#0e0f13] to-amber-950/25',
          textColor: 'text-[#facc15]',
          borderColor: 'border-[#eab308]/50',
          glow: 'shadow-[0_0_20px_rgba(234,179,8,0.35)]',
          accentColor: '#eab308',
          accentColorBg: 'bg-amber-500/10 text-[#facc15] border-amber-500/20'
        };
      case 'yaarwin':
      default:
        return {
          logo: 'https://i.ibb.co/5WvxRqXs/site-Icon-2-1.png',
          bigLogo: 'https://i.ibb.co/G3sz87sw/Adobe-Express-file-1.png',
          modalLogoScale: 'scale-[1.8] min-[360px]:scale-[2.05]',
          title: 'YAAR WIN',
          color: 'from-emerald-950/45 via-[#0e0f13] to-emerald-900/10',
          textColor: 'text-[#22c55e]',
          borderColor: 'border-[#22c55e]/50',
          glow: 'shadow-[0_0_20px_rgba(34,197,94,0.35)]',
          accentColor: '#22c55e',
          accentColorBg: 'bg-emerald-500/10 text-[#22c55e] border-emerald-500/20'
        };
    }
  };

  // Sync inputs with live system period
  const handleSyncPeriod = () => {
    setPeriodInput(liveAutoPeriod.toString());
    playBeep(440, 100);
  };

  // Safe synthesizer beep for retro tactile premium feedback
  const playBeep = (frequency = 600, duration = 80) => {
    // For standard clicks or general interface taps, route to our newly engineered premium click sound
    if (frequency === 600 || frequency === 440 || frequency === 320 || frequency === 350 || frequency === 450) {
      playClickSound(soundEnabled);
    } else {
      playUnifiedBeep(frequency, duration, soundEnabled);
    }
  };

  // Immersive countdown audio synthesizer with dynamic pitch tension build-up
  const playCountdownTickSound = (second: number) => {
    playUnifiedCountdownTick(second, soundEnabled);
  };

  const handlePredict = () => {
    // Gate prediction with Server Active Key
    if (!isServerKeyActivated) {
      playUnifiedBeep(300, 150);
      setServerKeyInputError('SERVER KEY REQUIRED: Please enter a valid SERVER ACTIVE KEY first to unlock AI predictions!');
      setShowServerKeyModal(true);
      return;
    }

    if (!periodInput.trim()) {
      alert('Please enter a period number first!');
      return;
    }

    playClickSound(soundEnabled);
    setIsScanning(true);
    setScanProgress(0);
    setPredictionResult(null);

    const statuses = [
      'Synchronizing server pathways...',
      'Ingesting record results matrix...',
      'Compiling RNG history patterns...',
      'Establishing AI target scanner...',
      'Decrypting index locks & weights...',
      'Finalizing 99.4% confidence win signal...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const nextProgress = Math.min(100, prev + 2);
        
        // Update statuses incrementally
        const statusIdx = Math.min(statuses.length - 1, Math.floor((nextProgress / 100) * statuses.length));
        if (statuses[statusIdx] && statuses[statusIdx] !== scanStatus) {
          setScanStatus(statuses[statusIdx]);
          playScanTickSound(nextProgress, soundEnabled);
        }

        if (nextProgress >= 100) {
          clearInterval(interval);
          finalizePrediction();
          return 100;
        }
        return nextProgress;
      });
    }, 60);
  };

  const handleWingoPredictionClick = () => {
    const isKeyExpired = !keyInfo || keyInfo.expiresAt - Date.now() <= 0;
    if (isKeyExpired) {
      playBeep(350, 90);
      onBack();
      return;
    }

    // Gate prediction with Server Active Key: Prediction is locked until Server Active Key is verified
    if (!isServerKeyActivated) {
      playUnifiedBeep(300, 150);
      setServerKeyInputError('SERVER KEY REQUIRED: Please enter a valid SERVER ACTIVE KEY first to unlock AI predictions!');
      setShowServerKeyModal(true);
      return;
    }

    if (lastPredictedPeriodIndex !== null && String(lastPredictedPeriodIndex) === String(liveAutoPeriod)) return;
    playClickSound(soundEnabled);
    setIsScanning(true);
    setScanProgress(0);
    setPredictionResult(null);

    const statuses = [
      'Synchronizing server pathways...',
      'Ingesting record results matrix...',
      'Compiling RNG history patterns...',
      'Establishing AI target scanner...',
      'Decrypting index locks & weights...',
      'Finalizing 99.4% confidence win signal...'
    ];

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const nextProgress = Math.min(100, prev + 2);
        
        const statusIdx = Math.min(statuses.length - 1, Math.floor((nextProgress / 100) * statuses.length));
        if (statuses[statusIdx] && statuses[statusIdx] !== scanStatus) {
          setScanStatus(statuses[statusIdx]);
          playScanTickSound(nextProgress, soundEnabled);
        }

        if (nextProgress >= 100) {
          clearInterval(interval);
          finalizePrediction();
          return 100;
        }
        return nextProgress;
      });
    }, 60);
  };

  const getFormattedPeriod = () => {
    // 1. Single source of truth: Active period is ALWAYS historyList[0].period + 1
    if (historyList && historyList.length > 0 && historyList[0]?.period) {
      const topPeriod = String(historyList[0].period);
      if (/^\d+$/.test(topPeriod)) {
        try {
          return String(BigInt(topPeriod) + 1n);
        } catch {
          const num = parseInt(topPeriod);
          if (!isNaN(num)) return String(num + 1);
        }
      }
      return topPeriod;
    }

    // 2. If liveAutoPeriod is a valid full 17-digit string, use it
    if (liveAutoPeriod) {
      const pStr = String(liveAutoPeriod);
      if (pStr.length >= 15 && /^\d+$/.test(pStr)) {
        return pStr;
      }
    }

    // 3. Fallback: strictly standard 17-digit format based on UTC intervals (shifted 1 round behind)
    const offsetMs = selectedTimeMode === '30sec' ? 30 * 1000 : 60 * 1000;
    const now = new Date(Date.now() - offsetMs);
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    const totalIntervals = selectedTimeMode === '30sec'
      ? (hours * 120) + (minutes * 2) + (seconds >= 30 ? 2 : 1)
      : (hours * 60) + minutes + 1;
    const indexStr = String(totalIntervals).padStart(4, '0');
    const gameCode = selectedTimeMode === '30sec' ? '10005' : '10001';
    return `${yyyy}${mm}${dd}${gameCode}${indexStr}`;
  };

  const finalizePrediction = () => {
    let accuracy = parseFloat((96 + Math.random() * 3.5).toFixed(1)); // 96% - 99.5% accuracy
    const isWingo = activeTab === 'wingo1' || activeTab === 'wingo3';
    const currentPeriod = getFormattedPeriod();
    
    let result: 'BIG' | 'SMALL' | 'RED' | 'GREEN' | 'MULTIPLIER' = 'BIG';
    let color: 'red' | 'green' | 'purple' = 'green';
    let multiplier: string | undefined;
    let predictedNumVal: number | undefined;

    if (isWingo) {
      const up = upcomingPredictionRef.current;
      // Pre-known upcoming prediction from live API result stream
      if (up && (String(up.period) === currentPeriod || !up.period)) {
        predictedNumVal = Number(up.predictedNumber);
        result = up.result === 'SMALL' ? 'SMALL' : 'BIG';
        color = up.color === 'red' || up.color === 'purple' ? up.color : 'green';
        if (up.accuracy) {
          accuracy = Number(up.accuracy);
        }
      } else {
        // Deterministic fallback based on period seed
        if (currentPeriod && /^\d+$/.test(currentPeriod)) {
          const lastDigit = parseInt(currentPeriod.slice(-1)) || 0;
          const secondLast = parseInt(currentPeriod.slice(-2, -1)) || 0;
          predictedNumVal = (lastDigit * 7 + secondLast * 3 + 4) % 10;
        } else {
          predictedNumVal = Math.floor(Math.random() * 10);
        }
        result = predictedNumVal >= 5 ? 'BIG' : 'SMALL';
        const colType = getNumberColorType(predictedNumVal);
        color = colType === 'red-violet' || colType === 'green-violet' ? 'purple' : 
                (colType === 'red' ? 'red' : 'green');
      }
    } else {
      result = 'MULTIPLIER';
      // Typical high performance multipliers
      const ranges = [2.34, 1.85, 4.12, 1.56, 3.88, 5.25, 2.05];
      multiplier = ranges[Math.floor(Math.random() * ranges.length)].toFixed(2) + 'x';
    }

    const newRecord: PredictionRecord = {
      id: `calc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      period: isWingo ? currentPeriod : (periodInput || '601'),
      gameType: activeTab,
      result,
      multiplier,
      color: isWingo ? color : undefined,
      accuracy,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WIN',
      predictedNumber: predictedNumVal
    };

    setPredictionResult(newRecord);
    setLastPredictedPeriodIndex(String(currentPeriod));
    setIsScanning(false);
    playPredictionSuccessSound(soundEnabled);
  };

  const handleStartServer = () => {
    if (transitionState.isVisible) return;
    playBeep(800, 100);
    setShowTimerSelection(true);
  };

  const executeRealServerBoot = (chosenMode: '1min' | '30sec') => {
    setSelectedTimeMode(chosenMode);
    setShowTimerSelection(false);

    const gameInfo = getGameLogoAndTitle();
    const duration = hasBootedOnceRef.current ? 600 : 1000;

    // Trigger smooth, stutter-free cyber transition overlay
    setTransitionState({
      isVisible: true,
      mode: 'entering',
      gameTitle: gameInfo.title,
      gameLogo: gameInfo.logo,
      themeColor: gameInfo.accentColor,
      statusText: 'SYNCING SERVER',
      customMessages: [
        'SYNCING SERVER...',
        'CONNECTING NEURAL MATRIX...',
        'CALIBRATING CLOCK...'
      ],
      duration
    });

    playRadiantSuccessSound(soundEnabled);

    setTimeout(() => {
      setIsServerStarted(true);
      hasBootedOnceRef.current = true;
      onServerStateChange?.(true, selectedGame);
      playTimerSelectTransition(chosenMode, soundEnabled);

      // Smoothly hide the loader overlay
      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isVisible: false }));
      }, 100);
    }, duration);
  };

  const handleBackToGameSelection = () => {
    playUnifiedBeep(350, 90);
    const gameInfo = getGameLogoAndTitle();

    setTransitionState({
      isVisible: true,
      mode: 'exiting',
      gameTitle: gameInfo.title,
      themeColor: gameInfo.accentColor,
      statusText: 'SYNCING SERVER',
      customMessages: [
        'SYNCING SERVER...',
        'DISCONNECTING STREAM...'
      ],
      duration: 400
    });

    setTimeout(() => {
      setIsServerStarted(false);
      setSelectedGame(null);
      onServerStateChange?.(false, null);
      setPredictionResult(null);
      setLastPredictedPeriodIndex(null);
      lastProcessedPeriodIndexRef.current = null;
      setHistoryList([]);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isVisible: false }));
      }, 80);
    }, 400);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-4 md:py-6 z-10 font-iceland max-w-md mx-auto w-full select-none justify-start pb-8">
      
      {/* IMMERSIVE SERVER ACTIVE KEY POPUP MODAL */}
      <AnimatePresence>
        {showServerKeyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 font-iceland tracking-widest select-none"
            onClick={() => {
              if (!isVerifyingServerKey) {
                setShowServerKeyModal(false);
                setServerKeyInputError('');
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 25 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="w-full max-w-sm relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Cyber Connector Notch from Reference */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 bg-[#1d4ed8] z-20" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-3 bg-[#1d4ed8] z-20" />

              {/* Main Chamfered Outer Border Wrapper */}
              <div 
                className="w-full p-[1.5px] relative"
                style={{
                  clipPath: 'polygon(28px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 28px), calc(100% - 28px) 100%, 28px 100%, 0 calc(100% - 28px), 0 28px)',
                  background: 'linear-gradient(180deg, #1e3a66 0%, #0f2444 50%, #1e3a66 100%)'
                }}
              >
                <div 
                  className="w-full px-6 py-7 text-center relative bg-[#061022]"
                  style={{
                    clipPath: 'polygon(27px 0, calc(100% - 27px) 0, 100% 27px, 100% calc(100% - 27px), calc(100% - 27px) 100%, 27px 100%, 0 calc(100% - 27px), 0 27px)'
                  }}
                >
                  {/* Close Button at top-right */}
                  <button
                    type="button"
                    onClick={() => {
                      playUnifiedBeep(320, 80);
                      setShowServerKeyModal(false);
                      setServerKeyInputError('');
                    }}
                    className="absolute top-3.5 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Logo provided by user */}
                  <div className="flex items-center justify-center mx-auto mb-3">
                    <img 
                      src="https://i.ibb.co/Y7LBvq7V/image.png"
                      alt="Server Key Shield"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-contain drop-shadow-md rounded-xl"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          target.src = 'https://i.ibb.co/dJmf51m8/113106-removebg-preview.png';
                        }
                      }}
                    />
                  </div>

                  {isServerKeyActivated ? (
                    /* ALREADY ACTIVATED VIEW */
                    <div className="flex flex-col items-center">
                      <h2 className="text-2xl sm:text-[25px] font-black uppercase text-white tracking-[0.12em] mb-1.5 leading-tight font-iceland">
                        Server <span className="text-emerald-400">Activated!</span>
                      </h2>

                      <p className="text-[12px] sm:text-[13px] font-sans text-slate-300 mb-4 leading-relaxed max-w-[280px]">
                        You have already activated the server key. Your connection is live and verified. Enjoy your predictions!
                      </p>

                      {/* Active Status Badge */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold tracking-wider uppercase mb-5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>STATUS: SERVER LIVE & ACTIVE</span>
                      </div>

                      {/* ALRIGHT / CLOSE BUTTON (Exact cut corner shape) */}
                      <button
                        type="button"
                        onClick={() => {
                          playUnifiedBeep(450, 70);
                          setShowServerKeyModal(false);
                        }}
                        style={{
                          clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)'
                        }}
                        className="w-full max-w-[180px] mx-auto py-3 px-8 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#2563eb] active:brightness-95 text-white font-bold text-[16px] tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="font-sans font-bold">Alright</span>
                      </button>

                      {/* Option to change/enter new server key */}
                      <button
                        type="button"
                        onClick={() => {
                          playUnifiedBeep(300, 70);
                          setIsServerKeyActivated(false);
                          setServerKeyInputValue('');
                          setServerKeyInputError('');
                          localStorage.removeItem('drago_server_key_verified');
                          localStorage.removeItem('drago_server_key_name');
                        }}
                        className="mt-3 text-[11px] font-mono text-slate-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer transition-colors"
                      >
                        Enter Different Server Key
                      </button>
                    </div>
                  ) : (
                    /* NOT ACTIVATED VIEW - KEY INPUT FORM */
                    <div>
                      {/* Modal Title: SERVER ACTIVE KEY */}
                      <h2 className="text-2xl sm:text-[25px] font-black uppercase text-white tracking-[0.12em] mb-1 leading-tight font-iceland">
                        SERVER ACTIVE KEY
                      </h2>

                      <p className="text-[11.5px] sm:text-[12px] font-sans text-slate-300/80 mb-5 leading-normal">
                        Enter dedicated server key to unlock predictions
                      </p>

                      {/* Key Input Box */}
                      <div className="flex flex-col gap-2 w-full text-left mb-5">
                        <div className="relative w-full">
                          <input
                            type="text"
                            value={serverKeyInputValue}
                            onChange={(e) => {
                              setServerKeyInputValue(e.target.value.toUpperCase());
                              if (serverKeyInputError) setServerKeyInputError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleVerifyServerActiveKey();
                              }
                            }}
                            placeholder="ENTER SERVER ACTIVE KEY"
                            className="w-full bg-[#030914] border border-[#1b3459] focus:border-[#2563eb] rounded-lg py-3 px-4 text-cyan-100 placeholder:text-slate-500 font-mono text-sm tracking-wider outline-none transition-all"
                            autoFocus
                          />
                          {serverKeyInputValue && (
                            <button
                              type="button"
                              onClick={() => setServerKeyInputValue('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Error Banner */}
                        {serverKeyInputError && (
                          <motion.div 
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/85 border border-red-500/60 text-red-300 text-[11px] font-mono leading-tight"
                          >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{serverKeyInputError}</span>
                          </motion.div>
                        )}

                        {/* Success Banner */}
                        {serverKeySuccessMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/85 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono leading-tight"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{serverKeySuccessMessage}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* CONFIRM BUTTON (Styled with exact cut-corner shape like screenshot) */}
                      <button
                        type="button"
                        onClick={handleVerifyServerActiveKey}
                        disabled={isVerifyingServerKey}
                        style={{
                          clipPath: 'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)'
                        }}
                        className="w-full max-w-[200px] mx-auto py-3 px-8 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#2563eb] active:brightness-95 text-white font-bold text-[16px] tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      >
                        {isVerifyingServerKey ? (
                          <span className="flex items-center gap-2 text-white">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            VERIFYING...
                          </span>
                        ) : (
                          <span className="font-sans font-bold">CONFIRM</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      

      {/* Immersive 5-Second Countdown Lock Overlay with flip-card styled massive neon digits */}
      <AnimatePresence>
        {isServerStarted && wingoTimeLeft >= 1 && wingoTimeLeft <= 5 && predictionResult !== null && (
          <motion.div
            key="countdown-lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-40 select-none px-6"
          >
            {/* Ambient cyber background particles and colored glow depending on selected game */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 m-auto w-[350px] h-[350px] rounded-full blur-[140px] opacity-45 animate-pulse"
                style={{ 
                  backgroundColor: isBdgTheme ? '#F0D597' :
                                   isSixClubTheme ? '#f59e0b' :
                                   isVeerGameTheme ? '#22c55e' :
                                   isDmFirstTheme ? '#eab308' :
                                   isSreeWinTheme ? '#8b5cf6' :
                                   isRedTheme || isNinetyOneTheme ? '#ff1e27' :
                                   isJalwaTheme ? '#61DACC' :
                                   isTirangaTheme || isGoaTheme ? '#6495ED' :
                                   isFiftyOneTheme ? '#f59e0b' :
                                   isJaiClubTheme ? '#d946ef' : '#21F102' 
                }}
              />
            </div>

            {/* Flip digital countdown card cluster */}
            <div className="flex items-center gap-4 sm:gap-6 relative z-10">
              {/* Digit 0 flip box */}
              <motion.div 
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="relative w-28 sm:w-32 h-[140px] sm:h-[160px] rounded-3xl overflow-hidden flex flex-col justify-between items-center shadow-[0_12px_45px_rgba(0,0,0,0.85)] border border-white/5"
                style={{
                  background: isBdgTheme ? 'linear-gradient(to bottom, #d4af37, #b58d10)' :
                              isSixClubTheme ? 'linear-gradient(to bottom, #d97706, #b45309)' :
                              isVeerGameTheme ? 'linear-gradient(to bottom, #16a34a, #14532d)' :
                              isDmFirstTheme ? 'linear-gradient(to bottom, #047857, #ca8a04)' :
                              isSreeWinTheme ? 'linear-gradient(to bottom, #8b5cf6, #581c87)' :
                              isRedTheme || isNinetyOneTheme ? 'linear-gradient(to bottom, #dc2626, #991b1b)' :
                              isJalwaTheme ? 'linear-gradient(to bottom, #0d9488, #0f766e)' :
                              isTirangaTheme || isGoaTheme ? 'linear-gradient(to bottom, #2563eb, #1e3a8a)' :
                              isFiftyOneTheme ? 'linear-gradient(to bottom, #d97706, #b45309)' :
                              isJaiClubTheme ? 'linear-gradient(to bottom, #c084fc, #86198f)' :
                              'linear-gradient(to bottom, #22c55e, #15803d)'
                }}
              >
                {/* Horizontal Flip Splice Line */}
                <div className="absolute top-[50%] left-0 right-0 h-[3px] bg-black/25 z-20 shadow-[0_1px_1px_rgba(255,255,255,0.15)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10 pointer-events-none z-10" />
                <div className="flex-1 flex items-center justify-center font-sans font-black text-white text-[95px] sm:text-[110px] leading-none select-none tracking-none h-full pt-1.5">
                  0
                </div>
              </motion.div>

              {/* Dynamic countdown digit flip box */}
              <motion.div 
                key={wingoTimeLeft}
                initial={{ rotateX: -90, scale: 0.85, filter: 'brightness(0.3)' }}
                animate={{ rotateX: 0, scale: 1, filter: 'brightness(1)' }}
                exit={{ rotateX: 90, scale: 0.85, filter: 'brightness(0.3)' }}
                transition={{ type: 'spring', damping: 14, stiffness: 250 }}
                className="relative w-28 sm:w-32 h-[140px] sm:h-[160px] rounded-3xl overflow-hidden flex flex-col justify-between items-center shadow-[0_12px_45px_rgba(0,0,0,0.85)] border border-white/5"
                style={{
                  background: isBdgTheme ? 'linear-gradient(to bottom, #d4af37, #b58d10)' :
                              isSixClubTheme ? 'linear-gradient(to bottom, #d97706, #b45309)' :
                              isVeerGameTheme ? 'linear-gradient(to bottom, #16a34a, #14532d)' :
                              isDmFirstTheme ? 'linear-gradient(to bottom, #047857, #ca8a04)' :
                              isSreeWinTheme ? 'linear-gradient(to bottom, #8b5cf6, #581c87)' :
                              isRedTheme || isNinetyOneTheme ? 'linear-gradient(to bottom, #dc2626, #991b1b)' :
                              isJalwaTheme ? 'linear-gradient(to bottom, #0d9488, #0f766e)' :
                              isTirangaTheme || isGoaTheme ? 'linear-gradient(to bottom, #2563eb, #1e3a8a)' :
                              isFiftyOneTheme ? 'linear-gradient(to bottom, #d97706, #b45309)' :
                              isJaiClubTheme ? 'linear-gradient(to bottom, #c084fc, #86198f)' :
                              'linear-gradient(to bottom, #22c55e, #15803d)'
                }}
              >
                {/* Horizontal Flip Splice Line */}
                <div className="absolute top-[50%] left-0 right-0 h-[3px] bg-black/25 z-20 shadow-[0_1px_1px_rgba(255,255,255,0.15)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10 pointer-events-none z-10" />
                <div className="flex-1 flex items-center justify-center font-sans font-black text-white text-[95px] sm:text-[110px] leading-none select-none tracking-none h-full pt-1.5">
                  {wingoTimeLeft}
                </div>
              </motion.div>
            </div>

            {/* Glowing dynamic floor shadow reflecting the neon card colors */}
            <div 
              className="w-48 h-5 rounded-full blur-xl mx-auto opacity-60 mt-4 animate-pulse pointer-events-none"
              style={{
                backgroundColor: isBdgTheme ? '#d4af37' :
                                 isSixClubTheme ? '#f59e0b' :
                                 isVeerGameTheme ? '#22c55e' :
                                 isDmFirstTheme ? '#eab308' :
                                 isSreeWinTheme ? '#8b5cf6' :
                                 isRedTheme || isNinetyOneTheme ? '#ff1e27' :
                                 isJalwaTheme ? '#61DACC' :
                                 isTirangaTheme || isGoaTheme ? '#6495ED' :
                                 isFiftyOneTheme ? '#f59e0b' :
                                 isJaiClubTheme ? '#d946ef' : '#21F102'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN VICTORY CELEBRATION MODAL - STAYS OPEN UNTIL USER TOUCHES SCREEN OR CLICKS GOT IT */}
      <AnimatePresence>
        {showWinCelebration && (
          <motion.div
            key="win-celebration-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              playClickSound();
              setShowWinCelebration(false);
            }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between z-50 select-none px-6 py-8 sm:py-10 cursor-pointer"
          >
            {/* Ambient cyber background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 m-auto w-[400px] h-[400px] rounded-full blur-[140px] opacity-45 animate-pulse"
                style={{ 
                  backgroundColor: isBdgTheme ? '#F0D597' :
                                   isSixClubTheme ? '#f59e0b' :
                                   isVeerGameTheme ? '#22c55e' :
                                   isDmFirstTheme ? '#eab308' :
                                   isSreeWinTheme ? '#8b5cf6' :
                                   isRedTheme || isNinetyOneTheme ? '#ff1e27' :
                                   isJalwaTheme ? '#61DACC' :
                                   isTirangaTheme || isGoaTheme ? '#6495ED' :
                                   isFiftyOneTheme ? '#f59e0b' :
                                   isJaiClubTheme ? '#d946ef' : '#21F102' 
                }}
              />
            </div>

            {/* Top spacing */}
            <div className="w-full h-2 sm:h-4 pointer-events-none" />

            {/* Victory Mascot + Title Centered Content */}
            <motion.div
              initial={{ scale: 0.88, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              onClick={(e) => {
                // Clicking content closes as well
                playClickSound();
                setShowWinCelebration(false);
              }}
              className="relative w-full max-w-[420px] flex flex-col items-center justify-center my-auto"
            >
              {/* Animated Lottie robot logo fetched directly from GitHub JSON - enlarged slightly */}
              <div className="w-[280px] h-[280px] min-[390px]:w-[315px] min-[390px]:h-[315px] sm:w-[350px] sm:h-[350px] flex items-center justify-center mb-4">
                <WinCelebrationSticker className="w-full h-full" />
              </div>

              {/* Premium styled victory heading "Hurray! We Won!" matching screenshot */}
              <motion.h2 
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-white text-[27px] min-[390px]:text-[31px] sm:text-[35px] font-extrabold font-oxanium tracking-wide text-center drop-shadow-[0_0_15px_rgba(33,241,2,0.4)] whitespace-nowrap"
              >
                Hurray! We Won!
              </motion.h2>
            </motion.div>

            {/* Prominent Bottom "GOT IT" Button strictly aligned at the bottom */}
            <div className="w-full max-w-[360px] pb-4 sm:pb-6 relative z-20">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  setShowWinCelebration(false);
                }}
                className="w-full py-4 px-8 font-oxanium font-black tracking-widest uppercase text-base sm:text-lg text-black rounded-lg transition-all duration-200 shadow-[0_0_30px_rgba(33,241,2,0.6)] cursor-pointer"
                style={{
                  backgroundColor: isBdgTheme ? '#F0D597' :
                                   isSixClubTheme ? '#f59e0b' :
                                   isVeerGameTheme ? '#22c55e' :
                                   isDmFirstTheme ? '#eab308' :
                                   isSreeWinTheme ? '#8b5cf6' :
                                   isRedTheme || isNinetyOneTheme ? '#ff1e27' :
                                   isJalwaTheme ? '#61DACC' :
                                   isTirangaTheme || isGoaTheme ? '#6495ED' :
                                   isFiftyOneTheme ? '#f59e0b' :
                                   isJaiClubTheme ? '#d946ef' : '#21F102',
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)'
                }}
              >
                GOT IT
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STRICT KEY EXPIRED ANTI-BYPASS MODAL */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div
            key="expired-key-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 font-iceland tracking-widest select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#1c0707] via-[#110303] to-[#080101] border-2 border-red-500/70 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center relative overflow-hidden flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
                <Flame className="w-8 h-8" />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-red-400 uppercase tracking-widest leading-none">
                  KEY EXPIRED!
                </h3>
                <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                  ACCESS REVOKED &amp; BURNT
                </span>
              </div>

              <p className="text-sm text-slate-300 font-sans normal-case leading-relaxed">
                Your portal access key lease has ended. Expired keys are permanently burnt and cannot be reused on any device.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowExpiredModal(false);
                  onBack();
                }}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:brightness-110 active:scale-98 text-white font-black text-base uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                ENTER NEW KEY
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Timer Cycle Selection Modal matching the sleek reference design */}
      <AnimatePresence>
        {showTimerSelection && (() => {
          const gameInfo = getGameLogoAndTitle();
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-[10px] flex items-center justify-center p-4 z-50 select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 25, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 25, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                className="w-[310px] min-[360px]:w-[330px] sm:w-[350px] relative rounded-2xl overflow-hidden pt-8 pb-6 px-6 sm:px-7 border"
                style={{
                  background: 'linear-gradient(180deg, #0a111a 0%, #060a12 50%, #020408 100%)',
                  borderColor: `${gameInfo.accentColor}35`,
                  boxShadow: `0 25px 60px rgba(0,0,0,0.95), 0 0 35px ${gameInfo.accentColor}25`
                }}
              >
                {/* Top Glowing Beam in game color with downward radiant glow */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2.5px] z-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${gameInfo.accentColor} 25%, #ffffff 50%, ${gameInfo.accentColor} 75%, transparent 100%)`,
                    boxShadow: `0 0 14px 2px ${gameInfo.accentColor}, 0 2px 25px 6px ${gameInfo.accentColor}95`
                  }}
                />
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-20 pointer-events-none z-10"
                  style={{
                    background: `radial-gradient(ellipse at top, ${gameInfo.accentColor}40 0%, transparent 75%)`
                  }}
                />

                {/* Bottom Glowing Beam in game color with upward radiant glow */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] z-20 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${gameInfo.accentColor} 25%, #ffffff 50%, ${gameInfo.accentColor} 75%, transparent 100%)`,
                    boxShadow: `0 0 14px 2px ${gameInfo.accentColor}, 0 -2px 25px 6px ${gameInfo.accentColor}95`
                  }}
                />
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-16 pointer-events-none z-10"
                  style={{
                    background: `radial-gradient(ellipse at bottom, ${gameInfo.accentColor}30 0%, transparent 75%)`
                  }}
                />

                {/* Inner Contents */}
                <div className="relative z-20 w-full flex flex-col items-center">
                  {/* Big Game Logo - centered without white background page */}
                  <div className="flex justify-center items-center h-[75px] min-[360px]:h-[85px] sm:h-[95px] mb-3 min-[360px]:mb-4 relative z-20 w-full overflow-visible">
                    {selectedGame === 'sreewin' ? (
                      <div className="h-[90px] min-[360px]:h-[105px] sm:h-[115px] flex items-center justify-center filter drop-shadow-[0_8px_24px_rgba(139,92,246,0.8)]">
                        <SreeWinLogo className="h-full w-auto max-w-[280px] object-contain scale-[1.35] min-[360px]:scale-[1.5]" />
                      </div>
                    ) : selectedGame === 'veergame' ? (
                      <img 
                        src="https://i.ibb.co/kVRgwDY0/veer-game.webp" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/games/veer-bada.webp';
                        }}
                        alt="VEER GAME" 
                        className="h-[52px] min-[360px]:h-[62px] sm:h-[70px] w-auto max-w-[200px] min-[360px]:max-w-[220px] object-contain filter drop-shadow-[0_6px_18px_rgba(34,197,94,0.65)] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : selectedGame === 'dmfirst' ? (
                      <img 
                        src="https://i.ibb.co/7d352X5Y/151840-removebg-preview.png" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/games/dmfirst-bada.png';
                        }}
                        alt="DM FIRST" 
                        className="h-[52px] min-[360px]:h-[62px] sm:h-[70px] w-auto max-w-[200px] min-[360px]:max-w-[220px] object-contain filter drop-shadow-[0_6px_18px_rgba(234,179,8,0.75)] transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img 
                        src={gameInfo.bigLogo || gameInfo.logo} 
                        alt={gameInfo.title} 
                        className={`h-[90px] min-[360px]:h-[105px] sm:h-[115px] w-auto max-w-[280px] object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] transition-transform duration-300 ${gameInfo.modalLogoScale || 'scale-125'}`}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* PREDICTION TIME Header in bold modern font */}
                  <div className="text-center mb-4">
                    <h2 
                      className="text-[20px] min-[360px]:text-[22px] sm:text-[23px] font-extrabold tracking-[0.14em] uppercase leading-none"
                      style={{ fontFamily: "'Montserrat', 'Orbitron', sans-serif" }}
                    >
                      <span 
                        className="text-[#00E5FF]"
                        style={{ 
                          textShadow: '0 0 16px rgba(0, 229, 255, 0.8), 0 0 28px rgba(0, 229, 255, 0.45)' 
                        }}
                      >
                        PREDICTION
                      </span>{' '}
                      <span className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                        TIME
                      </span>
                    </h2>
                  </div>

                  {/* Timer Option Boxes - distinct box for each per user request */}
                  <div className="flex flex-col gap-3 my-3 relative z-20 w-full px-1">
                    {/* 30 SECONDS BOX */}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: `0 0 22px ${gameInfo.accentColor}35` }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => executeRealServerBoot('30sec')}
                      className="group relative w-full py-3.5 px-4 rounded-xl border flex items-center justify-between transition-all duration-300 cursor-pointer overflow-hidden text-left"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 12, 22, 0.95) 100%)',
                        borderColor: `${gameInfo.accentColor}45`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`
                      }}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 25% 50%, ${gameInfo.accentColor}22 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-center gap-3.5 relative z-10">
                        <div 
                          className="w-[3.5px] h-6 rounded-full transition-all duration-200 group-hover:h-7 group-hover:w-[4px]"
                          style={{ 
                            backgroundColor: gameInfo.accentColor,
                            boxShadow: `0 0 10px ${gameInfo.accentColor}, 0 0 18px ${gameInfo.accentColor}90` 
                          }}
                        />
                        <span 
                          className="text-white font-black text-[16px] min-[360px]:text-[17px] tracking-[0.08em] uppercase group-hover:text-cyan-300 transition-colors"
                          style={{ fontFamily: "'Montserrat', 'Orbitron', sans-serif" }}
                        >
                          30 SECONDS
                        </span>
                      </div>
                      <span 
                        className="relative z-10 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md border text-slate-300"
                        style={{
                          borderColor: `${gameInfo.accentColor}35`,
                          backgroundColor: `${gameInfo.accentColor}15`
                        }}
                      >
                        30S
                      </span>
                    </motion.button>

                    {/* 1 MINUTE BOX */}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: `0 0 22px ${gameInfo.accentColor}35` }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => executeRealServerBoot('1min')}
                      className="group relative w-full py-3.5 px-4 rounded-xl border flex items-center justify-between transition-all duration-300 cursor-pointer overflow-hidden text-left"
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 12, 22, 0.95) 100%)',
                        borderColor: `${gameInfo.accentColor}45`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`
                      }}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 25% 50%, ${gameInfo.accentColor}22 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-center gap-3.5 relative z-10">
                        <div 
                          className="w-[3.5px] h-6 rounded-full transition-all duration-200 group-hover:h-7 group-hover:w-[4px]"
                          style={{ 
                            backgroundColor: gameInfo.accentColor,
                            boxShadow: `0 0 10px ${gameInfo.accentColor}, 0 0 18px ${gameInfo.accentColor}90` 
                          }}
                        />
                        <span 
                          className="text-white font-black text-[16px] min-[360px]:text-[17px] tracking-[0.08em] uppercase group-hover:text-cyan-300 transition-colors"
                          style={{ fontFamily: "'Montserrat', 'Orbitron', sans-serif" }}
                        >
                          1 MINUTE
                        </span>
                      </div>
                      <span 
                        className="relative z-10 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md border text-slate-300"
                        style={{
                          borderColor: `${gameInfo.accentColor}35`,
                          backgroundColor: `${gameInfo.accentColor}15`
                        }}
                      >
                        1M
                      </span>
                    </motion.button>
                  </div>

                  {/* Solid Red CANCEL Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      playBeep(320, 100);
                      setShowTimerSelection(false);
                    }}
                    className="w-full mt-3 py-3 bg-[#dc2626] hover:bg-[#ef4444] active:bg-[#b91c1c] text-white font-extrabold text-sm sm:text-base tracking-[0.2em] uppercase rounded-lg shadow-[0_4px_18px_rgba(220,38,38,0.55)] transition-all duration-200 cursor-pointer block text-center"
                    style={{ fontFamily: "'Montserrat', 'Orbitron', sans-serif" }}
                  >
                    CANCEL
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      
      {/* Top Header Controls Bar - Clean, Minimal back button only */}
      {isServerStarted && (
        <div className="w-full flex items-center justify-start mb-2">
          <button
            onClick={handleBackToGameSelection}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:text-white text-[11px] font-extrabold tracking-widest uppercase cursor-pointer duration-200 ${
              selectedGame === 'eightytwolottery' || selectedGame === 'ninetyoneclub'
                ? 'border-red-500/35 bg-red-950/30 text-red-400 hover:bg-red-500/20'
                : selectedGame === 'jalwagame'
                ? 'border-teal-500/35 bg-teal-950/30 text-teal-400 hover:bg-teal-500/20'
                : selectedGame === 'tiranga' || selectedGame === 'goagame'
                ? 'border-blue-500/35 bg-blue-950/30 text-blue-400 hover:bg-blue-500/20'
                : selectedGame === 'fiftyonegame'
                ? 'border-amber-500/35 bg-amber-950/30 text-amber-400 hover:bg-amber-500/20'
                : selectedGame === 'jaiclub'
                ? 'border-purple-500/35 bg-purple-950/30 text-purple-400 hover:bg-purple-500/20'
                : selectedGame === 'sreewin'
                ? 'border-purple-500/35 bg-purple-950/30 text-purple-400 hover:bg-purple-500/20'
                : selectedGame === 'bdgwin' || selectedGame === 'sixclub' || selectedGame === 'dmfirst'
                ? 'border-amber-500/35 bg-amber-950/30 text-amber-400 hover:bg-amber-500/20'
                : 'border-emerald-500/35 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isServerStarted ? (
          /* EXQUISITE CYBERPUNK PREMIUM GAMING LANDING PAGE */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm mx-auto flex flex-col justify-start flex-1 gap-4 relative pt-1 pb-44"
          >
            {/* TOP SECTION: Clean, ultra-premium matte Dark Navy cyberpunk box with 90-degree top corners and tech cuts (chamfer) on the bottom corners */}
            <div 
              className="w-full bg-gradient-to-br from-[#1d4ed8]/70 via-[#1e3a8a]/50 to-[#0f172a] p-[1.5px] shadow-[0_15px_35px_rgba(2,8,23,0.85)] relative overflow-hidden z-10 transition-all duration-300"
              style={{
                clipPath: "polygon(0px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0px calc(100% - 22px))"
              }}
            >
              {/* Inner container to match the border cut exactly in Dark Navy Theme */}
              <div 
                className="w-full bg-gradient-to-br from-[#0a1428] via-[#071124] to-[#030915] px-4 py-3 flex flex-col gap-2 relative overflow-hidden"
                style={{
                  clipPath: "polygon(0px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 21px 100%, 0px calc(100% - 21px))"
                }}
              >
                {/* Ambient Dark Navy subtle top glow */}
                <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between w-full relative z-10 gap-2">
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Left Side: Drago Logo */}
                    <div className="w-14 h-14 min-[360px]:w-16 min-[360px]:h-16 md:w-18 md:h-18 flex items-center justify-center relative shrink-0">
                      <img
                        src="https://i.ibb.co/dJmf51m8/113106-removebg-preview.png"
                        alt="DRAGO LOGO"
                        className="w-full h-full object-contain z-10 filter drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)]"
                        onError={(e) => {
                          const currentSrc = e.currentTarget.src;
                          if (!currentSrc.includes('113106-removebg-preview')) {
                            e.currentTarget.src = 'https://i.ibb.co/dJmf51m8/113106-removebg-preview.png';
                          } else {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback_el = parent.querySelector('.logo-fallback');
                              if (fallback_el) fallback_el.classList.remove('hidden');
                            }
                          }
                        }}
                        referrerPolicy="no-referrer"
                        id="drago-header-logo-img"
                      />
                      
                      {/* Fallback stylized SVG Dragon Icon */}
                      <div className="logo-fallback hidden absolute inset-0 flex flex-col items-center justify-center z-0">
                        <span className="text-2xl font-bold">🐉</span>
                        <span className="text-[8px] tracking-widest text-[#1A3A78] font-bold font-sans">DRAGO</span>
                      </div>
                    </div>

                    {/* Right Side: Title & Subtitle Stack */}
                    <div className="flex flex-col justify-center text-left">
                      {/* Header Title: Drago Predictor 4.0 - Prominently enlarged per user request */}
                      <h1 className="text-[23px] min-[360px]:text-[26px] min-[390px]:text-[28px] md:text-[32px] font-black font-iceland tracking-wider leading-none whitespace-nowrap text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                        Drago <span className="text-cyan-400 font-black drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">Predictor </span>4.0
                      </h1>
                      <p className="text-[11px] min-[360px]:text-[12px] md:text-[13px] font-semibold font-orbitron tracking-widest text-blue-100/90 mt-1.5 leading-tight whitespace-nowrap">
                        Smart Ai Predictions
                      </p>
                    </div>
                  </div>

                </div>

                {/* Clean, high-tech horizontal divider line separating header and game selection */}
                <div className="w-full border-t border-blue-900/40 mt-1 relative z-10" />

                {/* Centered PLEASE SELECT GAME SERVER text */}
                <div className="flex flex-col w-full mt-1.5 select-none relative z-10 pb-0.5">
                  <div className="text-center w-full">
                    <p className="text-[13px] min-[360px]:text-[14.5px] min-[390px]:text-[16px] md:text-[18px] font-bold uppercase tracking-[0.14em] min-[360px]:tracking-[0.2em] font-iceland leading-none whitespace-nowrap">
                      <span className="text-white">PLEASE </span>
                      <span className="text-cyan-400 font-extrabold">SELECT </span>
                      <span className="text-white">GAME </span>
                      <span className="text-cyan-400 font-extrabold">SERVER</span>
                    </p>
                  </div>

                  {/* High Tech Interactive Simulation Dropdown Drawer Console - Allows direct verification that days decay and key expires */}
                  {showKeyConsole && (
                    <div className="w-full mt-2 px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-[#07080c] shadow-[inset_0_0_10px_rgba(0,162,255,0.05)] flex flex-col gap-2.5 text-left transition-all duration-300 max-w-full">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-800/50">
                        <span className="text-xs font-bold text-cyan-300/80 tracking-widest font-mono uppercase">PORTAL SECURITY LEASE</span>
                        <span className="text-[10px] text-white/40 font-mono font-medium tracking-normal select-none">ID: #{maskKeyLastSixCharacters(keyInfo?.keyName || 'DRAGO-VIP-KEY')}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-iceland">ACTIVATION TYPE</span>
                          <span className="text-sm font-bold text-[#61DACC] font-iceland tracking-wider">{maskKeyLastSixCharacters(keyInfo?.keyName || 'DRAGO-VIP-KEY')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-iceland">TIMELINE REMAINING</span>
                          <span className="text-sm font-bold text-amber-300 font-mono tracking-wide">{formatTimeLeft(timeLeftMs)}</span>
                        </div>
                      </div>

                      <div className="mt-1 pt-2 border-t border-slate-800/50 flex flex-col gap-2">
                        <span className="text-[10px] text-amber-500/85 uppercase tracking-[0.15em] font-iceland text-center font-semibold">
                          --- TESTING AND DECAY SIMULATOR MODULE ---
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2 mt-0.5">
                          {/* Fast-forward simulator - subtracts 1 day instantly from lease */}
                          <button
                            type="button"
                            onClick={() => simulateDaysPassed(1)}
                            className="bg-amber-950/20 hover:bg-amber-950/45 border border-amber-500/30 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg text-xs font-iceland tracking-widest uppercase font-bold text-center duration-150 active:scale-95 cursor-pointer"
                          >
                            -1 Day Decay
                          </button>

                          {/* Fast-forward simulator - subtracts 5 days instantly from lease */}
                          <button
                            type="button"
                            onClick={simulateInstantExpiration}
                            className="bg-red-950/25 hover:bg-red-950/50 border border-red-500/35 hover:border-red-400 text-red-300 py-1.5 px-2 rounded-lg text-xs font-iceland tracking-widest uppercase font-bold text-center duration-150 active:scale-95 cursor-pointer"
                          >
                            INSTANT EXPIRE
                          </button>
                        </div>
                        <p className="text-[9px] text-white/40 normal-case leading-normal font-sans italic text-center">
                          Use buttons above to test decrement and auto-expiration redirection logic.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticker positioned below the top box and above the game card - Telegram Muscle Dog Animation */}
            <div className="w-full flex justify-center -my-1 relative z-20">
              <MuscleDogSticker className="w-44 h-44 sm:w-52 sm:h-52" />
            </div>

            {/* GAME CONTENT SECTION */}
            {true ? (
              <div className="w-full flex flex-col gap-4 mt-2">
                {/* Game Card - Cyberpunk card with 90-degree bottom-left and top-right, and chamfers at top-left and bottom-right */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #10b981 0%, #059669 20%, #064e3b 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #6ee7b7 0%, rgba(16, 185, 129, 0.6) 35%, rgba(5, 150, 105, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(16, 185, 129, 0.45)"
                    }}
                  />

                  {/* Glowing Dark Green backdrop effect for extra dimension */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(16,185,129,0.45) 0%, rgba(5,150,105,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered Wingo logo from the requested URL - positioned higher and streamlined */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10" id="future-custom-placement">
                    <img 
                      src="https://i.ibb.co/G3sz87sw/Adobe-Express-file-1.png" 
                      alt="Wingo Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(16,185,129,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Corner site icon placed with comfortable gap above START SERVER */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/5WvxRqXs/site-Icon-2-1.png" 
                      alt="Yaarwin Site Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)] rounded-2xl border-2 border-[#10b981]/70 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        Yaar Win
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape as requested */}
                      <a 
                        href={settings.gameLinks?.yaarwin || "https://yaarwin.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#6ee7b7] to-[#10b981] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-emerald-200 to-[#34d399] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('yaarwin');
                      handleStartServer();
                    }}
                    id="drago-start-server-btn"
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(16,185,129,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #059669, #10b981, #047857)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* 82 LOTTERY GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #ef4444 0%, #dc2626 20%, #7f1d1d 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fca5a5 0%, rgba(239, 68, 68, 0.6) 35%, rgba(220, 38, 38, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(239, 68, 68, 0.45)"
                    }}
                  />

                  {/* Glowing Dark Red backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(239,68,68,0.45) 0%, rgba(185,28,28,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered Wingo logo from the requested URL - positioned higher and streamlined */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/Xf3mrhQs/Untitled-11-June-2026-at-14-45-16.png" 
                      alt="82 Lottery Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(239,68,68,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Corner site icon, "82 Lottery" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/9kyC9Kj7/IMG-20260611-144339.jpg" 
                      alt="82 Lottery Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)] rounded-2xl border-2 border-[#ef4444]/70 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        82 Lottery
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.eightytwolottery || "https://82lottery.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fca5a5] to-[#ef4444] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-red-200 to-[#f87171] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('eightytwolottery');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(239,68,68,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #b91c1c, #ef4444, #991b1b)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* JALWA GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #2dd4bf 0%, #0d9488 20%, #042f2e 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #99f6e4 0%, rgba(45, 212, 191, 0.6) 35%, rgba(13, 148, 136, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(45, 212, 191, 0.45)"
                    }}
                  />

                  {/* Glowing Teal backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(45,212,191,0.45) 0%, rgba(13,148,136,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered logo from the requested URL - positioned higher and streamlined */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/gZCkyBHW/Adobe-Express-file-2.png" 
                      alt="Jalwa Game Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(45,212,191,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Corner site icon, "JALWA GAME" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/C3z8tfrt/images-3.jpg" 
                      alt="Jalwa Game Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(45,212,191,0.5)] rounded-2xl border-2 border-[#2dd4bf]/70 shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        JALWA GAME
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.jalwagame || "https://jalwagame.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#99f6e4] to-[#14b8a6] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(45,212,191,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-teal-200 to-[#2dd4bf] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('jalwagame');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(45,212,191,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #0d9488, #2dd4bf, #0f766e)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* TIRANGA CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 20%, #1e40af 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #bfdbfe 0%, rgba(59, 130, 246, 0.6) 35%, rgba(37, 99, 235, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(59, 130, 246, 0.45)"
                    }}
                  />

                  {/* Glowing Blue backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(59,130,246,0.45) 0%, rgba(37,99,235,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered logo from the requested URL - positioned higher and streamlined */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/cSRGgtTs/Untitled-11-June-2026-at-15-19-06.png" 
                      alt="Tiranga Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(59,130,246,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Corner site icon, "TIRANGA" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/5X77Znb6/ff808081922891f201922cd7564505f6-large.png" 
                      alt="Tiranga Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(59,130,246,0.5)] rounded-2xl border-2 border-[#3b82f6]/70 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        TIRANGA
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.tiranga || "https://tiranggame.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#bfdbfe] to-[#3b82f6] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-blue-200 to-[#60a5fa] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('tiranga');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(59,130,246,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1e40af)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* 51 GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #f59e0b 0%, #d97706 20%, #78350f 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fef08a 0%, rgba(245, 158, 11, 0.6) 35%, rgba(217, 119, 6, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(245, 158, 11, 0.45)"
                    }}
                  />

                  {/* Glowing Amber backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(245,158,11,0.45) 0%, rgba(217,119,6,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered logo from requested URL - shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/chhhCW1y/Untitled-17-June-2026-at-10-34-00.png" 
                      alt="51 Game Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "51 GAME" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/XfRq7zhD/favicon.jpg" 
                      alt="51 Game Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] rounded-2xl border-2 border-[#f59e0b]/70 shadow-[0_0_15px_rgba(217,119,6,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        51 GAME
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.fiftyonegame || "https://51game.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fde68a] to-[#f59e0b] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-amber-200 to-[#fbbf24] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('fiftyonegame');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(245,158,11,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #b45309, #f59e0b, #92400e)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* JAI CLUB CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #e879f9 0%, #d946ef 20%, #701a75 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fae8ff 0%, rgba(217, 70, 239, 0.6) 35%, rgba(192, 38, 211, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(217, 70, 239, 0.45)"
                    }}
                  />

                  {/* Glowing Cyber Synth backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(217,70,239,0.45) 0%, rgba(192,38,211,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/2Yf609DL/Untitled-17-June-2026-at-09-27-49.png" 
                      alt="Jai Club Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(217,70,239,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "JAI CLUB" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/7dw9k2Sk/images-4.jpg" 
                      alt="Jai Club Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(217,70,239,0.5)] rounded-2xl border-2 border-[#d946ef]/70 shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        JAI CLUB
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.jaiclub || "https://jaiclub.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#f5d0fe] to-[#d946ef] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(217,70,239,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-fuchsia-200 to-[#e879f9] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('jaiclub');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(217,70,239,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #a21caf, #d946ef, #86198f)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* GOA GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 16%, #1e3a8a 32%, #0f1d4a 48%, #04091a 66%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #93c5fd 0%, rgba(59, 130, 246, 0.85) 35%, rgba(29, 78, 216, 0.3) 70%, transparent 100%)",
                      boxShadow: "0 2px 18px rgba(59, 130, 246, 0.6)"
                    }}
                  />

                  {/* Glowing Cyber Synth backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-55"
                    style={{
                      background: "radial-gradient(circle at top, rgba(37,99,235,0.65) 0%, rgba(29,78,216,0.3) 45%, transparent 75%)"
                    }}
                  />

                  {/* Centered top logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-7 min-[360px]:-mt-8">
                    <img 
                      src="https://i.ibb.co/Y75t85Mz/131178-removebg-preview.png" 
                      alt="Goa Game Top Logo" 
                      className="h-[150px] min-[360px]:h-[180px] md:h-[210px] max-w-[92%] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_20px_rgba(37,99,235,0.65)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "GOA GAME" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/QvSD9bwc/Screenshot-2026-09-05-12-40-10-914-com-google-android-googlequicksearchbox-edit.jpg" 
                      alt="Goa Game Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_14px_rgba(37,99,235,0.7)] rounded-2xl border-2 border-[#3b82f6] shadow-[0_0_18px_rgba(37,99,235,0.6)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(59,130,246,0.5)"
                        }}
                      >
                        GOA GAME
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.goagame || "https://goagame.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#93c5fd] via-[#3b82f6] to-[#1d4ed8] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-blue-200 via-blue-400 to-[#60a5fa] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('goagame');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-115 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_22px_rgba(37,99,235,0.65)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #0d1bf8, #2563eb, #1d4ed8)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.8)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* 91 CLUB CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #ef4444 0%, #dc2626 20%, #7f1d1d 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fca5a5 0%, rgba(239, 68, 68, 0.6) 35%, rgba(220, 38, 38, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(239, 68, 68, 0.45)"
                    }}
                  />

                  {/* Glowing Cyber Synth backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(239,68,68,0.45) 0%, rgba(185,28,28,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/RGs2hQZF/Adobe-Express-file-15.png" 
                      alt="91 Club Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(239,68,68,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "91 CLUB" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/h1nfwLyz/91-club-app-logo.jpg" 
                      alt="91 Club Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)] rounded-2xl border-2 border-[#ef4444]/70 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        91 CLUB
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.ninetyoneclub || "https://91club.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fecaca] to-[#ef4444] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-red-200 to-[#f87171] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('ninetyoneclub');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(239,68,68,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #991b1b, #ef4444, #b91c1c)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* BDG WIN CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #f59e0b 0%, #d97706 20%, #78350f 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fef08a 0%, rgba(245, 158, 11, 0.6) 35%, rgba(217, 119, 6, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(245, 158, 11, 0.45)"
                    }}
                  />

                  {/* Glowing Cyber Synth backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(245,158,11,0.45) 0%, rgba(217,119,6,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-9 min-[360px]:-mt-10">
                    <img 
                      src="https://i.ibb.co/2Y5NDFQT/Adobe-Express-file-16.png" 
                      alt="BDG Win Top Logo" 
                      className="h-[160px] min-[360px]:h-[190px] md:h-[220px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.45)] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "BDG WIN" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/ksWPDHVB/IMG-20260611-194537.png" 
                      alt="BDG Win Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] rounded-2xl border-2 border-[#f59e0b]/70 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        BDG WIN
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.bdgwin || "https://bdgwin.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fde68a] to-[#f59e0b] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-amber-200 to-[#fbbf24] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('bdgwin');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(245,158,11,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #b45309, #f59e0b, #92400e)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* SREE WIN GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #a855f7 0%, #9333ea 20%, #581c87 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #f3e8ff 0%, rgba(168, 85, 247, 0.6) 35%, rgba(147, 51, 234, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(168, 85, 247, 0.45)"
                    }}
                  />

                  {/* Glowing Royal Violet backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(168,85,247,0.45) 0%, rgba(147,51,234,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top Sree Win logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-1 select-none -mt-7 min-[360px]:-mt-8">
                    <div className="h-[155px] min-[360px]:h-[185px] md:h-[215px] flex items-center justify-center transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(168,85,247,0.45)]">
                      <SreeWinLogo className="h-[135px] min-[360px]:h-[160px] md:h-[185px] w-auto" />
                    </div>
                  </div>

                  {/* Side icon, "Sree Win" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <SreeWinSideIcon className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px]" />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        Sree Win
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.sreewin || "https://sreewin.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#f3e8ff] to-[#a855f7] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-purple-200 to-[#c084fc] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('sreewin');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(168,85,247,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #7e22ce, #a855f7, #6b21a8)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* 6 CLUB GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #eab308 0%, #ca8a04 20%, #78350f 38%, #080e1a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fef08a 0%, rgba(234, 179, 8, 0.6) 35%, rgba(202, 138, 4, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(234, 179, 8, 0.45)"
                    }}
                  />

                  {/* Glowing Cyber Gold backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-45"
                    style={{
                      background: "radial-gradient(circle at top, rgba(234,179,8,0.45) 0%, rgba(202,138,4,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top 6 Club logo shifted higher for size */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-1 select-none -mt-7 min-[360px]:-mt-8">
                    <img 
                      src="https://i.ibb.co/9k0zm901/131387-removebg-preview.png" 
                      alt="6 Club Top Logo" 
                      className="h-[140px] min-[360px]:h-[165px] md:h-[195px] w-auto max-w-[280px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(234,179,8,0.45)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "6 Club" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/KjDjtgkV/cropped-6club-game-logo-1.jpg" 
                      alt="6 Club Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)] rounded-2xl border-2 border-[#eab308]/70 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        6 Club
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.sixclub || "https://6club.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fef08a] to-[#eab308] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-amber-200 to-[#facc15] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('sixclub');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-black font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(234,179,8,0.5)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #ca8a04, #facc15, #eab308)",
                      textShadow: "0px 1px 1px rgba(255,255,255,0.4)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* VEER GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #16a34a 0%, #15803d 20%, #14532d 38%, #031c0a 52%, #000000 68%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #86efac 0%, rgba(34, 197, 94, 0.7) 35%, rgba(21, 128, 61, 0.2) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(34, 197, 94, 0.55)"
                    }}
                  />

                  {/* Glowing Cyber Emerald backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-50"
                    style={{
                      background: "radial-gradient(circle at top, rgba(34,197,94,0.5) 0%, rgba(21,128,61,0.2) 50%, transparent 80%)"
                    }}
                  />

                  {/* Centered top Veer Game logo positioned nicely */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-1 select-none -mt-4 min-[360px]:-mt-5">
                    <img 
                      src="https://i.ibb.co/kVRgwDY0/veer-game.webp" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/games/veer-bada.webp';
                      }}
                      alt="Veer Game Top Logo" 
                      className="h-[110px] min-[360px]:h-[128px] md:h-[148px] w-auto max-w-[240px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(34,197,94,0.5)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "Veer Game" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/CpRLCXp7/Chat-GPT-Image-Sep-11-2026-01-14-02-AM.png" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/games/veer-chota.png';
                      }}
                      alt="Veer Game Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.55)] rounded-2xl border-2 border-[#22c55e]/80 shadow-[0_0_15px_rgba(34,197,94,0.45)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                        }}
                      >
                        Veer Game
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.veergame || "https://veergame.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#bbf7d0] to-[#22c55e] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(34,197,94,0.45)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-emerald-200 to-[#4ade80] bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('veergame');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-black font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(34,197,94,0.55)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #15803d, #22c55e, #16a34a)",
                      textShadow: "0px 1px 1px rgba(255,255,255,0.4)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>

                {/* DM FIRST GAME CARD */}
                <div 
                  className="w-full h-[238px] min-[360px]:h-[268px] min-[390px]:h-[285px] md:h-[325px] rounded-none shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 pt-1 px-3.5 pb-3 flex flex-col items-center justify-between border-0 mt-2"
                  style={{
                    clipPath: "polygon(18px 0px, 100% 0px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0px 100%, 0px 18px)",
                    background: "linear-gradient(180deg, #064e3b 0%, #065f46 18%, #047857 36%, #062f22 52%, #000000 70%, #000000 100%)"
                  }}
                >
                  {/* Top Accent Line blending smoothly downwards into the card color */}
                  <div 
                    className="absolute top-0 left-0 right-0 w-full h-[10px] min-[360px]:h-[12px] z-20 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, #fef08a 0%, rgba(234, 179, 8, 0.85) 35%, rgba(16, 185, 129, 0.3) 70%, transparent 100%)",
                      boxShadow: "0 2px 14px rgba(234, 179, 8, 0.6)"
                    }}
                  />

                  {/* Glowing Cyber Green & Gold backdrop effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-0 opacity-50"
                    style={{
                      background: "radial-gradient(circle at top, rgba(234,179,8,0.3) 0%, rgba(16,185,129,0.2) 45%, transparent 80%)"
                    }}
                  />

                  {/* Centered top DM First logo positioned nicely */}
                  <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-1 select-none -mt-4 min-[360px]:-mt-5">
                    <img 
                      src="https://i.ibb.co/7d352X5Y/151840-removebg-preview.png" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/games/dmfirst-bada.png';
                      }}
                      alt="DM First Top Logo" 
                      className="h-[110px] min-[360px]:h-[128px] md:h-[148px] w-auto max-w-[240px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_20px_rgba(234,179,8,0.65)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Side icon, "DM First" text and REGISTER NOW button */}
                  <div className="absolute left-3.5 bottom-[80px] min-[360px]:bottom-[86px] md:bottom-[94px] z-20 select-none flex items-center gap-2.5 min-[360px]:gap-3.5">
                    <img 
                      src="https://i.ibb.co/TM9TPXqV/dmfirst-logo.png" 
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/games/dmfirst-chota.png';
                      }}
                      alt="DM First Side Icon" 
                      className="w-[48px] h-[48px] min-[360px]:w-[56px] min-[360px]:h-[56px] md:w-[64px] md:h-[64px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.6)] rounded-2xl border-2 border-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col gap-1.5 -mt-1">
                      <span 
                        className="font-iceland font-bold tracking-wider text-[19px] min-[360px]:text-[22px] md:text-[26px] text-white select-none leading-none"
                        style={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(234,179,8,0.4)"
                        }}
                      >
                        DM First
                      </span>
                      {/* REGISTER NOW button with custom slanted cut polygon shape */}
                      <a 
                        href={settings.gameLinks?.dmfirst || "https://dmfirst.com"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[105px] min-[360px]:w-[125px] md:w-[145px] h-[20px] min-[360px]:h-[24px] md:h-[28px] group flex"
                      >
                        {/* Outer clipped border container */}
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-[#fef08a] via-[#eab308] to-[#ca8a04] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                          }}
                        />
                        {/* Inner clipped background container */}
                        <div 
                          className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                          }}
                        >
                          <span 
                            className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-400 bg-clip-text text-transparent font-black"
                            style={{
                              filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                            }}
                          >
                            REGISTER NOW
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* START SERVER Chamfered Button inside the box */}
                  <button
                    onClick={() => {
                      playBeep(440, 100);
                      setActiveTab('wingo1');
                      setSelectedGame('dmfirst');
                      handleStartServer();
                    }}
                    className="w-full py-2.5 min-[360px]:py-3 px-6 border-0 hover:brightness-110 active:scale-[0.98] text-white font-black tracking-[0.2em] font-iceland uppercase text-[19px] min-[360px]:text-[22px] rounded-none transition-all duration-200 z-10 shadow-[0_4px_18px_rgba(16,185,129,0.55)] cursor-pointer select-none flex items-center justify-center"
                    style={{
                      clipPath: "polygon(12px 0px, 100% 0px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0px 100%, 0px 12px)",
                      background: "linear-gradient(90deg, #065f46 0%, #10b981 50%, #ca8a04 100%)",
                      textShadow: "0px 1px 2px rgba(0,0,0,0.8)"
                    }}
                  >
                    START SERVER
                  </button>
                </div>
              </div>
            ) : (
              /* ACTION SECTION: Snappy cyber progress indicator when starting server */
              <div className="w-full relative z-10 mt-4">
                <div 
                  className="w-full p-[1.5px] relative overflow-hidden"
                  style={{
                    clipPath: "polygon(0px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0px calc(100% - 22px))",
                    backgroundColor: st.borderColor,
                    boxShadow: selectedGame === 'eightytwolottery' ? "0 0 20px rgba(239,68,68,0.25)" : selectedGame === 'jalwagame' ? "0 0 20px rgba(97,218,204,0.3)" : selectedGame === 'tiranga' ? "0 0 20px rgba(100,149,237,0.3)" : selectedGame === 'fiftyonegame' ? "0 0 20px rgba(245,158,11,0.35)" : selectedGame === 'jaiclub' ? "0 0 20px rgba(217,70,239,0.4)" : selectedGame === 'goagame' ? "0 0 20px rgba(100,149,237,0.45)" : selectedGame === 'ninetyoneclub' ? "0 0 20px rgba(255,30,39,0.45)" : selectedGame === 'bdgwin' ? "0 0 20px rgba(240,213,151,0.45)" : selectedGame === 'sreewin' ? "0 0 20px rgba(139,92,246,0.45)" : selectedGame === 'sixclub' ? "0 0 20px rgba(234,179,8,0.45)" : selectedGame === 'veergame' ? "0 0 20px rgba(34,197,94,0.45)" : selectedGame === 'dmfirst' ? "0 0 20px rgba(234,179,8,0.45)" : "0 0 20px rgba(34,211,238,0.25)"
                  }}
                >
                  <div 
                    className="w-full p-4 flex flex-col gap-3 relative overflow-hidden"
                    style={{
                      clipPath: "polygon(0px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 21px 100%, 0px calc(100% - 21px))",
                      backgroundColor: "#000000"
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs uppercase tracking-widest animate-pulse font-bold font-orbitron ${st.text}`}>
                        [STARTING DRAGO ENGINE SERVER] {serverProgress}%
                      </span>
                      <div className={`w-2 h-2 rounded-full animate-ping ${st.progressPing}`} />
                    </div>
                    
                    {/* Progress Line */}
                    <div className={`w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mb-1 border ${st.progressBarBorder}`}>
                      <div 
                        className={`h-full duration-75 transition-all ${st.progressBarFill}`}
                        style={{ width: `${serverProgress}%` }}
                      />
                    </div>
                    
                    {/* Status stream line */}
                    <div className={`text-[10px] font-mono tracking-widest text-center truncate italic ${st.textSoft}`}>
                      &gt;&gt; {startingStatusText}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FIXED FULL-WIDTH STATIONARY BOTTOM BANNER: WELCOME DUDE! - Pinned edge-to-edge on bottom, shows immediately */}
            <div 
              className="fixed bottom-0 left-0 right-0 w-full z-40 transition-all duration-300 pointer-events-auto bg-[#030915]"
            >
              {/* TOP GLOWING BORDER LINE - 2.5px cyan-blue neon line */}
              <div className="w-full h-[2.5px] bg-gradient-to-r from-[#1d4ed8] via-[#38bdf8] to-[#1d4ed8] shadow-[0_0_12px_rgba(56,189,248,0.7)]" />

              {/* Inner dark navy container - Streamlined height with minimized bottom gap */}
              <div 
                className="w-full max-w-lg mx-auto bg-gradient-to-b from-[#0a1428]/98 via-[#071124]/98 to-[#030915]/98 px-5 pt-3.5 pb-2 sm:px-6 sm:pt-4 sm:pb-2.5 flex flex-col gap-2 relative overflow-hidden backdrop-blur-md"
              >
                {/* Subtle top ambient glow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-14 bg-cyan-500/25 rounded-full blur-xl pointer-events-none" />

                {/* Top Row: WELCOME dude! + Server Key Activation Button */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <h2 className="text-[26px] min-[360px]:text-[29px] sm:text-[32px] font-bold font-iceland tracking-wide text-white select-none leading-none">
                    WELCOME <span className="text-cyan-400">dude!</span>
                  </h2>

                  {/* Compact SAK Button per user request */}
                  <button
                    type="button"
                    onClick={() => {
                      playUnifiedBeep(550, 80);
                      setShowServerKeyModal(true);
                      setServerKeyInputError('');
                      setServerKeySuccessMessage('');
                    }}
                    className={`relative group px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md border transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center shadow-md select-none shrink-0 ${
                      isServerKeyActivated
                        ? 'border-emerald-400/70 bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-emerald-950/90 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)] hover:brightness-110'
                        : 'border-cyan-400/70 bg-gradient-to-r from-cyan-950/90 via-blue-900/70 to-cyan-950/90 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.35)] hover:border-cyan-300 hover:shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                    }`}
                  >
                    <span className="font-iceland font-bold text-[13px] sm:text-[14px] tracking-wider uppercase whitespace-nowrap">
                      SAK
                    </span>
                  </button>
                </div>

                {/* Middle Row: Tier ("Drago Bronze") + Days Badge + Exit Button */}
                <div className="flex items-center justify-between w-full relative z-10 pt-0.5">
                  <span className="font-iceland font-black text-cyan-400 text-[20px] min-[360px]:text-[23px] sm:text-[26px] tracking-wider select-none leading-none drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                    Drago Bronze
                  </span>

                  <div className="flex items-center gap-2.5">
                    {/* Days Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#041d3d] border border-[#1e40af]/80 text-cyan-300 text-[12px] min-[360px]:text-[13px] font-iceland font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)] select-none">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="tracking-wider uppercase">{getFormattedDaysText()}</span>
                    </div>

                    {/* Exit / Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playUnifiedBeep(350, 100);
                        onBack();
                      }}
                      title="Exit / Logout"
                      className="p-2 rounded-md bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/60 hover:text-red-300 hover:border-red-400 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Key Code Row with Copy Button and Eye Toggle - 6 Letters Masked */}
                <div className="w-full pt-1.5 pb-0 flex items-center justify-between gap-2 relative z-10 border-t border-blue-900/50 mt-0.5">
                  <span className="font-mono font-medium text-[12.5px] min-[360px]:text-[13.5px] sm:text-[14.5px] text-cyan-300/90 tracking-wide truncate select-all drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                    {maskKeyLastSixCharacters(
                      keyInfo?.keyName && keyInfo.keyName !== 'FREE-TRIAL'
                        ? keyInfo.keyName
                        : 'DRAGO-VIP-KEY'
                    )}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFullKey(!showFullKey);
                        playUnifiedBeep(500, 60);
                      }}
                      title={showFullKey ? "Hide 6 letters" : "Reveal full key"}
                      className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    >
                      {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyKey}
                      title="Copy Access Key"
                      className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    >
                      {isKeyCopied ? (
                        <div className="flex items-center gap-1 text-green-400 text-[11px] font-mono font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIED</span>
                        </div>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE LIVE CALCULATOR AND PREDICTION SCREEN (isServerStarted === true) */
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col gap-3.5 select-none"
          >
            {/* Centered Game Logo - Medium scaled, upper center */}
            <div className="w-full flex justify-center mb-1 relative">
              {/* Soft circular radial background glow behind logo with dynamic theme blur */}
              <div 
                className="absolute inset-0 m-auto w-48 h-48 blur-[60px] rounded-full pointer-events-none" 
                style={{ backgroundColor: isVeerGameTheme ? 'rgba(34, 197, 94, 0.45)' : isDmFirstTheme ? 'rgba(234, 179, 8, 0.45)' : isRedTheme || isNinetyOneTheme ? 'rgba(239, 68, 68, 0.45)' : isBdgTheme ? 'rgba(240, 213, 151, 0.45)' : isSixClubTheme ? 'rgba(245, 158, 11, 0.45)' : isSreeWinTheme ? 'rgba(139, 92, 246, 0.45)' : isJalwaTheme ? 'rgba(97, 218, 204, 0.45)' : isTirangaTheme ? 'rgba(100, 149, 237, 0.45)' : isFiftyOneTheme ? 'rgba(245, 158, 11, 0.45)' : isJaiClubTheme ? 'rgba(217, 70, 239, 0.45)' : isGoaTheme ? 'rgba(37, 99, 235, 0.55)' : 'rgba(33, 241, 1, 0.42)' }}
              />
              <div 
                className="absolute inset-0 m-auto w-32 h-32 blur-[30px] rounded-full pointer-events-none" 
                style={{ backgroundColor: isVeerGameTheme ? 'rgba(134, 239, 172, 0.25)' : isDmFirstTheme ? 'rgba(254, 240, 138, 0.3)' : isRedTheme || isNinetyOneTheme ? 'rgba(254, 226, 226, 0.25)' : isBdgTheme ? 'rgba(240, 213, 151, 0.25)' : isSixClubTheme ? 'rgba(254, 240, 138, 0.25)' : isSreeWinTheme ? 'rgba(192, 132, 252, 0.25)' : isJalwaTheme ? 'rgba(97, 218, 204, 0.25)' : isTirangaTheme ? 'rgba(100, 149, 237, 0.25)' : isFiftyOneTheme ? 'rgba(245, 158, 11, 0.25)' : isJaiClubTheme ? 'rgba(217, 70, 239, 0.25)' : isGoaTheme ? 'rgba(147, 197, 253, 0.35)' : 'rgba(134, 239, 172, 0.25)' }}
              />
              {isSreeWinTheme ? (
                <div className="w-72 sm:w-[340px] flex items-center justify-center relative z-10 filter drop-shadow-[0_0_28px_rgba(139,92,246,0.7)]">
                  <SreeWinLogo className="w-full h-auto object-contain" />
                </div>
              ) : isVeerGameTheme ? (
                <div className="w-72 sm:w-[320px] flex items-center justify-center relative z-10 py-1">
                  <img
                    src="https://i.ibb.co/kVRgwDY0/veer-game.webp"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/games/veer-bada.webp';
                    }}
                    alt="Veer Game Logo"
                    className="w-auto h-16 sm:h-20 max-w-[240px] object-contain relative z-10 filter drop-shadow-[0_0_25px_rgba(34,197,94,0.75)]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : isDmFirstTheme ? (
                <div className="w-72 sm:w-[320px] flex items-center justify-center relative z-10 py-1">
                  <img
                    src="https://i.ibb.co/7d352X5Y/151840-removebg-preview.png"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/games/dmfirst-bada.png';
                    }}
                    alt="DM First Logo"
                    className="w-auto h-16 sm:h-20 max-w-[250px] object-contain relative z-10 filter drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <img
                  src={
                    isSixClubTheme
                      ? 'https://i.ibb.co/9k0zm901/131387-removebg-preview.png'
                      : isRedTheme 
                      ? 'https://i.ibb.co/1JYX2QCW/Adobe-Express-file-13.png' 
                      : isNinetyOneTheme 
                      ? 'https://i.ibb.co/RGs2hQZF/Adobe-Express-file-15.png' 
                      : isBdgTheme 
                      ? 'https://i.ibb.co/2Y5NDFQT/Adobe-Express-file-16.png' 
                      : isJalwaTheme 
                      ? 'https://i.ibb.co/gZCkyBHW/Adobe-Express-file-2.png' 
                      : isTirangaTheme 
                      ? 'https://i.ibb.co/cSRGgtTs/Untitled-11-June-2026-at-15-19-06.png' 
                      : isFiftyOneTheme 
                      ? 'https://i.ibb.co/chhhCW1y/Untitled-17-June-2026-at-10-34-00.png' 
                      : isJaiClubTheme 
                      ? 'https://i.ibb.co/2Yf609DL/Untitled-17-June-2026-at-09-27-49.png' 
                      : isGoaTheme 
                      ? 'https://i.ibb.co/Y75t85Mz/131178-removebg-preview.png' 
                      : 'https://i.ibb.co/hFzW0Kt5/IMG-20260614-234731.png'
                  }
                  alt="Game Logo"
                  className="w-72 sm:w-[340px] h-auto object-contain relative z-10"
                  style={{ 
                    filter: isRedTheme || isNinetyOneTheme 
                      ? 'drop-shadow(0 0 28px rgba(239,68,68,0.7))' 
                      : isBdgTheme 
                      ? 'drop-shadow(0 0 28px rgba(240,213,151,0.7))' 
                      : isSixClubTheme
                      ? 'drop-shadow(0 0 28px rgba(245,158,11,0.75))'
                      : isJalwaTheme 
                      ? 'drop-shadow(0 0 28px rgba(97,218,204,0.7))' 
                      : isTirangaTheme 
                      ? 'drop-shadow(0 0 28px rgba(100,149,237,0.7))' 
                      : isFiftyOneTheme 
                      ? 'drop-shadow(0 0 28px rgba(245,158,11,0.7))' 
                      : isJaiClubTheme 
                      ? 'drop-shadow(0 0 28px rgba(217, 70, 239, 0.7))' 
                      : isGoaTheme 
                      ? 'drop-shadow(0 0 28px rgba(37,99,235,0.75))' 
                      : 'drop-shadow(0 0 28px rgba(33,241,2,0.7))' 
                  }}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Wingo Sub-mode Selection Tabs (BIG/SMALL vs NUMBER) styled exactly like the capsule/cove style of the bottom bar */}
            <div id="wingo-submode-tabs" className={`w-full bg-[#030704]/90 border ${theme.borderMuted} rounded-full p-1 flex items-center justify-between font-black uppercase select-none shadow-[0_4px_15px_rgba(0,0,0,0.6)]`}>
              <button
                type="button"
                onClick={() => {
                  playBeep(450, 75);
                  setWingoSubMode('bigsmall');
                  setPredictionResult(null); // Clear recommendation so they can query fresh
                }}
                className={`flex-1 py-1.5 px-3 text-center rounded-full transition-all duration-300 font-extrabold uppercase tracking-wider font-mono text-xs whitespace-nowrap ${
                  wingoSubMode === 'bigsmall'
                    ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                    : theme.textSoft
                }`}
              >
                BIG / SMALL
              </button>
              <button
                type="button"
                onClick={() => {
                  playBeep(450, 75);
                  setWingoSubMode('number');
                  setPredictionResult(null); // Clear recommendation so they can query fresh
                }}
                className={`flex-1 py-1.5 px-3 text-center rounded-full transition-all duration-300 font-extrabold uppercase tracking-wider font-mono text-xs whitespace-nowrap ${
                  wingoSubMode === 'number'
                    ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                    : theme.textSoft
                }`}
              >
                NUMBER
              </button>
            </div>

            {/* Target Period & Clock styled with a beautiful cyber slant cut on the top-left and bottom-right corners */}
            <div id="target-period-timer" className={`relative w-full filter ${theme.dropShadowSmall} select-none`}>
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className={`w-full bg-gradient-to-r ${theme.borderGradient} p-[1px]`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)' }}
              >
                {/* Inner main card container */}
                <div 
                  className={`w-full bg-gradient-to-b ${theme.bgGradient} py-4.5 pr-5 pl-7 flex items-center justify-between relative overflow-hidden`}
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  <div className="flex items-center relative z-20">
                    <span className="text-white text-sm sm:text-base font-black font-mono tracking-[0.12em] leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {getFormattedPeriod()}
                    </span>
                  </div>
                  <div className="text-right flex items-center justify-end relative z-20">
                    <span className={`text-xl sm:text-2xl font-black font-mono tracking-widest ${theme.textGlow} leading-none`}>
                      00:{String(wingoTimeLeft).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className={`absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r ${theme.topGlowBar} to-transparent pointer-events-none`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* PAST RESULTS Section - Clean balls without enclosing border lines */}
            <div className="w-full flex flex-col gap-1 -mt-0.5 select-none">
              <div className="w-full text-center">
                <span className={`text-[13px] sm:text-[14.5px] font-mono font-black tracking-[0.24em] ${theme.textGlowSmall} uppercase`}>
                  PAST RESULTS
                </span>
              </div>

              {/* Past Results balls enclosed in a prominent full-width card matching user request */}
              <div id="past-results-panel" className="relative w-full flex items-center justify-center py-1 select-none">
                <div 
                  className="w-full flex items-center justify-center gap-2.5 sm:gap-4 px-2 sm:px-6 py-3.5 rounded-2xl bg-gradient-to-b from-black/85 via-black/75 to-black/90 backdrop-blur-md transition-all duration-300 overflow-hidden"
                  style={{
                    border: `1.5px solid ${theme.accentColor}55`,
                    boxShadow: `0 0 16px ${theme.accentColor}25, inset 0 1px 2px rgba(255, 255, 255, 0.15)`
                  }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {pastBalls.map((ball, idx) => {
                      const isNewest = idx === 0;
                      return (
                        <motion.div
                          key={ball.period || `ball-${idx}-${ball.num}`}
                          layout
                          initial={{ opacity: 0, x: -38, scale: 0.6, rotate: -25 }}
                          animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, x: 38, scale: 0.6, rotate: 25 }}
                          transition={{
                            layout: { type: "spring", stiffness: 380, damping: 26 },
                            opacity: { duration: 0.3 },
                            scale: { type: "spring", stiffness: 400, damping: 22 },
                            x: { type: "spring", stiffness: 380, damping: 26 }
                          }}
                          className="relative w-11 h-11 sm:w-12.5 sm:h-12.5 flex items-center justify-center select-none shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95"
                        >
                          {/* Highlight pulsating glow ring on newest ball arriving */}
                          {isNewest && (
                            <motion.div
                              initial={{ scale: 0.85, opacity: 0.9 }}
                              animate={{ scale: [0.85, 1.25, 1], opacity: [0.9, 0.4, 0] }}
                              transition={{ duration: 1.2, times: [0, 0.5, 1] }}
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                border: `2px solid ${theme.accentColor}`,
                                boxShadow: `0 0 14px ${theme.accentColor}`
                              }}
                            />
                          )}
                          {/* Subtle white blooming light background */}
                          <div className="absolute w-8 h-8 rounded-full bg-white/[0.22] blur-[2px] pointer-events-none mix-blend-screen" />
                          <img 
                            src={NUMBER_IMAGES[ball.num]} 
                            alt={String(ball.num)} 
                            className="w-10 h-10 sm:w-11 sm:h-11 object-contain relative z-10 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]" 
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* AI Recommendation Container with beautiful cyber slant cuts on the top-left and bottom-right corners matching the period header */}
            <div id="ai-recommendation-box" className={`relative w-full filter ${theme.dropShadowMedium} select-none`}>
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className={`w-full bg-gradient-to-r ${theme.borderGradient} p-[1.2px]`}
                style={{ clipPath: 'polygon(18px 0%, 100% 0%, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0% 100%, 0% 18px)' }}
              >
                {/* Inner main card container */}
                <div 
                  className={`w-full bg-gradient-to-b ${theme.bgGradient} pt-2.5 pb-4 px-4.5 flex flex-col items-center relative overflow-hidden`}
                  style={{ clipPath: 'polygon(17.5px 0%, 100% 0%, 100% calc(100% - 17.5px), calc(100% - 17.5px) 100%, 0% 100%, 0% 17.5px)' }}
                >
                  <div className={`w-full flex items-center justify-between border-b ${theme.borderMuted} pb-2.5 mb-2.5 relative z-20`}>
                    <span className={`text-[14.5px] font-iceland font-black tracking-[0.2em] ${theme.textGlow} uppercase`}>
                      AI RECOMMENDATION
                    </span>
                    <span className={`text-[11px] font-iceland tracking-widest ${theme.textGlowSmall} bg-black/40 border ${theme.borderMuted} px-2 py-0.5 rounded uppercase animate-pulse leading-none`}>
                      STABLE SEED-TCP
                    </span>
                  </div>

                  {/* Glowing 3D Glassy Sphere/Ball in center with fixed height to prevent layout shifts/flicker */}
                  <div className="my-1.5 flex flex-col items-center justify-center w-full h-[210px] relative">
                    {isScanning ? (
                      <div className="relative -mx-4.5 w-[calc(100%+2.25rem)] h-[210px] overflow-hidden flex flex-col items-center justify-center p-0 bg-transparent">
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center select-none">
                          {(() => {
                            const baseItems = (historyList && historyList.length > 0) ? historyList : [
                              { period: "202606161000", predictedNumber: 7, result: "BIG" },
                              { period: "202606160999", predictedNumber: 3, result: "SMALL" },
                              { period: "202606160998", predictedNumber: 8, result: "BIG" },
                              { period: "202606160997", predictedNumber: 1, result: "SMALL" },
                              { period: "202606160996", predictedNumber: 9, result: "BIG" }
                            ];
                            const cycleLength = 6;
                            const cycleItems = [];
                            while (cycleItems.length < cycleLength) {
                              cycleItems.push(...baseItems);
                            }
                            const baseCycle = cycleItems.slice(0, cycleLength);
                            const finalScanItems = [...baseCycle, ...baseCycle, ...baseCycle, ...baseCycle];

                            return (
                              <div
                                className="w-full flex flex-col animate-scan-roll-fast"
                              >
                                {finalScanItems.map((record, i) => {
                                  const displayPeriod = (() => {
                                    if (!record || record.period === undefined || record.period === null) {
                                      return '00000';
                                    }
                                    const pStr = String(record.period);
                                    if (pStr.length >= 15) {
                                      return pStr;
                                    }
                                    const today = new Date();
                                    const yyyy = today.getUTCFullYear();
                                    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
                                    const dd = String(today.getUTCDate()).padStart(2, '0');
                                    const val = pStr.replace(/\D/g, '');
                                    const indexStr = String(val).padStart(4, '0');
                                    const gameCode = selectedTimeMode === '30sec' ? '10005' : '10001';
                                    return `${yyyy}${mm}${dd}${gameCode}${indexStr}`;
                                  })();
                                  
                                  const numVal = record.predictedNumber !== undefined 
                                    ? record.predictedNumber 
                                    : (record.result === 'BIG' ? 9 : 1);
                                  
                                  const sizeVal = record.result === 'MULTIPLIER' ? 'BIG' : record.result;
                                  const colVal = getNumberColorType(numVal);

                                  return (
                                    <div 
                                      key={i} 
                                      className="flex items-center justify-between h-[30px] min-h-[30px] max-h-[30px] px-2 min-[360px]:px-3 sm:px-4 text-[14px] sm:text-[15px] font-iceland text-white font-bold tracking-wider select-none"
                                    >
                                      <span className={`${theme.textSolid} text-left min-w-[145px]`}>
                                        {displayPeriod}
                                      </span>
                                      
                                      <span className={`text-center ${
                                        colVal === 'red-violet' || colVal === 'red' ? 'text-rose-500' : theme.textSolid
                                      }`}>
                                        {numVal}
                                      </span>

                                      <span className={`text-right min-w-[50px] ${
                                        sizeVal === 'BIG' ? 'text-amber-400' : 'text-rose-400'
                                      }`}>
                                        {sizeVal}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Top black line/fade directly at the top header edge */}
                          <div className="absolute inset-x-0 top-0 h-[24px] bg-gradient-to-b from-black via-black/90 to-transparent z-30 pointer-events-none" />

                          {/* Smooth sweep scan overlay (Ultra-smooth GPU accelerated laser beam) */}
                          <motion.div 
                            className="absolute inset-x-0 top-0 pointer-events-none z-20 will-change-transform"
                            initial={{ y: 14 }}
                            animate={{ y: 162 }}
                            transition={{
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: 0.85,
                              ease: [0.42, 0, 0.58, 1]
                            }}
                          >
                            {/* Soft diffused ambient glow halo */}
                            <div 
                              className="w-full h-[14px] -my-[6px] blur-[5px] opacity-60"
                              style={{
                                background: `linear-gradient(90deg, transparent 0%, ${theme.accentColor} 20%, ${theme.accentColor} 80%, transparent 100%)`
                              }}
                            />
                            {/* Sharp luminous laser core */}
                            <div 
                              className="w-full h-[1.5px] relative"
                              style={{
                                background: `linear-gradient(90deg, transparent 0%, ${theme.accentColor} 15%, #ffffff 50%, ${theme.accentColor} 85%, transparent 100%)`,
                                boxShadow: `0 0 10px 2px ${theme.accentColor}, 0 0 20px 4px ${theme.accentColor}66`
                              }}
                            />
                          </motion.div>

                          {/* Bottom smooth gradient fade to black with ANALYZING SERVER text situated cleanly at bottom in the black region */}
                          <div className="absolute inset-x-0 bottom-0 h-[52px] bg-gradient-to-t from-black via-black/95 to-transparent flex items-end justify-center pb-1 z-30 pointer-events-none">
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ 
                                opacity: [0.85, 1, 0.85],
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.5, 
                                ease: "easeInOut" 
                              }}
                              className="flex items-center justify-center"
                            >
                              <span 
                                className="text-[13px] sm:text-[14.5px] font-iceland font-bold tracking-[0.26em] uppercase select-none"
                                style={{ 
                                  color: theme.accentColor,
                                  textShadow: `0 0 10px ${theme.accentColor}, 0 0 20px ${theme.accentColor}`
                                }}
                              >
                                ANALYZING SERVER
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    ) : predictionResult ? (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`result-${predictionResult.period}-${predictionResult.predictedNumber ?? ''}-${predictionResult.result}-${wingoSubMode}`}
                          initial={{ y: 24, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ 
                            duration: 0.35, 
                            ease: "easeOut"
                          }}
                          className="flex flex-col items-center justify-center gap-3 w-full h-full relative"
                        >
                          {wingoSubMode === 'number' ? (
                             (() => {
                              const recNum = predictionResult.predictedNumber !== undefined ? predictionResult.predictedNumber : 9;
                              
                              return (
                                <>
                                  <div className="relative w-28 h-28 flex items-center justify-center select-none z-10">
                                    {/* Stage floor blur shadow from ball.html */}
                                    <div className="absolute left-[15%] right-[15%] -bottom-2 h-3.5 rounded-full bg-black/65 blur-[6px] pointer-events-none" />
                                    {/* Soft white glowing light background */}
                                    <div className="absolute w-[95px] h-[95px] rounded-full bg-white/[0.28] blur-xl pointer-events-none mix-blend-screen animate-pulse" />
                                    <div className="absolute w-[130px] h-[130px] rounded-full bg-white/[0.14] blur-2xl pointer-events-none mix-blend-screen" />
                                    <img 
                                       src={NUMBER_IMAGES[recNum]} 
                                       alt={String(recNum)} 
                                       className="relative z-10 w-24 h-24 object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-ball-pop" 
                                       referrerPolicy="no-referrer"
                                     />
                                  </div>
                                  <span className="text-[28px] sm:text-[32px] font-black tracking-widest uppercase font-iceland leading-none mt-1 text-white z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                                    NUMBER {predictionResult.predictedNumber}
                                  </span>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <div className="relative w-28 h-28 flex items-center justify-center select-none z-10">
                                {/* Soft white glowing light background */}
                                <div className="absolute w-[95px] h-[95px] rounded-full bg-white/[0.28] blur-xl pointer-events-none mix-blend-screen animate-pulse" />
                                <div className="absolute w-[130px] h-[130px] rounded-full bg-white/[0.14] blur-2xl pointer-events-none mix-blend-screen" />
                                <img 
                                  src={predictionResult.result === 'BIG' 
                                    ? 'https://i.ibb.co/JjZSB374/game-result-big.png' 
                                    : 'https://i.ibb.co/GfVjCNnh/game-result-small.png'
                                  } 
                                  alt={predictionResult.result} 
                                  className="relative z-10 w-24 h-24 object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-ball-pop" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <span className="text-[28px] sm:text-[32px] font-black tracking-widest uppercase font-iceland leading-none mt-1 text-white z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                                {predictionResult.result}
                              </span>
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full select-none pt-1 pb-2">
                        <RecommendationSticker className="w-28 h-28 sm:w-30 sm:h-30" />
                        <span className={`mt-2.5 text-[11.5px] sm:text-[12.5px] font-iceland font-bold tracking-[0.22em] uppercase ${theme.textGlowSmall} opacity-90 text-center select-none`}>
                          READY TO ANALYZE
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className={`absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r ${theme.topGlowBar} to-transparent pointer-events-none`}
                style={{ clipPath: 'polygon(18px 0%, 100% 0%, 100% 100%, 18px 100%)', left: '1px' }}
              />
            </div>

            {/* Giant GET PREDICTION button styled exactly like Past Results box */}
            <div id="get-prediction-btn-box" className={`relative w-full filter ${theme.dropShadowLarge} select-none transition-all duration-300 hover:scale-[1.01]`}>
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className={`w-full bg-gradient-to-r ${theme.borderGradient} p-[1.2px] transition-all duration-200`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 15.5px)' }}
              >
                <button
                  onClick={handleWingoPredictionClick}
                  disabled={isScanning || (lastPredictedPeriodIndex !== null && String(lastPredictedPeriodIndex) === String(liveAutoPeriod))}
                  className={`w-full bg-gradient-to-r ${isVeerGameTheme ? 'from-[#15803d] via-[#22c55e] to-[#16a34a]' : isDmFirstTheme ? 'from-[#065f46] via-[#10b981] to-[#ca8a04]' : isRedTheme || isNinetyOneTheme ? 'from-[#ef4444] via-[#dc2626] to-[#b91c1c]' : isBdgTheme ? 'from-[#F0D597] via-[#d4af37] to-[#78350f]' : isSixClubTheme ? 'from-[#f59e0b] via-[#eab308] to-[#ca8a04]' : isSreeWinTheme ? 'from-[#8b5cf6] via-[#7c3aed] to-[#581c87]' : isJalwaTheme ? 'from-[#61DACC] via-[#0d9488] to-[#0f766e]' : isTirangaTheme ? 'from-[#6495ED] via-[#3b82f6] to-[#1d4ed8]' : isFiftyOneTheme ? 'from-[#f59e0b] via-[#d97706] to-[#b45309]' : isJaiClubTheme ? 'from-[#d946ef] via-[#a855f7] to-[#ec4899]' : isGoaTheme ? 'from-[#6495ED] via-[#2563eb] to-[#1e3a8a]' : 'from-[#21F102] via-[#1bb303] to-[#107801]'} hover:brightness-110 active:brightness-90 disabled:opacity-40 ${isRedTheme || isTirangaTheme || isJaiClubTheme || isGoaTheme || isNinetyOneTheme || isSreeWinTheme || isVeerGameTheme || isDmFirstTheme ? 'text-white' : 'text-black'} font-black uppercase py-4.5 tracking-[0.2em] text-[15px] sm:text-[16px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none font-mono border-none outline-none relative`}
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  {(lastPredictedPeriodIndex !== null && String(lastPredictedPeriodIndex) === String(liveAutoPeriod)) ? "WAIT FOR NEXT PERIOD" : "GET PREDICTION"}
                </button>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className={`absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r ${theme.topGlowBar} to-transparent pointer-events-none`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* Records Section exactly like screenshot - with reduced gaps */}
            <div className="w-full flex items-center justify-between -mt-1.5 -mb-1 select-none">
              <div className={`h-[1px] flex-1 ${theme.borderSplitter}`} />
              <span className={`text-[10px] font-mono font-black tracking-[0.25em] ${theme.textSolid} uppercase px-4 leading-none`}>
                RECORDS
              </span>
              <div className={`h-[1px] flex-1 ${theme.borderSplitter}`} />
            </div>

            {/* Records panel styled with the matching cyber slant cut and glowing neon outlines */}
            <div id="records-table-panel" className={`relative w-full filter ${theme.dropShadowSmall} -mt-1 select-none`}>
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className={`w-full bg-gradient-to-r ${theme.borderGradient} p-[1.2px]`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 15.5px)' }}
              >
                <div 
                  className={`w-full bg-gradient-to-b ${theme.bgGradient} p-3.5 relative overflow-hidden`}
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  <div className="w-full overflow-x-auto relative z-10">
                    <table className="w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className={`border-b ${theme.recordBorder} pb-2`}>
                          <th className={`text-[11px] uppercase tracking-wider ${theme.textSolid} opacity-75 font-black font-mono py-1.5 pl-1`}>
                            PERIOD
                          </th>
                          <th className={`text-[11px] uppercase tracking-wider ${theme.textSolid} opacity-75 font-black font-mono py-1.5 text-center`}>
                            NUMBER
                          </th>
                          <th className={`text-[11px] uppercase tracking-wider ${theme.textSolid} opacity-75 font-black font-mono py-1.5 text-center`}>
                            SIZE
                          </th>
                          <th className={`text-[11px] uppercase tracking-wider ${theme.textSolid} opacity-75 font-black font-mono py-1.5 pr-1 text-right`}>
                            COLOR
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.slice(0, 10).map((record) => {
                          const displayPeriod = (() => {
                            if (!record || record.period === undefined || record.period === null) {
                              return '00000';
                            }
                            const pStr = String(record.period);
                            if (pStr.length >= 15) {
                              return pStr;
                            }
                            const today = new Date();
                            const yyyy = today.getUTCFullYear();
                            const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
                            const dd = String(today.getUTCDate()).padStart(2, '0');
                            const val = pStr.replace(/\D/g, '');
                            const indexStr = String(val).padStart(4, '0');
                            const gameCode = selectedTimeMode === '30sec' ? '10005' : '10001';
                            return `${yyyy}${mm}${dd}${gameCode}${indexStr}`;
                          })();
                          
                          const numVal = record.predictedNumber !== undefined 
                            ? record.predictedNumber 
                            : (record.result === 'BIG' ? 9 : 1);
                          
                          const sizeVal = record.result === 'MULTIPLIER' ? 'BIG' : record.result;
                          
                          // Precise match with ball colors: Violet for 0/5, Red for even, Green for odd
                          const colVal = getNumberColorType(numVal);
                          
                          return (
                            <tr 
                              key={record.period || record.id} 
                              className={`border-b ${theme.recordBorder} ${theme.recordHover} transition-colors duration-200 font-mono text-[11.5px] sm:text-[13.5px]`}
                            >
                              <td className="py-2.5 font-bold text-white pl-1 select-all">
                                {displayPeriod}
                              </td>
                              <td className="py-2.5 text-[15.5px] sm:text-[16.5px] font-extrabold text-center">
                                <span className={
                                  colVal === 'red-violet' ? 'bg-gradient-to-r from-rose-500 to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                  colVal === 'green-violet' ? 'bg-gradient-to-r from-[#22c55e] to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                  colVal === 'red' ? 'text-rose-500 font-extrabold' : 'text-[#22c55e] font-extrabold'
                                }>
                                  {numVal}
                                </span>
                              </td>
                              <td className={`py-2.5 text-[13px] sm:text-[14px] font-extrabold text-center ${
                                sizeVal === 'BIG' ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {sizeVal}
                              </td>
                              <td className="py-2.5 text-right pr-1">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full inline-block ${
                                    colVal === 'red-violet' ? 'bg-gradient-to-r from-rose-500 from-[50%] to-purple-500 to-[50%] shadow-[0_0_6px_rgba(239,68,68,0.6)]' :
                                    colVal === 'green-violet' ? 'bg-gradient-to-r from-emerald-500 from-[50%] to-purple-500 to-[50%] shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                                    colVal === 'red' ? 'bg-rose-500 text-rose-500 shadow-[0_0_6px_#f43f5e]' : 
                                    'bg-emerald-500 text-emerald-500 shadow-[0_0_6px_#10b981]'
                                  }`} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className={`absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r ${theme.topGlowBar} to-transparent pointer-events-none`}
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* TG channel support */}
            <a
              href={settings.telegramUrl || settings.telegramChannelUrl || "https://t.me/+iLrgv9u-WbBlMTM9"}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded-xl overflow-hidden border ${theme.bannerBorder} bg-[#030704] p-4 flex items-center justify-between transition-all duration-300 mt-2`}
            >
              <div className="absolute inset-0 bg-transparent opacity-40 rounded-full -translate-y-12 shrink-0 pointer-events-none" />
              <div className="z-10 text-left">
                <span className="text-xs uppercase tracking-widest font-black flex items-center gap-1.5 mb-1 text-white select-none">
                  <Zap className={`w-3.5 h-3.5 animate-pulse ${theme.textSolid}`} />
                  Join Community Channel
                </span>
                <p className={`text-[10px] uppercase tracking-wider font-mono opacity-50 ${theme.textSolid} select-none`}>
                  Get premium signals on Telegram!
                </p>
              </div>

              <div className={`w-8 h-8 rounded-full border ${theme.bannerGlowIcon} flex items-center justify-center transition-all duration-300 group-hover:scale-110 select-none z-10 font-sans`}>
                <Send className="w-4 h-4 animate-pulse" />
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
      <LoaderOverlay 
        isVisible={transitionState.isVisible} 
        mode={transitionState.mode}
        gameTitle={transitionState.gameTitle}
        gameLogo={transitionState.gameLogo}
        themeColor={transitionState.themeColor}
        statusText={transitionState.statusText}
        customMessages={transitionState.customMessages}
        duration={transitionState.duration}
      />
    </div>
  );
}
