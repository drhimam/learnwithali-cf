// LearnWithAli - Algorithmic question generator for Grade 3-5.
// Every question is multiple-choice (4 options) for big, touch-friendly buttons.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build 4 unique choices (as strings) containing the correct answer.
function buildChoices(correct, makeDistractor) {
  const set = new Set([String(correct)])
  let guard = 0
  while (set.size < 4 && guard < 50) {
    const d = makeDistractor()
    if (d !== null && d !== undefined) set.add(String(d))
    guard++
  }
  // Fallback padding if distractors collide too much
  let pad = 1
  while (set.size < 4) {
    set.add(String(Number(correct) + pad))
    pad++
  }
  return shuffle([...set])
}

const NAMES = ['Ali', 'Maya', 'Leo', 'Zara', 'Sam', 'Nina', 'Omar', 'Lily']
const THINGS = [
  { s: 'apple', p: 'apples', e: '🍎' },
  { s: 'sticker', p: 'stickers', e: '⭐' },
  { s: 'cookie', p: 'cookies', e: '🍪' },
  { s: 'marble', p: 'marbles', e: '🔵' },
  { s: 'pencil', p: 'pencils', e: '✏️' },
]

function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

function genMultiplication(level) {
  const cap = Math.min(3 + level, 12)
  const a = randInt(2, cap)
  const b = randInt(2, Math.min(4 + level, 12))
  const ans = a * b
  const choices = buildChoices(ans, () => {
    const opts = [ans + randInt(1, 5), ans - randInt(1, 5), a * (b + 1), (a + 1) * b, a + b]
    const v = pick(opts)
    return v > 0 ? v : null
  })
  return { prompt: `${a} × ${b} = ?`, answer: String(ans), choices, hint: `Add ${a} to itself ${b} times.`, emoji: '✖️' }
}

function genDivision(level) {
  const b = randInt(2, Math.min(3 + level, 12))
  const c = randInt(2, Math.min(4 + level, 12))
  const a = b * c
  const ans = c
  const choices = buildChoices(ans, () => {
    const v = pick([ans + 1, ans - 1, ans + 2, ans - 2, b])
    return v > 0 ? v : null
  })
  return { prompt: `${a} ÷ ${b} = ?`, answer: String(ans), choices, hint: `What times ${b} makes ${a}?`, emoji: '➗' }
}

function genFraction(level) {
  const d = randInt(3, Math.min(4 + level, 12))
  const n1 = randInt(1, d - 1)
  const n2 = randInt(1, d - 1)
  const sum = n1 + n2
  const ans = `${sum}/${d}`
  const choices = buildChoices(ans, () => {
    const opts = [`${sum}/${d + d}`, `${sum + 1}/${d}`, `${Math.max(1, sum - 1)}/${d}`, `${n1 * n2}/${d}`]
    return pick(opts)
  })
  return { prompt: `${n1}/${d} + ${n2}/${d} = ?`, answer: ans, choices, hint: 'Same bottom number? Just add the tops!', emoji: '🍰' }
}

function genDecimal(level) {
  const scale = level + 1
  const a = randInt(1, 9 * scale) / 10
  const b = randInt(1, 9 * scale) / 10
  const ans = (a + b).toFixed(1)
  const choices = buildChoices(ans, () => {
    const opts = [(a + b + 0.1).toFixed(1), (a + b - 0.1).toFixed(1), (a + b + 1).toFixed(1), (Math.abs(a - b)).toFixed(1)]
    return pick(opts)
  })
  return { prompt: `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, answer: ans, choices, hint: 'Line up the decimal points, then add.', emoji: '🔢' }
}

function genWord(level) {
  const name = pick(NAMES)
  const thing = pick(THINGS)
  const a = randInt(2, Math.min(4 + level, 12))
  const b = randInt(2, Math.min(4 + level, 10))
  const type = pick(['groups', 'add', 'share'])
  if (type === 'add') {
    const ans = a + b
    const choices = buildChoices(ans, () => pick([ans + 1, ans - 1, ans + 2, a * b]))
    return {
      prompt: `${name} had ${a} ${thing.p} ${thing.e} and got ${b} more. How many now?`,
      answer: String(ans), choices, hint: 'Add the two amounts together.', emoji: '📖',
    }
  }
  if (type === 'share') {
    const ans = a
    const total = a * b
    const choices = buildChoices(ans, () => pick([ans + 1, ans - 1, b, ans + 2]).valueOf() > 0 ? pick([ans + 1, ans - 1, b, ans + 2]) : ans + 3)
    return {
      prompt: `${name} shares ${total} ${thing.p} ${thing.e} equally among ${b} friends. How many each?`,
      answer: String(ans), choices, hint: `Divide ${total} into ${b} equal groups.`, emoji: '📖',
    }
  }
  const ans = a * b
  const choices = buildChoices(ans, () => pick([ans + a, ans - a, a + b, ans + b]))
  return {
    prompt: `${name} has ${a} boxes with ${b} ${thing.p} ${thing.e} in each. How many ${thing.p} in total?`,
    answer: String(ans), choices, hint: `Multiply ${a} × ${b}.`, emoji: '📖',
  }
}

function genGeometry(level) {
  const l = randInt(2, 5 + level)
  const w = randInt(2, 5 + level)
  const askArea = Math.random() < 0.5
  if (askArea) {
    const ans = l * w
    const choices = buildChoices(ans, () => pick([2 * (l + w), ans + l, ans - w, (l + 1) * w]))
    return { prompt: `A rectangle is ${l} cm by ${w} cm. What is its AREA (cm²)?`, answer: String(ans), choices, hint: 'Area = length × width.', emoji: '📐' }
  }
  const ans = 2 * (l + w)
  const choices = buildChoices(ans, () => pick([l * w, ans + 2, ans - 2, l + w]))
  return { prompt: `A rectangle is ${l} cm by ${w} cm. What is its PERIMETER (cm)?`, answer: String(ans), choices, hint: 'Perimeter = 2 × (length + width).', emoji: '📐' }
}

const GENERATORS = {
  multiplication: genMultiplication,
  division: genDivision,
  fraction: genFraction,
  decimal: genDecimal,
  word: genWord,
  geometry: genGeometry,
}

export function generateQuestions(theme, level, count = 6, grade = 3) {
  const gen = GENERATORS[theme] || genMultiplication
  // Difficulty scales with BOTH the level and the child's grade.
  // Higher grade => higher effective difficulty for the same level.
  const gradeBoost = Math.max(0, (grade - 3)) * 3
  const effLevel = level + gradeBoost
  const questions = []
  const seen = new Set()
  let guard = 0
  while (questions.length < count && guard < count * 20) {
    const q = gen(effLevel)
    if (!seen.has(q.prompt)) {
      seen.add(q.prompt)
      questions.push({ id: `${theme}-${grade}-${level}-${questions.length}`, ...q })
    }
    guard++
  }
  return questions
}
