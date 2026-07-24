/**
 * BMI 与体脂率计算
 *
 * BMI = 体重(kg) / 身高(m)²
 * 中国成人标准（WS/T 428-2013）：
 *   <18.5 偏瘦 · 18.5–23.9 正常 · 24.0–27.9 超重 · ≥28 肥胖
 *
 * 体脂率：
 *   - Deurenberg 估算法：1.2×BMI + 0.23×年龄 − 10.8×性别 − 5.4（男=1，女=0）
 *   - 美军海军围度法（US Navy）：基于颈围 / 腰围 /（女）臀围
 */

export type Sex = 'male' | 'female'

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface BmiCategoryInfo {
  id: BmiCategory
  label: string 
  range: string
  advice: string
}

export interface BmiResult {
  bmi: number
  category: BmiCategoryInfo
  /** BMI 18.5–23.9 对应的理想体重区间 (kg) */
  idealWeightMin: number
  idealWeightMax: number
}

export type BodyFatMethod = 'deurenberg' | 'navy'

export interface BodyFatCategoryInfo {
  id: string
  label: string
  range: string
}

export interface BodyFatResult {
  percent: number
  method: BodyFatMethod
  methodLabel: string
  category: BodyFatCategoryInfo
}

/** 中国成人 BMI 标准区间（WS/T 428-2013） */
export const BMI_CATEGORIES: readonly BmiCategoryInfo[] = [
  {
    id: 'underweight',
    label: '偏瘦',
    range: '< 18.5',
    advice: '可适当增加营养与力量训练，关注体重是否过低。',
  },
  {
    id: 'normal',
    label: '正常',
    range: '18.5 – 23.9',
    advice: '体重处于健康范围，保持均衡饮食与规律运动即可。',
  },
  {
    id: 'overweight',
    label: '超重',
    range: '24.0 – 27.9',
    advice: '建议控制热量摄入，增加有氧与力量训练。',
  },
  {
    id: 'obese',
    label: '肥胖',
    range: '≥ 28',
    advice: '建议在专业指导下制定减重计划，关注代谢相关指标。',
  },
]

/** 男性体脂率参考区间（大致成人标准） */
const MALE_BF_CATEGORIES: BodyFatCategoryInfo[] = [
  { id: 'essential', label: '必需脂肪', range: '2 – 5%' },
  { id: 'athlete', label: '运动员', range: '6 – 13%' },
  { id: 'fitness', label: '健身水平', range: '14 – 17%' },
  { id: 'average', label: '一般', range: '18 – 24%' },
  { id: 'obese', label: '偏高', range: '≥ 25%' },
]

/** 女性体脂率参考区间 */
const FEMALE_BF_CATEGORIES: BodyFatCategoryInfo[] = [
  { id: 'essential', label: '必需脂肪', range: '10 – 13%' },
  { id: 'athlete', label: '运动员', range: '14 – 20%' },
  { id: 'fitness', label: '健身水平', range: '21 – 24%' },
  { id: 'average', label: '一般', range: '25 – 31%' },
  { id: 'obese', label: '偏高', range: '≥ 32%' },
]

