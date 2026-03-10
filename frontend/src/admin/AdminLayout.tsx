import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { AdminTopHeader } from './components/AdminTopHeader.tsx';
import './AdminLayout.css';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="app-root">
      <AdminTopHeader onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <div className="content-wrapper">
          <Header />
          <main className="main-content">
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
