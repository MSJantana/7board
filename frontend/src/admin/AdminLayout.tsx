import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { AdminTopHeader } from './components/AdminTopHeader.tsx';
import './AdminLayout.css';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
