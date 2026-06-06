import { Routes, Route } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage'
import QuizPage from './pages/QuizPage'
import MenuPage from './pages/MenuPage'
import ShoppingPage from './pages/ShoppingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/shopping" element={<ShoppingPage />} />
    </Routes>
  )
}
