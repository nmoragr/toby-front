//import React, { useState, useEffect } from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../common/socket';
import './auth.css';
import avatar0 from '../assets/avatars/avatar0.svg';
import avatar1 from '../assets/avatars/avatar1.svg';
import avatar2 from '../assets/avatars/avatar2.svg';
import avatar3 from '../assets/avatars/avatar3.svg';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginRegister({ defaultRegister = false }){
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.querySelector('input[name="nombre"]');
    if (el && typeof el.focus === 'function') el.focus();
  }, []);

  async function doLogin(nombreVal, passwordVal){
    setError('');
    setLoading(true);
    try{
      const res = await fetch(`${BASE_URL}/authentication/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreVal, password: passwordVal }),
      });
      let body;
      try {
        body = await res.json();
      } catch (e) {
        // fallback to text when server returned a plain string
        const text = await res.text().catch(() => null);
        body = text || {};
      }
      if (!res.ok) {
        const message = (body && (body.error || (typeof body === 'string' ? body : JSON.stringify(body)))) || 'Credenciales incorrectas';
        setError(message);
        setLoading(false);
        return null;
      }
      const token = body.access_token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('nombre', nombreVal);
        // extraer userId del payload JWT y guardarlo localmente
        try {
          const payload = JSON.parse(atob(token.split('.')[1] || ''));
          const uid = payload.sub || payload.userId || null;
          const rol = payload.rol || payload.role || 'usuario';
          if (uid) localStorage.setItem('userId', String(uid));
          localStorage.setItem('rol', rol);
        } catch {
          // noop
        }
        connectSocket();
        setLoading(false);
        navigate('/lobby');
        return token;
      } else {
        setError('Respuesta inválida del servidor');
      }
    } catch (err){
      setError(err.message || 'Error de red');
    }
    setLoading(false);
    return null;
  }

  async function doRegister(nombreVal, passwordVal){
    setError('');
    setLoading(true);
    try{
      const res = await fetch(`${BASE_URL}/authentication/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreVal, password: passwordVal, avatar: selectedAvatar }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201) {
        // registro exitoso -> hacer login automático
        await doLogin(nombreVal, passwordVal);
        return true;
      } else {
        setError(body.error || JSON.stringify(body) || 'Error en registro');
      }
    } catch (err){
      setError(err.message || 'Error de red');
    }
    setLoading(false);
    return false;
  }

  async function handleSubmit(e){
    e.preventDefault();
    setError('');
    if (!nombre || !password) {
      setError('Completa nombre y contraseña');
      return;
    }
    if (isRegister) {
      await doRegister(nombre, password);
    } else {
      await doLogin(nombre, password);
    }
  }

  return (
    <section className="auth-root">
      <h2 className="auth-title">
        {isRegister ? '¡Es hora de crear tu usuario!' : '¡Es hora de iniciar sesión!'}
      </h2>
      <form onSubmit={handleSubmit} className="auth-form" aria-live="polite">
        {isRegister && (
          <div className="avatar-section">
            <p>Elige tu avatar</p>
            <div className="avatar-grid">
              {[avatar0, avatar1, avatar2, avatar3].map((src, i) => (
                <button key={i} type="button" className={`avatar-item ${selectedAvatar === i ? 'selected' : ''}`} onClick={() => setSelectedAvatar(i)}>
                  <img src={src} alt={`Avatar ${i}`} />
                </button>
              ))}
            </div>
          </div>
        )}
        <label>Nombre</label>
        <input name="nombre" type="text" placeholder="Inserte nombre de usuario" value={nombre} onChange={e => setNombre(e.target.value)} />
        <label>Contraseña</label>
        <input name="password" type="password" placeholder="Cree una contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="auth-error" role="alert">{error}</div>}
        <footer className="auth-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : (isRegister ? 'Crear cuenta' : 'Iniciar sesión')}
          </button>
          <button type="button" className="auth-toggle" onClick={() => { setIsRegister(v => !v); setError(''); }}>
            {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}
          </button>
        </footer>
      </form>
    </section>
  );
}
