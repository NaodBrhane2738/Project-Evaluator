import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './hooks/useUser'
import { AppLayout } from './layouts/AppLayout'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { SubmitProject } from './pages/SubmitProject'
import { Leaderboard } from './pages/Leaderboard'
import { Comparison } from './pages/Comparison'
import { JudgePage } from './pages/JudgePage'
import { AdminPanel } from './pages/AdminPanel'
import { UIPreferencesProvider } from './context/UIPreferencesContext'

function NicknameGate({ children }: { children: React.ReactNode }) {
  const { userId } = useUser()
  if (!userId) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <UIPreferencesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<NicknameGate><AppLayout /></NicknameGate>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<SubmitProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/compare" element={<Comparison />} />
            <Route path="/judge" element={<JudgePage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UIPreferencesProvider>
  )
}
