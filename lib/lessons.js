// LearnWithAli - "How to do it" mini-lessons with worked examples, per world theme.

export const LESSONS = {
  multiplication: {
    emoji: '\u2716\ufe0f',
    title: 'How to Multiply',
    intro: 'Multiplication is fast adding! It means adding the same number many times.',
    steps: [
      'Look at the two numbers, like 4 \u00d7 3.',
      'The first number (4) is what you add. The second (3) is how many times.',
      'So 4 \u00d7 3 means 4 + 4 + 4.',
      'Add them up to get your answer!',
    ],
    example: {
      problem: '4 \u00d7 3 = ?',
      work: ['4 + 4 + 4', '= 8 + 4', '= 12'],
      answer: '12',
    },
  },
  division: {
    emoji: '\u2797',
    title: 'How to Divide',
    intro: 'Dividing means sharing a number into equal groups. It is the opposite of multiplying.',
    steps: [
      'Look at 12 \u00f7 3. You have 12 things to share.',
      'The second number (3) is how many equal groups.',
      'Ask: what number times 3 gives 12?',
      'Because 4 \u00d7 3 = 12, the answer is 4!',
    ],
    example: {
      problem: '12 \u00f7 3 = ?',
      work: ['Share 12 into 3 equal groups', '3 \u00d7 4 = 12', 'So each group gets 4'],
      answer: '4',
    },
  },
  fraction: {
    emoji: '\ud83c\udf70',
    title: 'How to Add Fractions',
    intro: 'A fraction is a part of a whole, like a slice of pizza! The bottom number is how many slices in total.',
    steps: [
      'When bottoms (denominators) are the SAME, it is easy.',
      'Just add the top numbers (numerators).',
      'Keep the bottom number the same.',
      'Example: 1/5 + 2/5 \u2192 add tops 1 + 2 = 3, keep bottom 5.',
    ],
    example: {
      problem: '1/5 + 2/5 = ?',
      work: ['Add the tops: 1 + 2 = 3', 'Keep the bottom: 5', '= 3/5'],
      answer: '3/5',
    },
  },
  decimal: {
    emoji: '\ud83d\udd22',
    title: 'How to Add Decimals',
    intro: 'Decimals are numbers with a point, like 2.5. The digits after the point are smaller parts.',
    steps: [
      'Line up the decimal points, one under the other.',
      'Add the numbers just like normal.',
      'Bring the decimal point straight down into the answer.',
      'Example: 1.2 + 0.6.',
    ],
    example: {
      problem: '1.2 + 0.6 = ?',
      work: ['Line up: 1.2 and 0.6', 'Add: 12 + 6 = 18 (in tenths)', '= 1.8'],
      answer: '1.8',
    },
  },
  word: {
    emoji: '\ud83d\udcd6',
    title: 'How to Solve Word Problems',
    intro: 'Word problems are little stories with a math question hiding inside!',
    steps: [
      'Read the story slowly and picture it.',
      'Find the important numbers.',
      'Decide: do I add, subtract, multiply, or share?',
      'Words like "in each" often mean multiply. "Share equally" means divide.',
    ],
    example: {
      problem: 'Ali has 3 boxes with 4 apples in each. How many apples?',
      work: ['"in each" means multiply', '3 boxes \u00d7 4 apples', '= 12 apples'],
      answer: '12',
    },
  },
  geometry: {
    emoji: '\ud83d\udcd0',
    title: 'Area & Perimeter',
    intro: 'Shapes have an AREA (space inside) and a PERIMETER (distance around the edge).',
    steps: [
      'AREA of a rectangle = length \u00d7 width.',
      'PERIMETER = add up all 4 sides = 2 \u00d7 (length + width).',
      'For a 5 by 3 rectangle: Area = 5 \u00d7 3.',
      'Perimeter = 2 \u00d7 (5 + 3).',
    ],
    example: {
      problem: 'A rectangle is 5 cm by 3 cm. Find the AREA.',
      work: ['Area = length \u00d7 width', '= 5 \u00d7 3', '= 15 cm\u00b2'],
      answer: '15',
    },
  },
}

export function getLesson(theme) {
  return LESSONS[theme] || LESSONS.multiplication
}
