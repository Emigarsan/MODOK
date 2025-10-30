import { useCallback, useEffect, useMemo, useState } from 'react';
import centralImage from './assets/central-image.svg';
import frame1 from './assets/secondary/frame-1.svg';
import frame2 from './assets/secondary/frame-2.svg';
import frame3 from './assets/secondary/frame-3.svg';
import frame4 from './assets/secondary/frame-4.svg';
import frame5 from './assets/secondary/frame-5.svg';
import frame6 from './assets/secondary/frame-6.svg';
import frame7 from './assets/secondary/frame-7.svg';
import tertiaryCore from './assets/tertiary-core.svg';

const API_BASE = '/api/counter';

const primaryButtons = [
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
  { label: '+10', delta: 10 },
  { label: '-1', delta: -1 },
  { label: '-5', delta: -5 },
  { label: '-10', delta: -10 }
];

const secondaryButtons = [
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
  { label: '-1', delta: -1 },
  { label: '-5', delta: -5 }
];

const tertiaryButtons = [
  { label: '+1', delta: 1 },
  { label: '+3', delta: 3 },
  { label: '-1', delta: -1 },
  { label: '-3', delta: -3 }
];

const initialState = {
  primary: 100,
  secondary: 28,
  tertiary: 120,
  secondaryImageIndex: 0
};

export default function App() {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const secondaryImages = useMemo(
    () => [frame1, frame2, frame3, frame4, frame5, frame6, frame7],
    []
  );

  const fetchState = useCallback(() => {
    setLoading(true);
    fetch(API_BASE)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Respuesta inválida del servidor');
        }
        return response.json();
      })
      .then((data) => {
        setState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el estado de los contadores.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const updateCounter = useCallback((segment, delta) => {
    if (delta === 0) {
      return;
    }
    const endpoint = delta > 0 ? 'increment' : 'decrement';
    setLoading(true);
    fetch(`${API_BASE}/${segment}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.abs(delta) })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo actualizar el contador.');
        }
        return response.json();
      })
      .then((data) => {
        setState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo actualizar el contador.');
      })
      .finally(() => setLoading(false));
  }, []);

  const currentSecondaryImage = secondaryImages[
    ((state.secondaryImageIndex % secondaryImages.length) + secondaryImages.length) % secondaryImages.length
  ];

  return (
    <div className="page">
      <header>
        <h1>M.O.D.O.K</h1>
        <p>
          Control central de contadores con apoyo visual. El segundo contador cambia de fase al llegar a
          cero y cada decremento reduce también el tercer contador.
        </p>
        {loading && <span className="status-text">Sincronizando…</span>}
      </header>

      {error && <p className="error">{error}</p>}

      <div className="dashboard">
        <section className="counter-card">
          <img src={centralImage} alt="M.O.D.O.K" className="counter-art" />
          <h2>Control Principal</h2>
          <div className="counter-value">{loading ? '…' : state.primary}</div>
          <div className="button-grid primary-controls">
            {primaryButtons.map(({ label, delta }) => (
              <button key={`primary-${label}`} onClick={() => updateCounter('primary', delta)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="counter-card">
          <img
            src={currentSecondaryImage}
            alt={`Fase secundaria ${state.secondaryImageIndex + 1}`}
            className="counter-art"
          />
          <h2>Fases Dinámicas</h2>
          <div className="counter-value">{loading ? '…' : state.secondary}</div>
          <p className="counter-meta">7 imágenes secuenciadas para cada llegada a cero.</p>
          <div className="button-grid">
            {secondaryButtons.map(({ label, delta }) => (
              <button key={`secondary-${label}`} onClick={() => updateCounter('secondary', delta)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="counter-card">
          <img src={tertiaryCore} alt="Reserva auxiliar" className="counter-art" />
          <h2>Reserva Vinculada</h2>
          <div className="counter-value">{loading ? '…' : state.tertiary}</div>
          <p className="counter-meta">Se reduce automáticamente con cada decremento secundario.</p>
          <div className="button-grid">
            {tertiaryButtons.map(({ label, delta }) => (
              <button key={`tertiary-${label}`} onClick={() => updateCounter('tertiary', delta)}>
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
