import { Routes, Route } from 'react-router-dom'
import ChatbotPage from './components/chatbot/ChatbotPage'
import NewChatPage from './components/newchat/NewChatPage'
import NewChatPlusPage from './components/newchatplus/NewChatPlusPage'
import GPTChatPage from './components/GPT/GPTChatPage'
import ClaudeChatPage from './components/Claude/ClaudeChatPage'

function App() {
  return (
    <Routes>
      <Route path="/chatplus" element={<NewChatPlusPage />} />
      <Route path="/chatbot" element={<ChatbotPage />} />
      {/* Backward compatibility: /newchat also points to the same page */}
      <Route path="/newchat" element={<NewChatPage />} />
      {/* New enhanced page route */}
      <Route path="/newchatplus" element={<NewChatPlusPage />} />
      <Route path="/gpt" element={<GPTChatPage />} />
      <Route path="/" element={<ClaudeChatPage />} />
    </Routes>
  )
}

export default App
