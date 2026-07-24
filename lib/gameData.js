// LearnWithAli - Grade 3-5 world & level configuration
// Worlds are the "galaxies" of the adventure map. Levels unlock sequentially.

export const WORLDS = [
  {
    id: 'mult',
    name: 'Multiplication Mountain',
    theme: 'multiplication',
    emoji: '🏔️',
    gradient: 'from-orange-400 to-red-500',
    ring: 'ring-orange-300',
    accent: '#f97316',
    levels: 8,
    baseCoins: 12,
    blurb: 'Climb the peaks by mastering your times tables!',
  },
  {
    id: 'div',
    name: 'Division Valley',
    theme: 'division',
    emoji: '🏞️',
    gradient: 'from-green-400 to-emerald-600',
    ring: 'ring-green-300',
    accent: '#22c55e',
    levels: 8,
    baseCoins: 14,
    blurb: 'Share treasures fairly across the valley.',
  },
  {
    id: 'frac',
    name: 'Fraction Forest',
    theme: 'fraction',
    emoji: '🌲',
    gradient: 'from-emerald-400 to-teal-600',
    ring: 'ring-emerald-300',
    accent: '#10b981',
    levels: 8,
    baseCoins: 16,
    blurb: 'Find your path through the fraction trees.',
  },
  {
    id: 'dec',
    name: 'Decimal Desert',
    theme: 'decimal',
    emoji: '🏜️',
    gradient: 'from-amber-400 to-yellow-600',
    ring: 'ring-amber-300',
    accent: '#f59e0b',
    levels: 8,
    baseCoins: 16,
    blurb: 'Cross the dunes one decimal point at a time.',
  },
  {
    id: 'word',
    name: 'Word Problem Wharf',
    theme: 'word',
    emoji: '⚓',
    gradient: 'from-sky-400 to-blue-600',
    ring: 'ring-sky-300',
    accent: '#3b82f6',
    levels: 8,
    baseCoins: 18,
    blurb: 'Solve story puzzles at the busy docks.',
  },
  {
    id: 'geo',
    name: 'Geometry Galaxy',
    theme: 'geometry',
    emoji: '🌌',
    gradient: 'from-fuchsia-500 to-purple-700',
    ring: 'ring-fuchsia-300',
    accent: '#a855f7',
    levels: 8,
    baseCoins: 20,
    blurb: 'Explore shapes among the stars.',
  },
]

export const QUESTIONS_PER_LEVEL = 6
export const PASS_THRESHOLD = 0.8 // 80% correct to pass

export const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦄', '🐯', '🐨', '🐵', '🦉', '🐙', '🐧', '🐉']

export function getWorld(worldId) {
  return WORLDS.find((w) => w.id === worldId)
}

// Coin reward: base scales with level, plus bonuses for mastery & speed.
export function calcCoins({ world, levelNumber, accuracy, timeSec, total }) {
  const base = world.baseCoins + levelNumber * 2
  const perfectBonus = accuracy >= 1 ? 20 : 0
  const speedBonus = timeSec > 0 && timeSec < total * 5 ? 10 : 0
  return { base, perfectBonus, speedBonus, total: base + perfectBonus + speedBonus }
}

// Stars earned based on accuracy (1-3).
export function calcStars(accuracy) {
  if (accuracy >= 1) return 3
  if (accuracy >= 0.9) return 2
  if (accuracy >= PASS_THRESHOLD) return 1
  return 0
}
