import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SolicitacaoForm } from './SolicitacaoForm';
import { TopHeader } from './components/TopHeader';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Approval } from './pages/Approval';
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { SolicitacoesList } from './admin/SolicitacoesList';
import { ArquivadosList } from './admin/ArquivadosList';
import { UsuariosList } from './admin/UsuariosList';

function RequireAuth({ children }: Readonly<{ children: React.ReactNode }>) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const PublicFormLayout = () => (
  <div className="public-form-layout" style={{ 
    minHeight: '100vh', 
    backgroundColor: '#f0f2f5', 
    display: 'flex', 
    flexDirection: 'column',
    padding: '0' 
  }}>
    <TopHeader />
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '40px 20px'
    }}>
      <Outlet />
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Redirecionamento da raiz e rotas desconhecidas para /solicitacoes */}
        <Route path="/" element={<Navigate to="/solicitacoes" replace />} />
        <Route path="*" element={<Navigate to="/solicitacoes" replace />} />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="solicitacoes" element={<SolicitacoesList />} />
          <Route path="arquivados" element={<ArquivadosList />} />
          <Route path="usuarios" element={<UsuariosList />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Layout do Formulário Público (Externo/Pipefy style) */}
        <Route element={<PublicFormLayout />}>
          <Route path="/solicitacoes" element={<SolicitacaoForm />} />
          <Route path="/approval/:id" element={<Approval />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </AuthProvider>
  );
}

export default App;
