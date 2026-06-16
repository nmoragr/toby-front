import { useEffect, useState } from 'react';
import './admin.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminView() {
  const [partidas, setPartidas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingPartidas, setLoadingPartidas] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartidas();
    fetchUsuarios();
  }, []);

  async function fetchPartidas() {
    setLoadingPartidas(true);
    try {
      const res = await fetch(`${BASE_URL}/partidas`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPartidas(Array.isArray(data) ? data : data.partidas || []);
    } catch (err) {
      setError(err.message || 'Error al cargar partidas');
    } finally {
      setLoadingPartidas(false);
    }
  }

  async function fetchUsuarios() {
    setLoadingUsuarios(true);
    try {
      const res = await fetch(`${BASE_URL}/authentication/usuarios`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  }

  const totalPartidas = partidas.length;
  const partidasActivas = partidas.filter(p => p.estado === 'en_juego').length;
  const partidasEspera = partidas.filter(p => p.estado === 'en_espera').length;

  function estadoBadge(estado) {
    const map = {
      en_espera: { label: 'En espera', className: 'badge-espera' },
      en_juego: { label: 'En juego', className: 'badge-activa' },
      terminada: { label: 'Terminada', className: 'badge-terminada' },
    };
    const info = map[estado] || { label: estado, className: '' };
    return <span className={`badge ${info.className}`}>{info.label}</span>;
  }

  return (
    <div className="admin-root">
      <h1 className="admin-title">Panel de Administración</h1>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{totalPartidas}</span>
          <span className="stat-label">Total partidas</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{partidasActivas}</span>
          <span className="stat-label">En juego</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{partidasEspera}</span>
          <span className="stat-label">En espera</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{usuarios.length}</span>
          <span className="stat-label">Usuarios</span>
        </div>
      </div>

      <div className="admin-sections">
        <section className="admin-section">
          <div className="section-header">
            <h2>Partidas</h2>
            <button className="refresh-btn" onClick={fetchPartidas}>Actualizar</button>
          </div>
          {loadingPartidas ? (
            <p className="admin-info">Cargando partidas...</p>
          ) : partidas.length === 0 ? (
            <p className="admin-info">No hay partidas registradas.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Jugadores</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{estadoBadge(p.estado)}</td>
                    <td>{p.jugadores_count ?? p.jugadores?.length ?? '-'}</td>
                    <td>{p.tipo || 'pública'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-section">
          <div className="section-header">
            <h2>Usuarios</h2>
            <button className="refresh-btn" onClick={fetchUsuarios}>Actualizar</button>
          </div>
          {loadingUsuarios ? (
            <p className="admin-info">Cargando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p className="admin-info">No hay datos de usuarios disponibles.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>{u.rol || 'usuario'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
