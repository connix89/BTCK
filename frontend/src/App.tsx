import { Routes, Route } from 'react-router-dom'
import ChatbotPage from './components/chatbot/ChatbotPage'
import NewChatPage from './components/newchat/NewChatPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<NewChatPage />} />
      <Route path="/chatbot" element={<ChatbotPage />} />
      {/* Backward compatibility: /newchat also points to the same page */}
      <Route path="/newchat" element={<NewChatPage />} />
    </Routes>
  )
}

export default App
