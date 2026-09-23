import { Outlet } from 'react-router-dom'
import { AdminHeader } from '../../components/AdminHeader/AdminHeader'
import { AdminSidebar } from '../../components/AdminSidebar/AdminSidebar'
import './AdminLayout.scss'

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-layout__workspace">
        <AdminHeader />
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
