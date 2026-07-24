'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Coins, Flame, Star, Lock, Check, X, ArrowLeft, Trophy,
  Sparkles, Play, RotateCcw, ChevronRight, Lightbulb, Home,
  BookOpen, BarChart3, Target, Clock, Award, TrendingUp, GraduationCap,
  LogOut, Eye, EyeOff,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { WORLDS, getWorld, AVATARS, QUESTIONS_PER_LEVEL, PASS_THRESHOLD, calcCoins, calcStars } from '@/lib/gameData'
import { generateQuestions } from '@/lib/questionGenerator'
import { getLesson } from '@/lib/lessons'
import { loadAnalytics, recordLevel, computeInsights } from '@/lib/analytics'
import { useAuth } from '@/lib/context/AuthContext'

const FONT = { fontFamily: '"Fredoka", "Baloo 2", system-ui, sans-serif' }

// ---------------- API helpers ----------------
const api = {
  async signup(data) {
    const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    return r.json()
  },
  async login(data) {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    return r.json()
  },
  async completeLevel(data, token) {
    const r = await fetch('/api/complete-level', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
    return r.json()
  },
  async leaderboard() {
    const r = await fetch('/api/leaderboard')
    return r.json()
  },
}

// ---------------- Small components ----------------
function CoinCountUp({ from, to, duration = 1400 }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const ease = (p) => 1 - Math.pow(1 - p, 3)
    const step = (t) => {
      const p = Math.min((t - t0) / duration, 1)
      setV(Math.round(from + (to - from) * ease(p)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [from, to, duration])
  return <span>{v}</span>
}

function StarRow({ count, size = 28 }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map((i) => (
        <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 260, damping: 12 }}>
          <Star size={size} className={i <= count ? 'fill-yellow-400 text-yellow-400 drop-shadow' : 'text-white/40'} />
        </motion.div>
      ))}
    </div>
  )
}

