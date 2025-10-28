import { useEffect, useState } from 'react';
import centralImage from './assets/central-image.svg';

const API_BASE = '/api/counter';

const buttons = [
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
  { label: '+10', delta: 10 },
  { label: '-1', delta: -1 },
  { label: '-5', delta: -5 },
  { label: '-10', delta: -10 }
];

export default function App() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_BASE)
      .then((response) => response.json())
      .then((data) => {
        setValue(data.value);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el contador.');
        setLoading(false);
      });
  }, []);

  const handleUpdate = (amount) => {
    const endpoint = amount > 0 ? 'increment' : 'decrement';
    fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.abs(amount) })
    })
      .then((response) => response.json())
      .then((data) => {
        setValue(data.value);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo actualizar el contador.');
      });
  };

  return (
    <div className="container">
      <header>
        <h1>Contador Railway</h1>
        <p>Controla el valor central con los botones inferiores.</p>
      </header>
      <main>
        <img src={centralImage} alt="Elemento central" className="central-image" />
        <div className="counter-display">
          {loading ? 'Cargando…' : value}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="buttons-grid">
          {buttons.map(({ label, delta }) => (
            <button key={label} onClick={() => handleUpdate(delta)}>
              {label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
