import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import RegisterPage from './pages/Register.jsx';
import FreeGamePage from './pages/FreeGame.jsx';
import EventPage from './pages/Event.jsx';
import DisplayPage from './pages/Display.jsx';
import AdminPage from './pages/Admin.jsx';

function PageWrapper({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const pageClass = isAdmin ? 'page page-wide' : 'page';
  return (
    <div className={pageClass}>
      {children}
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <PageWrapper>
        <header>
          <h1>InevitableCON 2025 Sevilla</h1>
          <nav className="nav">
            <Link to="/register"><button>Inicio</button></Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/freegame" element={<FreeGamePage />} />
          <Route path="/event" element={<EventPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </PageWrapper>
    </BrowserRouter>
  );
}
