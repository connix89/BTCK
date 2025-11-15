// filepath: /Users/lekhang/Documents/BTCK/frontend/src/lib/api.ts
// Simple API client for analysis endpoints with fallback proxy.
import type { StepAnalysis } from '../types/analysis'

export type AnalyzeResponse = { rule: StepAnalysis; llm: StepAnalysis }

const RAW_BASE = (import.meta as any)?.env?.VITE_API_URL || ''
const BASE = RAW_BASE.replace(/\/$/, '') // trim trailing slash

function isValidStepAnalysis(x: any): x is StepAnalysis {
  return x && typeof x === 'object' && typeof x.icon === 'string' && typeof x.title === 'string' && Array.isArray(x.reasoning_steps) && Array.isArray(x.fix_steps)
}

function normalize(resp: any): AnalyzeResponse | null {
  if (!resp || typeof resp !== 'object') return null
  const { rule, llm } = resp as any
  if (!isValidStepAnalysis(rule) || !isValidStepAnalysis(llm)) return null
  return { rule, llm }
}

export async function analyzeCode(code: string): Promise<AnalyzeResponse> {
  const url = BASE ? `${BASE}/analyze` : '/analyze' // if no base, rely on vite proxy
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 15000)
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    })
  } catch (e: any) {
    clearTimeout(t)
    throw new Error(e?.name === 'AbortError' ? 'Request timeout' : 'Network error')
  }
  clearTimeout(t)
  if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`))
  const data = await res.json().catch(() => null)
  const parsed = normalize(data)
  if (!parsed) throw new Error('Invalid payload')
  return parsed
}
