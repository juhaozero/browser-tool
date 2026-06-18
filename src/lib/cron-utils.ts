/**
 * Cron 表达式解析与生成（标准 5 字段：分 时 日 月 周）
 * 下次执行时间通过逐分钟枚举计算，适合预览而非高精度调度
 */
const FIELD_RANGES = [
  { name: '分', min: 0, max: 59 },
  { name: '时', min: 0, max: 23 },
  { name: '日', min: 1, max: 31 },
  { name: '月', min: 1, max: 12 },
  { name: '周', min: 0, max: 7 },
]

function matchField(value: number, field: string, _min: number, _max: number): boolean {
  if (field === '*') return true
  if (field.includes('/')) {
    const [base, step] = field.split('/')
    const stepN = parseInt(step, 10)
    if (base === '*') return value % stepN === 0
    return value >= parseInt(base, 10) && (value - parseInt(base, 10)) % stepN === 0
  }
  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number)
    return value >= a && value <= b
  }
  if (field.includes(',')) {
    return field.split(',').some((v) => parseInt(v, 10) === value)
  }
  return parseInt(field, 10) === value
}

/** 周字段匹配：cron 中 0 与 7 均表示周日 */
function matchDowField(value: number, field: string): boolean {
  if (field === '?' || field === '*') return true
  if (field.includes(',')) {
    return field.split(',').some((part) => matchDowField(value, part.trim()))
  }
  if (field.includes('-')) {
    const [a, b] = field.split('-').map((v) => (parseInt(v, 10) === 7 ? 0 : parseInt(v, 10)))
    return value >= Math.min(a, b) && value <= Math.max(a, b)
  }
  if (field.includes('/')) {
    const [base, step] = field.split('/')
    const stepN = parseInt(step, 10)
    const start = base === '*' ? 0 : parseInt(base, 10) === 7 ? 0 : parseInt(base, 10)
    return value >= start && (value - start) % stepN === 0
  }
  const n = parseInt(field, 10)
  const target = n === 7 ? 0 : n
  return value === target
}

export function validateCron(expr: string): string | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Cron 表达式需要 5 个字段：分 时 日 月 周'
  for (let i = 0; i < 5; i++) {
    const { min, max, name } = FIELD_RANGES[i]
    const field = parts[i]
    if (field === '?') continue
    if (!/^[\d*,/?-]+$/.test(field)) return `${name}字段格式无效: ${field}`
    if (!field.includes('*') && !field.includes('/') && !field.includes('-') && !field.includes(',')) {
      const n = parseInt(field, 10)
      if (n < min || n > max) return `${name}字段值 ${n} 超出范围 [${min}-${max}]`
    }
  }
  return null
}

export function describeCron(expr: string): string {
  const err = validateCron(expr)
  if (err) return err
  const [min, hour, day, month, dow] = expr.trim().split(/\s+/)
  const parts: string[] = []
  if (min === '0' && hour === '0' && day === '*' && month === '*' && dow === '*')
    return '每天 00:00 执行'
  if (min.startsWith('*/')) parts.push(`每 ${min.slice(2)} 分钟`)
  else if (min !== '*') parts.push(`第 ${min} 分钟`)
  if (hour !== '*') parts.push(`${hour} 时`)
  if (day !== '*') parts.push(`${day} 日`)
  if (month !== '*') parts.push(`${month} 月`)
  if (dow !== '*' && dow !== '?') parts.push(`周 ${dow}`)
  return parts.length ? parts.join('，') + ' 执行' : '每分钟执行'
}

/** 日字段与周字段匹配：两者均指定时为 OR 语义（标准 cron） */
function matchesDomDow(
  dayOfMonth: number,
  dayOfWeek: number,
  dayField: string,
  dowField: string,
): boolean {
  const domWildcard = dayField === '*'
  const dowWildcard = dowField === '*' || dowField === '?'
  const domMatch = matchField(dayOfMonth, dayField, 1, 31)
  const dowMatch = matchDowField(dayOfWeek, dowField)

  if (domWildcard && dowWildcard) return true
  if (domWildcard) return dowMatch
  if (dowWildcard) return domMatch
  return domMatch || dowMatch
}

export interface CronNextRunsResult {
  runs: Date[]
  incomplete: boolean
}

export function getNextCronRuns(expr: string, count = 5): CronNextRunsResult | string {
  const err = validateCron(expr)
  if (err) return err
  const parts = expr.trim().split(/\s+/)
  const results: Date[] = []
  const cursor = new Date()
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  let guard = 0
  while (results.length < count && guard < 525600) {
    guard++
    const m = cursor.getMinutes()
    const h = cursor.getHours()
    const d = cursor.getDate()
    const mo = cursor.getMonth() + 1
    const dow = cursor.getDay()
    if (
      matchField(m, parts[0], 0, 59) &&
      matchField(h, parts[1], 0, 23) &&
      matchField(mo, parts[3], 1, 12) &&
      matchesDomDow(d, dow, parts[2], parts[4])
    ) {
      results.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }
  return { runs: results, incomplete: results.length < count }
}

export const CRON_PRESETS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天 0 点', value: '0 0 * * *' },
  { label: '每天 9 点', value: '0 9 * * *' },
  { label: '每周一 9 点', value: '0 9 * * 1' },
  { label: '每月 1 日 0 点', value: '0 0 1 * *' },
]
