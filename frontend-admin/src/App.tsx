import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { Sidebar } from './Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './Dashboard';
import { SolicitacoesList } from './SolicitacoesList';
import { ArquivadosList } from './ArquivadosList';

import { TopHeader } from './components/TopHeader';

const DashboardLayout = () => (
  <div className="app-root">
    <TopHeader />
    <div className="app-body">
      <Sidebar />
      <div className="content-wrapper">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solicitacoes" element={<SolicitacoesList />} />
          <Route path="/arquivados" element={<ArquivadosList />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
        </Route>
        
        {/* Redirecionar rotas desconhecidas para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </>
  );
}

export default App;
