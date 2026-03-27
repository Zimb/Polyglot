import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Vocabulary from './pages/Vocabulary'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → flashcards for now */}
        <Route path="/" element={<Navigate to="/vocabulary" replace />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
      </Routes>
    </BrowserRouter>
  )
}
