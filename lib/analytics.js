// LearnWithAli - local progress analytics, stored per user in localStorage.

const keyFor = (userId) => `lwa_analytics_${userId}`

function emptyStats() {
  return {
    totalQuestions: 0,
    totalCorrect: 0,
    totalTimeSec: 0,
    levelsCompleted: 0,
    attempts: 0,
    byTheme: {}, // theme -> { attempted, correct, timeSec, worldName }
    history: [], // most recent first, capped
  }
}

export function loadAnalytics(userId) {
  if (typeof window === 'undefined' || !userId) return emptyStats()
  try {
    const raw = localStorage.getItem(keyFor(userId))
    return raw ? { ...emptyStats(), ...JSON.parse(raw) } : emptyStats()
  } catch {
    return emptyStats()
  }
}

function save(userId, stats) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(stats))
  } catch {}
}

// Record one completed level attempt (pass or fail).
export function recordLevel(userId, { worldId, theme, worldName, levelNumber, correct, total, timeSec, coins, passed }) {
  const a = loadAnalytics(userId)
  a.totalQuestions += total
  a.totalCorrect += correct
  a.totalTimeSec += timeSec
  a.attempts += 1
  if (passed) a.levelsCompleted += 1

  const t = a.byTheme[theme] || { attempted: 0, correct: 0, timeSec: 0, worldName }
  t.attempted += total
  t.correct += correct
  t.timeSec += timeSec
  t.worldName = worldName
  a.byTheme[theme] = t

  a.history.unshift({
    date: Date.now(),
    worldId,
    worldName,
    theme,
    levelNumber,
    correct,
    total,
    accuracy: total ? correct / total : 0,
    timeSec,
    coins,
    passed,
  })
  a.history = a.history.slice(0, 50)

  save(userId, a)
  return a
}

// Derive friendly summary insights from stored stats.
export function computeInsights(stats) {
  const overallAcc = stats.totalQuestions ? stats.totalCorrect / stats.totalQuestions : 0
  const avgTimePerQ = stats.totalQuestions ? stats.totalTimeSec / stats.totalQuestions : 0
  const themes = Object.entries(stats.byTheme).map(([theme, v]) => ({
    theme,
    worldName: v.worldName,
    accuracy: v.attempted ? v.correct / v.attempted : 0,
    attempted: v.attempted,
  }))
  const sorted = [...themes].sort((a, b) => b.accuracy - a.accuracy)
  return {
    overallAcc,
    avgTimePerQ,
    themes,
    strongest: sorted[0] || null,
    weakest: sorted.length ? sorted[sorted.length - 1] : null,
  }
}
