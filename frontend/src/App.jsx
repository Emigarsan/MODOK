import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation } from 'react-router-dom';
import centralImage from './assets/50103a.png';
import celda1 from './assets/secondary/5A Entorno Celda 1.jpg';
import celda2 from './assets/secondary/6A Entorno Celda 2.jpg';
import celda3 from './assets/secondary/7A Entorno Celda 3.jpg';
import celda4 from './assets/secondary/8A Entorno Celda 4.jpg';
import celda5 from './assets/secondary/9A Entorno Celda 5.jpg';
import celda6 from './assets/secondary/10A Entorno Celda 6.jpg';
import celda7 from './assets/secondary/11A Entorno Celda 7.jpg';
import celda7Accesorio from './assets/secondary/11B Accesorio Masivo.jpg';
import tertiaryCore from './assets/43021.png';

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
  { label: '+5', delta: 5 },
  { label: '-1', delta: -1 },
  { label: '-5', delta: -5 }
];

const initialState = {
  primary: 1792,
  secondary: 128,
  tertiary: 640,
  secondaryImageIndex: 0,
  allowCloseSecondary: false,
  allowCloseTertiary: false
};

export function EventView({ onAction, mesaId } = {}) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalSource, setModalSource] = useState(null); // 'secondaryFinal' | 'tertiaryZero' | null
  const [secondaryLocked, setSecondaryLocked] = useState(false);
  const [tertiaryLocked, setTertiaryLocked] = useState(false);
  const [primaryRevealed, setPrimaryRevealed] = useState(false);
  const scrollPosRef = useRef(0);

  const secondaryImages = useMemo(
    () => [celda1, celda2, celda3, celda4, celda5, celda6, celda7],
    []
  );

  const normalizeState = useCallback(
    (data) => {
      if (!data || typeof data !== 'object') {
        return { ...initialState };
      }

      const withFallback = (value, fallback) =>
        typeof value === 'number' && Number.isFinite(value) ? value : fallback;

      const sanitizeCounter = (value, fallback) => {
        const normalized = withFallback(value, fallback);
        return Math.max(0, Math.trunc(normalized));
      };

      const rawIndex = withFallback(data.secondaryImageIndex, initialState.secondaryImageIndex);
      const normalizedIndex =
        ((Math.trunc(rawIndex) % secondaryImages.length) + secondaryImages.length) % secondaryImages.length;

      return {
        primary: sanitizeCounter(data.primary, initialState.primary),
        secondary: sanitizeCounter(data.secondary, initialState.secondary),
        tertiary: sanitizeCounter(data.tertiary, initialState.tertiary),
        secondaryImageIndex: normalizedIndex,
        allowCloseSecondary: Boolean(data.allowCloseSecondary),
        allowCloseTertiary: Boolean(data.allowCloseTertiary)
      };
    },
    [secondaryImages]
  );

  const fetchState = useCallback((isInitial = false) => {
    fetch(API_BASE)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Respuesta inv?lida del servidor');
        }
        return response.json();
      })
      .then((data) => {
        setState(normalizeState(data));
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el estado de los contadores.');
      })
      .finally(() => {
        if (isInitial) {
          setInitialLoading(false);
        }
      });
  }, [normalizeState]);

  // Initial load only once
  useEffect(() => {
    fetchState(true);
  }, [fetchState]);

  // When a modal is shown, scroll to top and lock body; restore on close
  useEffect(() => {
      if (modalMessage) {
    const isBlocked =
      (modalSource === "secondaryFinal" && !state.allowCloseSecondary) ||
      (modalSource === "tertiaryZero" && !state.allowCloseTertiary);
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal modal-stop">
          <div className="modal-stop-sign">🛑 STOP</div>
          <p className="modal-stop-text">{modalMessage}</p>
          <button type="button" onClick={closeModal} disabled={isBlocked}>
            Cerrar
          </button>
          {isBlocked && <p className="counter-meta">Esperando autorizaci&oacute;n desde Admin.</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="dashboard">
        {primaryRevealed && (
          <section className="counter-card">
            <h2>Vida M.O.D.O.K.</h2>
            <img src={centralImage} alt="M.O.D.O.K" className="counter-art" />
            <div className="counter-value">{state.primary}</div>
            <div className="button-grid primary-controls">
              {primaryButtons.map(({ label, delta }) => (
                <button key={`primary-${label}`} onClick={() => updateCounter('primary', delta)}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="counter-card">
          <h2>{secondaryTitle}</h2>
          {!secondaryLocked && (
            <p className="cell-tracker">Celda {state.secondaryImageIndex + 1}</p>
          )}
          <img
            src={displayedSecondaryImage}
            alt={`Celda ${state.secondaryImageIndex + 1}`}
            className="counter-art"
          />
          {!secondaryLocked && <div className="counter-value">{state.secondary}</div>}
          {!secondaryLocked && (
            <div className="button-grid">
              {secondaryButtons.map(({ label, delta }) => (
                <button
                  key={`secondary-${label}`}
                  onClick={() => updateCounter('secondary', delta)}
                  disabled={secondaryLocked}
                  aria-disabled={secondaryLocked}
                  title={secondaryLocked ? 'Bloqueado tras la sÃ©ptima imagen' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>

        {!tertiaryLocked && (
          <section className="counter-card">
            <h2>Entrenamiento especializado</h2>
            <img src={tertiaryCore} alt="Entrenamiento Especializado" className="counter-art" />
            <div className="counter-value">{state.tertiary}</div>
            <div className="button-grid">
              {tertiaryButtons.map(({ label, delta }) => (
                <button
                  key={`tertiary-${label}`}
                  onClick={() => updateCounter('tertiary', delta)}
                  disabled={tertiaryLocked}
                  aria-disabled={tertiaryLocked}
                  title={tertiaryLocked ? 'Bloqueado al alcanzar 0' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}


export default function App() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const mesaParam = search.get('mesa');
  const mesaId = mesaParam && /^\d+$/.test(mesaParam) ? parseInt(mesaParam, 10) : null;

  const onAction = async ({ contador, delta }) => {
    if (!mesaId) return;
    const payload = { delta, uuid: crypto.randomUUID(), ts: Date.now() };
    try {
      await fetch(`/api/mesas/${mesaId}/contador/${contador}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) { }
  };

  return <EventView mesaId={mesaId} onAction={mesaId ? onAction : undefined} />;
}