function assertPositive(n: number, label: string): void {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${label}须为正数`)
  }
}

function assertAge(age: number): void {
  if (!Number.isFinite(age) || age < 1 || age > 120) {
    throw new Error('年龄须在 1–120 之间')
  }
}

export function roundMetric(n: number, digits = 1): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** 身高厘米 → 米 */
export function cmToMeters(cm: number): number {
  assertPositive(cm, '身高')
  return cm / 100
}

export function classifyBmi(bmi: number): BmiCategoryInfo {
  if (!Number.isFinite(bmi)) throw new Error('BMI 无效')
  if (bmi < 18.5) return BMI_CATEGORIES[0]
  if (bmi < 24) return BMI_CATEGORIES[1]
  if (bmi < 28) return BMI_CATEGORIES[2]
  return BMI_CATEGORIES[3]
}

/**
 * 计算 BMI
 * @param weightKg 体重（千克）
 * @param heightCm 身高（厘米）
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  assertPositive(weightKg, '体重')
  assertPositive(heightCm, '身高')
  if (heightCm < 50 || heightCm > 300) throw new Error('身高须在 50–300 cm 之间')
  if (weightKg < 10 || weightKg > 500) throw new Error('体重须在 10–500 kg 之间')

  const heightM = cmToMeters(heightCm)
  const bmi = weightKg / (heightM * heightM)
  const category = classifyBmi(bmi)

  return {
    bmi: roundMetric(bmi, 1),
    category,
    idealWeightMin: roundMetric(18.5 * heightM * heightM, 1),
    idealWeightMax: roundMetric(23.9 * heightM * heightM, 1),
  }
}

export function classifyBodyFat(percent: number, sex: Sex): BodyFatCategoryInfo {
  if (!Number.isFinite(percent) || percent < 0 || percent > 80) {
    throw new Error('体脂率结果异常，请检查输入')
  }
  const table = sex === 'male' ? MALE_BF_CATEGORIES : FEMALE_BF_CATEGORIES
  if (sex === 'male') {
    if (percent < 6) return table[0]
    if (percent < 14) return table[1]
    if (percent < 18) return table[2]
    if (percent < 25) return table[3]
    return table[4]
  }
  if (percent < 14) return table[0]
  if (percent < 21) return table[1]
  if (percent < 25) return table[2]
  if (percent < 32) return table[3]
  return table[4]
}

/**
 * Deurenberg 体脂率估算
 * BF% = 1.2×BMI + 0.23×年龄 − 10.8×性别 − 5.4（男=1，女=0）
 */
export function bodyFatDeurenberg(bmi: number, age: number, sex: Sex): BodyFatResult {
  if (!Number.isFinite(bmi) || bmi <= 0) throw new Error('BMI 须为正数')
  assertAge(age)
  const sexFactor = sex === 'male' ? 1 : 0
  const percent = 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4
  return {
    percent: roundMetric(percent, 1),
    method: 'deurenberg',
    methodLabel: 'Deurenberg 估算',
    category: classifyBodyFat(percent, sex),
  }
}

/**
 * 美军海军围度法
 * @param heightCm 身高 cm
 * @param neckCm 颈围 cm
 * @param waistCm 腰围 cm（肚脐附近）
 * @param hipCm 臀围 cm（仅女性需要）
 */
export function bodyFatNavy(
  heightCm: number,
  neckCm: number,
  waistCm: number,
  sex: Sex,
  hipCm?: number,
): BodyFatResult {
  assertPositive(heightCm, '身高')
  assertPositive(neckCm, '颈围')
  assertPositive(waistCm, '腰围')
  if (heightCm < 50 || heightCm > 300) throw new Error('身高须在 50–300 cm 之间')

  let density: number
  if (sex === 'male') {
    const abdomen = waistCm - neckCm
    if (abdomen <= 0) throw new Error('腰围须大于颈围')
    density = 1.0324 - 0.19077 * Math.log10(abdomen) + 0.15456 * Math.log10(heightCm)
  } else {
    if (hipCm == null || !Number.isFinite(hipCm) || hipCm <= 0) {
      throw new Error('女性计算需填写臀围')
    }
    const sum = waistCm + hipCm - neckCm
    if (sum <= 0) throw new Error('腰围 + 臀围须大于颈围')
    density = 1.29579 - 0.35004 * Math.log10(sum) + 0.221 * Math.log10(heightCm)
  }

  if (density <= 0) throw new Error('围度数据不合理，请检查输入')
  const percent = 495 / density - 450
  return {
    percent: roundMetric(percent, 1),
    method: 'navy',
    methodLabel: '美军海军围度法',
    category: classifyBodyFat(percent, sex),
  }
}

/** 由身高体重直接算 Deurenberg 体脂 */
export function bodyFatFromWeight(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): BodyFatResult {
  const { bmi } = calculateBmi(weightKg, heightCm)
  return bodyFatDeurenberg(bmi, age, sex)
}
