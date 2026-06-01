import { useNavigate } from 'react-router-dom'
import './App.css'

export default function App() {
  const navigate = useNavigate()

  return (
    <div className="home-root">
      <h1 className="home-title">Entre ríos y viento</h1>
      <div className="home-buttons">
        <button className="home-btn green" onClick={() => navigate('/auth')}>
          Iniciar sesión
        </button>
        <button className="home-btn purple" onClick={() => navigate('/register')}>
          Crear cuenta
        </button>
        <button className="home-btn green" onClick={() => navigate('/lobby')}>
          Usuario público
        </button>
      </div>
    </div>
  )
}
