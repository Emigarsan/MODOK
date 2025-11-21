import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  allowCloseTertiary: false,
  showFlipModal: false,
  flipImageIndex: -1,
  modalResetVersion: 0
};

const flipImageMap = {
  0: '/flip/5B.jpg',
  1: '/flip/6B.jpg',
  2: '/flip/7B.jpg',
  3: '/flip/8B.jpg',
  4: '/flip/9B.jpg',
  5: '/flip/10B.jpg'
};

const MAX_FLIP_INDEX = Math.max(...Object.keys(flipImageMap).map((key) => Number(key)));

export function EventView({ onAction, mesaId } = {}) {
  const [state, setState] = useState(initialState);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondaryDismissed, setSecondaryDismissed] = useState(false);
  const [tertiaryDismissed, setTertiaryDismissed] = useState(false);
  const scrollPosRef = useRef(0);

  const secondaryImages = useMemo(
    () => [celda1, celda2, celda3, celda4, celda5, celda6, celda7],
    []
  );

  const normalizeState = useCallback(
    (data) => {
      if (!data || typeof data !== 'object') return { ...initialState };
      const withFallback = (value, fallback) =>
        typeof value === 'number' && Number.isFinite(value) ? value : fallback;
      const sanitizeCounter = (value, fallback) => Math.max(0, Math.trunc(withFallback(value, fallback)));

      const rawIndex = withFallback(data.secondaryImageIndex, initialState.secondaryImageIndex);
      const normalizedIndex =
        ((Math.trunc(rawIndex) % secondaryImages.length) + secondaryImages.length) % secondaryImages.length;

      const rawFlipIndex = withFallback(data.flipImageIndex, -1);
      const clampedFlipIndex = Math.max(-1, Math.min(Math.trunc(rawFlipIndex), MAX_FLIP_INDEX));

      return {
        primary: sanitizeCounter(data.primary, initialState.primary),
        secondary: sanitizeCounter(data.secondary, initialState.secondary),
        tertiary: sanitizeCounter(data.tertiary, initialState.tertiary),
        secondaryImageIndex: normalizedIndex,
        allowCloseSecondary: Boolean(data.allowCloseSecondary),
        allowCloseTertiary: Boolean(data.allowCloseTertiary),
        showFlipModal: Boolean(data.showFlipModal),
        flipImageIndex: clampedFlipIndex,
        modalResetVersion: Number.isFinite(data.modalResetVersion)
          ? Math.max(0, Math.trunc(data.modalResetVersion))
          : 0
      };
    },
    [secondaryImages]
  );

  const fetchState = useCallback(
    (isInitial = false) => {
      fetch(API_BASE)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Estado inválido'))))
        .then((data) => {
          setState(normalizeState(data));
          setError(null);
        })
        .catch(() => setError('No se pudo cargar el estado de los contadores.'))
        .finally(() => {
          if (isInitial) setInitialLoading(false);
        });
    },
    [normalizeState]
  );

  useEffect(() => {
    fetchState(true);
    const id = setInterval(() => fetchState(), 3000);
    return () => clearInterval(id);
  }, [fetchState]);

  const onLastImage = state.secondaryImageIndex === secondaryImages.length - 1;
  const secondaryLocked = onLastImage && state.secondary === 0;
  const tertiaryLocked = state.tertiary === 0;
  const primaryRevealed = secondaryLocked;

  const currentSecondaryImage =
    secondaryImages[state.secondaryImageIndex] ?? secondaryImages[initialState.secondaryImageIndex];
  const displayedSecondaryImage = secondaryLocked ? celda7Accesorio : currentSecondaryImage;
  const secondaryTitle = secondaryLocked ? 'Accesorio M.Y.T.H.O.S.' : 'Celdas de Contención';

  const showSecondaryModal = secondaryLocked && !secondaryDismissed;
  const showTertiaryModal = tertiaryLocked && !tertiaryDismissed;
  const flipImageSrc = flipImageMap[state.flipImageIndex] ?? null;
  const showFlipModal = state.showFlipModal && !!flipImageSrc && !showSecondaryModal && !showTertiaryModal;
  const showModal = showSecondaryModal || showTertiaryModal || showFlipModal;

  useEffect(() => {
    if (secondaryLocked) setSecondaryDismissed(false);
  }, [secondaryLocked]);

  useEffect(() => {
    if (tertiaryLocked) setTertiaryDismissed(false);
  }, [tertiaryLocked]);

  const lastResetRef = useRef(state.modalResetVersion);
  useEffect(() => {
    if (state.modalResetVersion !== lastResetRef.current) {
      setSecondaryDismissed(true);
      setTertiaryDismissed(true);
      lastResetRef.current = state.modalResetVersion;
    }
  }, [state.modalResetVersion]);

  // Scroll lock for modal
  useEffect(() => {
    if (showModal) {
      scrollPosRef.current = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined') window.scrollTo({ top: scrollPosRef.current, behavior: 'auto' });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const closeModal = useCallback(() => {
    if (showSecondaryModal) setSecondaryDismissed(true);
    if (showTertiaryModal) setTertiaryDismissed(true);
  }, [showSecondaryModal, showTertiaryModal]);

  const updateCounter = useCallback(
    (segment, delta) => {
      if (!delta) return;
      if ((segment === 'secondary' && secondaryLocked) || (segment === 'tertiary' && tertiaryLocked)) return;
      const endpoint = delta > 0 ? 'increment' : 'decrement';
      const amount = Math.abs(delta);
      fetch(`${API_BASE}/${segment}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudo actualizar'))))
        .then((data) => {
          setState(normalizeState(data));
          setError(null);
          if (onAction) {
            const idx = segment === 'primary' ? 1 : segment === 'secondary' ? 2 : 3;
            onAction({ segment, contador: idx, delta });
          }
        })
        .catch(() => setError('No se pudo actualizar el contador.'));
    },
    [normalizeState, onAction, secondaryLocked, tertiaryLocked]
  );

  const renderModalContent = () => {
    const isFlip = showFlipModal;
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className={`modal ${isFlip ? 'modal-flip' : 'modal-display'}`}>
          {isFlip ? (
            <>
              {flipImageSrc && <img src={flipImageSrc} alt="Siguiente celda" className="modal-flip-image" />}
              <p className="modal-stop-text">Dale la vuelta a la celda y muestra la siguiente carta</p>
            </>
          ) : (
            <>
              <div className="modal-stop-sign">🛑 STOP</div>
              {showSecondaryModal && (
                <p className="modal-stop-text">
                  Habéis liberado a todos los reclusos de sus celdas. Seguid las instrucciones de los organizadores.
                </p>
              )}
              {showTertiaryModal && (
                <p className="modal-stop-text">
                  Habéis derrotado el Plan Secundario. Seguid las instrucciones de los organizadores.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (showModal && typeof document !== 'undefined') {
    return createPortal(renderModalContent(), document.body);
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
          {!secondaryLocked && <p className="cell-tracker">Celda {state.secondaryImageIndex + 1}</p>}
          <img src={displayedSecondaryImage} alt={`Celda ${state.secondaryImageIndex + 1}`} className="counter-art" />
          {!secondaryLocked && <div className="counter-value">{state.secondary}</div>}
          {!secondaryLocked && (
            <div className="button-grid">
              {secondaryButtons.map(({ label, delta }) => (
                <button key={`secondary-${label}`} onClick={() => updateCounter('secondary', delta)}>
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
                <button key={`tertiary-${label}`} onClick={() => updateCounter('tertiary', delta)}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {initialLoading && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Cargando estado...</p>
          </div>
        </div>
      )}
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
    } catch (_) {
      // ignore
    }
  };

  return <EventView mesaId={mesaId} onAction={mesaId ? onAction : undefined} />;
}

