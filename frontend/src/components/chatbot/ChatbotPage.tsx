import { useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './chatbot.css'
import { Link } from 'react-router-dom'
import type { StepAnalysis } from '../../types/analysis'
import { analyzeCode } from '../../lib/api'

const starterCode = `def find_max(arr):
    max_val = arr[0]
    for i in range(len(arr)+1):  # off-by-one
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val`

export default function ChatbotPage() {
  const [input, setInput] = useState(starterCode)
  const [{ rule, llm }, setAnalyses] = useState<{ rule: StepAnalysis | null; llm: StepAnalysis | null }>({ rule: null, llm: null })
  const [visible, setVisible] = useState({ rule: 0, llm: 0 })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const codeHighlight = useMemo(() => {
    if (!rule?.highlightLines?.length) return [] as number[]
    return rule.highlightLines!
  }, [rule])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [visible])

  const onSend = async () => {
    if (!input.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await analyzeCode(input)
      setAnalyses(res)
      setVisible({ rule: 0, llm: 0 })

      let i = 0
      const tick = () => {
        i += 1
        setVisible(() => ({
          rule: Math.min(i, res.rule.reasoning_steps.length),
          llm: Math.min(i, res.llm.reasoning_steps.length),
        }))
        if (i < Math.max(res.rule.reasoning_steps.length, res.llm.reasoning_steps.length)) {
          setTimeout(tick, 900)
        } else {
          setSending(false)
        }
      }
      setTimeout(tick, 400)
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Lỗi gọi API')
      setSending(false)
    }
  }

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <h1>💬 Chatbot phân tích code</h1>
        <nav>
          <Link to="/" className="nav-link">← Trang chủ</Link>
        </nav>
      </header>

      <div className="chatbot-layout">
        <section className="chatbot-code">
          <h3>Mã nguồn</h3>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
          <button className="send-btn" onClick={onSend} disabled={sending}>
            {sending ? 'Đang phân tích…' : 'Gửi đến Chatbot'}
          </button>
          {error && <div style={{background:'#1f2937',border:'1px solid #b91c1c',color:'#fecaca',padding:'.6rem .75rem',borderRadius:8}}>{error}</div>}
          {(rule || llm) && (
            <div className="code-preview">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                wrapLines
                showLineNumbers
                customStyle={{ margin: 0, borderRadius: 8, background: '#0f0f23' }}
                lineProps={(ln: number) => ({
                  style: {
                    display: 'block',
                    background: codeHighlight.includes(ln)
                      ? 'linear-gradient(90deg, rgba(255,215,0,0.12) 0%, rgba(255,215,0,0.05) 100%)'
                      : undefined,
                  },
                })}
              >
                {input}
              </SyntaxHighlighter>
            </div>
          )}
        </section>

        <section className="chat-columns" ref={scrollRef}>
          <div className="panel panel--system">
            <header className="panel__header">
              {rule ? (
                <>
                  <span className="panel__icon">{rule.icon}</span> {rule.title}
                </>
              ) : (
                <>
                  <span className="panel__icon">⚙️</span> Hệ thống
                </>
              )}
            </header>
            {!rule && <div className="empty">Nhập mã và bấm gửi để xem phân tích.</div>}
            {rule && (
              <div className="panel__body">
                <h4>Reasoning</h4>
                <ul className="steps">
                  {rule.reasoning_steps.slice(0, visible.rule).map((s, idx) => (
                    <li key={idx} className="step">{s}</li>
                  ))}
                </ul>
                {visible.rule >= rule.reasoning_steps.length && (
                  <>
                    <h4>Fix</h4>
                    <ul className="steps">
                      {rule.fix_steps.map((s, idx) => (
                        <li key={idx} className="step fix">{s}</li>
                      ))}
                    </ul>
                    {rule.suggested_patch && (
                      <div className="patch">
                        <strong>Patch:</strong>
                        <pre>{rule.suggested_patch}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="panel panel--llm">
            <header className="panel__header">
              {llm ? (
                <>
                  <span className="panel__icon">{llm.icon}</span> {llm.title}
                </>
              ) : (
                <>
                  <span className="panel__icon">🤖</span> LLM
                </>
              )}
            </header>
            {!llm && <div className="empty">Nhập mã và bấm gửi để xem phân tích.</div>}
            {llm && (
              <div className="panel__body">
                <h4>Reasoning</h4>
                <ul className="steps">
                  {llm.reasoning_steps.slice(0, visible.llm).map((s, idx) => (
                    <li key={idx} className="step">{s}</li>
                  ))}
                </ul>
                {visible.llm >= llm.reasoning_steps.length && (
                  <>
                    <h4>Fix</h4>
                    <ul className="steps">
                      {llm.fix_steps.map((s, idx) => (
                        <li key={idx} className="step fix">{s}</li>
                      ))}
                    </ul>
                    {llm.suggested_patch && (
                      <div className="patch">
                        <strong>Patch:</strong>
                        <pre>{llm.suggested_patch}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
