import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLanguage } from './i18n/useLanguage'

const DashboardLayout = lazy(() =>
  import('./layouts/DashboardLayout/DashboardLayout').then((module) => ({ default: module.DashboardLayout })),
)
const DashboardPage = lazy(() =>
  import('./pages/Dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const EmployeesPage = lazy(() =>
  import('./pages/Employees/EmployeesPage').then((module) => ({ default: module.EmployeesPage })),
)
const DepartmentsPage = lazy(() =>
  import('./pages/Departments/DepartmentsPage').then((module) => ({ default: module.DepartmentsPage })),
)
const ProjectsPage = lazy(() =>
  import('./pages/Projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const LoginPage = lazy(() =>
  import('./pages/Login/LoginPage').then((module) => ({ default: module.LoginPage })),
)

function App() {
  const { t } = useLanguage()

  return (
    <Suspense fallback={<div className="route-loading" role="status">{t.common.loading}</div>}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
