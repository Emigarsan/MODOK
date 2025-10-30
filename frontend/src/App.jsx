import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [modalMessage, setModalMessage] = useState(null);
  const [modalSource, setModalSource] = useState(null); // 'secondaryFinal' | 'tertiaryZero' | null
  const [secondaryLocked, setSecondaryLocked] = useState(false);

  const secondaryImages = useMemo(
    () => [frame1, frame2, frame3, frame4, frame5, frame6, frame7],
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
        secondaryImageIndex: normalizedIndex
      };
    },
    [secondaryImages]
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
        setState(normalizeState(data));
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el estado de los contadores.');
      })
      .finally(() => setLoading(false));
  }, [normalizeState]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const previousSecondaryIndex = useRef(initialState.secondaryImageIndex);
  const previousSecondaryValue = useRef(initialState.secondary);
  const previousTertiary = useRef(initialState.tertiary);

  // Track image index changes without triggering modal here; modal will trigger
  // when on last image AND the secondary value reaches 0 (next effect).
  useEffect(() => {
    if (previousSecondaryIndex.current !== state.secondaryImageIndex) {
      previousSecondaryIndex.current = state.secondaryImageIndex;
    }
  }, [state.secondaryImageIndex]);

  // When already on the last image (7ª) and secondary transitions to 0, show modal
  useEffect(() => {
    if (previousSecondaryValue.current !== state.secondary) {
      const reachedZeroNow = state.secondary === 0 && previousSecondaryValue.current > 0;
      if (
        reachedZeroNow &&
        state.secondaryImageIndex === secondaryImages.length - 1 &&
        !secondaryLocked
      ) {
        setModalMessage('Alto, escucha las instrucciones de los coordinadores');
        setModalSource('secondaryFinal');
      }
      previousSecondaryValue.current = state.secondary;
    }
  }, [state.secondary, state.secondaryImageIndex, secondaryImages.length, secondaryLocked]);

  useEffect(() => {
    if (previousTertiary.current !== state.tertiary) {
      if (state.tertiary === 0) {
        setModalMessage('Alto, escucha las instrucciones de los coordinadores');
        setModalSource('tertiaryZero');
      }
      previousTertiary.current = state.tertiary;
    }
  }, [state.tertiary]);

  const closeModal = useCallback(() => {
    // Lock secondary counter only if the modal was triggered by the 7th image event
    if (modalSource === 'secondaryFinal') {
      setSecondaryLocked(true);
    }
    setModalMessage(null);
    setModalSource(null);
  }, [modalSource]);

  const updateCounter = useCallback((segment, delta) => {
    if (delta === 0) {
      return;
    }
    // Prevent modifications to secondary when locked
    if (segment === 'secondary' && secondaryLocked) {
      return;
    }
    const endpoint = delta > 0 ? 'increment' : 'decrement';
    // Ensure secondary never overshoots below 0: cap decrement to current value
    let effectiveAmount = Math.abs(delta);
    if (segment === 'secondary' && delta < 0) {
      const available = state.secondary;
      effectiveAmount = Math.min(effectiveAmount, available);
      if (effectiveAmount === 0) {
        // Already at 0 → no-op; modal will already have been handled previously
        return;
      }
    }
    setLoading(true);
    fetch(`${API_BASE}/${segment}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: effectiveAmount })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo actualizar el contador.');
        }
        return response.json();
      })
      .then((data) => {
        setState(normalizeState(data));
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo actualizar el contador.');
      })
      .finally(() => setLoading(false));
  }, [normalizeState, secondaryLocked, state.secondary]);

  const currentSecondaryImage =
    secondaryImages[state.secondaryImageIndex] ?? secondaryImages[initialState.secondaryImageIndex];

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
          <div className="counter-value">{state.primary}</div>
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
          <div className="counter-value">{state.secondary}</div>
          <p className="counter-meta">7 imágenes secuenciadas para cada llegada a cero.</p>
          <div className="button-grid">
            {secondaryButtons.map(({ label, delta }) => (
              <button
                key={`secondary-${label}`}
                onClick={() => updateCounter('secondary', delta)}
                disabled={secondaryLocked}
                aria-disabled={secondaryLocked}
                title={secondaryLocked ? 'Bloqueado tras la séptima imagen' : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="counter-card">
          <img src={tertiaryCore} alt="Reserva auxiliar" className="counter-art" />
          <h2>Reserva Vinculada</h2>
          <div className="counter-value">{state.tertiary}</div>
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

      {modalMessage && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <p>{modalMessage}</p>
            <button type="button" onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
