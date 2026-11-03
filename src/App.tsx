import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { BattlePage } from './pages/BattlePage'
import { FieldPage } from './pages/FieldPage'
import { GatePage } from './pages/GatePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<GatePage />} />
      <Route path="/admin" element={<Navigate to="/admin/levels" replace />} />
      <Route path="/admin/themes/:themeId" element={<AdminPage />} />
      <Route path="/admin/levels/:levelId" element={<AdminPage />} />
      <Route path="/admin/monsters/:monsterId" element={<AdminPage />} />
      <Route path="/admin/towers/:towerId" element={<AdminPage />} />
      <Route path="/admin/heroes/:heroId" element={<AdminPage />} />
      <Route path="/admin/:section" element={<AdminPage />} />
      <Route path="/field" element={<FieldPage />} />
      <Route path="/field/:levelId" element={<BattlePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
