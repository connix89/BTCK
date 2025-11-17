import React, { useEffect, useRef, useState } from "react";
import "./newchatplus.css";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; time: string };

function timeNow() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  const parts = text.split("```");
  return (
    <>
      {parts.map((p, idx) =>
        idx % 2 === 1 ? (
          <pre key={idx} className="ncp-code">
            <code>{p.trim()}</code>
          </pre>
        ) : (
          <p key={idx}>
            {p.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        )
      )}
    </>
  );
}

export default function NewChatPlusPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Xin chào! Mình có thể giúp gì cho bạn hôm nay?",
      time: timeNow(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: value,
      time: timeNow(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Cảm ơn bạn! Đây là gợi ý ban đầu.\n\n- Điểm nổi bật 1\n- Điểm nổi bật 2\n\nBạn muốn mình chi tiết phần nào?",
        time: timeNow(),
      };
      setMessages((m) => [...m, assistantMsg]);
      setIsTyping(false);
    }, 900);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="ncp-root">
      <div className="ncp-shell">
        <aside className="ncp-sidebar">
          <div className="ncp-logo">BTCK</div>

          <div className="ncp-search">
            <svg viewBox="0 0 24 24" className="ncp-ic">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21l1-1-5.5-5.5zM4 9.5C4 6.46 6.46 4 9.5 4S15 6.46 15 9.5 12.54 15 9.5 15 4 12.54 4 9.5z" />
            </svg>
            <input placeholder="Tìm hội thoại..." />
          </div>

          <button className="ncp-newchat" onClick={() => setMessages([])}>
            <svg viewBox="0 0 24 24" className="ncp-ic">
              <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z" />
            </svg>
            Tạo hội thoại mới
          </button>

          <div className="ncp-recent">
            <div className="ncp-recent-title">Gần đây</div>
            <button className="ncp-recent-item">Sửa giao diện trang chat</button>
            <button className="ncp-recent-item">Ý tưởng landing page</button>
            <button className="ncp-recent-item">Tối ưu API FastAPI</button>
          </div>
        </aside>

        <main className="ncp-main">
          <header className="ncp-header">
            <div className="ncp-h-left">
              <div className="ncp-title">New Chat+</div>
              <div className="ncp-subtle">{messages.length} tin nhắn</div>
            </div>
            <div className="ncp-h-right">
              <select className="ncp-select" defaultValue="gpt-4o-mini">
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="custom">Custom</option>
              </select>
              <button className="ncp-iconbtn" title="Cài đặt">
                <svg viewBox="0 0 24 24" className="ncp-ic">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.007 7.007 0 0 0-1.63-.94L14.5 2h-5l-.35 2.32c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.61 7.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.73 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.4 1.05.71 1.63.94L9.5 22h5l.35-2.32c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0  0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
                </svg>
              </button>
            </div>
          </header>

          <div className="ncp-chatwrap">
            {messages.length === 0 && !isTyping && (
              <div className="ncp-emptystate">
                <div className="ncp-hero">💬</div>
                <div className="ncp-emptitle">Bắt đầu cuộc trò chuyện</div>
                <div className="ncp-empsub">Hỏi bất kỳ điều gì. Nhấn Enter để gửi, Shift+Enter để xuống dòng.</div>
                <div className="ncp-suggestions">
                  <button onClick={() => send("Gợi ý cấu trúc UI đẹp cho trang chat?")}>Gợi ý UI chat đẹp?</button>
                  <button onClick={() => send("Viết hàm gọi API FastAPI với fetch/axios")}>Gọi API FastAPI</button>
                  <button onClick={() => send("Tạo bộ màu chủ đạo cho website giáo dục")}>Bộ màu chủ đạo</button>
                </div>
              </div>
            )}

            <div className="ncp-chatlist" ref={listRef}>
              {messages.map((m) => (
                <div key={m.id} className={`ncp-msg ${m.role}`}>
                  <div className="ncp-avatar">{m.role === "assistant" ? "🤖" : "🧑"}</div>
                  <div className="ncp-bubble">
                    <div className="ncp-meta">
                      <span className="ncp-author">{m.role === "assistant" ? "Assistant" : "Bạn"}</span>
                      <span className="ncp-dot">•</span>
                      <span className="ncp-time">{m.time}</span>
                    </div>
                    <div className="ncp-content">{renderMarkdown(m.content)}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="ncp-msg assistant">
                  <div className="ncp-avatar">🤖</div>
                  <div className="ncp-bubble">
                    <div className="ncp-meta">
                      <span className="ncp-author">Assistant</span>
                      <span className="ncp-dot">•</span>
                      <span className="ncp-time">đang soạn…</span>
                    </div>
                    <div className="ncp-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ncp-composer">
            <button className="ncp-iconbtn" title="Đính kèm">
              <svg viewBox="0 0 24 24" className="ncp-ic">
                <path d="M16.5 6v9a4.5 4.5 0 1 1-9 0V5a3 3 0 0 1 6 0v9a1.5 1.5 0 1 1-3 0V6h-2v8a3.5 3.5 0 1 0 7 0V5a5 5 0 0 0-10 0v10a6 6 0 1 0 12 0V6h-2z" />
              </svg>
            </button>

            <textarea
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />

            <div className="ncp-actions">
              <button className="ncp-iconbtn" title="Thu âm">
                <svg viewBox="0 0 24 24" className="ncp-ic">
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0  0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19h2v3h-2z" />
                </svg>
              </button>
              <button className="ncp-send" onClick={() => send()} disabled={!input.trim()}>
                Gửi
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
