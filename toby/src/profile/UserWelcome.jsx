import { useNavigate } from 'react-router-dom';
import './UserWelcome.css';

const AVATAR_EMOJIS = ['🐻‍❄️', '🦊', '🐺', '🦁'];

export default function UserWelcome() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre') || 'Jugador';
  const rol = localStorage.getItem('rol') || 'usuario';
  const userId = localStorage.getItem('userId');

  const avatarIndex = Number(userId || 0) % 4;
  const avatarEmoji = AVATAR_EMOJIS[avatarIndex];

  return (
    <div className="profile-root">
      <div className="profile-card">
        <div className="profile-avatar">{avatarEmoji}</div>
        <h1 className="profile-name">{nombre}</h1>
        <span className="profile-role">{rol === 'admin' ? '👑 Administrador' : '🎮 Jugador'}</span>

        <div className="profile-actions">
          <button className="profile-btn primary" onClick={() => navigate('/lobby')}>
            Ir al lobby
          </button>
          {rol === 'admin' && (
            <button className="profile-btn secondary" onClick={() => navigate('/admin')}>
              Panel de administración
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
