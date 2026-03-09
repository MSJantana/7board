import { useState } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { Sidebar } from './Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './Dashboard';
import { SolicitacoesList } from './SolicitacoesList';
import { ArquivadosList } from './ArquivadosList';
import { UsuariosList } from './UsuariosList';

import { TopHeader } from './components/TopHeader';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="app-root">
      <TopHeader onMenuClick={() => setIsSidebarOpen(true)} />
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
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solicitacoes" element={<SolicitacoesList />} />
          <Route path="/arquivados" element={<ArquivadosList />} />
          <Route path="/usuarios" element={<UsuariosList />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
        </Route>
        
        {/* Redirecionar rotas desconhecidas para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </AuthProvider>
  );
}

export default App;
