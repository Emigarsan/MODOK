import { useEffect, useMemo, useState } from 'react';

const CHALLENGES = [
  {
    id: 'challenge-1',
    name: 'La Sala Roja',
    imageFile: 'la-sala-roja.jpg',
  },
  {
    id: 'challenge-2',
    name: 'Celdas Falsas',
    imageFile: 'celdas-falsas.jpg',
  },
  {
    id: 'challenge-3',
    name: 'Thunder Force',
    imageFile: 'thunder-force.jpg',
  },
  {
    id: 'challenge-4',
    name: 'Hail H.Y.D.R.A.',
    imageFile: 'hail-hydra.jpg',
  },
  {
    id: 'challenge-5',
    name: 'Ultrón Infinito',
    imageFile: 'ultron-infinito.jpg',
  },
];

const MAX_POINTS = 150;

const sanitizePoints = (value) => (Number.isFinite(value) ? value : 0);

const computeTableScore = (table) => {
  if (!table) return 0;
  const challenge = table.inevitableChallenge;
  if (!challenge || challenge === '(Ninguno)') return 0;
  const base = table.difficulty === 'Experto' ? 5 : 3;
  const legacyCount = Array.isArray(table.playersInfo)
    ? table.playersInfo.filter((p) => p && p.legacy && String(p.legacy) !== 'Ninguno').length
    : 0;
  const victoryPoints = typeof table.victoryPoints === 'number' ? table.victoryPoints : 0;
  return sanitizePoints(base + legacyCount + victoryPoints);
};

export default function ChallengesDisplay() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      fetch('/api/tables/freegame/list')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (!isMounted) return;
          setTables(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setTables([]);
          setLoading(false);
        });
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  const pointsByChallenge = useMemo(() => {
    const totals = new Map();
    CHALLENGES.forEach((c) => totals.set(c.name, 0));

    tables.forEach((table) => {
      const challengeName = table?.inevitableChallenge;
      if (!challengeName || !totals.has(challengeName)) {
        return;
      }
      const current = totals.get(challengeName) || 0;
      totals.set(challengeName, current + computeTableScore(table));
    });

    return totals;
  }, [tables]);

  return (
    <div className="display-wrapper">
      <header className="display-header">
        <h1>Retos Inevitables</h1>
      </header>

      {loading && tables.length === 0 ? (
        <div className="display-loading">Cargando datos...</div>
      ) : (
        <section className="challenge-grid">
          {CHALLENGES.map((challenge) => {
            const total = pointsByChallenge.get(challenge.name) || 0;
            const safeTotal = Math.min(total, MAX_POINTS);
            const imageSrc = `${import.meta.env.BASE_URL}challenges/${challenge.imageFile}`;

            return (
              <article key={challenge.id} className="challenge-card">
                <div className="challenge-image-wrapper">
                  <img
                    src={imageSrc}
                    alt={challenge.name}
                    className="challenge-image"
                    loading="lazy"
                  />
                </div>
                <div className="challenge-body">
                  <h2>{challenge.name}</h2>
                  <div className="challenge-progress">
                    <span className="challenge-progress-value">{safeTotal}</span>
                    <span className="challenge-progress-max">/ {MAX_POINTS}</span>
                  </div>
                  {total > MAX_POINTS && (
                    <p className="challenge-progress-overflow">
                      * Progreso supera el objetivo previsto
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
