import { useNavigate } from 'react-router-dom';
import './App.css';

export default function App() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="home-root">
      <h1 className="home-title">Entre ríos y viento</h1>
      <p className="home-subtitle">Un juego de tablero para 2–4 jugadores</p>
      <div className="home-buttons">
        {isLoggedIn ? (
          <button className="home-btn green" onClick={() => navigate('/lobby')}>
            Ir al lobby
          </button>
        ) : (
          <>
            <button className="home-btn green" onClick={() => navigate('/auth')}>
              Iniciar sesión
            </button>
            <button className="home-btn purple" onClick={() => navigate('/register')}>
              Crear cuenta
            </button>
          </>
        )}
        <button className="home-btn outline" onClick={() => navigate('/instructions')}>
          Ver instrucciones
        </button>
      </div>
    </div>
  );
}
