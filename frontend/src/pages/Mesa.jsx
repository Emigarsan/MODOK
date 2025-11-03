import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { EventView } from '../App.jsx';

export default function MesaPage() {
  const { mesaId } = useParams();

  const logMesaEvent = useCallback(async ({ contador, delta }) => {
    const payload = { delta, uuid: crypto.randomUUID(), ts: Date.now() };
    try {
      await fetch(`/api/mesas/${mesaId}/contador/${contador}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {}
  }, [mesaId]);

  return (
    <div className="page">
      <header>
        <h1>Mesa {mesaId}</h1>
      </header>
      <EventView onAction={logMesaEvent} />
    </div>
  );
}

