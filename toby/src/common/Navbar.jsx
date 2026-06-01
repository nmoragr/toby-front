import { Link, useLocation, useNavigate } from 'react-router-dom'
import { disconnectSocket } from '../common/socket'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const nombreUsuario = localStorage.getItem('nombre')

  const isActive = (path) => location.pathname === path

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('nombre')
    localStorage.removeItem('currentJugadorId')
    localStorage.removeItem('currentPartidaId')
    disconnectSocket()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🐻‍❄️ Entre ríos y viento
        </Link>

        <ul className="navbar-menu">
          <li>
            <Link to="/lobby" className={`navbar-link ${isActive('/lobby') ? 'active' : ''}`}>
              Lobby
            </Link>
          </li>
          <li>
            <Link to="/instructions" className={`navbar-link ${isActive('/instructions') ? 'active' : ''}`}>
              Instrucciones
            </Link>
          </li>
          <li>
            <Link to="/nosotros" className={`navbar-link ${isActive('/nosotros') ? 'active' : ''}`}>
              Nosotros
            </Link>
          </li>
          {isLoggedIn ? (
            <>
              <li>
                <span className="navbar-username">Hola, {nombreUsuario}</span>
              </li>
              <li>
                <button className="navbar-link navbar-logout" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/auth" className={`navbar-link ${isActive('/auth') ? 'active' : ''}`}>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/register" className={`navbar-link ${isActive('/register') ? 'active' : ''}`}>
                  Registrarse
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
