import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CharacterSelector from '../components/CharacterSelector.jsx';

const LEGACY_OPTIONS = [
    'Ninguno',
    'Vástago de M',
    'Mutante híbrido',
    'Equipo de dos',
    'Los más buscados',
    'Equipado para lo peor',
    'Guerreros araña',
    'Instruidas por Thanos',
    'Rabia irradiada',
    'Ronin',
    'Dama de la muerte',
    'Solo ante el peligro'
];

export default function AdminEditPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [aspects, setAspects] = useState([]);
    const [swAspects, setSwAspects] = useState([]);
    const adminKey = localStorage.getItem('adminKey') || '';

    useEffect(() => {
        if (!adminKey) {
            alert('No autenticado como admin');
            navigate('/admin');
            return;
        }
        setLoading(true);
        fetch('/api/admin/tables', { headers: { 'X-Admin-Secret': adminKey } })
            .then((r) => r.ok ? r.json() : Promise.reject(new Error('No autorizado')))
            .then((data) => {
                const list = (type === 'register') ? (Array.isArray(data.register) ? data.register : []) : (Array.isArray(data.freegame) ? data.freegame : []);
                const found = (list || []).find((t) => String(t.id) === String(id));
                if (!found) throw new Error('Mesa no encontrada');
                // build editable form state
                if (type === 'register') {
                    setForm({
                        id: found.id,
                        tableNumber: found.tableNumber,
                        code: found.code,
                        tableName: found.tableName || '',
                        difficulty: found.difficulty || '',
                        players: found.players || 0,
                        playersInfo: Array.isArray(found.playersInfo) ? found.playersInfo.map(p => ({ character: p.character || '', aspect: p.aspect || '' })) : []
                    });
                } else {
                    setForm({
                        id: found.id,
                        tableNumber: found.tableNumber,
                        code: found.code,
                        name: found.name || '',
                        difficulty: found.difficulty || 'Normal',
                        inevitableChallenge: found.inevitableChallenge || '(Ninguno)',
                        players: found.players || 0,
                        playersInfo: Array.isArray(found.playersInfo) ? found.playersInfo.map(p => ({ character: p.character || '', aspect: p.aspect || '', legacy: p.legacy || 'Ninguno' })) : [],
                        victoryPoints: found.victoryPoints || 0,
                        scenarioCleared: !!found.scenarioCleared
                    });
                }
            })
            .catch((e) => setError(e.message || 'Error'))
            .finally(() => setLoading(false));

        fetch('/api/tables/register/characters').then(r => r.ok ? r.json() : []).then(d => setCharacters(Array.isArray(d) ? d : [])).catch(() => setCharacters([]));
        fetch('/api/tables/register/aspects').then(r => r.ok ? r.json() : []).then(d => setAspects(Array.isArray(d) ? d : [])).catch(() => setAspects([]));
        fetch('/api/tables/register/spiderwoman-aspects').then(r => r.ok ? r.json() : []).then(d => setSwAspects(Array.isArray(d) ? d : [])).catch(() => setSwAspects([]));
    }, [adminKey, id, navigate, type]);

    const updatePlayer = useCallback((index, patch) => {
        setForm((prev) => {
            const next = { ...prev };
            next.playersInfo = (next.playersInfo || []).slice();
            next.playersInfo[index] = { ...next.playersInfo[index], ...patch };
            return next;
        });
    }, []);

    const addPlayer = useCallback(() => {
        setForm((prev) => ({ ...prev, players: (prev.players || 0) + 1, playersInfo: [...(prev.playersInfo || []), { character: '', aspect: '', legacy: 'Ninguno' }] }));
    }, []);

    const removePlayer = useCallback((index) => {
        setForm((prev) => {
            const next = { ...prev };
            const arr = (next.playersInfo || []).slice();
            arr.splice(index, 1);
            next.playersInfo = arr;
            next.players = Math.max(0, (next.players || 0) - 1);
            return next;
        });
    }, []);

    const handleSave = useCallback(async () => {
        if (!form) return;
        try {
            const endpoint = `/api/admin/tables/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
            const payload = {};
            if (type === 'register') {
                payload.tableName = form.tableName;
                payload.difficulty = form.difficulty;
                payload.players = Number(form.players) || 0;
                payload.playersInfo = (form.playersInfo || []).map(p => ({ character: p.character || '', aspect: p.aspect || '' }));
            } else {
                payload.name = form.name;
                payload.difficulty = form.difficulty;
                payload.inevitableChallenge = form.inevitableChallenge;
                payload.players = Number(form.players) || 0;
                payload.playersInfo = (form.playersInfo || []).map(p => ({ character: p.character || '', aspect: p.aspect || '', legacy: p.legacy || 'Ninguno' }));
                payload.victoryPoints = Number(form.victoryPoints) || 0;
                payload.scenarioCleared = !!form.scenarioCleared;
            }
            const res = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminKey }, body: JSON.stringify(payload) });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Error al actualizar');
            }
            alert('Actualizado');
            navigate('/admin');
        } catch (e) {
            alert(e.message || 'No se pudo guardar');
        }
    }, [adminKey, form, id, navigate, type]);

    if (loading) return <div className="container">Cargando...</div>;
    if (error) return <div className="container">Error: {error}</div>;
    if (!form) return <div className="container">Mesa no encontrada</div>;

    return (
        <div className="container overlay-card">
            <h2>Editar mesa ({type === 'register' ? 'Evento' : 'Freegame'})</h2>
            <div className="form">
                <label className="field-label">
                    <span className="field-label-title">Numero de mesa (no editable)</span>
                    <input value={form.tableNumber} disabled />
                </label>
                <label className="field-label">
                    <span className="field-label-title">Código (no editable)</span>
                    <input value={form.code} disabled />
                </label>
                {type === 'register' ? (
                    <>
                        <label className="field-label">
                            <span className="field-label-title">Nombre de mesa</span>
                            <input value={form.tableName} onChange={(e) => setForm({ ...form, tableName: e.target.value })} />
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Dificultad</span>
                            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                <option value="">Selecciona dificultad</option>
                                <option value="Normal">Normal</option>
                                <option value="Experto">Experto</option>
                            </select>
                        </label>
                    </>
                ) : (
                    <>
                        <label className="field-label">
                            <span className="field-label-title">Nombre</span>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Dificultad</span>
                            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                <option value="Normal">Normal</option>
                                <option value="Experto">Experto</option>
                            </select>
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Reto inevitable</span>
                            <input value={form.inevitableChallenge} onChange={(e) => setForm({ ...form, inevitableChallenge: e.target.value })} />
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Puntos de Victoria</span>
                            <input type="number" value={form.victoryPoints} onChange={(e) => setForm({ ...form, victoryPoints: Number(e.target.value) })} />
                        </label>
                        <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={!!form.scenarioCleared} onChange={(e) => setForm({ ...form, scenarioCleared: e.target.checked })} />
                            <span>Escenario completado</span>
                        </label>
                    </>
                )}

                <label className="field-label">
                    <span className="field-label-title">Numero de jugadores</span>
                    <input type="number" min={0} max={4} value={form.players} onChange={(e) => {
                        const v = Math.max(0, Math.min(4, Number(e.target.value) || 0));
                        let nextPlayersInfo = form.playersInfo || [];
                        if (v > nextPlayersInfo.length) {
                            nextPlayersInfo = [...nextPlayersInfo, ...Array.from({ length: v - nextPlayersInfo.length }, () => (type === 'register' ? { character: '', aspect: '' } : { character: '', aspect: '', legacy: 'Ninguno' }))];
                        } else if (v < nextPlayersInfo.length) {
                            nextPlayersInfo = nextPlayersInfo.slice(0, v);
                        }
                        setForm({ ...form, players: v, playersInfo: nextPlayersInfo });
                    }} />
                </label>

                {(form.playersInfo || []).map((p, idx) => (
                    <div key={idx} className={type === 'register' ? 'player-row' : 'player-row freegame-row'}>
                        <label className="field-label">
                            <span className="field-label-title">Personaje</span>
                            <CharacterSelector value={p.character} options={characters} onChange={(v) => updatePlayer(idx, { character: v })} />
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Aspecto</span>
                            <select value={p.aspect} disabled={p.character === 'Adam Warlock'} onChange={(e) => updatePlayer(idx, { aspect: e.target.value })}>
                                <option value="" disabled>{p.character === 'Adam Warlock' ? 'No aplica' : 'Selecciona aspecto'}</option>
                                {(p.character === 'Spider-woman' ? swAspects : aspects).map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </label>
                        {type === 'freegame' && (
                            <label className="field-label">
                                <span className="field-label-title">Legado</span>
                                <select value={p.legacy} onChange={(e) => updatePlayer(idx, { legacy: e.target.value })}>
                                    {LEGACY_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </label>
                        )}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button type="button" onClick={() => removePlayer(idx)}>Eliminar jugador</button>
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSave}>Guardar</button>
                    <button onClick={() => navigate('/admin')}>Cancelar</button>
                    <button onClick={addPlayer} type="button">Añadir jugador</button>
                </div>
            </div>
        </div>
    );
}
