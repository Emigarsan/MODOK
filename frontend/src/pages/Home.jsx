import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const POLL_INTERVAL_MS = 5000;

const defaultFlags = {
  event: false,
  freegame: false
};

const normalizeFlags = (raw) => ({
  event: !!(raw && raw.event),
  freegame: !!(raw && raw.freegame)
});

export default function HomePage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch('/api/display/qr')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Respuesta no valida');
          }
          return response.json();
        })
        .then((data) => {
          if (cancelled) return;
          setFlags(normalizeFlags(data));
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setError('No se pudo cargar el estado de las mesas');
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const cards = [
    {
      key: 'freegame',
      title: 'Retos Inevitables (Mañana)',
      activeText: 'Disponible para registrar mesa',
      to: '/freegame'
    },
    {
      key: 'event',
      title: 'Evento (Tarde)',
      activeText: 'Disponible para registrar mesa',
      to: '/register'
    }
  ];

  return (
    <div className="home-page">
      <div className="home-grid">
        {cards.map((card) => {
          const isOpen = flags[card.key];
          return (
            <section key={card.key} className={`home-card ${isOpen ? 'active' : 'inactive'}`}>
              <h2>{card.title}</h2>
              <p className="status-text">{isOpen ? card.activeText : card.inactiveText}</p>
              <button
                type="button"
                onClick={() => handleNavigate(card.to)}
                disabled={!isOpen || loading}
              >
                Registrar Mesa
              </button>
            </section>
          );
        })}
      </div>
      {!error && (
        <p className="status-banner">
          Esta página se actualiza automáticamente cada {Math.round(POLL_INTERVAL_MS / 1000)} segundos.
        </p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
