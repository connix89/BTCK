import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './newchat.css'
import type { ChatMessage } from '../../types/analysis'
import { starterCode } from '../../data/newchatMock'
import { analyzeCode } from '../../lib/api'

export default function NewChatPage() {
  const [input, setInput] = useState(starterCode)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const onSend = async () => {
    if (!input.trim() || sending) return
    setError(null)
    setSending(true)
    const userId = `${Date.now()}-u`
    const asstId = `${Date.now()}-a`
    const userMsg: ChatMessage = { id: userId, role: 'user', text: input }

    // push user message
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
        if (t < maxTicks) {
          setTimeout(tick, 850)
        } else {
          setSending(false)
        }
      }
      setTimeout(tick, 500)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Lỗi gọi API')
      setSending(false)
    }
  }

  return (
    <div className="nc-page">
      <header className="nc-header">
        <h1>💬 Assistant</h1>
        {/* <nav className="nc-nav">
          <Link to="/" className="nc-link">Trang chủ</Link>
          <Link to="/chatbot" className="nc-link">Chatbot cũ</Link>
        </nav> */}
      </header>

      <div className="nc-layout">
        {error && (
          <div style={{background:'#1f2937',border:'1px solid #b91c1c',color:'#fecaca',padding:'0.75rem',borderRadius:10,marginBottom:'0.75rem'}}>
            ⛔ {error}
          </div>
        )}
        <section className="nc-chat" ref={chatRef}>
          {messages.map((msg, idx) => {
            const prevMsgText = messages[idx - 1]?.role === 'user' ? messages[idx - 1].text : ''

            return (
              <div key={msg.id} className={`nc-msg ${msg.role}`}>
                {msg.role === 'user' ? (
                  <div className="nc-bubble nc-bubble--user">
                    <div className="nc-user-title">Bạn</div>
                    <div className="nc-code-preview">
                      <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 8, background: '#0f0f23' }} showLineNumbers wrapLines>
                        {msg.text}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ) : (
                  <div className="nc-bubble nc-bubble--assistant">
                    <div className="nc-code-preview">
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
                        {prevMsgText}
                      </SyntaxHighlighter>
                    </div>
                    <div className="nc-split">
                      <div className="nc-col">
                        <div className="nc-col__header">
                          <span className="nc-ico">{msg.analysis.rule.icon}</span>
                          <span>{msg.analysis.rule.title}</span>
                          {msg.progress.active === 'rule' && (
                            <span className="nc-badge nc-badge--pulse">Đang phân tích <span className="typing"><i/><i/><i/></span></span>
                          )}
                        </div>
                        <ul className="nc-steps">
                          {msg.analysis.rule.reasoning_steps.slice(0, msg.progress.rule).map((s, i) => (
                            <li key={i} className="nc-step"><span className="nc-step__dot"/> {s}</li>
                          ))}
                        </ul>
                        {msg.progress.rule >= msg.analysis.rule.reasoning_steps.length && (
                          <div className="nc-fix">
                                      <h4>Fix</h4>
                                      <ul>                              {msg.analysis.rule.fix_steps.map((f, i) => (
                                <li key={i} className="nc-step nc-step--fix">{f}</li>
                              ))}
                            </ul>
                            {msg.analysis.rule.suggested_patch && (
                              <div className="nc-patch">
                                <strong>Patch:</strong>
                                <pre>{msg.analysis.rule.suggested_patch}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="nc-col">
                        <div className="nc-col__header">
                          <span className="nc-ico">{msg.analysis.llm.icon}</span>
                          <span>{msg.analysis.llm.title}</span>
                          {msg.progress.active === 'llm' && (
                            <span className="nc-badge nc-badge--pulse">Đang phân tích <span className="typing"><i/><i/><i/></span></span>
                          )}
                        </div>
                        <ul className="nc-steps">
                          {msg.analysis.llm.reasoning_steps.slice(0, msg.progress.llm).map((s, i) => (
                            <li key={i} className="nc-step"><span className="nc-step__dot"/> {s}</li>
                          ))}
                        </ul>
                        {msg.progress.llm >= msg.analysis.llm.reasoning_steps.length && (
                          <div className="nc-fix">
                                      <h4>Fix</h4>
                                      <ul>                              {msg.analysis.llm.fix_steps.map((f, i) => (
                                <li key={i} className="nc-step nc-step--fix">{f}</li>
                              ))}
                            </ul>
                            {msg.analysis.llm.suggested_patch && (
                              <div className="nc-patch">
                                <strong>Patch:</strong>
                                <pre>{msg.analysis.llm.suggested_patch}</pre>
                              </div>
                            )}
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
            <div className="nc-msg assistant">
              <div className="nc-bubble nc-bubble--assistant nc-right">
                <div className="nc-typing-row">
                  <span className="nc-ico">🤖</span>
                  <span>Đang phản hồi</span>
                  <span className="typing"><i/><i/><i/></span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="nc-input">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="Dán code của bạn vào đây..." />
          <button onClick={onSend} disabled={sending} className="nc-send">{sending ? 'Đang phân tích…' : 'Gửi'}</button>
        </section>
      </div>
    </div>
  )
}
