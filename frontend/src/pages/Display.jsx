import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import centralImage from '../assets/50103a.png';
import celda1 from '../assets/secondary/5A Entorno Celda 1.jpg';
import celda2 from '../assets/secondary/6A Entorno Celda 2.jpg';
import celda3 from '../assets/secondary/7A Entorno Celda 3.jpg';
import celda4 from '../assets/secondary/8A Entorno Celda 4.jpg';
import celda5 from '../assets/secondary/9A Entorno Celda 5.jpg';
import celda6 from '../assets/secondary/10A Entorno Celda 6.jpg';
import celda7 from '../assets/secondary/11A Entorno Celda 7.jpg';
import celda7Accesorio from '../assets/secondary/11B Accesorio Masivo.jpg';
import tertiaryCore from '../assets/43021.png';

const API_BASE = '/api/counter';

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

export default function DisplayPage() {
  const [state, setState] = useState(initialState);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stopDismissed, setStopDismissed] = useState(false);
  const resetRef = useRef(initialState.modalResetVersion);

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
      const flipIndexRaw = typeof data.flipImageIndex === 'number' ? Math.trunc(data.flipImageIndex) : -1;
      const flipIndex = Math.max(-1, Math.min(flipIndexRaw, MAX_FLIP_INDEX));

      return {
        primary: sanitizeCounter(data.primary, initialState.primary),
        secondary: sanitizeCounter(data.secondary, initialState.secondary),
        tertiary: sanitizeCounter(data.tertiary, initialState.tertiary),
        secondaryImageIndex: normalizedIndex,
        allowCloseSecondary: Boolean(data.allowCloseSecondary),
        allowCloseTertiary: Boolean(data.allowCloseTertiary),
        showFlipModal: Boolean(data.showFlipModal),
        flipImageIndex: flipIndex,
        modalResetVersion: Number.isFinite(data.modalResetVersion)
          ? Math.max(0, Math.trunc(data.modalResetVersion))
          : 0
      };
    },
    [secondaryImages]
  );

  const fetchState = useCallback(() => {
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
        setError('No se pudo cargar el estado');
      })
      .finally(() => setInitialLoading(false));
  }, [normalizeState]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 3000);
    return () => clearInterval(id);
  }, [fetchState]);

  const onLastImage = state.secondaryImageIndex === secondaryImages.length - 1;
  const secondaryLocked = onLastImage && state.secondary === 0;
  const primaryRevealed = secondaryLocked;
  const displayedSecondaryImage = secondaryLocked
    ? celda7Accesorio
    : (secondaryImages[state.secondaryImageIndex] ?? secondaryImages[initialState.secondaryImageIndex]);
  const secondaryTitle = secondaryLocked ? 'Accesorio M.Y.T.H.O.S.' : 'Celdas de Contención';
  const secondaryNumberLabel = `Celda ${state.secondaryImageIndex + 1}`;
  const showSecondaryModal = secondaryLocked && !stopDismissed;
  const showTertiaryModal = state.tertiary === 0 && !stopDismissed;
  const flipImageSrc = flipImageMap[state.flipImageIndex] ?? null;
  const showFlipModal = state.showFlipModal && !!flipImageSrc && !showSecondaryModal && !showTertiaryModal;
  const showModal = showSecondaryModal || showTertiaryModal || showFlipModal;

  useEffect(() => {
    if (state.modalResetVersion !== resetRef.current) {
      setStopDismissed(true);
      resetRef.current = state.modalResetVersion;
    }
  }, [state.modalResetVersion]);

  useEffect(() => {
    if (!secondaryLocked && state.tertiary > 0) {
      setStopDismissed(false);
    }
  }, [secondaryLocked, state.tertiary]);

  useEffect(() => {
    if (!secondaryLocked && state.tertiary > 0) {
      setStopDismissed(false);
    }
  }, [secondaryLocked, state.tertiary]);

  return (
    <div className="display-layout">
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className={`modal ${showFlipModal ? 'modal-flip' : 'modal-display'}`}>
            {showFlipModal ? (
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
                    Habéis derrotado el Plan Secundario Entrenamiento especializado. Seguid las instrucciones de los organizadores.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div className="dashboard">
        {error && <p className="error">{error}</p>}

        {primaryRevealed && (
          <section className="counter-card">
            <h2>Vida M.O.D.O.K.</h2>
            <img src={centralImage} alt="M.O.D.O.K" className="counter-art" />
            <div className="counter-value">{state.primary}</div>
          </section>
        )}

        <section className={`counter-card ${secondaryLocked ? 'counter-card--locked' : ''}`}>
          <h2>{secondaryTitle}</h2>
          {!secondaryLocked && <div className="counter-subtitle">{secondaryNumberLabel}</div>}
          <img
            src={displayedSecondaryImage}
            alt={`Celda ${state.secondaryImageIndex + 1}`}
            className="counter-art"
          />
          {!secondaryLocked && <div className="counter-value">{state.secondary}</div>}
        </section>

        {state.tertiary > 0 && (
          <section className="counter-card">
            <h2>Entrenamiento especializado</h2>
            <img src={tertiaryCore} alt="Entrenamiento Especializado" className="counter-art" />
            <div className="counter-value">{state.tertiary}</div>
          </section>
        )}

        {initialLoading && (
          <div className="modal-overlay">
            <div className="modal">
              <p>Cargando estado...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

