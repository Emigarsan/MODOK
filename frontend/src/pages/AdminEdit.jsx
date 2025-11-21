import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CharacterSelector from '../components/CharacterSelector.jsx';

export default function AdminEditPage() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [table, setTable] = useState(null);
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
                setTable(found);
            })
            .catch((e) => setError(e.message || 'Error'))
            .finally(() => setLoading(false));

        fetch('/api/tables/register/characters').then(r => r.ok ? r.json() : []).then(d => setCharacters(Array.isArray(d) ? d : [])).catch(() => setCharacters([]));
        fetch('/api/tables/register/aspects').then(r => r.ok ? r.json() : []).then(d => setAspects(Array.isArray(d) ? d : [])).catch(() => setAspects([]));
        fetch('/api/tables/register/spiderwoman-aspects').then(r => r.ok ? r.json() : []).then(d => setSwAspects(Array.isArray(d) ? d : [])).catch(() => setSwAspects([]));
    }, [adminKey, id, navigate, type]);

    const handleSave = useCallback(async (payload) => {
        try {
            const endpoint = `/api/admin/tables/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
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
    }, [adminKey, id, navigate, type]);

    if (loading) return <div className="container">Cargando...</div>;
    if (error) return <div className="container">Error: {error}</div>;
    if (!table) return <div className="container">Mesa no encontrada</div>;

    // Render register or freegame form, disabling number and code
    if (type === 'register') {
        const players = Array.isArray(table.playersInfo) ? table.playersInfo : [];
        return (
            <div className="container overlay-card">
                <h2>Editar mesa (Evento)</h2>
                <div className="form">
                    <label className="field-label">
                        <span className="field-label-title">Numero de mesa (no editable)</span>
                        <input value={table.tableNumber} disabled />
                    </label>
                    <label className="field-label">
                        <span className="field-label-title">Código (no editable)</span>
                        <input value={table.code} disabled />
                    </label>
                    <label className="field-label">
                        <span className="field-label-title">Nombre de mesa</span>
                        <input defaultValue={table.tableName || ''} id="name" />
                    </label>
                    <label className="field-label">
                        <span className="field-label-title">Dificultad</span>
                        <select defaultValue={table.difficulty || ''} id="difficulty">
                            <option value="">Selecciona dificultad</option>
                            <option value="Normal">Normal</option>
                            <option value="Experto">Experto</option>
                        </select>
                    </label>
                    <label className="field-label">
                        <span className="field-label-title">Jugadores</span>
                        <input type="number" defaultValue={table.players || 0} id="players" min={0} max={4} />
                    </label>
                    {players.map((p, idx) => (
                        <div key={idx} className="player-row">
                            <label className="field-label">
                                <span className="field-label-title">Personaje</span>
                                <CharacterSelector value={p.character} options={characters} onChange={(v) => { /* no-op here */ }} />
                            </label>
                            <label className="field-label">
                                <span className="field-label-title">Aspecto</span>
                                <select defaultValue={p.aspect || ''}>
                                    {(p.character === 'Spider-woman' ? swAspects : aspects).map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </label>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => {
                            const payload = {
                                tableName: document.getElementById('name').value,
                                difficulty: document.getElementById('difficulty').value,
                                players: Number(document.getElementById('players').value) || 0
                            };
                            handleSave(payload);
                        }}>Guardar</button>
                        <button onClick={() => navigate('/admin')}>Cancelar</button>
                    </div>
                </div>
            </div>
        );
    }

    // freegame
    const playersInfo = Array.isArray(table.playersInfo) ? table.playersInfo : [];
    return (
        <div className="container overlay-card">
            <h2>Editar mesa (Freegame)</h2>
            <div className="form">
                <label className="field-label">
                    <span className="field-label-title">Numero de mesa (no editable)</span>
                    <input value={table.tableNumber} disabled />
                </label>
                <label className="field-label">
                    <span className="field-label-title">Código (no editable)</span>
                    <input value={table.code} disabled />
                </label>
                <label className="field-label">
                    <span className="field-label-title">Nombre</span>
                    <input defaultValue={table.name || ''} id="name" />
                </label>
                <label className="field-label">
                    <span className="field-label-title">Dificultad</span>
                    <select defaultValue={table.difficulty || 'Normal'} id="difficulty">
                        <option value="Normal">Normal</option>
                        <option value="Experto">Experto</option>
                    </select>
                </label>
                <label className="field-label">
                    <span className="field-label-title">Reto inevitable</span>
                    <input defaultValue={table.inevitableChallenge || '(Ninguno)'} id="inevitable" />
                </label>
                <label className="field-label">
                    <span className="field-label-title">Jugadores</span>
                    <input type="number" defaultValue={table.players || 0} id="players" min={0} max={4} />
                </label>
                {playersInfo.map((p, idx) => (
                    <div key={idx} className="player-row freegame-row">
                        <label className="field-label">
                            <span className="field-label-title">Personaje</span>
                            <CharacterSelector value={p.character} options={characters} onChange={() => { }} />
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Aspecto</span>
                            <select defaultValue={p.aspect || ''}>{(p.character === 'Spider-woman' ? swAspects : aspects).map(a => <option key={a} value={a}>{a}</option>)}</select>
                        </label>
                        <label className="field-label">
                            <span className="field-label-title">Legado</span>
                            <input defaultValue={p.legacy || 'Ninguno'} />
                        </label>
                    </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                        const payload = {
                            name: document.getElementById('name').value,
                            difficulty: document.getElementById('difficulty').value,
                            inevitableChallenge: document.getElementById('inevitable').value,
                            players: Number(document.getElementById('players').value) || 0
                        };
                        handleSave(payload);
                    }}>Guardar</button>
                    <button onClick={() => navigate('/admin')}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
