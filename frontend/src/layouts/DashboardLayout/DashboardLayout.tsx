import { Outlet } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import './DashboardLayout.scss'

export function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout__workspace">
        <Header />
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
