import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import Vocabulary from './pages/Vocabulary'
import MyCards from './pages/MyCards'
import LangSetup from './pages/LangSetup'
import Hub from './pages/Hub'
import Links from './pages/Links'

function RootRedirect() {
  const { nativeLang, targetLang } = useAppStore()
  return <Navigate to={nativeLang && targetLang ? '/vocabulary' : '/setup'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/setup" element={<LangSetup />} />
        <Route path="/vocabulary" element={<Hub />} />
        <Route path="/flashcards" element={<Vocabulary />} />
        <Route path="/links" element={<Links />} />
        <Route path="/mes-fiches" element={<MyCards />} />
      </Routes>
    </BrowserRouter>
  )
}
