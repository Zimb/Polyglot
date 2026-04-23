import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import Vocabulary from './pages/Vocabulary'
import MyCards from './pages/MyCards'
import LangSetup from './pages/LangSetup'
import Hub from './pages/Hub'
import Links from './pages/Links'
import AlphabetScriptHub from './pages/AlphabetScriptHub'
import AlphabetFlashcard from './pages/AlphabetFlashcard'
import FillBlank from './pages/FillBlank'
import Adventure from './pages/Adventure'
import KanjiDraw from './pages/KanjiDraw'

function RootRedirect() {
  const { nativeLang, targetLang } = useAppStore()
  return <Navigate to={nativeLang && targetLang ? '/hub' : '/setup'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/setup" element={<LangSetup />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/flashcards" element={<Vocabulary />} />
        <Route path="/links" element={<Links />} />
        <Route path="/alphabet/:scriptId" element={<AlphabetScriptHub />} />
        <Route path="/alphabet/:scriptId/flashcards" element={<AlphabetFlashcard />} />
        <Route path="/alphabet/:scriptId/draw" element={<KanjiDraw />} />
        <Route path="/mes-fiches" element={<MyCards />} />
        <Route path="/fill-blank" element={<FillBlank />} />
        <Route path="/adventure" element={<Adventure />} />
      </Routes>
    </BrowserRouter>
  )
}
