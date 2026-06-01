// Pagina que incluya información del equipo y el sitio.
import React from "react";
import "./Nosotros.css";

function Nosotros() {
  return (
    <div className="Nosotros-root">
      <div className="Nosotros-container">
        <h1>Nosotros</h1>

        <section>
          <h2>¿Quiénes somos?</h2>
          <p>
            Somos un grupo de estudiantes de ingeniería que solo quieren
            aprender sobre el desarrollo de aplicaciones web y, así, pasar el
            ramo Tecnologías y Aplicaciones Web. Con ese objetivo en mente,
            desarrollamos "Entre Vientos y Ríos", un juego con el que esperamos
            que muchos puedan pasar un buen rato. Sin duda ha sido un gran
            desafío, pero nos hace felices ver los resultados que hemos obtenido
            hasta ahora.
          </p>

          <h3>¡Esperamos que lo disfruten!</h3>
        </section>

        <div className="Nosotros-list">
          <h2>Integrantes</h2>
          <ul>
            <li>Josefina de la Sotta</li>
            <li>Natalia Moraga</li>
            <li>María de los Ángeles Ronfeldt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Nosotros;