// ---------------- Profile setup (signup) ----------------
function ProfileSetup({ onCreate, onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [grade, setGrade] = useState(4)
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const res = await api.signup({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      grade,
      avatar,
    })
    setLoading(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    if (res?.user) onCreate(res)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden" style={FONT}>
      {/* floating math symbols */}
      {['+', '\u00d7', '\u00f7', '=', '\u2212', '%'].map((s, i) => (
        <motion.div key={i} className="absolute text-white/20 font-bold select-none" style={{ fontSize: 80 + i * 10, left: `${(i * 17) % 90}%`, top: `${(i * 29) % 80}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}>
          {s}
        </motion.div>
      ))}

      <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        {onBack && (
          <button onClick={onBack} className="absolute left-6 top-6 text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold z-10">
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <div className="text-center mb-6 mt-4">
          <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-2">🚀</motion.div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">LearnWithAli</h1>
          <p className="text-gray-500 mt-1 font-medium">Create your explorer account!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-700 mb-1">What's your name?</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your name..." maxLength={24}
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium mb-4" />

        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium mb-4" />

        <label className="block text-sm font-semibold text-gray-700 mb-1">Password (min 6 characters)</label>
        <div className="relative mb-4">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium pr-12" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password..."
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium mb-5" />

        <label className="block text-sm font-semibold text-gray-700 mb-2">Pick your grade</label>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[3, 4, 5].map((g) => (
            <button key={g} onClick={() => setGrade(g)}
              className={`py-3 rounded-2xl font-bold text-lg transition-all ${grade === g ? 'bg-indigo-500 text-white scale-105 shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Grade {g}
            </button>
          ))}
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">Choose your buddy</label>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {AVATARS.map((a) => (
            <button key={a} onClick={() => setAvatar(a)}
              className={`text-3xl p-1 rounded-2xl transition-all ${avatar === a ? 'bg-pink-100 ring-2 ring-pink-400 scale-110' : 'hover:bg-gray-100'}`}>
              {a}
            </button>
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.95 }} onClick={submit} disabled={!name.trim() || !email.trim() || !password || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xl font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? 'Creating account...' : <>Start Adventure <Play className="fill-white" size={22} /></>}
        </motion.button>
      </motion.div>
    </div>
  )
}

// ---------------- Landing Page ----------------
function LandingPage({ onSignUp, onSignIn }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden py-12" style={FONT}>
      {/* Dynamic floating math symbols */}
      {['+', '\u00d7', '\u00f7', '=', '\u2212', '%', '\u221a', '\u03c0'].map((s, i) => (
        <motion.div key={i} className="absolute text-white/10 font-bold select-none pointer-events-none" style={{ fontSize: 60 + i * 20, left: `${(i * 13) % 90}%`, top: `${(i * 23) % 80}%` }}
          animate={{ y: [0, -30, 0], rotate: [0, 15, -15, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}>
          {s}
        </motion.div>
      ))}

      {/* Floating decorative gradient circles */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="w-full max-w-5xl mx-auto px-4 flex items-center justify-between mb-8 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-4xl">🚀</span>
          <span className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent drop-shadow">LearnWithAli</span>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSignIn}
          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all text-sm backdrop-blur-md">
          Explorer Sign In
        </motion.button>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative max-w-3xl mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 100 }} className="mb-6">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-8xl inline-block drop-shadow-2xl">
            🎓
          </motion.div>
        </motion.div>

        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
          The Math Adventure of a <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">Lifetime!</span>
        </motion.h1>
        
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-white/85 text-lg md:text-xl font-medium mt-6 max-w-xl leading-relaxed">
          Embark on a gamified learning journey across 6 unique worlds. Master multiplication, division, fractions, and geometry while earning rewards!
        </motion.p>

        {/* Hero CTAs */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md">
          <motion.button whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)' }} whileTap={{ scale: 0.97 }} onClick={onSignUp}
            className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-xl font-extrabold shadow-lg transition-all flex items-center justify-center gap-2">
            Start Adventure <Play className="fill-white" size={20} />
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05, bg: 'rgba(255, 255, 255, 0.25)' }} whileTap={{ scale: 0.97 }} onClick={onSignIn}
            className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-white/20 border-2 border-white/40 text-white text-xl font-extrabold shadow-md transition-all flex items-center justify-center gap-2 backdrop-blur-md">
            Resume Game <ChevronRight size={22} />
          </motion.button>
        </motion.div>

        {/* Guest sign in removed - authentication required */}
      </div>

      {/* Showcase Worlds Carousel/Grid */}
      <div className="w-full max-w-5xl mx-auto mt-12 px-4 z-10 relative">
        <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest text-center mb-4">Explore Math Worlds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {WORLDS.map((w, idx) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.08 }} whileHover={{ scale: 1.05, y: -4 }}
              className={`p-4 rounded-3xl bg-gradient-to-br ${w.gradient} shadow-lg text-center text-white border border-white/10 relative overflow-hidden`}>
              <div className="absolute -right-3 -top-3 text-5xl opacity-10 select-none pointer-events-none">{w.emoji}</div>
              <div className="text-4xl mb-2">{w.emoji}</div>
              <h3 className="font-extrabold text-sm drop-shadow leading-tight truncate">{w.name.split(' ')[0]}</h3>
              <p className="text-[10px] text-white/80 font-medium leading-normal mt-1 leading-snug">{w.blurb}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ---------------- Login Page ----------------
function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    const res = await api.login({ email: email.trim().toLowerCase(), password })
    setLoading(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    if (res?.user) onLogin(res)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden" style={FONT}>
      {/* Floating background math symbols */}
      {['+', '×', '÷', '=', '−', '%'].map((s, i) => (
        <motion.div key={i} className="absolute text-white/10 font-bold select-none pointer-events-none" style={{ fontSize: 70 + i * 15, left: `${(i * 20) % 90}%`, top: `${(i * 30) % 80}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}>
          {s}
        </motion.div>
      ))}

      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8">

        <button onClick={onBack} className="absolute left-6 top-6 text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold z-10 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="text-center mt-6 mb-6">
          <div className="text-5xl mb-2">👋</div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">Welcome Back!</h2>
          <p className="text-gray-500 mt-1 font-medium">Sign in to continue your adventure</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium mb-4" />

        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
        <div className="relative mb-6">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Enter your password..."
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-lg font-medium pr-12" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <motion.button whileTap={{ scale: 0.95 }} onClick={submit} disabled={!email.trim() || !password || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-extrabold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
          {loading ? 'Signing in...' : <>Log In <ChevronRight size={22} /></>}
        </motion.button>

        <p className="text-center text-gray-500 text-sm font-medium">
          Don&apos;t have an account?{' '}
          <button onClick={onBack} className="text-indigo-500 hover:text-indigo-700 font-bold underline">
            Sign Up
          </button>
        </p>
      </motion.div>
    </div>
  )
}
// ---------------- Header ----------------
function TopBar({ user, onLeaderboard, onAnalytics, onLogout }) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-3xl">{user.avatar}</div>
          <div className="leading-tight">
            <div className="font-bold text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-500">Grade {user.grade}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full font-bold">
            <Flame size={18} className="fill-orange-500 text-orange-500" /> {user.currentStreak || 0}
          </div>
          <motion.div key={user.totalCoins} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-bold">
            <Coins size={18} className="fill-yellow-400 text-yellow-500" /> {user.totalCoins || 0}
          </motion.div>
          <button onClick={onLeaderboard} className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200">
            <Trophy size={18} />
          </button>
          <button onClick={onAnalytics} title="My progress" className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200">
            <BarChart3 size={18} />
          </button>
          <button onClick={onLogout} title="Logout" className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- World Map ----------------
function WorldMap({ progressMap, onSelectWorld }) {
  const worldCompleted = (w) => {
    let c = 0
    for (let l = 1; l <= w.levels; l++) if ((progressMap[`${w.id}-${l}`]?.stars || 0) >= 1) c++
    return c
  }
  const worldUnlocked = (idx) => true // all worlds unlocked for now

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" style={FONT}>
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-extrabold text-white drop-shadow mb-1">
        Choose your world <Sparkles className="inline mb-1" size={26} />
      </motion.h2>
      <p className="text-white/80 mb-6 font-medium">Pick any world and start your adventure!</p>

      <div className="grid sm:grid-cols-2 gap-5">
        {WORLDS.map((w, idx) => {
          const unlocked = worldUnlocked(idx)
          const done = worldCompleted(w)
          const pct = Math.round((done / w.levels) * 100)
          return (
            <motion.button
              key={w.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={unlocked ? { scale: 1.03, y: -4 } : {}}
              whileTap={unlocked ? { scale: 0.98 } : {}}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectWorld(w)}
              className={`relative text-left rounded-3xl p-5 overflow-hidden shadow-xl bg-gradient-to-br ${w.gradient} ${!unlocked ? 'grayscale opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="absolute -right-4 -top-4 text-8xl opacity-20 select-none">{w.emoji}</div>
              <div className="relative">
                <div className="text-5xl mb-2">{w.emoji}</div>
                <h3 className="text-xl font-extrabold text-white drop-shadow">{w.name}</h3>
                <p className="text-white/85 text-sm font-medium mb-3">{w.blurb}</p>
                <div className="h-2.5 bg-black/20 rounded-full overflow-hidden mb-2">
                  <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                </div>
                <div className="flex items-center justify-between text-white text-sm font-bold">
                  <span>{done}/{w.levels} levels</span>
                  {unlocked ? <span className="flex items-center gap-1">Play <ChevronRight size={16} /></span> : <span className="flex items-center gap-1"><Lock size={14} /> Locked</span>}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Level select (path within a world) ----------------
function LevelSelect({ world, progressMap, onBack, onSelectLevel }) {
  const levelUnlocked = (n) => true // all levels unlocked for now
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" style={FONT}>
      <button onClick={onBack} className="flex items-center gap-1 text-white font-bold mb-4 bg-white/20 px-3 py-2 rounded-full hover:bg-white/30">
        <ArrowLeft size={18} /> Worlds
      </button>
      <div className="text-center mb-6">
        <div className="text-6xl mb-1">{world.emoji}</div>
        <h2 className="text-3xl font-extrabold text-white drop-shadow">{world.name}</h2>
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {Array.from({ length: world.levels }).map((_, i) => {
          const n = i + 1
          const unlocked = levelUnlocked(n)
          const p = progressMap[`${world.id}-${n}`]
          const stars = p?.stars || 0
          const offset = (i % 2 === 0 ? -1 : 1) * 70
          return (
            <motion.div key={n} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} style={{ transform: `translateX(${offset}px)` }}>
              <button
                disabled={!unlocked}
                onClick={() => unlocked && onSelectLevel(n)}
                className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center font-extrabold text-white shadow-xl border-4 border-white/70 transition-all ${
                  unlocked ? `bg-gradient-to-br ${world.gradient} hover:scale-110 active:scale-95` : 'bg-gray-400/70 cursor-not-allowed'
                }`}
              >
                {unlocked ? (
                  <>
                    <span className="text-2xl">{n}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star key={s} size={12} className={s <= stars ? 'fill-yellow-300 text-yellow-300' : 'text-white/40'} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Lock size={28} />
                )}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Gameplay ----------------
function Gameplay({ world, levelNumber, grade, onExit, onFinish }) {
  const [questions] = useState(() => generateQuestions(world.theme, levelNumber, QUESTIONS_PER_LEVEL, grade))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [wrongShake, setWrongShake] = useState(false)
  const [showLesson, setShowLesson] = useState(false)
  const startRef = useRef(Date.now())

  const q = questions[idx]

  const handleAnswer = (choice) => {
    if (locked) return
    setSelected(choice)
    setLocked(true)
    const isCorrect = String(choice) === String(q.answer)
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 }, scalar: 0.8 })
    } else {
      setWrongShake(true)
      setTimeout(() => setWrongShake(false), 500)
    }
    setTimeout(() => {
      if (idx + 1 < questions.length) {
        setIdx(idx + 1)
        setSelected(null)
        setLocked(false)
        setShowHint(false)
      } else {
        const total = questions.length
        const finalCorrect = correctCount + (isCorrect ? 1 : 0)
        const accuracy = finalCorrect / total
        const timeSec = Math.round((Date.now() - startRef.current) / 1000)
        onFinish({ correct: finalCorrect, total, accuracy, timeSec, passed: accuracy >= PASS_THRESHOLD })
      }
    }, isCorrect ? 850 : 1100)
  }

  const btnStyle = (choice) => {
    if (selected === null) return 'bg-white text-gray-800 hover:bg-indigo-50 border-gray-200'
    const isThis = String(choice) === String(selected)
    const isAnswer = String(choice) === String(q.answer)
    if (isAnswer) return 'bg-green-500 text-white border-green-600'
    if (isThis && !isAnswer) return 'bg-red-500 text-white border-red-600'
    return 'bg-white text-gray-400 border-gray-200 opacity-60'
  }

  const progressPct = (idx / questions.length) * 100

  return (
    <div className="min-h-screen flex flex-col" style={FONT}>
      {/* top: progress + exit */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/30 text-white font-bold hover:bg-white/50"><X size={20} /> Exit</button>
          <div className="flex-1 h-4 bg-white/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full" animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 100 }} />
          </div>
          <div className="text-white font-bold text-sm whitespace-nowrap">{idx + 1}/{questions.length}</div>
          <button onClick={() => setShowLesson(true)} title="How to solve" className="p-2 rounded-full bg-white/30 text-white hover:bg-white/50"><BookOpen size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            >
              {/* Question card */}
              <motion.div animate={wrongShake ? { x: [0, -12, 12, -10, 10, 0] } : {}} transition={{ duration: 0.45 }}
                className="bg-white rounded-[2rem] shadow-2xl p-8 mb-6 text-center">
                <div className="text-5xl mb-3">{q.emoji}</div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-800 leading-snug">{q.prompt}</div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button onClick={() => setShowHint((s) => !s)} className="inline-flex items-center gap-1 text-indigo-500 font-semibold text-sm hover:text-indigo-700">
                    <Lightbulb size={16} /> {showHint ? 'Hide hint' : 'Need a hint?'}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setShowLesson(true)} className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm hover:text-emerald-700">
                    <BookOpen size={16} /> How to do it
                  </button>
                </div>
                <AnimatePresence>
                  {showHint && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="text-gray-500 mt-2 bg-indigo-50 rounded-xl py-2 px-3 font-medium">
                      {q.hint}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Choices */}
              <div className="grid grid-cols-2 gap-3">
                {q.choices.map((choice) => (
                  <motion.button
                    key={choice}
                    whileTap={{ scale: 0.95 }}
                    disabled={locked}
                    onClick={() => handleAnswer(choice)}
                    className={`relative py-6 rounded-2xl border-4 text-2xl font-extrabold shadow-md transition-colors ${btnStyle(choice)}`}
                  >
                    {choice}
                    {selected !== null && String(choice) === String(q.answer) && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-3"><Check size={22} /></motion.span>
                    )}
                    {selected !== null && String(choice) === String(selected) && String(choice) !== String(q.answer) && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-3"><X size={22} /></motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLesson(false)}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl my-8">
              <LessonContent world={world} />
              <button onClick={() => setShowLesson(false)} className={`mt-5 w-full py-3 rounded-2xl bg-gradient-to-r ${world.gradient} text-white font-bold`}>Back to Questions</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------- Level Complete ----------------
function LevelComplete({ world, levelNumber, result, coins, prevCoins, onRetry, onNext, onMap, hasNext }) {
  useEffect(() => {
    if (result.passed) {
      const end = Date.now() + 900
      const frame = () => {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#f97316', '#facc15', '#22c55e', '#a855f7'] })
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#f97316', '#facc15', '#22c55e', '#a855f7'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [result.passed])

  const stars = calcStars(result.accuracy)

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={FONT}>
      <motion.div initial={{ scale: 0.7, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        className={`w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center bg-gradient-to-br ${world.gradient}`}>
        <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-7xl mb-2">
          {result.passed ? '\ud83c\udf89' : '\ud83d\udcaa'}
        </motion.div>
        <h2 className="text-4xl font-extrabold text-white drop-shadow mb-1">
          {result.passed ? 'Level Complete!' : 'So Close!'}
        </h2>
        <p className="text-white/90 font-semibold mb-4">{world.name} · Level {levelNumber}</p>

        {result.passed && <StarRow count={stars} />}

        <div className="bg-white/20 rounded-2xl p-4 my-5 text-white">
          <div className="text-lg font-bold">You got {result.correct}/{result.total} correct</div>
          <div className="text-white/80 text-sm">{Math.round(result.accuracy * 100)}% accuracy · {result.timeSec}s</div>
        </div>

        {result.passed ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-yellow-400 rounded-2xl py-4 mb-5 shadow-inner">
            <div className="flex items-center justify-center gap-2 text-yellow-900">
              <Coins size={40} className="fill-yellow-600 text-yellow-700" />
              <span className="text-5xl font-extrabold tabular-nums">+<CoinCountUp from={0} to={coins.total} /></span>
            </div>
            <div className="flex justify-center gap-3 mt-2 text-yellow-900 text-sm font-bold">
              <span>Base {coins.base}</span>
              {coins.perfectBonus > 0 && <span>\u2b50 Perfect +{coins.perfectBonus}</span>}
              {coins.speedBonus > 0 && <span>\u26a1 Speed +{coins.speedBonus}</span>}
            </div>
          </motion.div>
        ) : (
          <div className="bg-white/20 rounded-2xl py-3 mb-5 text-white font-semibold">
            Get {Math.round(PASS_THRESHOLD * 100)}% to pass. Try again – you've got this!
          </div>
        )}

        <div className="flex flex-col gap-2">
          {result.passed && hasNext && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={onNext} className="w-full py-3.5 rounded-2xl bg-white text-gray-800 text-lg font-extrabold shadow flex items-center justify-center gap-2">
              Next Level <ChevronRight size={20} />
            </motion.button>
          )}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onRetry} className="flex-1 py-3 rounded-2xl bg-white/25 text-white font-bold flex items-center justify-center gap-1">
              <RotateCcw size={18} /> Retry
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onMap} className="flex-1 py-3 rounded-2xl bg-white/25 text-white font-bold flex items-center justify-center gap-1">
              <Home size={18} /> Map
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------- Leaderboard modal ----------------
function LeaderboardModal({ onClose, meId }) {
  const [rows, setRows] = useState(null)
  useEffect(() => { api.leaderboard().then((d) => setRows(d?.leaderboard || [])) }, [])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" style={FONT}>
      <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500 fill-yellow-400" /> <h3 className="text-2xl font-extrabold text-gray-800">Top Explorers</h3>
        </div>
        {!rows ? <p className="text-gray-400">Loading...</p> : rows.length === 0 ? <p className="text-gray-400">No players yet!</p> : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-2xl ${r.id === meId ? 'bg-indigo-100' : 'bg-gray-50'}`}>
                <div className="w-7 text-center font-extrabold text-gray-500">{i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : i + 1}</div>
                <div className="text-2xl">{r.avatar}</div>
                <div className="flex-1 font-bold text-gray-800">{r.name}</div>
                <div className="flex items-center gap-1 text-yellow-600 font-bold"><Coins size={16} className="fill-yellow-400" />{r.totalCoins}</div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl bg-indigo-500 text-white font-bold">Close</button>
      </motion.div>
    </motion.div>
  )
}

// ---------------- Lesson content (how to solve, with worked example) ----------------
function LessonContent({ world }) {
  const lesson = getLesson(world.theme)
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-5xl mb-1">{lesson.emoji}</div>
        <h3 className="text-2xl font-extrabold text-gray-800">{lesson.title}</h3>
        <p className="text-gray-500 font-medium mt-1">{lesson.intro}</p>
      </div>

      <div className="space-y-2 mb-4">
        {lesson.steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
            <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${world.gradient} text-white font-bold flex items-center justify-center text-sm`}>{i + 1}</div>
            <p className="text-gray-700 font-medium">{s}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl p-4 border-2 border-dashed border-indigo-200 bg-indigo-50">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2"><Sparkles size={18} /> Worked Example</div>
        <div className="text-xl font-extrabold text-gray-800 mb-2">{lesson.example.problem}</div>
        {lesson.example.work.map((w, i) => (
          <div key={i} className="text-gray-600 font-medium">{w}</div>
        ))}
        <div className="mt-2 inline-flex items-center gap-2 bg-green-500 text-white font-bold px-3 py-1.5 rounded-full">
          <Check size={16} /> Answer: {lesson.example.answer}
        </div>
      </div>
    </div>
  )
}

// Full-screen lesson intro shown before starting a level
function LessonIntro({ world, levelNumber, onStart, onBack }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={FONT}>
      <button onClick={onBack} className="flex items-center gap-1 text-white font-bold mb-4 bg-white/20 px-3 py-2 rounded-full hover:bg-white/30">
        <ArrowLeft size={18} /> Back
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-2xl p-6">
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
            <GraduationCap size={14} /> {world.name} · Level {levelNumber}
          </span>
        </div>
        <LessonContent world={world} />
        <motion.button whileTap={{ scale: 0.95 }} onClick={onStart}
          className={`mt-5 w-full py-4 rounded-2xl bg-gradient-to-r ${world.gradient} text-white text-xl font-extrabold shadow-lg flex items-center justify-center gap-2`}>
          Got it – Let's Play! <Play className="fill-white" size={22} />
        </motion.button>
      </motion.div>
    </div>
  )
}

// ---------------- Analytics dashboard (localStorage) ----------------
function AnalyticsModal({ userId, onClose }) {
  const [stats, setStats] = useState(null)
  useEffect(() => { setStats(loadAnalytics(userId)) }, [userId])
  if (!stats) return null
  const insights = computeInsights(stats)
  const chartData = insights.themes.map((t) => {
    const w = WORLDS.find((x) => x.theme === t.theme)
    return { name: (w?.name || t.theme).split(' ')[0], accuracy: Math.round(t.accuracy * 100), fill: w?.accent || '#6366f1' }
  })
  const played = stats.attempts > 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" style={FONT}>
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl my-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-indigo-500" /> <h3 className="text-2xl font-extrabold text-gray-800">My Progress</h3>
        </div>

        {!played ? (
          <p className="text-gray-400 py-8 text-center font-medium">Play a level to see your progress analysis! 🚀</p>
        ) : (
          <>
            {/* summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 rounded-2xl p-3">
                <div className="flex items-center gap-1 text-green-600 text-xs font-bold"><Target size={14} /> Accuracy</div>
                <div className="text-2xl font-extrabold text-gray-800">{Math.round(insights.overallAcc * 100)}%</div>
              </div>
              <div className="bg-yellow-50 rounded-2xl p-3">
                <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold"><Award size={14} /> Levels Done</div>
                <div className="text-2xl font-extrabold text-gray-800">{stats.levelsCompleted}</div>
              </div>
              <div className="bg-sky-50 rounded-2xl p-3">
                <div className="flex items-center gap-1 text-sky-600 text-xs font-bold"><Sparkles size={14} /> Questions</div>
                <div className="text-2xl font-extrabold text-gray-800">{stats.totalCorrect}/{stats.totalQuestions}</div>
              </div>
              <div className="bg-purple-50 rounded-2xl p-3">
                <div className="flex items-center gap-1 text-purple-600 text-xs font-bold"><Clock size={14} /> Avg / question</div>
                <div className="text-2xl font-extrabold text-gray-800">{insights.avgTimePerQ.toFixed(1)}s</div>
              </div>
            </div>

            {/* accuracy by world */}
            <div className="mb-4">
              <div className="text-sm font-bold text-gray-600 mb-2">Accuracy by World</div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* strength / weakness */}
            {insights.strongest && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-2xl p-3">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><TrendingUp size={14} /> Strongest</div>
                  <div className="font-extrabold text-gray-800 text-sm">{insights.strongest.worldName}</div>
                  <div className="text-emerald-600 font-bold text-sm">{Math.round(insights.strongest.accuracy * 100)}%</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-3">
                  <div className="flex items-center gap-1 text-orange-600 text-xs font-bold"><Target size={14} /> Keep Practicing</div>
                  <div className="font-extrabold text-gray-800 text-sm">{insights.weakest.worldName}</div>
                  <div className="text-orange-600 font-bold text-sm">{Math.round(insights.weakest.accuracy * 100)}%</div>
                </div>
              </div>
            )}

            {/* recent history */}
            <div className="text-sm font-bold text-gray-600 mb-2">Recent Games</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stats.history.slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-full ${h.passed ? 'bg-green-500' : 'bg-red-400'}`} />
                  <div className="flex-1 font-semibold text-gray-700 truncate">{h.worldName} · Lvl {h.levelNumber}</div>
                  <div className="text-gray-500 font-medium">{h.correct}/{h.total}</div>
                  <div className="text-yellow-600 font-bold flex items-center gap-0.5"><Coins size={12} className="fill-yellow-400" />{h.coins}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl bg-indigo-500 text-white font-bold">Close</button>
      </motion.div>
    </motion.div>
  )
}


// ---------------- Root App ----------------
function App() {
  const { user, progress, token, loading, login, logout, updateUser, updateProgress } = useAuth()
  const [screen, setScreen] = useState('loading') // loading | landing | login | signup | map | levels | lesson | play | complete
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [lastResult, setLastResult] = useState(null)
  const [lastCoins, setLastCoins] = useState(null)
  const [prevCoins, setPrevCoins] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // progress lookup map
  const progressMap = {}
  for (const p of progress) progressMap[`${p.worldId}-${p.levelNumber}`] = p

  // Redirect based on auth state only on initial load
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!loading && !hasInitialized.current) {
      hasInitialized.current = true
      if (user) { setScreen('map') }
      else { setScreen('landing') }
    }
  }, [loading, user])

  const handleAuthSuccess = (d) => {
    login(d.user, d.token, d.progress || [])
    setScreen('map')
  }

  const handleLogout = () => {
    logout()
    setSelectedWorld(null)
    setSelectedLevel(1)
    setScreen('landing')
  }

  const startLevel = (worldOrCurrent, n) => {
    const w = worldOrCurrent || selectedWorld
    setSelectedWorld(w)
    setSelectedLevel(n)
    setScreen('lesson')
  }

  const handleFinish = useCallback(async (result) => {
    setLastResult(result)
    const coins = result.passed
      ? calcCoins({ world: selectedWorld, levelNumber: selectedLevel, accuracy: result.accuracy, timeSec: result.timeSec, total: result.total })
      : { base: 0, perfectBonus: 0, speedBonus: 0, total: 0 }
    setLastCoins(coins)
    setPrevCoins(user?.totalCoins || 0)
    setScreen('complete')

    // Store detailed progress analysis locally (per user)
    if (user?.id) {
      recordLevel(user.id, {
        worldId: selectedWorld.id,
        theme: selectedWorld.theme,
        worldName: selectedWorld.name,
        levelNumber: selectedLevel,
        correct: result.correct,
        total: result.total,
        timeSec: result.timeSec,
        coins: coins.total,
        passed: result.passed,
      })
    }

    if (result.passed) {
      const res = await api.completeLevel({
        userId: user.id,
        worldId: selectedWorld.id,
        levelNumber: selectedLevel,
        score: result.correct,
        total: result.total,
        coinsEarned: coins.total,
        stars: calcStars(result.accuracy),
        timeSec: result.timeSec,
      }, token)
      if (res?.user) { updateUser(res.user); updateProgress(res.progress || []) }
    }
  }, [selectedWorld, selectedLevel, user, token, updateUser, updateProgress])

  const hasNextLevel = selectedWorld && selectedLevel < selectedWorld.levels

  if (loading || screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600" style={FONT}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="text-6xl">🚀</motion.div>
      </div>
    )
  }

  if (screen === 'landing') {
    return <LandingPage onSignUp={() => setScreen('signup')} onSignIn={() => setScreen('login')} />
  }

  if (screen === 'login') {
    return <LoginPage onLogin={handleAuthSuccess} onBack={() => setScreen('landing')} />
  }

  if (screen === 'signup' || screen === 'profile') {
    return <ProfileSetup onCreate={handleAuthSuccess} onBack={() => setScreen('landing')} />
  }

  // Lesson intro (how to solve, with worked example) before starting a level
  if (screen === 'lesson' && selectedWorld) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${selectedWorld.gradient}`}>
        <LessonIntro world={selectedWorld} levelNumber={selectedLevel} onStart={() => setScreen('play')} onBack={() => setScreen('levels')} />
      </div>
    )
  }

  // Gameplay & Complete get their own full-screen gradient background
  if (screen === 'play') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${selectedWorld.gradient}`}>
        <Gameplay world={selectedWorld} levelNumber={selectedLevel} grade={user?.grade || 3} onExit={() => setScreen('levels')} onFinish={handleFinish} />
      </div>
    )
  }

  if (screen === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <LevelComplete
          world={selectedWorld}
          levelNumber={selectedLevel}
          result={lastResult}
          coins={lastCoins}
          prevCoins={prevCoins}
          hasNext={hasNextLevel}
          onRetry={() => setScreen('play')}
          onNext={() => { setSelectedLevel((n) => n + 1); setScreen('play') }}
          onMap={() => setScreen('levels')}
        />
      </div>
    )
  }

  // map & levels share the topbar + adventure background
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
      <TopBar user={user} onLeaderboard={() => setShowLeaderboard(true)} onAnalytics={() => setShowAnalytics(true)} onLogout={handleLogout} />
      <AnimatePresence mode="wait">
        {screen === 'map' && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorldMap progressMap={progressMap} onSelectWorld={(w) => { setSelectedWorld(w); setScreen('levels') }} />
          </motion.div>
        )}
        {screen === 'levels' && selectedWorld && (
          <motion.div key="levels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LevelSelect world={selectedWorld} progressMap={progressMap} onBack={() => setScreen('map')} onSelectLevel={(n) => startLevel(selectedWorld, n)} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} meId={user?.id} />}
        {showAnalytics && <AnalyticsModal userId={user?.id} onClose={() => setShowAnalytics(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App