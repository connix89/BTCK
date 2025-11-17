import { useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './gpt.css'
import type { ChatMessage } from '../../types/analysis'
import { starterCode } from '../../data/newchatMock'
import { analyzeCode } from '../../lib/api'

export default function GPTChatPage() {
  const [input, setInput] = useState(starterCode)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'details' | 'overview' | 'patch'>('details')
  const [speed, setSpeed] = useState<400 | 800 | 1200>(800)
  const [compareMode, setCompareMode] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.role === 'user') return m.text
    }
    return input
  }, [messages, input])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function onSend() {
    if (!input.trim() || sending) return
    setError(null)
    setSending(true)
    const userId = `${Date.now()}-u`
    const asstId = `${Date.now()}-a`

    const userMsg: ChatMessage = { id: userId, role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')

    try {
      const analysis = await analyzeCode(userMsg.text)
      const assistantMsg: ChatMessage = {
        id: asstId,
        role: 'assistant',
        analysis,
        progress: { rule: 0, llm: 0, active: 'rule' },
      }
      setMessages((m) => [...m, assistantMsg])

      const totalRule = analysis.rule.reasoning_steps.length
      const totalLlm = analysis.llm.reasoning_steps.length
      const maxTicks = Math.max(totalRule, totalLlm) * 2
      let t = 0
      const tick = () => {
        t += 1
        const turn: 'rule' | 'llm' = t % 2 === 1 ? 'rule' : 'llm'
        setMessages((prev) => prev.map((msg) => {
          if (msg.id !== asstId || msg.role !== 'assistant') return msg
          const nextRule = turn === 'rule' ? Math.min(msg.progress.rule + 1, totalRule) : msg.progress.rule
          const nextLlm = turn === 'llm' ? Math.min(msg.progress.llm + 1, totalLlm) : msg.progress.llm
          const done = nextRule >= totalRule && nextLlm >= totalLlm
          return { ...msg, progress: { rule: nextRule, llm: nextLlm, active: done ? null : turn } }
        }))
        if (t < maxTicks) setTimeout(tick, speed)
        else setSending(false)
      }
      setTimeout(tick, 500)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Lỗi gọi API')
      setSending(false)
    }
  }

  function onRegenerate() {
    if (sending) return
    if (!lastUserText?.trim()) return
    setInput(lastUserText)
    setTimeout(() => onSend(), 0)
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }

  return (
    <div className="gpt-root">
      <header className="gpt-header">
        <div className="gpt-title">
          <span className="gpt-logo">BTCK</span>
          <span className="gpt-sub">Trợ lý học tập</span>
        </div>
        <div className="gpt-actions">
          <div className="gpt-selects">
            <label className="gpt-label">Tốc độ</label>
            <select className="gpt-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value) as 400|800|1200)}>
              <option value={1200}>Chậm</option>
              <option value={800}>Vừa</option>
              <option value={400}>Nhanh</option>
            </select>
            <label className="gpt-label switch">
              <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
              <span>Chế độ so sánh</span>
            </label>
          </div>
          <button className="gpt-btn ghost" onClick={() => setMessages([])}>Hội thoại mới</button>
          <button className="gpt-btn" onClick={onRegenerate} disabled={sending}>Phân tích lại</button>
        </div>
      </header>

      <main className="gpt-main">
        {error && (
          <div className="gpt-alert">
            ⛔ {error}
          </div>
        )}

        {messages.length === 0 && !sending && (
          <section className="gpt-empty">
            <div className="gpt-hero">💬</div>
            <div className="gpt-empty-title">Bắt đầu phân tích code</div>
            <div className="gpt-empty-sub">Dán code Python của bạn, nhấn Gửi để nhận phân tích từ 2 góc nhìn Rule-based và LLM.</div>
            <div className="gpt-suggestions">
              <button onClick={() => setInput(starterCode)}>Dán ví dụ Off-by-one</button>
              <button onClick={() => setInput('def sum(xs):\n    s=0\n    for x in xs:\n        s+=x\n    return s')}>Ví dụ: Sum list</button>
              <button onClick={() => setInput('class Counter:\n    def __init__(self):\n        self.cnt=0\n    def inc(self):\n        self.cnt+=1')}>Ví dụ: Class Counter</button>
            </div>
          </section>
        )}

        <section className="gpt-chat" ref={chatRef}>
          {messages.map((msg, idx) => {
            const prev = messages[idx - 1]
            const prevUserText = prev && prev.role === 'user' ? prev.text : ''
            return (
              <div key={msg.id} className={`gpt-row ${msg.role}`}>
                <div className="gpt-avatar">{msg.role === 'assistant' ? '🤖' : '🧑'}</div>
                {msg.role === 'user' ? (
                  <div className="gpt-bubble user">
                    <div className="gpt-meta"><span className="you">Bạn</span></div>
                    <div className="gpt-code">
                      <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 8, background: '#0f0f23' }} showLineNumbers wrapLines>
                        {msg.text}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ) : (
                  <div className="gpt-bubble assistant">
                    <div className="gpt-toolbar">
                      <div className="gpt-seg">
                        <button className={viewMode==='overview' ? 'active': ''} onClick={() => setViewMode('overview')}>Tổng quan</button>
                        <button className={viewMode==='details' ? 'active': ''} onClick={() => setViewMode('details')}>Chi tiết</button>
                        <button className={viewMode==='patch' ? 'active': ''} onClick={() => setViewMode('patch')}>Patch</button>
                      </div>
                    </div>
                    <div className={`gpt-split ${compareMode ? 'compare': ''}`}>
                      <div className={`gpt-card ${msg.progress.active === 'rule' ? 'active' : ''}`}>
                        <div className="gpt-card-h">
                          <span className="ico">{msg.analysis.rule.icon}</span>
                          <span>{msg.analysis.rule.title}</span>
                          {msg.progress.active === 'rule' && (
                            <span className="badge">Đang phân tích <span className="dots"><i/><i/><i/></span></span>
                          )}
                          <span className="count">{msg.progress.rule}/{msg.analysis.rule.reasoning_steps.length}</span>
                        </div>
                        <div className="gpt-progress"><div style={{width: `${(msg.progress.rule/Math.max(1,msg.analysis.rule.reasoning_steps.length))*100}%`}}/></div>
                        {viewMode !== 'patch' && (
                          <>
                            <div className="gpt-preview">
                              <SyntaxHighlighter
                                language="python"
                                style={vscDarkPlus}
                                wrapLines
                                showLineNumbers
                                customStyle={{ margin: 0, borderRadius: 8, background: '#0f0f23' }}
                                lineProps={(ln: number) => ({
                                  style: {
                                    display: 'block',
                                    background: msg.analysis.rule.highlightLines?.includes(ln)
                                      ? 'linear-gradient(90deg, rgba(255,215,0,0.12) 0%, rgba(255,215,0,0.05) 100%)'
                                      : undefined,
                                  },
                                })}
                              >
                                {prevUserText}
                              </SyntaxHighlighter>
                            </div>
                            <ul className={`gpt-steps ${viewMode==='overview' ? 'condensed':''}`}>
                              {(viewMode==='overview' ? msg.analysis.rule.reasoning_steps.slice(0, Math.min(2, msg.progress.rule)) : msg.analysis.rule.reasoning_steps.slice(0, msg.progress.rule)).map((s, i) => (
                                <li key={i} className="reveal"><span className="dot"/> {s}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {viewMode === 'patch' && (
                          <div className="gpt-patchbox">
                            <div className="gpt-patch">
                              <div className="gpt-patch-h">
                                <strong>Patch (Hệ thống)</strong>
                                {msg.analysis.rule.suggested_patch && (
                                  <button className="gpt-btn tiny" onClick={() => copyToClipboard(msg.analysis.rule.suggested_patch!)}>Copy</button>
                                )}
                              </div>
                              <pre>{msg.analysis.rule.suggested_patch || 'Không có gợi ý'}</pre>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`gpt-card ${msg.progress.active === 'llm' ? 'active' : ''}`}>
                        <div className="gpt-card-h">
                          <span className="ico">{msg.analysis.llm.icon}</span>
                          <span>{msg.analysis.llm.title}</span>
                          {msg.progress.active === 'llm' && (
                            <span className="badge">Đang phân tích <span className="dots"><i/><i/><i/></span></span>
                          )}
                          <span className="count">{msg.progress.llm}/{msg.analysis.llm.reasoning_steps.length}</span>
                        </div>
                        <div className="gpt-progress"><div style={{width: `${(msg.progress.llm/Math.max(1,msg.analysis.llm.reasoning_steps.length))*100}%`}}/></div>
                        {viewMode !== 'patch' && (
                          <ul className={`gpt-steps ${viewMode==='overview' ? 'condensed':''}`}>
                            {(viewMode==='overview' ? msg.analysis.llm.reasoning_steps.slice(0, Math.min(2, msg.progress.llm)) : msg.analysis.llm.reasoning_steps.slice(0, msg.progress.llm)).map((s, i) => (
                              <li key={i} className="reveal"><span className="dot"/> {s}</li>
                            ))}
                          </ul>
                        )}
                        {viewMode === 'patch' && (
                          <div className="gpt-patchbox">
                            <div className="gpt-patch">
                              <div className="gpt-patch-h">
                                <strong>Patch (LLM)</strong>
                                {msg.analysis.llm.suggested_patch && (
                                  <button className="gpt-btn tiny" onClick={() => copyToClipboard(msg.analysis.llm.suggested_patch!)}>Copy</button>
                                )}
                              </div>
                              <pre>{msg.analysis.llm.suggested_patch || 'Không có gợi ý'}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {sending && (
            <div className="gpt-row assistant">
              <div className="gpt-avatar">🤖</div>
              <div className="gpt-bubble assistant">
                <div className="gpt-typing">
                  <span className="ico">🤖</span>
                  <span>Đang phản hồi</span>
                  <span className="dots"><i/><i/><i/></span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="gpt-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dán code của bạn ở đây..."
            spellCheck={false}
          />
          <button className="gpt-btn" onClick={() => copyToClipboard(input)} disabled={!input.trim()}>
            Copy code
          </button>
          <button className="gpt-btn primary" onClick={onSend} disabled={sending}>
            {sending ? 'Đang phân tích…' : 'Gửi'}
          </button>
        </section>
      </main>
    </div>
  )
}
