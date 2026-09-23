import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
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
const AssignmentsPage = lazy(() =>
  import('./pages/Assignments/AssignmentsPage').then((module) => ({ default: module.AssignmentsPage })),
)
const LoginPage = lazy(() =>
  import('./pages/Login/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const AdminRoute = lazy(() =>
  import('./routes/AdminRoute').then((module) => ({ default: module.AdminRoute })),
)
const AdminLayout = lazy(() =>
  import('./layouts/AdminLayout/AdminLayout').then((module) => ({ default: module.AdminLayout })),
)
const AdminOverviewPage = lazy(() =>
  import('./pages/AdminOverview/AdminOverviewPage').then((module) => ({ default: module.AdminOverviewPage })),
)
const AdminUsersPage = lazy(() =>
  import('./pages/AdminUsers/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })),
)

function App() {
  const { t } = useLanguage()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="route-loading" role="status">{t.common.restoringSession}</div>
  }

  return (
    <Suspense fallback={<div className="route-loading" role="status">{t.common.loading}</div>}>
      <Routes>
        <Route path="login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
