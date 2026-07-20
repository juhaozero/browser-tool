/** Lorem 与简单假数据生成 */

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
]

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Jamie']
const LAST_NAMES = ['Chen', 'Smith', 'Garcia', 'Kim', 'Patel', 'Brown', 'Lee', 'Nguyen', 'Wilson', 'Martinez']
const DOMAINS = ['example.com', 'mail.test', 'demo.dev', 'sample.io']
const STREETS = ['Oak St', 'Maple Ave', 'Cedar Rd', 'Pine Ln', 'River Blvd']
const CITIES = ['Shanghai', 'Beijing', 'Shenzhen', 'Hangzhou', 'Chengdu', 'Guangzhou']

function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}

function pick<T>(arr: T[]): T {
  return arr[randInt(arr.length)]!
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function generateLoremWords(count: number): string {
  const words: string[] = []
  for (let i = 0; i < count; i++) words.push(pick(LOREM_WORDS))
  words[0] = capitalize(words[0]!)
  return words.join(' ')
}

export function generateLoremSentences(count: number): string {
  const sentences: string[] = []
  for (let i = 0; i < count; i++) {
    const len = 6 + randInt(10)
    sentences.push(generateLoremWords(len) + '.')
  }
  return sentences.join(' ')
}

export function generateLoremParagraphs(count: number, sentencesPer = 4): string {
  const paragraphs: string[] = []
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateLoremSentences(sentencesPer))
  }
  return paragraphs.join('\n\n')
}

export type FakePerson = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  company: string
}

export function generateFakePerson(): FakePerson {
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const name = `${first} ${last}`
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@${pick(DOMAINS)}`
  const phone = `+86 1${randInt(9)}${String(randInt(100000000)).padStart(8, '0')}`
  const address = `${100 + randInt(900)} ${pick(STREETS)}`
  const city = pick(CITIES)
  const company = `${pick(LAST_NAMES)} ${pick(['Labs', 'Tech', 'Studio', 'Systems', 'Digital'])}`
  return { name, email, phone, address, city, company }
}

export function generateFakeJson(count: number): string {
  const rows = Array.from({ length: count }, (_, i) => {
    const p = generateFakePerson()
    return { id: i + 1, ...p }
  })
  return JSON.stringify(rows, null, 2)
}
