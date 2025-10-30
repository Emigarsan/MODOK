import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import RegisterPage from './pages/Register.jsx';
import FreeGamePage from './pages/FreeGame.jsx';
import EventPage from './pages/Event.jsx';
import DisplayPage from './pages/Display.jsx';
import AdminPage from './pages/Admin.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="page">
        <header>
          <h1>InevitableCON 2025 Sevilla</h1>
          <nav className="nav">
            <Link to="/register">Register</Link>
            <Link to="/freegame">Freegame</Link>
            <Link to="/event">Event</Link>
            <Link to="/display">Display</Link>
            <Link to="/admin">Admin</Link>
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
      </div>
    </BrowserRouter>
  );
}

