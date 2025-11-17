import { useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './claude.css'
import type { ChatMessage } from '../../types/analysis'
import { starterCode } from '../../data/newchatMock'
import { analyzeCode } from '../../lib/api'

type ViewMode = 'overview' | 'details' | 'patch' | 'side-by-side'
type RevealSpeed = 300 | 600 | 900 | 1200

export default function ClaudeChatPage() {
  const [input, setInput] = useState(starterCode)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Enhanced controls
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')
  const [speed, setSpeed] = useState<RevealSpeed>(600)
  const [showMetrics, setShowMetrics] = useState(true)
  const [highlightDiff, setHighlightDiff] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  
  const chatRef = useRef<HTMLDivElement>(null)

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].text
    }
    return input
  }, [messages, input])

  useEffect(() => {
    if (autoScroll) {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, autoScroll])

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
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== asstId || msg.role !== 'assistant') return msg
            const nextRule = turn === 'rule' ? Math.min(msg.progress.rule + 1, totalRule) : msg.progress.rule
            const nextLlm = turn === 'llm' ? Math.min(msg.progress.llm + 1, totalLlm) : msg.progress.llm
            const done = nextRule >= totalRule && nextLlm >= totalLlm
            return {
              ...msg,
              progress: { rule: nextRule, llm: nextLlm, active: done ? null : turn },
            }
          })
        )
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
    if (sending || !lastUserText?.trim()) return
    setInput(lastUserText)
    setTimeout(onSend, 100)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch((err) => console.error('Copy failed:', err))
  }

  return (
    <div className="claude-page">
      <header className="claude-header">
        <div className="claude-header-left">
          <div className="claude-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad1)" />
              <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="url(#grad2)" opacity="0.7" />
              <defs>
                <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="12">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#00d1ff" />
                </linearGradient>
                <linearGradient id="grad2" x1="2" y1="7" x2="22" y2="22">
                  <stop offset="0%" stopColor="#00d1ff" />
                  <stop offset="100%" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="claude-title">AI Assistant</h1>
            <p className="claude-subtitle">Trợ lý học tập thông minh</p>
          </div>
        </div>
        <div className="claude-header-actions">
          <button className="claude-btn claude-btn--ghost" onClick={onRegenerate} disabled={sending || !lastUserText}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Tạo lại
          </button>
        </div>
      </header>

      <div className="claude-controls">
        <div className="claude-control-group">
          <label className="claude-label">Chế độ xem:</label>
          <div className="claude-segmented">
            <button className={viewMode === 'overview' ? 'active' : ''} onClick={() => setViewMode('overview')}>
              Tổng quan
            </button>
            <button className={viewMode === 'details' ? 'active' : ''} onClick={() => setViewMode('details')}>
              Chi tiết
            </button>
            <button className={viewMode === 'side-by-side' ? 'active' : ''} onClick={() => setViewMode('side-by-side')}>
              So sánh
            </button>
            <button className={viewMode === 'patch' ? 'active' : ''} onClick={() => setViewMode('patch')}>
              Patch
            </button>
          </div>
        </div>

        <div className="claude-control-group">
          <label className="claude-label">Tốc độ:</label>
          <select className="claude-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value) as RevealSpeed)}>
            <option value={300}>Nhanh</option>
            <option value={600}>Trung bình</option>
            <option value={900}>Chậm</option>
            <option value={1200}>Rất chậm</option>
          </select>
        </div>

        <div className="claude-control-group">
          <label className="claude-toggle">
            <input type="checkbox" checked={showMetrics} onChange={(e) => setShowMetrics(e.target.checked)} />
            <span>Hiển thị metrics</span>
          </label>
          <label className="claude-toggle">
            <input type="checkbox" checked={highlightDiff} onChange={(e) => setHighlightDiff(e.target.checked)} />
            <span>Highlight khác biệt</span>
          </label>
          <label className="claude-toggle">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
            <span>Auto scroll</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="claude-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <section className="claude-chat" ref={chatRef}>
        {messages.length === 0 && (
          <div className="claude-empty">
            <div className="claude-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01M12 10h.01M16 10h.01" />
              </svg>
            </div>
            <h3>Chào mừng đến với AI Assistant</h3>
            <p>Dán đoạn code của bạn vào để nhận phân tích chi tiết từ cả hệ thống lẫn mô hình AI</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevUserMsg = idx > 0 && messages[idx - 1].role === 'user' ? messages[idx - 1] : null
          const prevUserText = prevUserMsg?.text || ''

          return (
            <div key={msg.id} className={`claude-msg ${msg.role}`}>
              {msg.role === 'user' ? (
                <div className="claude-user-bubble">
                  <div className="claude-avatar claude-avatar--user">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </div>
                  <div className="claude-bubble-content">
                    <div className="claude-bubble-header">
                      <span className="claude-bubble-title">Bạn</span>
                      <span className="claude-bubble-time">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="claude-code-block">
                      <SyntaxHighlighter
                        language="python"
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, borderRadius: 8, background: '#0a0a0f', fontSize: '0.9rem' }}
                        showLineNumbers
                        wrapLines
                      >
                        {msg.text}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="claude-assistant-bubble">
                  <div className="claude-avatar claude-avatar--assistant">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                    </svg>
                  </div>
                  <div className="claude-bubble-content">
                    <div className="claude-bubble-header">
                      <span className="claude-bubble-title">Assistant</span>
                      <div className="claude-bubble-actions">
                        <button
                          className="claude-icon-btn"
                          onClick={() => copyToClipboard(prevUserText)}
                          title="Copy code"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {viewMode !== 'patch' && (
                      <div className="claude-code-preview">
                        <SyntaxHighlighter
                          language="python"
                          style={vscDarkPlus}
                          wrapLines
                          showLineNumbers
                          customStyle={{ margin: 0, borderRadius: 8, background: '#0a0a0f', fontSize: '0.9rem' }}
                          lineProps={(ln: number) => ({
                            style: {
                              display: 'block',
                              background:
                                highlightDiff && msg.analysis.rule.highlightLines?.includes(ln)
                                  ? 'linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)'
                                  : undefined,
                            },
                          })}
                        >
                          {prevUserText}
                        </SyntaxHighlighter>
                      </div>
                    )}

                    {viewMode === 'overview' && (
                      <div className="claude-overview">
                        <div className="claude-overview-item">
                          <span className="claude-overview-label">{msg.analysis.rule.icon} {msg.analysis.rule.title}</span>
                          <span className="claude-overview-count">{msg.progress.rule}/{msg.analysis.rule.reasoning_steps.length} bước</span>
                        </div>
                        <div className="claude-overview-item">
                          <span className="claude-overview-label">{msg.analysis.llm.icon} {msg.analysis.llm.title}</span>
                          <span className="claude-overview-count">{msg.progress.llm}/{msg.analysis.llm.reasoning_steps.length} bước</span>
                        </div>
                      </div>
                    )}

                    {(viewMode === 'details' || viewMode === 'side-by-side') && (
                      <div className={`claude-panels ${viewMode === 'side-by-side' ? 'claude-panels--split' : ''}`}>
                        <div className={`claude-panel ${msg.progress.active === 'rule' ? 'claude-panel--active' : ''}`}>
                          <div className="claude-panel-header">
                            <span className="claude-panel-icon">{msg.analysis.rule.icon}</span>
                            <span className="claude-panel-title">{msg.analysis.rule.title}</span>
                            {showMetrics && (
                              <span className="claude-panel-counter">
                                {msg.progress.rule}/{msg.analysis.rule.reasoning_steps.length}
                              </span>
                            )}
                            {msg.progress.active === 'rule' && (
                              <span className="claude-pulse-badge">
                                Đang phân tích
                                <span className="claude-typing">
                                  <i />
                                  <i />
                                  <i />
                                </span>
                              </span>
                            )}
                          </div>

                          {showMetrics && (
                            <div className="claude-progress">
                              <div style={{ width: `${(msg.progress.rule / msg.analysis.rule.reasoning_steps.length) * 100}%` }} />
                            </div>
                          )}

                          <div className="claude-steps">
                            {msg.analysis.rule.reasoning_steps.slice(0, msg.progress.rule).map((step, i) => (
                              <div key={i} className="claude-step claude-step--reveal">
                                <span className="claude-step-number">{i + 1}</span>
                                <span className="claude-step-text">{step}</span>
                              </div>
                            ))}
                          </div>

                          {msg.progress.rule >= msg.analysis.rule.reasoning_steps.length && (
                            <div className="claude-fix-section">
                              <h4 className="claude-fix-title">🔧 Cách khắc phục</h4>
                              <ul className="claude-fix-list">
                                {msg.analysis.rule.fix_steps.map((fix, i) => (
                                  <li key={i} className="claude-fix-item">{fix}</li>
                                ))}
                              </ul>
                              {msg.analysis.rule.suggested_patch && (
                                <div className="claude-patch-box">
                                  <div className="claude-patch-header">
                                    <strong>Patch đề xuất:</strong>
                                    <button
                                      className="claude-copy-btn"
                                      onClick={() => copyToClipboard(msg.analysis.rule.suggested_patch!)}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="claude-patch-code">{msg.analysis.rule.suggested_patch}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={`claude-panel ${msg.progress.active === 'llm' ? 'claude-panel--active' : ''}`}>
                          <div className="claude-panel-header">
                            <span className="claude-panel-icon">{msg.analysis.llm.icon}</span>
                            <span className="claude-panel-title">{msg.analysis.llm.title}</span>
                            {showMetrics && (
                              <span className="claude-panel-counter">
                                {msg.progress.llm}/{msg.analysis.llm.reasoning_steps.length}
                              </span>
                            )}
                            {msg.progress.active === 'llm' && (
                              <span className="claude-pulse-badge">
                                Đang phân tích
                                <span className="claude-typing">
                                  <i />
                                  <i />
                                  <i />
                                </span>
                              </span>
                            )}
                          </div>

                          {showMetrics && (
                            <div className="claude-progress">
                              <div style={{ width: `${(msg.progress.llm / msg.analysis.llm.reasoning_steps.length) * 100}%` }} />
                            </div>
                          )}

                          <div className="claude-steps">
                            {msg.analysis.llm.reasoning_steps.slice(0, msg.progress.llm).map((step, i) => (
                              <div key={i} className="claude-step claude-step--reveal">
                                <span className="claude-step-number">{i + 1}</span>
                                <span className="claude-step-text">{step}</span>
                              </div>
                            ))}
                          </div>

                          {msg.progress.llm >= msg.analysis.llm.reasoning_steps.length && (
                            <div className="claude-fix-section">
                              <h4 className="claude-fix-title">🔧 Cách khắc phục</h4>
                              <ul className="claude-fix-list">
                                {msg.analysis.llm.fix_steps.map((fix, i) => (
                                  <li key={i} className="claude-fix-item">{fix}</li>
                                ))}
                              </ul>
                              {msg.analysis.llm.suggested_patch && (
                                <div className="claude-patch-box">
                                  <div className="claude-patch-header">
                                    <strong>Patch đề xuất:</strong>
                                    <button
                                      className="claude-copy-btn"
                                      onClick={() => copyToClipboard(msg.analysis.llm.suggested_patch!)}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="claude-patch-code">{msg.analysis.llm.suggested_patch}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {viewMode === 'patch' && (
                      <div className="claude-patch-compare">
                        <div className="claude-patch-col">
                          <div className="claude-patch-col-header">
                            <span>{msg.analysis.rule.icon} {msg.analysis.rule.title}</span>
                            <button
                              className="claude-copy-btn"
                              onClick={() => copyToClipboard(msg.analysis.rule.suggested_patch || '')}
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="claude-patch-code">{msg.analysis.rule.suggested_patch || 'Không có patch'}</pre>
                        </div>
                        <div className="claude-patch-col">
                          <div className="claude-patch-col-header">
                            <span>{msg.analysis.llm.icon} {msg.analysis.llm.title}</span>
                            <button
                              className="claude-copy-btn"
                              onClick={() => copyToClipboard(msg.analysis.llm.suggested_patch || '')}
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="claude-patch-code">{msg.analysis.llm.suggested_patch || 'Không có patch'}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <div className="claude-composer">
        <textarea
          className="claude-input"
          placeholder="Dán đoạn code Python của bạn vào đây..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault()
              onSend()
            }
          }}
          disabled={sending}
          rows={6}
        />
        <div className="claude-composer-footer">
          <span className="claude-hint">
            {sending ? '⏳ Đang phân tích...' : 'Ctrl + Enter để gửi'}
          </span>
          <button className="claude-btn claude-btn--primary" onClick={onSend} disabled={sending || !input.trim()}>
            {sending ? (
              <>
                <span className="claude-spinner" />
                Đang gửi...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Gửi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
